const HOSTED_MCP_URL = 'https://www.regdatalab.com/mcp';

function buildAuthHeader(env = process.env) {
  const authHeader = env.FDA_DATA_AUTH_HEADER && env.FDA_DATA_AUTH_HEADER.trim();

  if (authHeader) {
    return authHeader;
  }

  const apiKey = env.FDA_DATA_API_KEY && env.FDA_DATA_API_KEY.trim();

  if (apiKey) {
    return `Authorization: Bearer ${apiKey}`;
  }

  throw new Error('FDA_DATA_API_KEY or FDA_DATA_AUTH_HEADER is required to use the FDA Data MCP wrapper.');
}

function buildRemoteArgs(env = process.env, passthroughArgs = []) {
  return [
    HOSTED_MCP_URL,
    '--transport',
    'http-only',
    '--header',
    buildAuthHeader(env),
    ...passthroughArgs,
  ];
}

module.exports = {
  HOSTED_MCP_URL,
  buildAuthHeader,
  buildRemoteArgs,
};
