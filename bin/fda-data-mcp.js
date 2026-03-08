#!/usr/bin/env node

const { spawn } = require('node:child_process');

const { buildRemoteArgs } = require('../lib/wrapper-config.js');

const passthroughArgs = process.argv.slice(2);

if (passthroughArgs.includes('--help') || passthroughArgs.includes('-h')) {
  console.log(`
FDA Data MCP wrapper

Usage:
  FDA_DATA_API_KEY=your_key npx -y fda-data-mcp

Optional:
  FDA_DATA_AUTH_HEADER="Authorization: Bearer your_key" npx -y fda-data-mcp

This wrapper proxies stdio clients to:
  https://www.regdatalab.com/mcp
`.trim());
  process.exit(0);
}

let remoteArgs;

try {
  remoteArgs = buildRemoteArgs(process.env, passthroughArgs);
} catch (error) {
  console.error(error.message);
  console.error('Example: FDA_DATA_API_KEY=your_key npx -y fda-data-mcp');
  process.exit(1);
}

const proxyScript = require.resolve('mcp-remote/dist/proxy.js');
const child = spawn(process.execPath, [proxyScript, ...remoteArgs], {
  env: process.env,
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(`Failed to start mcp-remote: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
