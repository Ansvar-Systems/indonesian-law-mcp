# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-XX-XX
### Added
- Initial release of Indonesian Law MCP
- `search_legislation` tool for full-text search across all Indonesian statutes and regulations
- `get_provision` tool for retrieving specific articles (pasal)
- `get_provision_eu_basis` tool for international framework cross-references (GDPR, ASEAN)
- `validate_citation` tool for legal citation validation
- `check_statute_currency` tool for checking statute amendment status
- `list_laws` tool for browsing available legislation
- Coverage of PDP Law (UU 27/2022), ITE Law (UU 11/2008), PP 71/2019, Company Law (UU 40/2007), Consumer Protection (UU 8/1999)
- Bahasa Indonesia and English language support
- Contract tests with 12 golden test cases
- Drift detection with 6 stable provision anchors
- Health and version endpoints
- Vercel deployment (dual tier bundled free)
- npm package with stdio transport
- MCP Registry publishing

[Unreleased]: https://github.com/Ansvar-Systems/indonesian-law-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Ansvar-Systems/indonesian-law-mcp/releases/tag/v1.0.0
