/**
 * HTML parser for Indonesian legislation
 *
 * Supports two source formats:
 *   1. BPK RI (peraturan.bpk.go.id) — full-text HTML with Pasal/Bab structure
 *   2. peraturan.go.id — metadata-only detail pages with PDF download links
 *
 * BPK RI HTML contains the full statute text with articles (Pasal) and chapters (Bab).
 * The HTML uses consistent patterns:
 *
 *   Pasal X            -- article heading (Pasal = Article in Indonesian)
 *   (1) text           -- numbered subsection (ayat)
 *   a. text            -- lettered point (huruf)
 *
 * Indonesian legal hierarchy (per UU No. 12/2011):
 *   Bab (Chapter) > Bagian (Part) > Paragraf (Paragraph) > Pasal (Article) > Ayat (Subsection)
 *
 * provision_ref format: "pasal1", "pasal2", etc. (Indonesian "Pasal" = Article)
 */

export interface CensusLaw {
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

export interface ActIndexEntry {
  id: string;
  /** Indonesian legal type: UU (Undang-Undang/Law), PP (Peraturan Pemerintah/Government Regulation), UUD (Constitution) */
  lawType: string;
  lawNumber: string;
  lawYear: string;
  title: string;
  titleEn: string;
  shortName: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issuedDate: string;
  inForceDate: string;
  url: string;
  description?: string;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedAct {
  id: string;
  type: 'statute';
  title: string;
  title_en: string;
  short_name: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issued_date: string;
  in_force_date: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

/**
 * Strip HTML tags and decode common entities, normalising whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#xA0;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

/**
 * Extract the current Bab (Chapter) heading from the HTML before a given position.
 *
 * Indonesian legislation uses "BAB I", "BAB II", etc. for chapters, often followed
 * by a title on the next line, e.g.:
 *   BAB I
 *   KETENTUAN UMUM (General Provisions)
 */
function extractCurrentBab(html: string, position: number): string | undefined {
  const textBefore = html.substring(0, position);
  // Match BAB headings - they appear as standalone text or in tags
  const babPattern = /BAB\s+([IVXLCDM]+)\b[^<]*?(?:\n|<[^>]+>)\s*([A-Z][A-Z\s,]+[A-Z])/g;
  let lastBab: string | undefined;
  let match: RegExpExecArray | null;

  while ((match = babPattern.exec(textBefore)) !== null) {
    const babNum = match[1].trim();
    const babTitle = match[2].trim().replace(/\s+/g, ' ');
    lastBab = `BAB ${babNum} - ${babTitle}`;
  }

  // Simpler fallback: just "BAB X"
  if (!lastBab) {
    const simpleBabPattern = /BAB\s+([IVXLCDM]+)/g;
    while ((match = simpleBabPattern.exec(textBefore)) !== null) {
      lastBab = `BAB ${match[1].trim()}`;
    }
  }

  return lastBab;
}

/**
 * Parse BPK RI HTML to extract provisions from an Indonesian statute page.
 *
 * Indonesian legislation uses "Pasal X" (Article X) for individual provisions.
 * The HTML from peraturan.bpk.go.id contains the full statute text with
 * Pasal headings that can be split on.
 *
 * Strategy:
 * 1. Find all "Pasal X" markers in the text
 * 2. Extract content between consecutive Pasal markers
 * 3. Track current BAB (Chapter) for context
 * 4. Extract definitions from Pasal 1 (Ketentuan Umum / General Provisions)
 */
export function parseIndonesianHtml(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  // Find all Pasal markers in the HTML
  // Patterns: "Pasal 1", "Pasal 26A", sometimes wrapped in tags
  const pasalPattern = /(?:<[^>]*>)?\s*Pasal\s+(\d+[A-Za-z]*)\s*(?:<[^>]*>)?/gi;
  const pasalPositions: { num: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = pasalPattern.exec(html)) !== null) {
    const num = match[1];
    // Avoid duplicates at nearly the same position (can happen with nested tags)
    const lastPos = pasalPositions[pasalPositions.length - 1];
    if (lastPos && lastPos.num === num && Math.abs(lastPos.index - match.index) < 200) {
      continue;
    }
    pasalPositions.push({ num, index: match.index });
  }

  // Extract content between each Pasal marker
  for (let i = 0; i < pasalPositions.length; i++) {
    const current = pasalPositions[i];
    const nextIndex = i + 1 < pasalPositions.length
      ? pasalPositions[i + 1].index
      : html.length;

    const sectionHtml = html.substring(current.index, nextIndex);
    const content = stripHtml(sectionHtml);

    // Skip near-empty provisions
    if (content.length < 15) continue;

    const sectionNum = current.num;
    const provisionRef = `pasal${sectionNum}`;
    const chapter = extractCurrentBab(html, current.index);

    // Try to extract a title/topic from the first line of content
    const titleLine = content.split('\n')[0] ?? '';
    const title = titleLine.replace(/^Pasal\s+\d+[A-Za-z]*\s*/i, '').trim();

    provisions.push({
      provision_ref: provisionRef,
      chapter,
      section: sectionNum,
      title: title.length > 3 ? title.substring(0, 200) : '',
      content: content.substring(0, 12000), // Cap at 12K chars for very long articles
    });

    // Extract definitions from Pasal 1 (typically the Ketentuan Umum section)
    if (sectionNum === '1') {
      extractDefinitions(content, provisionRef, definitions);
    }
  }

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
    definitions,
  };
}

/**
 * Parse BPK RI HTML using census law metadata instead of ActIndexEntry.
 */
export function parseBpkHtml(html: string, law: CensusLaw): ParsedAct {
  const act: ActIndexEntry = {
    id: law.id,
    lawType: 'UU',
    lawNumber: law.number,
    lawYear: law.year,
    title: law.title,
    titleEn: law.title_en,
    shortName: `UU ${law.number}/${law.year}`,
    status: law.status === 'unknown' ? 'in_force' : law.status as ActIndexEntry['status'],
    issuedDate: '',
    inForceDate: '',
    url: law.url_bpk_ri || law.url_peraturan_go_id,
    description: '',
  };
  return parseIndonesianHtml(html, act);
}

/**
 * Parse metadata from a peraturan.go.id detail page.
 * Extracts: title, status, issued date, PDF URL.
 */
export function parsePeraturanGoIdDetail(html: string, law: CensusLaw): {
  title: string;
  status: string;
  issuedDate: string;
  pdfUrl: string;
} {
  // Extract title - usually in the page heading
  const titleMatch = html.match(/<h[12][^>]*>([^<]+(?:Tentang\s+[^<]+)?)<\/h[12]>/i)
    || html.match(/Undang-undang\s+Nomor\s+\d+\s+Tahun\s+\d+\s+Tentang\s+([^<]+)/i);
  const title = titleMatch ? stripHtml(titleMatch[1]).trim() : law.title;

  // Extract status - "Berlaku" (In Effect), "Tidak Berlaku" (Repealed)
  const statusMatch = html.match(/(?:Status|status)[:\s]*(?:<[^>]+>)*\s*(Berlaku|Tidak Berlaku|Diubah)/i);
  let status = 'in_force';
  if (statusMatch) {
    const raw = statusMatch[1].toLowerCase();
    if (raw.includes('tidak')) status = 'repealed';
    else if (raw.includes('diubah')) status = 'amended';
  }

  // Extract issued date - "17 Oktober 2022"
  const dateMatch = html.match(/(?:Tanggal|tanggal)[^<]*?(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
  const issuedDate = dateMatch ? parseIndonesianDate(dateMatch[1]) : '';

  // Extract PDF URL - pattern: /files/Salinan+UU+Nomor+N+Tahun+YYYY.pdf
  const pdfMatch = html.match(/href="([^"]*\.pdf)"/i)
    || html.match(/src="([^"]*\.pdf)"/i);
  const pdfUrl = pdfMatch
    ? (pdfMatch[1].startsWith('http') ? pdfMatch[1] : `https://peraturan.go.id${pdfMatch[1]}`)
    : '';

  return { title, status, issuedDate, pdfUrl };
}

/**
 * Parse Indonesian month names to ISO date.
 */
function parseIndonesianDate(dateStr: string): string {
  const months: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04',
    mei: '05', juni: '06', juli: '07', agustus: '08',
    september: '09', oktober: '10', november: '11', desember: '12',
  };

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 3) return '';

  const day = parts[0].padStart(2, '0');
  const month = months[parts[1].toLowerCase()] ?? '';
  const year = parts[2];

  if (!month) return '';
  return `${year}-${month}-${day}`;
}

/**
 * Extract term definitions from the Ketentuan Umum (General Provisions) section.
 *
 * Indonesian statutes typically define terms in Pasal 1 using numbered points:
 *   1. Term1 adalah/ialah definition...
 *   2. Term2 adalah/ialah definition...
 *
 * "adalah" and "ialah" both mean "is/means" in Indonesian.
 * Some definitions use "yang dimaksud dengan" (what is meant by).
 */
function extractDefinitions(
  text: string,
  sourceProvision: string,
  definitions: ParsedDefinition[],
): void {
  const lines = text.split('\n');
  let currentDef = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for numbered definition start: "1. Term adalah/ialah ..."
    const defStart = trimmed.match(
      /^\d+\.\s+(.+?)\s+(?:adalah|ialah|yang dimaksud dengan)\s+(.+)/i,
    );

    if (defStart) {
      // Save previous definition if pending
      if (currentDef) {
        pushDefinition(currentDef, sourceProvision, definitions);
      }
      currentDef = trimmed;
    } else if (currentDef && /^\d+\./.test(trimmed)) {
      // New numbered item starts - save previous and start fresh
      pushDefinition(currentDef, sourceProvision, definitions);
      const newDef = trimmed.match(
        /^\d+\.\s+(.+?)\s+(?:adalah|ialah|yang dimaksud dengan)\s+(.+)/i,
      );
      currentDef = newDef ? trimmed : '';
    } else if (currentDef) {
      // Continuation of current definition
      currentDef += ' ' + trimmed;
    }
  }

  // Don't forget the last definition
  if (currentDef) {
    pushDefinition(currentDef, sourceProvision, definitions);
  }
}

/**
 * Parse a single definition line and push to the definitions array.
 */
function pushDefinition(
  text: string,
  sourceProvision: string,
  definitions: ParsedDefinition[],
): void {
  const match = text.match(
    /^\d+\.\s+(.+?)\s+(?:adalah|ialah|yang dimaksud dengan)\s+(.+)/i,
  );
  if (!match) return;

  const term = match[1]
    .replace(/yang selanjutnya disebut\s+.*/i, '') // Remove "hereinafter referred to as..."
    .trim();
  const definition = match[2]
    .replace(/\.+$/, '')
    .trim();

  if (term.length > 0 && definition.length > 5) {
    definitions.push({
      term,
      definition: definition.substring(0, 4000),
      source_provision: sourceProvision,
    });
  }
}

/**
 * Pre-configured list of key Indonesian laws (legacy fallback).
 *
 * The census-driven pipeline reads data/census.json instead.
 * This list is kept as a fallback for when census is not available.
 */
export const KEY_INDONESIAN_ACTS: ActIndexEntry[] = [
  {
    id: 'uu-27-2022',
    lawType: 'UU',
    lawNumber: '27',
    lawYear: '2022',
    title: 'Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi',
    titleEn: 'Law No. 27 of 2022 on Personal Data Protection (PDP Law)',
    shortName: 'UU 27/2022 PDP',
    status: 'in_force',
    issuedDate: '2022-10-17',
    inForceDate: '2022-10-17',
    url: 'https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022',
    description: 'Comprehensive personal data protection law; Indonesia\'s equivalent of the EU GDPR',
  },
  {
    id: 'uu-11-2008',
    lawType: 'UU',
    lawNumber: '11',
    lawYear: '2008',
    title: 'Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    titleEn: 'Law No. 11 of 2008 on Electronic Information and Transactions (ITE Law)',
    shortName: 'UU 11/2008 ITE',
    status: 'amended',
    issuedDate: '2008-04-21',
    inForceDate: '2008-04-21',
    url: 'https://peraturan.bpk.go.id/Details/37589/uu-no-11-tahun-2008',
    description: 'Electronic information and transactions law; covers e-commerce, digital signatures, cybercrimes',
  },
  {
    id: 'uu-19-2016',
    lawType: 'UU',
    lawNumber: '19',
    lawYear: '2016',
    title: 'Undang-Undang Nomor 19 Tahun 2016 tentang Perubahan atas UU No. 11 Tahun 2008',
    titleEn: 'Law No. 19 of 2016 amending the ITE Law',
    shortName: 'UU 19/2016 ITE Amdt',
    status: 'in_force',
    issuedDate: '2016-11-25',
    inForceDate: '2016-11-25',
    url: 'https://peraturan.bpk.go.id/Details/37582/uu-no-19-tahun-2016',
    description: 'Amendment to the ITE Law',
  },
  {
    id: 'uu-40-2007',
    lawType: 'UU',
    lawNumber: '40',
    lawYear: '2007',
    title: 'Undang-Undang Nomor 40 Tahun 2007 tentang Perseroan Terbatas',
    titleEn: 'Law No. 40 of 2007 on Limited Liability Companies',
    shortName: 'UU 40/2007 Company',
    status: 'in_force',
    issuedDate: '2007-08-16',
    inForceDate: '2007-08-16',
    url: 'https://peraturan.bpk.go.id/Details/39965/uu-no-40-tahun-2007',
    description: 'Company law (Perseroan Terbatas / PT)',
  },
  {
    id: 'uu-8-1999',
    lawType: 'UU',
    lawNumber: '8',
    lawYear: '1999',
    title: 'Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen',
    titleEn: 'Law No. 8 of 1999 on Consumer Protection',
    shortName: 'UU 8/1999 Consumer',
    status: 'in_force',
    issuedDate: '1999-04-20',
    inForceDate: '2000-04-20',
    url: 'https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999',
    description: 'Consumer protection law',
  },
];
