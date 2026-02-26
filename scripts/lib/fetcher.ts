/**
 * Rate-limited HTTP client for Indonesian law sources
 *
 * Supports two data sources:
 *   1. BPK RI (peraturan.bpk.go.id) — full-text HTML of legislation
 *   2. peraturan.go.id (JDIH Nasional) — listing pages + detail pages + PDFs
 *
 * - 500ms minimum delay between requests (be respectful to government servers)
 * - Max 3 concurrent requests
 * - Identifies as Indonesian-Law-MCP
 * - Retries on 429/5xx with exponential backoff
 * - No auth needed (Government Open Data)
 */

const USER_AGENT =
  'Indonesian-Law-MCP/2.0 (https://github.com/Ansvar-Systems/indonesian-law-mcp; hello@ansvar.ai)';
const MIN_DELAY_MS = 500;
const MAX_CONCURRENT = 3;

let lastRequestTime = 0;
let activeRequests = 0;

async function rateLimit(): Promise<void> {
  // Wait for concurrency slot
  while (activeRequests >= MAX_CONCURRENT) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
  activeRequests++;
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
}

export interface FetchResult {
  status: number;
  body: string;
  contentType: string;
  url: string;
}

/**
 * Fetch a URL with rate limiting and proper headers.
 * Retries up to 3 times on 429/5xx errors with exponential backoff.
 */
export async function fetchWithRateLimit(url: string, maxRetries = 3): Promise<FetchResult> {
  await rateLimit();

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(30000),
        });

        if (response.status === 429 || response.status >= 500) {
          if (attempt < maxRetries) {
            const backoff = Math.pow(2, attempt + 1) * 1000;
            console.log(`  HTTP ${response.status} for ${url}, retrying in ${backoff}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            continue;
          }
        }

        const body = await response.text();
        return {
          status: response.status,
          body,
          contentType: response.headers.get('content-type') ?? '',
          url: response.url,
        };
      } catch (fetchError) {
        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt + 1) * 1000;
          const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.log(`  Fetch error: ${msg}, retrying in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
        throw fetchError;
      }
    }

    throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
  } finally {
    releaseSlot();
  }
}

/**
 * Fetch the BPK RI detail page for a law.
 * Returns the full HTML body, which typically contains the full law text with Pasal structure.
 *
 * URL pattern: https://peraturan.bpk.go.id/Details/{id}/{slug}
 */
export async function fetchBpkDetail(detailId: string, slug: string): Promise<FetchResult> {
  const url = `https://peraturan.bpk.go.id/Details/${detailId}/${slug}`;
  return fetchWithRateLimit(url);
}

/**
 * Fetch the peraturan.go.id detail page for a law.
 * Returns metadata (title, year, number, status, PDF link).
 *
 * URL pattern: https://peraturan.go.id/id/{slug}
 */
export async function fetchPeraturanDetail(slug: string): Promise<FetchResult> {
  const url = `https://peraturan.go.id/id/${slug}`;
  return fetchWithRateLimit(url);
}
