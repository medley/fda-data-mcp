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
  if (authHeader) return assertHeaderSafe(authHeader, 'FDA_DATA_AUTH_HEADER');

  const apiKey = env.FDA_DATA_API_KEY && env.FDA_DATA_API_KEY.trim();
  if (apiKey) return assertHeaderSafe(`Authorization: Bearer ${apiKey}`, 'FDA_DATA_API_KEY');

  throw new Error(
    'FDA_DATA_API_KEY or FDA_DATA_AUTH_HEADER is required.\n' +
    'Get a free API key at https://www.regdatalab.com/signup (300 free credits/month).'
  );
}

// Reject values fetch() would refuse; its error message would echo the secret.
function assertHeaderSafe(header, name) {
  if (/[\0\r\n]/.test(header)) {
    throw new Error(`${name} contains a line break or NUL character. Remove it and try again.`);
  }
  return header;
}

function splitAuthHeader(authHeader) {
  const idx = authHeader.indexOf(':');
  if (idx <= 0) return null;
  return [authHeader.slice(0, idx).trim(), authHeader.slice(idx + 1).trim()];
}

/**
 * Parse SSE text into individual JSON-RPC messages.
 * SSE format: "event: message\ndata: {json}\n\n"
 */
function parseSSE(text) {
  const messages = [];
  const blocks = text.replace(/\r\n?/g, '\n').split(/\n\n+/);

  for (const block of blocks) {
    const data = [];

    for (const line of block.split('\n')) {
      if (line.startsWith('data:')) {
        const value = line.slice(5);
        data.push(value.startsWith(' ') ? value.slice(1) : value);
      }
    }

    // Per the SSE spec, multiple data lines in one event are joined with \n.
    if (data.length && data.join('').trim()) {
      messages.push(data.join('\n'));
    }
  }

  return messages;
}

function isResponseFor(json, id) {
  return json && typeof json === 'object' && !Array.isArray(json) &&
    json.jsonrpc === '2.0' && json.id === id && ('result' in json || 'error' in json);
}

// Build JSON-RPC errors for every request (not notification) in `body`.
function errorsFor(body, message) {
  const reqs = (Array.isArray(body) ? body : [body]).filter((m) => m && m.id !== undefined && m.id !== null);
  const errs = reqs.map((m) => ({ jsonrpc: '2.0', id: m.id, error: { code: -32000, message } }));
  if (!errs.length) return [];
  return [JSON.stringify(Array.isArray(body) ? errs : errs[0])];
}

async function sendRequest(body, sessionId, authHeader) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };

  const authParts = authHeader && splitAuthHeader(authHeader);
  if (authParts) {
    headers[authParts[0]] = authParts[1];
  }

  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const response = await fetch(HOSTED_MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    // Never follow redirects: custom auth headers and the session id would be
    // re-sent to whatever host the Location header names.
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });

  const newSessionId = response.headers.get('mcp-session-id') || sessionId;
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  const status = response.status;

  if (!response.ok) {
    // Forward the server's JSON-RPC error only if it answers this request;
    // otherwise (401 bodies, id:null errors, HTML pages) the client would wait forever.
    let errorJson;
    try { errorJson = JSON.parse(responseText); } catch { errorJson = undefined; }
    if (!Array.isArray(body) && body && body.id !== undefined && isResponseFor(errorJson, body.id)) {
      return { messages: [JSON.stringify(errorJson)], sessionId: newSessionId, status };
    }

    let message = `HTTP ${status}`;
    if (status === 401 || status === 403) {
      message += ': authentication failed. Check FDA_DATA_API_KEY (get a key at https://www.regdatalab.com/signup).';
    } else if (errorJson && errorJson.error && typeof errorJson.error.message === 'string') {
      message += `: ${errorJson.error.message}`;
    } else if (errorJson && typeof errorJson.error_description === 'string') {
      message += `: ${errorJson.error_description}`;
    } else {
      message += `: ${responseText.slice(0, 200)}`;
    }
    if (body && body.id === undefined && !Array.isArray(body)) {
      process.stderr.write(`Notification ${body.method} failed: ${message}\n`);
    }
    return { messages: errorsFor(body, message), sessionId: newSessionId, status };
  }

  // Handle SSE responses
  if (contentType.includes('text/event-stream')) {
    return { messages: toLines(parseSSE(responseText), body), sessionId: newSessionId, status };
  }

  // Handle plain JSON responses
  if (responseText.trim()) {
    return { messages: toLines([responseText], body), sessionId: newSessionId, status };
  }

  // 202 Accepted (notifications) — no response body
  return { messages: [], sessionId: newSessionId, status };
}

// stdout is newline-delimited, so every message must be re-serialized onto one
// line (servers may pretty-print JSON or split an SSE event over several data: lines).
function toLines(payloads, body) {
  const lines = [];
  for (const payload of payloads) {
    try {
      lines.push(JSON.stringify(JSON.parse(payload)));
    } catch {
      process.stderr.write(`Ignoring non-JSON message from server: ${payload.slice(0, 100)}\n`);
    }
  }
  if (!lines.length && payloads.length) return errorsFor(body, 'Server returned an invalid (non-JSON) response');
  return lines;
}

function redact(text, authHeader) {
  const parts = authHeader && splitAuthHeader(authHeader);
  if (!parts || !parts[1]) return text;
  let out = text.split(parts[1]).join('[REDACTED]');
  const token = parts[1].replace(/^Bearer\s+/i, '');
  if (token) out = out.split(token).join('[REDACTED]');
  return out;
}

const MAX_LINE_BYTES = 1_000_000;

async function main() {
  let authHeader;
  try {
    authHeader = buildAuthHeader();
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exit(1);
  }

  let sessionId = null;
  let initRequest = null;
  let buffer = '';
  let discarding = false;
  let pending = 0;
  let stdinEnded = false;
  let requestQueue = Promise.resolve();

  function checkDone() {
    if (stdinEnded && pending === 0) {
      // Let stdout drain first; exiting immediately truncates large responses on pipes.
      process.stdout.write('', () => process.exit(0));
    }
  }

  async function forward(msg) {
    if (msg && msg.method === 'initialize') {
      initRequest = msg;
      sessionId = null; // a fresh initialize must not carry the old session id
    }

    let result = await sendRequest(msg, sessionId, authHeader);

    // Streamable HTTP: 404 on a request carrying a session id means the session
    // expired. Re-initialize transparently with the client's original params and retry once.
    if (result.status === 404 && sessionId && initRequest && msg !== initRequest) {
      process.stderr.write('MCP session expired; re-initializing\n');
      const reinit = await sendRequest(initRequest, null, authHeader);
      if (reinit.status >= 200 && reinit.status < 300 && reinit.sessionId) {
        sessionId = reinit.sessionId;
        await sendRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, sessionId, authHeader);
        result = await sendRequest(msg, sessionId, authHeader);
      }
    }

    sessionId = result.sessionId;
    return result;
  }

  function rejectOversized(prefix) {
    const match = /"id"\s*:\s*("(?:[^"\\]|\\.)*"|-?\d+)/.exec(prefix);
    process.stderr.write(`stdin message exceeded ${MAX_LINE_BYTES} bytes, dropped\n`);
    if (match) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32600, message: `Request too large (limit ${MAX_LINE_BYTES} bytes)` },
        id: JSON.parse(match[1]),
      }) + '\n');
    }
  }

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    if (discarding) {
      const nl = chunk.indexOf('\n');
      if (nl === -1) return;
      discarding = false;
      chunk = chunk.slice(nl + 1);
    }
    buffer += chunk;

    // Process complete lines (JSON-RPC messages are newline-delimited)
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (!line) continue;

      if (line.length > MAX_LINE_BYTES) {
        rejectOversized(line.slice(0, 1000));
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch {
        process.stderr.write(`Invalid JSON from stdin: ${line.slice(0, 100)}\n`);
        continue;
      }

      pending++;
      requestQueue = requestQueue
        .then(() => forward(parsed))
        .then((result) => {
          for (const msg of result.messages) {
            process.stdout.write(msg + '\n');
          }
        })
        .catch((error) => {
          let errMsg = error instanceof Error ? error.message : String(error);
          if (error && error.cause && error.cause.message) errMsg += ` (${error.cause.message})`;
          errMsg = redact(errMsg, authHeader);
          process.stderr.write(`Request failed: ${errMsg}\n`);

          // Send JSON-RPC error(s) back to the client
          for (const msg of errorsFor(parsed, `Connection error: ${errMsg}`)) {
            process.stdout.write(msg + '\n');
          }
        })
        .finally(() => {
          pending--;
          checkDone();
        });
    }

    // Only the unterminated tail is left; cap it so one huge line cannot grow forever.
    if (buffer.length > MAX_LINE_BYTES) {
      rejectOversized(buffer.slice(0, 1000));
      buffer = '';
      discarding = true;
    }
  });

  process.stdin.on('end', () => {
    stdinEnded = true;
    checkDone();
  });

  process.stdin.resume();
}

module.exports = { HOSTED_MCP_URL, buildAuthHeader, parseSSE, sendRequest, redact, main };
