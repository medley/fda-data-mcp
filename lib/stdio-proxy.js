/**
 * stdio-to-Streamable-HTTP proxy for MCP.
 *
 * Reads JSON-RPC messages from stdin (one per line), POSTs them to the
 * remote MCP server with Bearer auth, parses the SSE/JSON responses,
 * and writes them to stdout. Manages the mcp-session-id lifecycle.
 *
 * Zero npm dependencies — only Node.js built-ins.
 */

const HOSTED_MCP_URL = 'https://www.regdatalab.com/mcp';

function buildAuthHeader(env = process.env) {
  const authHeader = env.FDA_DATA_AUTH_HEADER && env.FDA_DATA_AUTH_HEADER.trim();
  if (authHeader) return authHeader;

  const apiKey = env.FDA_DATA_API_KEY && env.FDA_DATA_API_KEY.trim();
  if (apiKey) return `Authorization: Bearer ${apiKey}`;

  throw new Error(
    'FDA_DATA_API_KEY or FDA_DATA_AUTH_HEADER is required.\n' +
    'Get a free API key at https://www.regdatalab.com/signup (300 free credits/month).'
  );
}

/**
 * Parse SSE text into individual JSON-RPC messages.
 * SSE format: "event: message\ndata: {json}\n\n"
 */
function parseSSE(text) {
  const messages = [];
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    let data = null;

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        data = line.slice(6);
      } else if (line.startsWith('data:')) {
        data = line.slice(5);
      }
    }

    if (data) {
      messages.push(data);
    }
  }

  return messages;
}

async function sendRequest(body, sessionId, authHeader) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };

  if (authHeader) {
    const idx = authHeader.indexOf(': ');
    if (idx > 0) {
      headers[authHeader.slice(0, idx)] = authHeader.slice(idx + 2);
    }
  }

  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const response = await fetch(HOSTED_MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  const newSessionId = response.headers.get('mcp-session-id') || sessionId;
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();

  if (!response.ok) {
    // Try to parse as JSON-RPC error
    try {
      const errorJson = JSON.parse(responseText);
      return { messages: [JSON.stringify(errorJson)], sessionId: newSessionId };
    } catch {
      return {
        messages: [JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32000, message: `HTTP ${response.status}: ${responseText.slice(0, 200)}` },
          id: body.id ?? null,
        })],
        sessionId: newSessionId,
      };
    }
  }

  // Handle SSE responses
  if (contentType.includes('text/event-stream')) {
    return { messages: parseSSE(responseText), sessionId: newSessionId };
  }

  // Handle plain JSON responses
  if (responseText.trim()) {
    return { messages: [responseText.trim()], sessionId: newSessionId };
  }

  // 202 Accepted (notifications) — no response body
  return { messages: [], sessionId: newSessionId };
}

async function main() {
  let authHeader;
  try {
    authHeader = buildAuthHeader();
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exit(1);
  }

  let sessionId = null;
  let buffer = '';
  let pending = 0;
  let stdinEnded = false;
  let requestQueue = Promise.resolve();

  function checkDone() {
    if (stdinEnded && pending === 0) {
      process.exit(0);
    }
  }

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buffer += chunk;

    if (buffer.length > 1_000_000) {
      process.stderr.write('stdin buffer exceeded 1 MB, clearing\n');
      buffer = '';
      return;
    }

    // Process complete lines (JSON-RPC messages are newline-delimited)
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (!line) continue;

      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch {
        process.stderr.write(`Invalid JSON from stdin: ${line.slice(0, 100)}\n`);
        continue;
      }

      pending++;
      requestQueue = requestQueue
        .then(() => sendRequest(parsed, sessionId, authHeader))
        .then((result) => {
          sessionId = result.sessionId;
          for (const msg of result.messages) {
            process.stdout.write(msg + '\n');
          }
        })
        .catch((error) => {
          const errMsg = error instanceof Error ? error.message : String(error);
          process.stderr.write(`Request failed: ${errMsg}\n`);

          // Send JSON-RPC error back to the client
          if (parsed.id !== undefined) {
            process.stdout.write(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32000, message: `Connection error: ${errMsg}` },
              id: parsed.id,
            }) + '\n');
          }
        })
        .finally(() => {
          pending--;
          checkDone();
        });
    }
  });

  process.stdin.on('end', () => {
    stdinEnded = true;
    checkDone();
  });

  process.stdin.resume();
}

module.exports = { HOSTED_MCP_URL, buildAuthHeader, parseSSE, sendRequest, main };
