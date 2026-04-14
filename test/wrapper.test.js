const test = require('node:test');
const assert = require('node:assert/strict');

const {
  HOSTED_MCP_URL,
  buildAuthHeader,
  parseSSE,
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
