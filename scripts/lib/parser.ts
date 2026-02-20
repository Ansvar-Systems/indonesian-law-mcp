/**
 * HTML parser for Indonesian legislation from BPK RI (peraturan.bpk.go.id)
 *
 * BPK RI serves legislation as structured HTML pages. Each law page contains
 * the full text with articles (Pasal) and chapters (Bab). The HTML structure
 * uses consistent patterns:
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
    // Indonesian articles often start with "Pasal X\n(1) Content..."
    // The title is inferred from chapter context
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
  // Pattern: numbered definition items
  // e.g., "1. Data Pribadi adalah data tentang..."
  // e.g., "2. Pengendali Data Pribadi yang selanjutnya disebut Pengendali..."
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
      // Check if this line is also a definition
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
 * Pre-configured list of key Indonesian laws to ingest.
 *
 * Source: peraturan.bpk.go.id (BPK RI legislation database)
 * URL pattern: https://peraturan.bpk.go.id/Details/{ID}/{slug}
 *
 * These are the most important laws for cybersecurity, data protection,
 * electronic transactions, and compliance use cases in Indonesia.
 *
 * Indonesian law types:
 *   UU    = Undang-Undang (Law)
 *   PP    = Peraturan Pemerintah (Government Regulation)
 *   UUD   = Undang-Undang Dasar (Constitution)
 */
export const KEY_INDONESIAN_ACTS: ActIndexEntry[] = [
  {
    id: 'uu-27-2022-pdp',
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
    description: 'Comprehensive personal data protection law (Perlindungan Data Pribadi); Indonesia\'s equivalent of the EU GDPR with a 2-year transition period ending October 2024',
  },
  {
    id: 'uu-11-2008-ite',
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
    description: 'Electronic information and transactions law; covers e-commerce, digital signatures, cybercrimes; amended by UU 19/2016',
  },
  {
    id: 'uu-19-2016-ite-amendment',
    lawType: 'UU',
    lawNumber: '19',
    lawYear: '2016',
    title: 'Undang-Undang Nomor 19 Tahun 2016 tentang Perubahan atas UU Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    titleEn: 'Law No. 19 of 2016 amending Law No. 11 of 2008 on Electronic Information and Transactions',
    shortName: 'UU 19/2016 ITE Amdt',
    status: 'in_force',
    issuedDate: '2016-11-25',
    inForceDate: '2016-11-25',
    url: 'https://peraturan.bpk.go.id/Details/37582/uu-no-19-tahun-2016',
    description: 'Amendment to the ITE Law; revised defamation provisions, added right to be forgotten, strengthened electronic evidence rules',
  },
  {
    id: 'pp-71-2019-pste',
    lawType: 'PP',
    lawNumber: '71',
    lawYear: '2019',
    title: 'Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik',
    titleEn: 'Government Regulation No. 71 of 2019 on the Operation of Electronic Systems and Transactions',
    shortName: 'PP 71/2019 PSTE',
    status: 'in_force',
    issuedDate: '2019-10-10',
    inForceDate: '2019-10-10',
    url: 'https://peraturan.bpk.go.id/Details/131060/pp-no-71-tahun-2019',
    description: 'Implementing regulation for electronic systems and transactions; covers data localization, electronic system registration, content moderation',
  },
  {
    id: 'uu-40-2007-pt',
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
    description: 'Company law governing establishment, governance, and dissolution of limited liability companies (Perseroan Terbatas / PT)',
  },
  {
    id: 'uu-8-1999-perlindungan-konsumen',
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
    description: 'Consumer protection law establishing consumer rights, business obligations, and dispute resolution mechanisms',
  },
  {
    id: 'uud-1945',
    lawType: 'UUD',
    lawNumber: '1945',
    lawYear: '1945',
    title: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
    titleEn: 'Constitution of the Republic of Indonesia 1945 (UUD 1945)',
    shortName: 'UUD 1945',
    status: 'in_force',
    issuedDate: '1945-08-18',
    inForceDate: '1945-08-18',
    url: 'https://peraturan.bpk.go.id/Details/41175/uud-tahun-1945',
    description: 'Supreme law of Indonesia; Pasal 28G guarantees protection of personal and family data; Pasal 28F guarantees right to communicate and obtain information',
  },
  {
    id: 'uu-36-1999-telekomunikasi',
    lawType: 'UU',
    lawNumber: '36',
    lawYear: '1999',
    title: 'Undang-Undang Nomor 36 Tahun 1999 tentang Telekomunikasi',
    titleEn: 'Law No. 36 of 1999 on Telecommunications',
    shortName: 'UU 36/1999 Telecom',
    status: 'in_force',
    issuedDate: '1999-09-08',
    inForceDate: '2000-09-08',
    url: 'https://peraturan.bpk.go.id/Details/45196/uu-no-36-tahun-1999',
    description: 'Telecommunications law regulating telecom operators, spectrum management, and interconnection; foundation for digital infrastructure regulation',
  },
  {
    id: 'uu-3-2011-transfer-dana',
    lawType: 'UU',
    lawNumber: '3',
    lawYear: '2011',
    title: 'Undang-Undang Nomor 3 Tahun 2011 tentang Transfer Dana',
    titleEn: 'Law No. 3 of 2011 on Fund Transfer',
    shortName: 'UU 3/2011 Fund Transfer',
    status: 'in_force',
    issuedDate: '2011-03-23',
    inForceDate: '2011-03-23',
    url: 'https://peraturan.bpk.go.id/Details/39126/uu-no-3-tahun-2011',
    description: 'Fund transfer law governing electronic fund transfers, payment orders, and settlement finality',
  },
  {
    id: 'pp-80-2019-perdagangan-elektronik',
    lawType: 'PP',
    lawNumber: '80',
    lawYear: '2019',
    title: 'Peraturan Pemerintah Nomor 80 Tahun 2019 tentang Perdagangan Melalui Sistem Elektronik',
    titleEn: 'Government Regulation No. 80 of 2019 on E-Commerce',
    shortName: 'PP 80/2019 E-Commerce',
    status: 'in_force',
    issuedDate: '2019-11-25',
    inForceDate: '2019-11-25',
    url: 'https://peraturan.bpk.go.id/Details/133007/pp-no-80-tahun-2019',
    description: 'E-commerce regulation covering online marketplace obligations, consumer protection in e-commerce, cross-border e-commerce, and business licensing requirements',
  },
  {
    id: 'uu-7-2014-perdagangan',
    lawType: 'UU',
    lawNumber: '7',
    lawYear: '2014',
    title: 'Undang-Undang Nomor 7 Tahun 2014 tentang Perdagangan',
    titleEn: 'Law No. 7 of 2014 on Trade',
    shortName: 'UU 7/2014 Trade',
    status: 'in_force',
    issuedDate: '2014-03-11',
    inForceDate: '2014-03-11',
    url: 'https://peraturan.bpk.go.id/Details/38560/uu-no-7-tahun-2014',
    description: 'Trade law covering domestic and international trade, e-commerce provisions, trade facilitation, and consumer goods distribution',
  },
];
