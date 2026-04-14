#!/usr/bin/env node

const passthroughArgs = process.argv.slice(2);

if (passthroughArgs.includes('--help') || passthroughArgs.includes('-h')) {
  console.log(`
FDA Data MCP wrapper

Usage:
  FDA_DATA_API_KEY=your_key npx -y fda-data-mcp

Optional:
  FDA_DATA_AUTH_HEADER="Authorization: Bearer your_key" npx -y fda-data-mcp

Best for:
  Claude Desktop / Cowork / Claude Code
  Cursor / Windsurf
  Other stdio MCP clients

This wrapper proxies stdio clients to:
  https://www.regdatalab.com/mcp

Get a free API key:
  https://www.regdatalab.com/signup
  Includes 300 free credits/month.
`.trim());
  process.exit(0);
}

// Direct stdio-to-HTTP proxy — no mcp-remote, no OAuth dance
const { main } = require('../lib/stdio-proxy.js');
main();
