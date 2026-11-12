# Official MCP Registry listing

`server.json` in this repo is the entry for the official MCP Registry
(<https://registry.modelcontextprotocol.io>). The entry is remote-only: it
points at the hosted endpoint `https://www.regdatalab.com/mcp` and lists no npm
package, so republishing it never needs an npm publish.

- Name: `io.github.medley/fda-data` (the name already in the registry since 2026-02-07)
- Version: `1.1.1`, published 2026-11-12 and marked latest in the registry. Each later publish needs a new, higher version
- Tools: not stored in the entry; clients read them from the server. `GET https://www.regdatalab.com/api` is the authoritative list
- Auth: OAuth sign-in, or an optional `Authorization: Bearer` header

## Publish (owner only, externally visible)

Run from a checkout of `main` after this file's PR merges:

```bash
brew install mcp-publisher        # once
mcp-publisher login github        # device-code sign-in as medley
mcp-publisher publish             # reads ./server.json
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.medley/fda-data"
```

The check should show the new version with `"isLatest":true`.

Bump `version` (next: `1.1.2`) before every later publish. The registry
refuses a version it already holds.
