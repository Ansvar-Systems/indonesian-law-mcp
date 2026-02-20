#!/usr/bin/env tsx
/**
 * Indonesian Law MCP -- Ingestion Pipeline
 *
 * Fetches Indonesian legislation from BPK RI (peraturan.bpk.go.id).
 * BPK RI provides free public access to legislation as Government Open Data.
 *
 * The pipeline:
 * 1. Fetches each law page as HTML from peraturan.bpk.go.id
 * 2. Validates the response is the correct law (not a redirect to unrelated content)
 * 3. Parses the HTML to extract Pasal (Article) provisions and definitions
 * 4. Saves structured seed JSON files for database building
 *
 * If fetching fails (network issues, geo-blocking, HTTP 403, redirect to wrong
 * page, etc.), the pipeline generates fallback seed files from the
 * KEY_INDONESIAN_ACTS metadata so the database can still be built.
 *
 * Usage:
 *   npm run ingest                    # Full ingestion
 *   npm run ingest -- --limit 5       # Test with 5 laws
 *   npm run ingest -- --skip-fetch    # Reuse cached HTML
 *
 * Data source: peraturan.bpk.go.id (BPK RI - Audit Board of the Republic of Indonesia)
 * Format: Server-rendered HTML with Pasal/Bab structure
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRateLimit } from './lib/fetcher.js';
import { parseIndonesianHtml, KEY_INDONESIAN_ACTS, type ActIndexEntry, type ParsedAct } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');

function parseArgs(): { limit: number | null; skipFetch: boolean } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let skipFetch = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--skip-fetch') {
      skipFetch = true;
    }
  }

  return { limit, skipFetch };
}

/**
 * Validate that the fetched HTML is actually for the expected law.
 *
 * BPK RI sometimes redirects to unrelated legislation pages (e.g., when
 * accessed from non-Indonesian IPs). We check that the page title or
 * content matches expected identifiers for the law.
 */
function validateFetchedContent(html: string, act: ActIndexEntry): boolean {
  const lowerHtml = html.toLowerCase();

  // Check for the law number and year in the page content
  // e.g., "27 tahun 2022" or "no. 27 tahun 2022" or "nomor 27 tahun 2022"
  const yearPattern = `${act.lawNumber}.*tahun.*${act.lawYear}`.toLowerCase();
  const yearRegex = new RegExp(yearPattern.replace(/\./g, '\\.'), 'i');

  // Also check for common patterns in the <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].toLowerCase() : '';

  // Check if the title contains a reference to our law
  const titleHasLaw = pageTitle.includes(act.lawNumber) && pageTitle.includes(act.lawYear);

  // Check if the body content references our law
  const bodyHasLaw = yearRegex.test(lowerHtml);

  // For the constitution (UUD 1945), check for "undang-undang dasar" or "uud"
  if (act.lawType === 'UUD') {
    return lowerHtml.includes('undang-undang dasar') || pageTitle.includes('uud');
  }

  return titleHasLaw || bodyHasLaw;
}

/**
 * Generate a fallback seed file from metadata when fetching fails.
 * Includes a summary provision with the law's description and key metadata.
 */
function generateFallbackSeed(act: ActIndexEntry): ParsedAct {
  const provisions: ParsedAct['provisions'] = [
    {
      provision_ref: 'pasal0',
      chapter: 'Metadata',
      section: '0',
      title: `${act.shortName} - Summary`,
      content: [
        `${act.title}`,
        `English: ${act.titleEn}`,
        `Type: ${act.lawType} No. ${act.lawNumber} of ${act.lawYear}`,
        `Status: ${act.status}`,
        `Issued: ${act.issuedDate}`,
        `In force: ${act.inForceDate}`,
        act.description ? `Description: ${act.description}` : '',
        `Source: ${act.url}`,
        '',
        'Note: Full text could not be fetched from peraturan.bpk.go.id. This seed contains metadata only. Re-run ingestion when the source is accessible.',
      ].filter(Boolean).join('\n'),
    },
  ];

  return {
    id: act.id,
    type: 'statute',
    title: act.title,
    title_en: act.titleEn,
    short_name: act.shortName,
    status: act.status,
    issued_date: act.issuedDate,
    in_force_date: act.inForceDate,
    url: act.url,
    description: act.description,
    provisions,
    definitions: [],
  };
}

async function fetchAndParseActs(acts: ActIndexEntry[], skipFetch: boolean): Promise<void> {
  console.log(`\nProcessing ${acts.length} Indonesian laws from peraturan.bpk.go.id...\n`);

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let fallbacks = 0;
  let totalProvisions = 0;
  let totalDefinitions = 0;
  const results: { act: string; provisions: number; definitions: number; status: string }[] = [];

  for (const act of acts) {
    const sourceFile = path.join(SOURCE_DIR, `${act.id}.html`);
    const seedFile = path.join(SEED_DIR, `${act.id}.json`);

    // Skip if seed already exists and we're in skip-fetch mode
    if (skipFetch && fs.existsSync(seedFile)) {
      const existing = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as ParsedAct;
      const provCount = existing.provisions?.length ?? 0;
      const defCount = existing.definitions?.length ?? 0;
      totalProvisions += provCount;
      totalDefinitions += defCount;
      results.push({ act: act.shortName, provisions: provCount, definitions: defCount, status: 'cached' });
      skipped++;
      processed++;
      continue;
    }

    try {
      let html: string;
      let fromCache = false;

      if (fs.existsSync(sourceFile) && skipFetch) {
        html = fs.readFileSync(sourceFile, 'utf-8');
        fromCache = true;
        console.log(`  Using cached ${act.shortName} (${act.id}) (${(html.length / 1024).toFixed(0)} KB)`);
      } else {
        process.stdout.write(`  Fetching ${act.shortName} (${act.id})...`);
        const result = await fetchWithRateLimit(act.url);

        if (result.status !== 200) {
          console.log(` HTTP ${result.status} - generating fallback seed`);
          const fallbackSeed = generateFallbackSeed(act);
          fs.writeFileSync(seedFile, JSON.stringify(fallbackSeed, null, 2));
          totalProvisions += fallbackSeed.provisions.length;
          results.push({
            act: act.shortName,
            provisions: fallbackSeed.provisions.length,
            definitions: 0,
            status: `fallback (HTTP ${result.status})`,
          });
          fallbacks++;
          processed++;
          continue;
        }

        html = result.body;
        console.log(` OK (${(html.length / 1024).toFixed(0)} KB)`);
      }

      // Validate the fetched content is for the correct law
      if (!validateFetchedContent(html, act)) {
        if (!fromCache) {
          // Don't cache wrong content
          console.log(`    -> Content mismatch (redirect detected), generating fallback seed`);
        } else {
          console.log(`    -> Cached content does not match expected law, generating fallback seed`);
        }
        const fallbackSeed = generateFallbackSeed(act);
        fs.writeFileSync(seedFile, JSON.stringify(fallbackSeed, null, 2));
        totalProvisions += fallbackSeed.provisions.length;
        results.push({
          act: act.shortName,
          provisions: fallbackSeed.provisions.length,
          definitions: 0,
          status: 'fallback (content mismatch)',
        });
        fallbacks++;
        processed++;
        continue;
      }

      // Cache validated HTML
      if (!fromCache) {
        fs.writeFileSync(sourceFile, html);
      }

      const parsed = parseIndonesianHtml(html, act);

      // If parsing yielded no provisions, generate fallback
      if (parsed.provisions.length === 0) {
        console.log(`    -> No provisions extracted, generating fallback seed`);
        const fallbackSeed = generateFallbackSeed(act);
        fs.writeFileSync(seedFile, JSON.stringify(fallbackSeed, null, 2));
        totalProvisions += fallbackSeed.provisions.length;
        results.push({
          act: act.shortName,
          provisions: fallbackSeed.provisions.length,
          definitions: 0,
          status: 'fallback (no provisions parsed)',
        });
        fallbacks++;
        processed++;
        continue;
      }

      fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2));
      totalProvisions += parsed.provisions.length;
      totalDefinitions += parsed.definitions.length;
      console.log(`    -> ${parsed.provisions.length} provisions, ${parsed.definitions.length} definitions extracted`);
      results.push({
        act: act.shortName,
        provisions: parsed.provisions.length,
        definitions: parsed.definitions.length,
        status: 'OK',
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ERROR ${act.shortName}: ${msg}`);
      console.log(`    -> Generating fallback seed`);

      // Generate fallback seed on error
      const fallbackSeed = generateFallbackSeed(act);
      fs.writeFileSync(seedFile, JSON.stringify(fallbackSeed, null, 2));
      totalProvisions += fallbackSeed.provisions.length;
      results.push({
        act: act.shortName,
        provisions: fallbackSeed.provisions.length,
        definitions: 0,
        status: `fallback (${msg.substring(0, 60)})`,
      });
      fallbacks++;
      failed++;
    }

    processed++;
  }

  console.log(`\n${'='.repeat(75)}`);
  console.log('INGESTION REPORT');
  console.log('='.repeat(75));
  console.log(`\n  Source:      peraturan.bpk.go.id (BPK RI)`);
  console.log(`  Processed:   ${processed}`);
  console.log(`  Cached:      ${skipped}`);
  console.log(`  Fallbacks:   ${fallbacks}`);
  console.log(`  Failed:      ${failed}`);
  console.log(`  Total provisions:  ${totalProvisions}`);
  console.log(`  Total definitions: ${totalDefinitions}`);
  console.log(`\n  Per-law breakdown:`);
  console.log(`  ${'Law'.padEnd(28)} ${'Provisions'.padStart(12)} ${'Definitions'.padStart(13)}  Status`);
  console.log(`  ${'-'.repeat(28)} ${'-'.repeat(12)} ${'-'.repeat(13)}  ${'-'.repeat(35)}`);
  for (const r of results) {
    console.log(
      `  ${r.act.padEnd(28)} ${String(r.provisions).padStart(12)} ${String(r.definitions).padStart(13)}  ${r.status}`,
    );
  }
  console.log('');

  if (fallbacks > 0) {
    console.log(`  NOTE: ${fallbacks} law(s) used fallback seeds (metadata only).`);
    console.log('  Re-run ingestion when peraturan.bpk.go.id is accessible for full text.\n');
  }
}

async function main(): Promise<void> {
  const { limit, skipFetch } = parseArgs();

  console.log('Indonesian Law MCP -- Ingestion Pipeline');
  console.log('========================================\n');
  console.log(`  Source: peraturan.bpk.go.id (BPK RI - Audit Board of Republic of Indonesia)`);
  console.log(`  Format: HTML with Pasal/Bab structure`);
  console.log(`  License: Government Open Data`);
  console.log(`  Rate limit: 500ms between requests`);

  if (limit) console.log(`  --limit ${limit}`);
  if (skipFetch) console.log(`  --skip-fetch`);

  const acts = limit ? KEY_INDONESIAN_ACTS.slice(0, limit) : KEY_INDONESIAN_ACTS;
  await fetchAndParseActs(acts, skipFetch);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
