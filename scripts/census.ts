#!/usr/bin/env tsx
/**
 * Indonesian Law MCP — Census Script
 *
 * Enumerates ALL Undang-Undang (UU / Laws) from peraturan.go.id — the official
 * Indonesian legal documentation database (JDIH Nasional) maintained by the
 * Directorate General of Legislation, Ministry of Law and Human Rights.
 *
 * Strategy:
 *   Scrape the paginated UU listing at https://peraturan.go.id/uu?page=N
 *   (20 entries per page, ~97 pages, ~1,926 total laws).
 *
 * Writes data/census.json in golden standard format.
 *
 * Usage:
 *   npx tsx scripts/census.ts
 *   npx tsx scripts/census.ts --limit 5     # Test with 5 pages
 *
 * Data source: peraturan.go.id (Government Open Data)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const CENSUS_PATH = path.join(DATA_DIR, 'census.json');

const BASE_URL = 'https://peraturan.go.id/uu';
const USER_AGENT = 'Indonesian-Law-MCP/2.0 (https://github.com/Ansvar-Systems/indonesian-law-mcp)';
const MIN_DELAY_MS = 500;

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<{ status: number; body: string }> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.7',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429 || response.status >= 500) {
        const backoff = Math.pow(2, attempt + 1) * 1000;
        console.log(`  HTTP ${response.status}, retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }

      const body = await response.text();
      return { status: response.status, body };
    } catch (err) {
      if (attempt < 2) {
        const msg = err instanceof Error ? err.message : String(err);
        const backoff = Math.pow(2, attempt + 1) * 1000;
        console.log(`  Error: ${msg}, retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Failed after 3 attempts: ${url}`);
}

// Known BPK RI Detail IDs for important laws
const KNOWN_BPK_IDS: Record<string, string> = {
  'uu-no-27-tahun-2022': '229798',
  'uu-no-11-tahun-2008': '37589',
  'uu-no-19-tahun-2016': '37582',
  'uu-no-40-tahun-2007': '39965',
  'uu-no-8-tahun-1999': '45288',
  'uu-no-36-tahun-1999': '45196',
  'uu-no-3-tahun-2011': '39126',
  'uu-no-7-tahun-2014': '38560',
  'uu-no-17-tahun-2023': '258028',
  'uu-no-34-tahun-2004': '40774',
  'uu-no-32-tahun-2009': '38771',
  'uu-no-17-tahun-2014': '38643',
  'uu-no-28-tahun-1999': '45345',
  'uu-no-23-tahun-2002': '44473',
};

interface CensusLaw {
  id: string;
  slug: string;
  number: string;
  year: string;
  title: string;
  title_en: string;
  status: 'in_force' | 'repealed' | 'amended' | 'unknown';
  url_peraturan_go_id: string;
  url_bpk_ri: string;
  bpk_detail_id: string;
  classification: 'ingestable' | 'metadata_only' | 'inaccessible';
}

interface CensusOutput {
  generated_at: string;
  source: string;
  description: string;
  stats: {
    total: number;
    class_ingestable: number;
    class_metadata_only: number;
    class_inaccessible: number;
    by_decade: Record<string, number>;
  };
  ingestion?: {
    completed_at: string;
    total_laws: number;
    total_provisions: number;
    coverage_pct: string;
  };
  laws: CensusLaw[];
}

function parseArgs(): { limit: number | null } {
  const args = process.argv.slice(2);
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return { limit };
}

/**
 * Parse a single listing page from peraturan.go.id/uu and extract all law entries.
 */
function parseListingPage(html: string): CensusLaw[] {
  const laws: CensusLaw[] = [];
  const seenSlugs = new Set<string>();

  // Match anchor tags pointing to law detail pages
  const linkPattern = /href="\/id\/(uu-no-(\d+[a-z]?)-tahun-(\d{4}))"[^>]*>([^<]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const slug = match[1].toLowerCase();
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const number = match[2];
    const year = match[3];
    const rawTitle = match[4]
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    if (!number || !year) continue;

    const id = `uu-${number}-${year}`;
    const bpkDetailId = KNOWN_BPK_IDS[slug] ?? '';
    const bpkUrl = bpkDetailId
      ? `https://peraturan.bpk.go.id/Details/${bpkDetailId}/${slug}`
      : '';

    laws.push({
      id,
      slug,
      number,
      year,
      title: rawTitle || `Undang-Undang Nomor ${number} Tahun ${year}`,
      title_en: '',
      status: 'in_force',
      url_peraturan_go_id: `https://peraturan.go.id/id/${slug}`,
      url_bpk_ri: bpkUrl,
      bpk_detail_id: bpkDetailId,
      classification: 'ingestable',
    });
  }

  return laws;
}

/**
 * Extract total result count from page HTML.
 * Pattern: <strong>1.926</strong> Peraturan ditemukan
 */
function extractTotalCount(html: string): number {
  const match = html.match(/<strong>([0-9.,]+)<\/strong>\s*Peraturan ditemukan/i);
  if (match) {
    return parseInt(match[1].replace(/[.,]/g, ''), 10);
  }
  return 0;
}

async function main(): Promise<void> {
  const { limit } = parseArgs();

  console.log('Indonesian Law MCP -- Census');
  console.log('============================\n');
  console.log('  Source:   peraturan.go.id (JDIH Nasional)');
  console.log('  Method:   Paginated UU listing scrape');
  console.log('  License:  Government Open Data\n');

  const allLaws: CensusLaw[] = [];
  const seenIds = new Set<string>();

  // Fetch page 1 to get total count
  process.stdout.write('  Page 1...');
  const firstResult = await rateLimitedFetch(`${BASE_URL}?page=1`);

  if (firstResult.status !== 200) {
    console.log(` HTTP ${firstResult.status} -- cannot access peraturan.go.id`);
    process.exit(1);
  }

  const totalCount = extractTotalCount(firstResult.body);
  const totalPages = Math.ceil(totalCount / 20);
  const firstPageLaws = parseListingPage(firstResult.body);

  for (const law of firstPageLaws) {
    if (!seenIds.has(law.id)) {
      seenIds.add(law.id);
      allLaws.push(law);
    }
  }

  console.log(` ${firstPageLaws.length} laws, ${totalCount} total (${totalPages} pages)`);

  // How many pages to scrape
  const maxPages = limit ? Math.min(limit, totalPages) : totalPages;

  // Scrape remaining pages
  for (let page = 2; page <= maxPages; page++) {
    process.stdout.write(`  Page ${page}/${maxPages}...`);

    try {
      const result = await rateLimitedFetch(`${BASE_URL}?page=${page}`);

      if (result.status !== 200) {
        console.log(` HTTP ${result.status}`);
        continue;
      }

      const laws = parseListingPage(result.body);
      let added = 0;
      for (const law of laws) {
        if (!seenIds.has(law.id)) {
          seenIds.add(law.id);
          allLaws.push(law);
          added++;
        }
      }

      console.log(` ${laws.length} entries (${added} new, ${allLaws.length} total)`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(` ERROR: ${msg}`);
    }

    // Progress every 10 pages
    if (page % 10 === 0) {
      console.log(`  --- ${page}/${maxPages} pages, ${allLaws.length} laws ---`);
    }
  }

  // Sort by year (descending), then number (descending)
  allLaws.sort((a, b) => {
    const yearDiff = parseInt(b.year) - parseInt(a.year);
    if (yearDiff !== 0) return yearDiff;
    return parseInt(b.number) - parseInt(a.number);
  });

  // Compute decade stats
  const byDecade: Record<string, number> = {};
  for (const law of allLaws) {
    const decade = `${Math.floor(parseInt(law.year) / 10) * 10}s`;
    byDecade[decade] = (byDecade[decade] ?? 0) + 1;
  }

  // Build census output
  const census: CensusOutput = {
    generated_at: new Date().toISOString(),
    source: 'peraturan.go.id (JDIH Nasional)',
    description: 'Full census of Indonesian Undang-Undang (Laws / Acts of Parliament)',
    stats: {
      total: allLaws.length,
      class_ingestable: allLaws.filter(a => a.classification === 'ingestable').length,
      class_metadata_only: allLaws.filter(a => a.classification === 'metadata_only').length,
      class_inaccessible: allLaws.filter(a => a.classification === 'inaccessible').length,
      by_decade: byDecade,
    },
    laws: allLaws,
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2) + '\n');

  console.log(`\n${'='.repeat(55)}`);
  console.log('CENSUS COMPLETE');
  console.log('='.repeat(55));
  console.log(`  Total UU discovered:   ${allLaws.length}`);
  console.log(`  Ingestable:            ${census.stats.class_ingestable}`);
  console.log(`  With BPK Detail ID:    ${allLaws.filter(a => a.bpk_detail_id).length}`);
  console.log(`\n  By decade:`);
  for (const [decade, count] of Object.entries(byDecade).sort()) {
    console.log(`    ${decade}: ${count}`);
  }
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
