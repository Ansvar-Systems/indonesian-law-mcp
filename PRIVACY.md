# Privacy & Client Confidentiality / Privasi dan Kerahasiaan Klien

**IMPORTANT READING FOR LEGAL PROFESSIONALS**
**BACAAN PENTING UNTUK PROFESIONAL HUKUM**

This document addresses privacy and confidentiality considerations when using this Tool, with particular attention to professional obligations under Indonesian bar association rules.

---

## Executive Summary

**Key Risks:**
- Queries through Claude API flow via Anthropic cloud infrastructure
- Query content may reveal client matters and privileged information
- PERADI (Perhimpunan Advokat Indonesia) rules require strict confidentiality controls

**Safe Use Options:**
1. **General Legal Research**: Use Tool for non-client-specific queries
2. **Local npm Package**: Install `@ansvar/indonesian-law-mcp` locally — database queries stay on your machine
3. **Remote Endpoint**: Vercel Streamable HTTP endpoint — queries transit Vercel infrastructure
4. **On-Premise Deployment**: Self-host with local LLM for privileged matters

---

## Data Flows and Infrastructure

### MCP (Model Context Protocol) Architecture

This Tool uses the **Model Context Protocol (MCP)** to communicate with AI clients:

```
User Query -> MCP Client (Claude Desktop/Cursor/API) -> Anthropic Cloud -> MCP Server -> Database
```

### Deployment Options

#### 1. Local npm Package (Most Private)

```bash
npx @ansvar/indonesian-law-mcp
```

- Database is local SQLite file on your machine
- No data transmitted to external servers (except to AI client for LLM processing)
- Full control over data at rest

#### 2. Remote Endpoint (Vercel)

```
Endpoint: https://indonesian-law-mcp.vercel.app/mcp
```

- Queries transit Vercel infrastructure
- Tool responses return through the same path
- Subject to Vercel's privacy policy

### What Gets Transmitted

When you use this Tool through an AI client:

- **Query Text**: Your search queries and tool parameters
- **Tool Responses**: Statute text, provision content, search results
- **Metadata**: Timestamps, request identifiers

**What Does NOT Get Transmitted:**
- Files on your computer
- Your full conversation history (depends on AI client configuration)

---

## Professional Obligations (Indonesia)

### Indonesian Bar Association Rules

Indonesian lawyers (advokat) are bound by strict confidentiality rules under the Undang-Undang Advokat No. 18 Tahun 2003 (Advocate Law) and the Kode Etik Advokat Indonesia established by PERADI (Perhimpunan Advokat Indonesia).

#### Kerahasiaan Advokat-Klien (Attorney-Client Privilege)

- All client communications are privileged under Indonesian law (Article 19 of the Advocate Law)
- Client identity may be confidential in sensitive matters
- Case strategy and legal analysis are protected
- Information that could identify clients or matters must be safeguarded
- Advocates have the right to refuse to testify about client matters (hak ingkar)

### Personal Data Protection Law (UU PDP No. 27/2022) and Client Data Processing

Under **UU PDP No. 27 Tahun 2022** (Personal Data Protection Law), when using services that process client data:

- You are the **Data Controller** (Pengendali Data Pribadi)
- AI service providers (Anthropic, Vercel) may be **Data Processors** (Prosesor Data Pribadi)
- A **Data Processing Agreement** may be required
- Ensure adequate technical and organizational measures
- Cross-border data transfers must comply with UU PDP requirements including adequacy assessments or binding corporate rules
- The Ministry of Communication and Information Technology (Kominfo) oversees enforcement during the transition period

---

## Risk Assessment by Use Case

### LOW RISK: General Legal Research

**Safe to use through any deployment:**

```
Example: "What does the Indonesian Company Law say about shareholder rights?"
```

- No client identity involved
- No case-specific facts
- Publicly available legal information

### MEDIUM RISK: Anonymized Queries

**Use with caution:**

```
Example: "What are the penalties for corruption under Indonesian anti-corruption law?"
```

- Query pattern may reveal you are working on a corruption matter
- Anthropic/Vercel logs may link queries to your API key

### HIGH RISK: Client-Specific Queries

**DO NOT USE through cloud AI services:**

- Remove ALL identifying details
- Use the local npm package with a self-hosted LLM
- Or use commercial legal databases with proper data processing agreements

---

## Data Collection by This Tool

### What This Tool Collects

**Nothing.** This Tool:

- Does NOT log queries
- Does NOT store user data
- Does NOT track usage
- Does NOT use analytics
- Does NOT set cookies

The database is read-only. No user data is written to disk.

### What Third Parties May Collect

- **Anthropic** (if using Claude): Subject to [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **Vercel** (if using remote endpoint): Subject to [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

---

## Recommendations

### For Solo Practitioners / Small Firms

1. Use local npm package for maximum privacy
2. General research: Cloud AI is acceptable for non-client queries
3. Client matters: Use commercial legal databases (Hukumonline, JDIH Premium)

### For Large Firms / Corporate Legal

1. Negotiate data processing agreements with AI service providers in compliance with UU PDP
2. Consider on-premise deployment with self-hosted LLM
3. Train staff on safe vs. unsafe query patterns
4. Appoint a Data Protection Officer as required by UU PDP

### For Government / Public Sector

1. Use self-hosted deployment, no external APIs
2. Follow Indonesian government data security requirements (PP 71/2019 on Electronic Systems)
3. Air-gapped option available for classified matters

---

## Questions and Support

- **Privacy Questions**: Open issue on [GitHub](https://github.com/Ansvar-Systems/indonesian-law-mcp/issues)
- **Anthropic Privacy**: Contact privacy@anthropic.com
- **Indonesian Bar Guidance**: Consult PERADI (Perhimpunan Advokat Indonesia) ethics guidance
- **Kominfo**: Contact the Ministry of Communication and Information Technology for data protection matters

---

**Last Updated**: 2026-02-22
**Tool Version**: 1.0.0
