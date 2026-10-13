const test = require('node:test');
const assert = require('node:assert/strict');

const {
  HOSTED_MCP_URL,
  buildAuthHeader,
  parseSSE,
  sendRequest,
} = require('../lib/stdio-proxy.js');

test('HOSTED_MCP_URL points to regdatalab', () => {
  assert.equal(HOSTED_MCP_URL, 'https://www.regdatalab.com/mcp');
});

test('buildAuthHeader uses FDA_DATA_API_KEY by default', () => {
  assert.equal(
    buildAuthHeader({ FDA_DATA_API_KEY: 'fda_test_123' }),
    'Authorization: Bearer fda_test_123',
  );
});

test('buildAuthHeader prefers a full auth header when provided', () => {
  assert.equal(
    buildAuthHeader({
      FDA_DATA_API_KEY: 'ignored',
      FDA_DATA_AUTH_HEADER: 'Authorization: Bearer fda_override_456',
    }),
    'Authorization: Bearer fda_override_456',
  );
});

test('buildAuthHeader trims whitespace', () => {
  assert.equal(
    buildAuthHeader({ FDA_DATA_API_KEY: '  fda_test_123  ' }),
    'Authorization: Bearer fda_test_123',
  );
});

test('buildAuthHeader throws when no auth env is present', () => {
  assert.throws(() => buildAuthHeader({}), (error) => {
    assert.match(error.message, /FDA_DATA_API_KEY/);
    assert.match(error.message, /regdatalab\.com\/signup/);
    assert.match(error.message, /300 free credits\/month/);
    return true;
  });
});

test('buildAuthHeader throws for empty string API key', () => {
  assert.throws(() => buildAuthHeader({ FDA_DATA_API_KEY: '' }));
  assert.throws(() => buildAuthHeader({ FDA_DATA_API_KEY: '   ' }));
});

test('parseSSE extracts messages from SSE format', () => {
  const sse = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}\n\n';
  const messages = parseSSE(sse);
  assert.equal(messages.length, 1);
  assert.equal(JSON.parse(messages[0]).result.ok, true);
});

test('parseSSE handles multiple messages', () => {
  const sse = [
    'event: message',
    'data: {"jsonrpc":"2.0","id":1,"result":"first"}',
    '',
    'event: message',
    'data: {"jsonrpc":"2.0","id":2,"result":"second"}',
    '',
  ].join('\n');
  const messages = parseSSE(sse);
  assert.equal(messages.length, 2);
  assert.equal(JSON.parse(messages[0]).result, 'first');
  assert.equal(JSON.parse(messages[1]).result, 'second');
});

test('parseSSE ignores comment lines and empty blocks', () => {
  const sse = ': keepalive\n\nevent: message\ndata: {"ok":true}\n\n';
  const messages = parseSSE(sse);
  assert.equal(messages.length, 1);
  assert.equal(JSON.parse(messages[0]).ok, true);
});

test('parseSSE handles data without event prefix', () => {
  const sse = 'data: {"bare":true}\n\n';
  const messages = parseSSE(sse);
  assert.equal(messages.length, 1);
  assert.equal(JSON.parse(messages[0]).bare, true);
});

// ---------------------------------------------------------------------------
// End-to-end: drive bin/fda-data-mcp.js over stdio against a local fake
// Streamable-HTTP MCP server. The hosted URL is hardcoded, so the child process
// patches fetch() to redirect it to the fake server.
// ---------------------------------------------------------------------------

const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'fda-data-mcp.js');
const GOOD_KEY = 'fda_good_key';

function startFakeServer() {
  const sessions = new Set();
  const requests = [];
  let counter = 0;
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      requests.push({ url: req.url, headers: req.headers, body: raw });
      if (req.url === '/elsewhere') {
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { leaked: true } }));
      }
      const json = (status, obj, extra = {}) => {
        res.writeHead(status, { 'content-type': 'application/json', ...extra });
        res.end(JSON.stringify(obj));
      };
      if (req.headers.authorization !== `Bearer ${GOOD_KEY}` && req.headers['x-api-key'] !== GOOD_KEY) {
        return json(401, { error: 'invalid_token', error_description: 'Invalid API key' });
      }
      const msg = JSON.parse(raw);
      if (msg.method === 'initialize') {
        const sid = `sess-${++counter}`;
        sessions.add(sid);
        return json(200, { jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'fake', version: '1' } } }, { 'mcp-session-id': sid });
      }
      const sid = req.headers['mcp-session-id'];
      if (!sessions.has(sid)) {
        return json(sid ? 404 : 400, { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Session not found' } });
      }
      if (Array.isArray(msg)) {
        return json(200, msg.filter((m) => m.id !== undefined).map((m) => ({ jsonrpc: '2.0', id: m.id, result: { method: m.method } })));
      }
      if (msg.id === undefined) { res.statusCode = 202; return res.end(); }
      const name = msg.params && msg.params.name;
      const args = (msg.params && msg.params.arguments) || {};
      const result = (r) => json(200, { jsonrpc: '2.0', id: msg.id, result: r });
      if (msg.method === 'tools/list') return result({ tools: [{ name: 'echo', inputSchema: { type: 'object' } }] });
      if (name === 'slow') return setTimeout(() => result({ text: 'slow' }), args.ms);
      if (name === 'expire') { sessions.delete(sid); return result({ text: 'expired' }); }
      if (name === 'big') return result({ text: 'x'.repeat(args.bytes) });
      if (name === 'html502') { res.writeHead(502, { 'content-type': 'text/html' }); return res.end('<html><body>502 Bad Gateway</body></html>'); }
      if (name === 'pretty') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { pretty: true } }, null, 2)); }
      if (name === 'redirect') { res.writeHead(307, { location: `http://localhost:${server.address().port}/elsewhere` }); return res.end(); }
      if (name === 'sse') {
        const nl = args.crlf ? '\r\n' : '\n';
        const progress = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/progress', params: { progressToken: 'p', progress: 1 } });
        const final = JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { sse: true } }, null, args.multiline ? 2 : 0);
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write(`event: message${nl}data: ${progress}${nl}${nl}: keepalive${nl}${nl}`);
        res.write(`id: 2${nl}event: message${nl}${final.split('\n').map((l) => `data: ${l}`).join(nl)}${nl}${nl}`);
        return res.end();
      }
      return result({ echo: args });
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, requests, url: `http://127.0.0.1:${server.address().port}/mcp` })));
}

function runWrapper(fakeUrl, env, messages, { stdinRaw } = {}) {
  const preload = `const f=globalThis.fetch;globalThis.fetch=(u,o)=>f(String(u)===${JSON.stringify(HOSTED_MCP_URL)}?process.env.FAKE_MCP_URL:u,o);require(${JSON.stringify(BIN)});`;
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['-e', preload], { env: { PATH: process.env.PATH, FAKE_MCP_URL: fakeUrl, ...env } });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => resolve({
      code,
      stderr: err,
      stdout: out,
      messages: out.split('\n').filter(Boolean).map((l) => JSON.parse(l)),
    }));
    if (stdinRaw) child.stdin.write(stdinRaw);
    for (const m of messages) child.stdin.write(`${JSON.stringify(m)}\n`);
    child.stdin.end();
  });
}

const initialize = { jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } };
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };
const callTool = (id, name, args = {}) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });

test('e2e', async (t) => {
  const fake = await startFakeServer();
  t.after(() => fake.server.close());
  const env = { FDA_DATA_API_KEY: GOOD_KEY };
  const run = (messages, opts, extraEnv = {}) => runWrapper(fake.url, { ...env, ...extraEnv }, messages, opts);

  await t.test('initialize, tools/list, tools/call, notifications; session id propagated', async () => {
    fake.requests.length = 0;
    const r = await run([initialize, initialized, { jsonrpc: '2.0', id: 1, method: 'tools/list' }, callTool(2, 'echo', { a: 1 })]);
    assert.equal(r.code, 0);
    assert.deepEqual(r.messages.map((m) => m.id), [0, 1, 2]);
    assert.equal(r.messages[1].result.tools[0].name, 'echo');
    assert.deepEqual(r.messages[2].result.echo, { a: 1 });
    assert.equal(fake.requests[0].headers['mcp-session-id'], undefined);
    const sid = fake.requests[1].headers['mcp-session-id'];
    assert.match(sid, /^sess-/);
    assert.ok(fake.requests.slice(1).every((q) => q.headers['mcp-session-id'] === sid));
    assert.ok(fake.requests.every((q) => q.headers.authorization === `Bearer ${GOOD_KEY}`));
  });

  await t.test('trailing whitespace/newline in FDA_DATA_API_KEY is trimmed', async () => {
    const r = await run([initialize], {}, { FDA_DATA_API_KEY: `  ${GOOD_KEY}\n` });
    assert.equal(r.messages[0].result.serverInfo.name, 'fake');
  });

  await t.test('JSON-RPC batch arrays are forwarded', async () => {
    const r = await run([initialize, [{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', method: 'notifications/x' }, { jsonrpc: '2.0', id: 2, method: 'tools/list' }]]);
    assert.deepEqual(r.messages[1].map((m) => m.id), [1, 2]);
  });

  await t.test('SSE: multi-event stream, CRLF line endings, multi-line data', async () => {
    const r = await run([initialize, callTool(1, 'sse'), callTool(2, 'sse', { crlf: true }), callTool(3, 'sse', { multiline: true })]);
    assert.deepEqual(
      r.messages.slice(1).map((m) => m.id ?? m.method),
      [ 'notifications/progress', 1, 'notifications/progress', 2, 'notifications/progress', 3 ],
    );
    assert.equal(r.messages[6].result.sse, true);
  });

  await t.test('pretty-printed JSON body is re-serialized onto one stdout line', async () => {
    const r = await run([initialize, callTool(1, 'pretty')]);
    assert.equal(r.messages[1].result.pretty, true);
  });

  await t.test('expired session (404) re-initializes and retries transparently', async () => {
    const r = await run([initialize, initialized, callTool(1, 'expire'), callTool(2, 'echo', { after: true })]);
    assert.deepEqual(r.messages.map((m) => m.id), [0, 1, 2]);
    assert.deepEqual(r.messages[2].result.echo, { after: true });
    assert.match(r.stderr, /re-initializing/);
  });

  await t.test('401 bad key gives a JSON-RPC error with the request id and a hint', async () => {
    const r = await run([initialize], {}, { FDA_DATA_API_KEY: 'wrong' });
    assert.equal(r.messages.length, 1);
    assert.equal(r.messages[0].id, 0);
    assert.match(r.messages[0].error.message, /HTTP 401/);
    assert.match(r.messages[0].error.message, /FDA_DATA_API_KEY/);
  });

  await t.test('missing API key exits 1 with signup hint', async () => {
    const r = await runWrapper(fake.url, {}, [initialize]);
    assert.equal(r.code, 1);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /FDA_DATA_API_KEY or FDA_DATA_AUTH_HEADER is required/);
  });

  await t.test('API key with an embedded newline is rejected without echoing the key', async () => {
    const r = await run([initialize], {}, { FDA_DATA_API_KEY: 'secretPART1\nsecretPART2' });
    assert.equal(r.code, 1);
    assert.doesNotMatch(r.stdout + r.stderr, /secretPART/);
  });

  await t.test('FDA_DATA_AUTH_HEADER without a space after the colon still authenticates', async () => {
    const r = await run([initialize], {}, { FDA_DATA_API_KEY: '', FDA_DATA_AUTH_HEADER: `Authorization:Bearer ${GOOD_KEY}` });
    assert.equal(r.messages[0].result.serverInfo.name, 'fake');
  });

  await t.test('redirects are not followed (custom auth header not sent to another origin)', async () => {
    fake.requests.length = 0;
    const r = await run([initialize, callTool(1, 'redirect')], {}, { FDA_DATA_API_KEY: '', FDA_DATA_AUTH_HEADER: `X-API-Key: ${GOOD_KEY}` });
    assert.equal(r.messages[1].id, 1);
    assert.ok(r.messages[1].error);
    assert.ok(!fake.requests.some((q) => q.url === '/elsewhere'));
  });

  await t.test('non-JSON 502 HTML becomes a JSON-RPC error for that id', async () => {
    const r = await run([initialize, callTool(1, 'html502')]);
    assert.equal(r.messages[1].id, 1);
    assert.match(r.messages[1].error.message, /HTTP 502/);
  });

  await t.test('malformed stdin line is skipped and later requests still work', async () => {
    const r = await run([initialize, callTool(1, 'echo')], { stdinRaw: '{not json\n' });
    assert.deepEqual(r.messages.map((m) => m.id), [0, 1]);
    assert.match(r.stderr, /Invalid JSON from stdin/);
  });

  await t.test('oversized stdin message gets an error response; next message still works', async () => {
    const r = await run([initialize, callTool(1, 'echo', { pad: 'p'.repeat(1_100_000) }), callTool(2, 'echo')]);
    // The oversized line is rejected synchronously while the others are still
    // queued, so replies can arrive out of order (JSON-RPC allows that).
    // Check each id instead of the order.
    const byId = new Map(r.messages.map((m) => [m.id, m]));
    assert.equal(r.messages.length, 3);
    assert.ok(byId.get(0).result);
    assert.equal(byId.get(1).error.code, -32600);
    assert.ok(byId.get(2).result);
  });

  await t.test('responses keep request order even when an earlier call is slow', async () => {
    const r = await run([initialize, callTool(1, 'slow', { ms: 300 }), callTool(2, 'echo'), { jsonrpc: '2.0', id: 3, method: 'ping' }]);
    assert.deepEqual(r.messages.map((m) => m.id), [0, 1, 2, 3]);
  });

  await t.test('large response is fully flushed to stdout before exit on stdin close', async () => {
    const bytes = 8_000_000;
    const r = await run([initialize, callTool(1, 'big', { bytes })]);
    assert.equal(r.code, 0);
    assert.equal(r.messages[1].result.text.length, bytes);
  });

  await t.test('unreachable server yields a connection error for requests only', async () => {
    const r = await runWrapper('http://127.0.0.1:1/mcp', env, [initialize, initialized]);
    assert.equal(r.messages.length, 1);
    assert.equal(r.messages[0].id, 0);
    assert.match(r.messages[0].error.message, /Connection error/);
  });
});

test('parseSSE handles CRLF and multi-line data fields', () => {
  assert.deepEqual(
    parseSSE('event: message\r\ndata: {"a":1}\r\n\r\nevent: message\r\ndata: {"b":\r\ndata: 2}\r\n\r\n').map((m) => JSON.parse(m)),
    [{ a: 1 }, { b: 2 }],
  );
});

// --- sendRequest response-shape validation and redaction (mocked fetch) ---

const SECRET = 'rdl_live_SYNTHETIC_TOKEN_123';
const AUTH = `Authorization: Bearer ${SECRET}`;

async function withFetch(status, text, headers, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(text, { status, headers });
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

test('sendRequest answers a request when HTTP 200 has an empty body', async () => {
  const result = await withFetch(200, '', { 'content-type': 'application/json' }, () =>
    sendRequest({ jsonrpc: '2.0', id: 7, method: 'tools/list' }, null, AUTH));
  assert.equal(result.messages.length, 1);
  const msg = JSON.parse(result.messages[0]);
  assert.equal(msg.id, 7);
  assert.ok(msg.error);
});

test('sendRequest answers a request when HTTP 200 carries non-JSON-RPC JSON', async () => {
  const result = await withFetch(200, '{"ok":true}', { 'content-type': 'application/json' }, () =>
    sendRequest({ jsonrpc: '2.0', id: 'a', method: 'tools/list' }, null, AUTH));
  const replies = result.messages.map((m) => JSON.parse(m)).filter((m) => m.id === 'a');
  assert.equal(replies.length, 1);
  assert.ok(replies[0].error);
});

test('sendRequest answers a request when an SSE stream has no reply for its id', async () => {
  const sse = 'event: message\ndata: {"jsonrpc":"2.0","method":"notifications/progress","params":{}}\n\n';
  const result = await withFetch(200, sse, { 'content-type': 'text/event-stream' }, () =>
    sendRequest({ jsonrpc: '2.0', id: 3, method: 'tools/call' }, null, AUTH));
  const replies = result.messages.map((m) => JSON.parse(m)).filter((m) => m.id === 3);
  assert.equal(replies.length, 1);
  assert.ok(replies[0].error);
});

test('sendRequest does not add an error when the server answered the request', async () => {
  const result = await withFetch(200, '{"jsonrpc":"2.0","id":1,"result":{}}', { 'content-type': 'application/json' }, () =>
    sendRequest({ jsonrpc: '2.0', id: 1, method: 'ping' }, null, AUTH));
  assert.deepEqual(result.messages.map((m) => JSON.parse(m)), [{ jsonrpc: '2.0', id: 1, result: {} }]);
});

test('sendRequest redacts the token from HTTP 500 structured errors', async () => {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 9, error: { code: -32000, message: `bad header ${AUTH}` } });
  const result = await withFetch(500, body, { 'content-type': 'application/json' }, () =>
    sendRequest({ jsonrpc: '2.0', id: 9, method: 'tools/list' }, null, AUTH));
  const joined = result.messages.join('\n');
  assert.ok(!joined.includes(SECRET), joined);
  assert.ok(joined.includes('[REDACTED]'));
});

test('sendRequest redacts the token from a non-matching HTTP 500 error message', async () => {
  const body = JSON.stringify({ error: { message: `token ${SECRET} rejected` } });
  const result = await withFetch(500, body, { 'content-type': 'application/json' }, () =>
    sendRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, null, AUTH));
  assert.ok(!result.messages.join('\n').includes(SECRET));
});

test('sendRequest redacts the token from notification failure logs', async () => {
  const writes = [];
  const originalWrite = process.stderr.write;
  process.stderr.write = (chunk) => { writes.push(String(chunk)); return true; };
  try {
    const result = await withFetch(502, `upstream echoed ${AUTH}`, { 'content-type': 'text/plain' }, () =>
      sendRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, null, AUTH));
    assert.deepEqual(result.messages, []);
  } finally {
    process.stderr.write = originalWrite;
  }
  const logged = writes.join('');
  assert.ok(logged.includes('Notification notifications/initialized failed'));
  assert.ok(!logged.includes(SECRET), logged);
});

test('sendRequest redacts a known mcp-session-id from forwarded messages', async () => {
  const sessionId = 'sess-SYNTHETIC-0123456789';
  const body = JSON.stringify({ jsonrpc: '2.0', id: 4, error: { code: -32000, message: `session ${sessionId} invalid` } });
  const result = await withFetch(500, body, { 'content-type': 'application/json' }, () =>
    sendRequest({ jsonrpc: '2.0', id: 4, method: 'tools/list' }, sessionId, AUTH));
  const joined = result.messages.join('\n');
  assert.ok(!joined.includes(sessionId), joined);
  assert.ok(joined.includes('[REDACTED]'));
});

test('sendRequest redacts a newly issued session id echoed in the body and logs', async () => {
  const newSession = 'sess-NEW-SYNTHETIC-987654321';
  const writes = [];
  const originalWrite = process.stderr.write;
  process.stderr.write = (chunk) => { writes.push(String(chunk)); return true; };
  let result;
  try {
    result = await withFetch(502, `bad gateway for ${newSession}`,
      { 'content-type': 'text/plain', 'mcp-session-id': newSession }, () =>
        sendRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, null, AUTH));
  } finally {
    process.stderr.write = originalWrite;
  }
  assert.equal(result.sessionId, newSession, 'the proxy still tracks the session internally');
  assert.ok(!writes.join('').includes(newSession), writes.join(''));
});
