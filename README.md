# Indonesian Law MCP Server

**The JDIH BPK (Jaringan Dokumentasi dan Informasi Hukum) alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Findonesian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/indonesian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/indonesian-law-mcp?style=social)](https://github.com/Ansvar-Systems/indonesian-law-mcp)
[![CI](https://github.com/Ansvar-Systems/indonesian-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/indonesian-law-mcp/actions/workflows/ci.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](docs/INTERNATIONAL_INTEGRATION_GUIDE.md)
[![Provisions](https://img.shields.io/badge/provisions-2%2C225-blue)](docs/INTERNATIONAL_INTEGRATION_GUIDE.md)

Cari **1.924 Undang-Undang (UU) Indonesia** -- dari UU Pelindungan Data Pribadi (UU PDP No. 27/2022) dan Kitab Undang-Undang Hukum Pidana (KUHP) hingga UU Ketenagakerjaan, UU ITE, dan lebih banyak lagi -- langsung dari Claude, Cursor, atau klien MCP apa pun.

If you're building legal tech, compliance tools, or doing Indonesian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Mengapa alat ini ada

Penelitian hukum Indonesia tersebar di peraturan.go.id, jdih.kemenkumham.go.id, BPK RI, dan portal JDIH kementerian yang berbeda-beda. Baik Anda:
- Seorang **pengacara** memvalidasi kutipan dalam dokumen hukum atau kontrak
- Seorang **profesional kepatuhan** memeriksa kewajiban UU PDP atau peraturan OJK
- Seorang **pengembang legaltech** membangun alat berdasarkan hukum Indonesia
- Seorang **peneliti** melacak peraturan perundang-undangan Indonesia di 1.924 UU

...Anda seharusnya tidak memerlukan puluhan tab browser dan pencarian PDF manual. Tanyakan kepada Claude. Dapatkan ketentuan yang tepat. Dengan konteks.

Server MCP ini membuat hukum Indonesia **dapat dicari, dapat direferensikan, dan dapat dibaca oleh AI**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://indonesian-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add indonesian-law --transport http https://indonesian-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "indonesian-law": {
      "type": "url",
      "url": "https://indonesian-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "indonesian-law": {
      "type": "http",
      "url": "https://indonesian-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/indonesian-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "indonesian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/indonesian-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "indonesian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/indonesian-law-mcp"]
    }
  }
}
```

---

## Contoh Kueri

Setelah terhubung, tanyakan secara alami:

- *"Cari 'pelindungan data pribadi' dalam UU PDP No. 27/2022"*
- *"Apa isi Pasal 30 KUHP tentang pidana denda?"*
- *"Temukan ketentuan tentang pemutusan hubungan kerja dalam UU Ketenagakerjaan"*
- *"Apakah UU ITE No. 11/2008 masih berlaku?"*
- *"Cari kewajiban keamanan data dalam UU PDP"*
- *"Apa persyaratan persetujuan dalam UU Perlindungan Konsumen?"*
- *"Bagaimana UU PDP Indonesia selaras dengan kerangka perlindungan data ASEAN?"*
- *"Validasi kutipan: UU No. 27 Tahun 2022, Pasal 16"*
- *"Bangun argumen hukum tentang hak subjek data dalam hukum Indonesia"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Undang-Undang** | 1,924 laws | Complete Indonesian legislative corpus from BPK RI |
| **Provisions (Pasal)** | 2,225 sections | Full-text searchable with FTS5 |
| **Database Size** | ~2 MB | Optimized SQLite, portable |
| **Language** | Indonesian (Bahasa Indonesia) | Official language of Indonesian law |
| **Freshness Checks** | Automated | Drift detection against JDIH BPK |

### Key Laws Included

| Law | Description |
|-----|-------------|
| UU No. 27/2022 (UU PDP) | Undang-Undang Pelindungan Data Pribadi |
| UU No. 11/2008 jo. 19/2016 (UU ITE) | Informasi dan Transaksi Elektronik |
| KUHP (Kitab UU Hukum Pidana) | Criminal Code |
| UU No. 13/2003 (Ketenagakerjaan) | Employment / Labour Law |
| UU No. 8/1999 (Perlindungan Konsumen) | Consumer Protection |
| UU No. 40/2007 (Perseroan Terbatas) | Limited Liability Companies |
| UU No. 4/2023 (P2SK) | Financial Sector Development |

**Verified data only** -- every citation is validated against official sources (peraturan.bpk.go.id, jdih.kemenkumham.go.id). Zero LLM-generated content.

---

## Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from peraturan.go.id and jdih.kemenkumham.go.id official sources using a census-first full corpus approach (BPK RI + JDIH Nasional)
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains law text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by law number + pasal (article)
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
JDIH BPK / peraturan.go.id --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                                  ^                        ^
                           Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Pendekatan Tradisional | Server MCP ini |
|------------------------|----------------|
| Cari di peraturan.go.id berdasarkan nomor UU | Cari dalam Bahasa Indonesia: *"pelindungan data pribadi"* |
| Navigasi manual UU multi-pasal | Dapatkan ketentuan yang tepat dengan konteks |
| Referensi silang manual antar UU | `build_legal_stance` mengagregasi dari berbagai sumber |
| "Apakah UU ini masih berlaku?" -- periksa manual | Alat `check_currency` -- jawaban dalam hitungan detik |
| Temukan kerangka ASEAN -- cari manual | `get_eu_basis` -- kerangka internasional terkait langsung |
| Tanpa API, tanpa integrasi | Protokol MCP -- native AI |

**Tradisional:** Cari di JDIH --> Unduh PDF --> Ctrl+F dalam Bahasa Indonesia --> Referensi silang UU lain --> Periksa kerangka ASEAN secara terpisah --> Ulangi

**MCP ini:** *"Apa kewajiban pemrosesan data berdasarkan UU PDP No. 27/2022 dan bagaimana selarasnya dengan standar internasional?"* --> Selesai.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 2,225 provisions with BM25 ranking. Supports Bahasa Indonesia queries |
| `get_provision` | Retrieve specific provision by law number + pasal (article) |
| `check_currency` | Check if a law is in force, amended, or repealed |
| `validate_citation` | Validate citation against database -- zero-hallucination check |
| `build_legal_stance` | Aggregate citations from multiple laws for a legal topic |
| `format_citation` | Format citations per Indonesian conventions (full/short/pinpoint) |
| `list_sources` | List all available laws with metadata, coverage scope, and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get international frameworks (ASEAN, G20, WTO) that an Indonesian law aligns with |
| `get_indonesian_implementations` | Find Indonesian laws implementing a specific international instrument |
| `search_eu_implementations` | Search international documents with Indonesian implementation counts |
| `get_provision_eu_basis` | Get international law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Indonesian laws against international frameworks |

---

## International Law Alignment

Indonesia is not an EU member state. Indonesian law aligns with international frameworks through:

- **ASEAN framework** -- Indonesia is a founding ASEAN member and the largest economy; digital economy and data protection laws (UU PDP) align with ASEAN frameworks
- **G20** -- Indonesia holds G20 membership; financial regulation and data governance align with G20 commitments
- **WTO** -- Trade, intellectual property, and e-commerce law follows WTO commitments
- **UNCITRAL** -- Electronic transactions framework follows UNCITRAL model law principles
- **Perhimpunan Advokat Indonesia (PERADI) / Kongres Advokat Indonesia (KAI)** -- Professional legal practice regulated by PERADI and KAI

The international bridge tools allow you to explore these alignment relationships -- checking which Indonesian provisions correspond to ASEAN or G20 requirements, and vice versa.

> **Note:** International cross-references reflect alignment and treaty obligation relationships. Indonesia adopts its own legislative approach, and the tools help identify where Indonesian and international law address the same domains.

---

## Data Sources & Freshness

All content is sourced from authoritative Indonesian legal databases:

- **[peraturan.go.id](https://peraturan.go.id/)** -- Official Indonesian government regulation portal
- **[JDIH BPK RI (peraturan.bpk.go.id)](https://peraturan.bpk.go.id/)** -- Badan Pemeriksa Keuangan legal information network (primary source)
- **[JDIH Kemenkumham](https://jdih.kemenkumham.go.id/)** -- Ministry of Law and Human Rights legal information network

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | BPK RI (Badan Pemeriksa Keuangan) / JDIH Nasional |
| **Language** | Indonesian (Bahasa Indonesia) |
| **Coverage** | 1,924 Undang-Undang across all legislative areas |
| **Ingestion method** | Census-first full corpus from BPK RI + JDIH Nasional |
| **Last ingested** | 2026-02-28 |

### Automated Freshness Checks

A GitHub Actions workflow monitors all data sources:

| Check | Method |
|-------|--------|
| **Law amendments** | Drift detection against known pasal anchors |
| **New laws** | Comparison against JDIH BPK index |
| **Repealed laws** | Status change detection |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from JDIH BPK RI and peraturan.go.id official databases. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for jurisprudence research
> - **Verify critical citations** against primary sources (peraturan.go.id) for official proceedings
> - **International cross-references** reflect alignment relationships, not formal transposition
> - **Regional/local regulations (Perda)** are not included -- this covers national Undang-Undang only
> - For professional legal advice in Indonesia, consult a member of **PERADI (Perhimpunan Advokat Indonesia)** or **KAI (Kongres Advokat Indonesia)**

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/indonesian-law-mcp
cd indonesian-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest              # Ingest laws from JDIH BPK
npm run build:db            # Rebuild SQLite database
npm run check-updates       # Check for amendments and new laws
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~2 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

**70+ national law MCPs** covering Australia, Brazil, Canada, China, Denmark, Finland, France, Germany, Ghana, Iceland, India, Ireland, Israel, Italy, Japan, Kenya, Netherlands, Nigeria, Norway, Singapore, Slovenia, South Korea, Sweden, Switzerland, Thailand, UAE, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Expanded provision extraction and pasal coverage
- Court case law (Mahkamah Agung, Mahkamah Konstitusi decisions)
- Government regulation (Peraturan Pemerintah / PP) coverage
- Historical law versions and amendment tracking

---

## Roadmap

- [x] Core law database with FTS5 search
- [x] Full corpus ingestion (1,924 UU, 2,225 provisions)
- [x] Census-first full corpus from BPK RI + JDIH Nasional
- [x] International law alignment tools (ASEAN, G20, WTO)
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Expanded pasal-level provision extraction
- [ ] Court case law expansion
- [ ] PP (Peraturan Pemerintah) and Perpres coverage
- [ ] Historical law versions (amendment tracking)

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{indonesian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Indonesian Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/indonesian-law-mcp},
  note = {1,924 Indonesian Undang-Undang with 2,225 provisions from BPK RI and JDIH Nasional}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** BPK RI / JDIH Nasional (public domain)
- **International References:** ASEAN, G20, WTO (public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool for Indonesian legal research -- turns out everyone building compliance tools for Southeast Asia has the same research frustrations.

So we're open-sourcing it. Navigating 1,924 Undang-Undang across JDIH BPK and peraturan.go.id shouldn't take hours.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
