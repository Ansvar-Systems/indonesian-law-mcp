# Indonesian Law MCP

[![npm](https://img.shields.io/npm/v/@ansvar/indonesian-law-mcp)](https://www.npmjs.com/package/@ansvar/indonesian-law-mcp)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/Ansvar-Systems/indonesian-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/indonesian-law-mcp/actions/workflows/ci.yml)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-green)](https://registry.modelcontextprotocol.io/)
[![OpenSSF Scorecard](https://img.shields.io/ossf-scorecard/github.com/Ansvar-Systems/indonesian-law-mcp)](https://securityscorecards.dev/viewer/?uri=github.com/Ansvar-Systems/indonesian-law-mcp)

A Model Context Protocol (MCP) server providing comprehensive access to Indonesian legislation, including the PDP Law (Perlindungan Data Pribadi), ITE Law (Informasi dan Transaksi Elektronik), Government Regulation on Electronic Systems, Company Law (Perseroan Terbatas), and Consumer Protection with full-text search.

## Deployment Tier

**MEDIUM** -- Dual tier, bundled free database shipped with the npm package. Full database available via separate download.

**Estimated database size:** ~100-200 MB (free tier), ~400-800 MB (professional tier with full regulatory corpus)

## Key Legislation Covered

| Law | Number/Year | Significance |
|-----|-------------|-------------|
| **PDP Law (Perlindungan Data Pribadi)** | UU No. 27/2022 | Comprehensive personal data protection law modeled on EU GDPR; enacted October 2022 with 2-year transition period |
| **ITE Law (Informasi dan Transaksi Elektronik)** | UU No. 11/2008 (amended UU No. 19/2016) | Electronic information, transactions, and cybercrime; primary cybercrime law |
| **Government Regulation on Electronic Systems** | PP No. 71/2019 | Electronic system operation, data localization for public systems, electronic transactions |
| **Company Law (Perseroan Terbatas)** | UU No. 40/2007 | Limited liability companies, corporate governance, directors' duties |
| **Consumer Protection** | UU No. 8/1999 | Consumer rights, business actor obligations, dispute resolution |
| **Constitution (UUD 1945)** | 1945 (amended) | Supreme law; Article 28G guarantees right to personal protection |

## Regulatory Context

- **Data Protection Authority:** PDP supervisory institution (being established); interim enforcement by Ministry of Communication and Informatics (Kominfo)
- **Cybercrime Enforcement:** Directorate of Cybercrime, Indonesian National Police (Bareskrim Polri)
- **Indonesia's PDP Law (UU 27/2022)** was modeled on the EU GDPR; enacted 17 October 2022 with a 2-year transition period ending October 2024
- Indonesia is the largest economy in ASEAN with 270M+ people and is rapidly digitalizing
- The legislation hierarchy follows UU No. 12/2011: UUD 1945 > UU/Perpu > PP > Perpres > Provincial/District Regulations
- Bahasa Indonesia is the legally binding language; English translations are unofficial
- Indonesia is a member of ASEAN and participates in the ASEAN Framework on Personal Data Protection
- PP No. 71/2019 imposes data localization requirements for public electronic system operators

## Data Sources

| Source | Authority | Method | Update Frequency | License | Coverage |
|--------|-----------|--------|-----------------|---------|----------|
| [BPK RI (peraturan.bpk.go.id)](https://peraturan.bpk.go.id) | Audit Board of the Republic of Indonesia | HTML Scrape | Weekly | Government Open Data | All UU, PP, Perpres, Ministerial Regulations, Constitution |
| [JDIH (peraturan.go.id)](https://www.peraturan.go.id) | Ministry of Law and Human Rights | HTML Scrape | Weekly | Government Open Data | National legal documentation, State Gazette references |

> Full provenance metadata: [`sources.yml`](./sources.yml)

## Installation

```bash
npm install -g @ansvar/indonesian-law-mcp
```

## Usage

### As stdio MCP server

```bash
indonesian-law-mcp
```

### In Claude Desktop / MCP client configuration

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

## Available Tools

| Tool | Description |
|------|-------------|
| `get_provision` | Retrieve a specific article (pasal) from an Indonesian law or regulation |
| `search_legislation` | Full-text search across all Indonesian legislation in Bahasa Indonesia and English |
| `get_provision_eu_basis` | Cross-reference lookup for international framework relationships (GDPR, ASEAN, etc.) |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run contract tests
npm run test:contract

# Run all validation
npm run validate

# Build database from sources
npm run build:db

# Start server
npm start
```

## Contract Tests

This MCP includes 12 golden contract tests covering:
- 4 article retrieval tests (PDP Law Art 1, ITE Law Art 1, Company Law Art 1, PP 71/2019 Art 1)
- 3 search tests (data pribadi, transaksi elektronik, keamanan siber)
- 2 citation roundtrip tests (official peraturan.bpk.go.id URL patterns)
- 1 cross-reference test (PDP Law to GDPR)
- 2 negative tests (non-existent law, malformed article)

Run with: `npm run test:contract`

## Indonesian Legislation Numbering

Indonesia uses a specific numbering format for legislation:

| Type | Format | Example |
|------|--------|---------|
| Law (Undang-Undang) | UU No. X Tahun YYYY | UU No. 27 Tahun 2022 (PDP Law) |
| Government Regulation | PP No. X Tahun YYYY | PP No. 71 Tahun 2019 |
| Presidential Regulation | Perpres No. X Tahun YYYY | Perpres No. 95 Tahun 2018 |
| Ministerial Regulation | Permen X No. Y Tahun YYYY | Permenkominfo No. 20 Tahun 2016 |

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability disclosure policy.

Report data errors: [Open an issue](https://github.com/Ansvar-Systems/indonesian-law-mcp/issues/new?template=data-error.md)

## License

Apache-2.0 -- see [LICENSE](./LICENSE)

---

Built by [Ansvar Systems](https://ansvar.eu) -- Cybersecurity compliance through AI-powered analysis.
