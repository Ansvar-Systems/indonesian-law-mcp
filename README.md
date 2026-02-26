# Indonesian Law MCP Server

**The peraturan.go.id alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Findonesian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/indonesian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/indonesian-law-mcp?style=social)](https://github.com/Ansvar-Systems/indonesian-law-mcp)
[![Database](https://img.shields.io/badge/database-pre--built-green)](data/database.db)
[![Provisions](https://img.shields.io/badge/provisions-2%2C225-blue)](#whats-included)

Query **1,924 Indonesian Undang-Undang (laws)** -- from the PDP Law and ITE Law to the Constitution and Company Law -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Indonesian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Indonesian legal research is scattered across peraturan.go.id, peraturan.bpk.go.id, JDIH Nasional, and individual ministry databases. Whether you're:
- A **compliance officer** checking PDP Law (data protection) obligations
- A **legal tech developer** building tools on Indonesian law
- A **lawyer** validating ITE Law provisions for e-commerce compliance
- A **researcher** analysing ASEAN data protection frameworks

...you shouldn't need to parse government PDFs and navigate fragmented databases. Ask Claude. Get the exact provision. With context.

This MCP server makes Indonesian law **searchable, cross-referenceable, and AI-readable**.

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

## Example Queries

Once connected, just ask naturally:

- *"What does Pasal 1 of UU PDP (UU 27/2022) define as personal data?"*
- *"Find provisions about transaksi elektronik in Indonesian law"*
- *"What are the data controller obligations in the PDP Law?"*
- *"Is UU 11/2008 (ITE Law) still in force?"*
- *"Find consumer protection provisions in Indonesian law"*
- *"What does UU 36/1999 say about telecommunications?"*
- *"Search for 'transfer dana' in Indonesian legislation"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Laws (Undang-Undang)** | 1,924 | Full census of Indonesian national legislation |
| **Provisions (Pasal)** | 2,225 | Full-text searchable with FTS5 |
| **Legal Definitions** | 65 | Extracted from Pasal 1 (Ketentuan Umum) |
| **Full-text Laws** | 8 | PDP, ITE, Company, Consumer Protection, Telecom, Trade, Fund Transfer |
| **Metadata-only Laws** | 1,916 | Title, year, number, status, source URL |
| **Database Size** | ~2.1 MB | Optimized SQLite, portable |
| **Coverage Period** | 1946--2026 | 80 years of Indonesian legislation |

**Verified data only** -- every law is enumerated from peraturan.go.id (JDIH Nasional), with full text sourced from peraturan.bpk.go.id (BPK RI). Zero LLM-generated content.

### Key Laws with Full Article Text

| Law | Articles | Description |
|-----|----------|-------------|
| **UU 27/2022 (PDP Law)** | 76 | Personal Data Protection -- Indonesia's GDPR equivalent |
| **UU 11/2008 (ITE Law)** | 54 | Electronic Information and Transactions |
| **UU 36/1999 (Telecom)** | 37 | Telecommunications |
| **UU 8/1999 (Consumer)** | 36 | Consumer Protection |
| **UU 3/2011 (Fund Transfer)** | 35 | Fund Transfer |
| **UU 7/2014 (Trade)** | 32 | Trade |
| **UU 40/2007 (Company)** | 26 | Limited Liability Companies (PT) |
| **UU 19/2016 (ITE Amdt)** | 13 | ITE Law Amendment |

---

## Available Tools (8)

### Core Legal Research Tools

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 search on 2,225 provisions with BM25 ranking |
| `get_provision` | Retrieve specific provision by law identifier + Pasal number |
| `list_documents` | List all 1,924 laws with status and metadata |
| `validate_citation` | Validate citation against database (zero-hallucination check) |
| `check_currency` | Check if statute is in force, amended, or repealed |
| `get_definitions` | Get legal term definitions from Pasal 1 (Ketentuan Umum) |
| `format_citation` | Format citations per Indonesian conventions |
| `build_legal_stance` | Aggregate citations across multiple statutes |

### EU Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations referenced in Indonesian law |
| `get_indonesian_implementations` | Find Indonesian laws implementing EU acts |
| `search_eu_implementations` | Search EU documents with Indonesian implementation counts |
| `get_provision_eu_basis` | Get EU references for specific provision |
| `validate_eu_compliance` | Check implementation status |

---

## Data Sources & Architecture

### Census-First Full Corpus Ingestion

This MCP uses a **census-first** approach:

1. **Census** (`scripts/census.ts`): Enumerates all 1,924 Undang-Undang from peraturan.go.id paginated listing
2. **Ingest** (`scripts/ingest.ts`): For each law, fetches full text from BPK RI (when accessible), falls back to metadata-only seed
3. **Build** (`scripts/build-db.ts`): Compiles all seeds into optimized SQLite with FTS5

```
peraturan.go.id (census) --> peraturan.bpk.go.id (full text) --> SQLite + FTS5 --> MCP response
                                    |
                         geo-blocked? --> metadata-only seed
```

### Sources

- **[peraturan.go.id](https://peraturan.go.id)** -- JDIH Nasional (Ministry of Law and Human Rights). Canonical listing of all Indonesian legislation.
- **[peraturan.bpk.go.id](https://peraturan.bpk.go.id)** -- BPK RI (Audit Board of the Republic of Indonesia). Full-text HTML of legislation with Pasal/Bab structure.

### Data Coverage by Decade

| Decade | Laws |
|--------|------|
| 1940s | 113 |
| 1950s | 421 |
| 1960s | 191 |
| 1970s | 82 |
| 1980s | 101 |
| 1990s | 185 |
| 2000s | 367 |
| 2010s | 216 |
| 2020s | 248 |

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official Indonesian government databases. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Full article text is available for 8 key laws only** -- most laws have metadata only
> - **Verify critical citations** against primary sources (peraturan.go.id or peraturan.bpk.go.id)
> - **Bahasa Indonesia is the legally binding language** -- no English translations are official

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [PRIVACY.md](PRIVACY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. See [PRIVACY.md](PRIVACY.md) for guidance.

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

### Data Pipeline

```bash
npm run census                           # Enumerate all 1,924 laws from peraturan.go.id
npm run ingest                           # Fetch full text from BPK RI + generate seeds
npm run ingest -- --resume               # Resume (skip existing seed files)
npm run ingest -- --limit 10             # Test with first 10 laws
npm run build:db                         # Rebuild SQLite database from seeds
npm run check-updates                    # Check for new legislation
```

### Pipeline Details

| Step | Script | Output |
|------|--------|--------|
| Census | `scripts/census.ts` | `data/census.json` (1,924 laws) |
| Ingest | `scripts/ingest.ts` | `data/seed/*.json` (per-law JSON) |
| Build | `scripts/build-db.ts` | `data/database.db` (2.1 MB SQLite) |

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~2.1 MB (efficient, portable)
- **Census:** ~50 seconds for full corpus enumeration
- **Ingestion:** ~6 seconds with metadata-only fallback

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite**:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, and more. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/swedish-law-mcp](https://github.com/Ansvar-Systems/swedish-law-mcp)
**Query 2,415 Swedish statutes** -- DSL, BrB, ABL, MB, and more. `npx @ansvar/swedish-law-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/Security-Controls-MCP)
**Query 261 security frameworks** -- SCF, ISO 27001, NIST CSF, SOC 2. `npx @ansvar/security-controls-mcp`

---

## Contributing

Contributions welcome! Priority areas:

- **Full-text expansion** -- Additional BPK RI Detail IDs for more laws
- **Peraturan Pemerintah (PP)** -- Government regulations (implementing legislation)
- **Peraturan Presiden (Perpres)** -- Presidential regulations
- **English translation** alignment for key statutes
- **Historical amendment tracking**

---

## Roadmap

- [x] **Census-first full corpus** -- 1,924 Undang-Undang enumerated from peraturan.go.id
- [x] **Full text for key laws** -- PDP, ITE, Company, Consumer, Telecom, Trade, Fund Transfer
- [ ] Full text expansion via BPK RI (from Indonesian IP access)
- [ ] Peraturan Pemerintah (PP) coverage
- [ ] Case law integration
- [ ] Daily freshness checks
- [ ] Premium tier with version tracking

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{indonesian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Indonesian Law MCP Server: Census-First Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/indonesian-law-mcp},
  note = {1,924 Indonesian Undang-Undang with full-text search}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Legislation:** Government Open Data (Republic of Indonesia)
- **Source:** peraturan.go.id (JDIH Nasional) + peraturan.bpk.go.id (BPK RI)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools. This MCP server covers the Indonesian legal system -- the largest economy in ASEAN with 270M+ people and a rapidly evolving regulatory landscape.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
