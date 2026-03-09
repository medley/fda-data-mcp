# Changelog

All notable changes to this repo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this repo uses a simple `vMAJOR.MINOR.PATCH` versioning scheme for public releases.

## [v0.3.0] - 2026-03-08

### Added

- Wrapper-first setup guidance for Claude Desktop, Cowork, Cursor, Windsurf, and other stdio MCP clients.
- Clear signup messaging in the npm wrapper when `FDA_DATA_API_KEY` is missing, including the free-tier link and credits.
- Discovery metadata link in the public README so agents can find `/.well-known/mcp.json` quickly.
- Publish-ready `fda-data-mcp` npm wrapper package built on top of `mcp-remote`.
- Wrapper entrypoint and config helpers for stdio clients that need a local command instead of direct remote HTTP.
- A dedicated GitHub social preview image asset for repo sharing.

### Changed

- Made the wrapper the default setup path in the README instead of direct HTTP.
- Updated the VS Code install button and Smithery metadata to use `fda-data-mcp` directly.
- Removed stale README copy that still claimed the npm package had not been published.

## [v0.1.0] - 2026-03-08

### Added

- Homepage screenshot in the README so GitHub visitors can see the live product before they install it.
- Public trust and support files: `LICENSE`, `SECURITY.md`, `SUPPORT.md`, and GitHub issue-routing config.
- Marketplace metadata for hosted MCP discovery: `server.json`, `smithery.yaml`, and `glama.json`.
- Lightweight validation CI for metadata and canonical hosted endpoint references.
- GitHub Pages landing page that points to the canonical hosted docs instead of duplicating stale product copy.

### Changed

- Renamed the public repo from `fda-data-docs` to `fda-data-mcp`.
- Rewrote the README as a product landing page for the hosted FDA Data MCP.
- Standardized install guidance around the hosted MCP endpoint at `https://www.regdatalab.com/mcp`.
- Added quick-start instructions for Claude Code, Claude Desktop, Cursor, Windsurf, generic MCP clients, and VS Code one-click install.
