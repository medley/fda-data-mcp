const test = require('node:test');
const assert = require('node:assert/strict');

const {
  HOSTED_MCP_URL,
  buildAuthHeader,
  buildRemoteArgs,
} = require('../lib/wrapper-config.js');

test('buildAuthHeader uses FDA_DATA_API_KEY by default', () => {
  assert.equal(buildAuthHeader({ FDA_DATA_API_KEY: 'fda_test_123' }), 'Authorization: Bearer fda_test_123');
});

test('buildAuthHeader prefers a full auth header when provided', () => {
  assert.equal(
    buildAuthHeader({
      FDA_DATA_API_KEY: 'ignored',
      FDA_DATA_AUTH_HEADER: 'Authorization: Bearer fda_override_456',
    }),
    'Authorization: Bearer fda_override_456'
  );
});

test('buildRemoteArgs returns the hosted endpoint and auth header', () => {
  assert.deepEqual(buildRemoteArgs({ FDA_DATA_API_KEY: 'fda_test_123' }), [
    HOSTED_MCP_URL,
    '--transport',
    'http-only',
    '--header',
    'Authorization: Bearer fda_test_123',
  ]);
});

test('buildRemoteArgs appends extra passthrough arguments', () => {
  assert.deepEqual(
    buildRemoteArgs({ FDA_DATA_API_KEY: 'fda_test_123' }, ['--debug', '--trace']),
    [
      HOSTED_MCP_URL,
      '--transport',
      'http-only',
      '--header',
      'Authorization: Bearer fda_test_123',
      '--debug',
      '--trace',
    ]
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
