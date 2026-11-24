# Install RegDataLab in Cline

RegDataLab is a hosted MCP server at `https://www.regdatalab.com/mcp`. It is already running. Skip cloning, package install, and any local process. Connect Cline to that URL over Streamable HTTP.

1. Get an API key at https://www.regdatalab.com/signup. Free plan: 6 free credits (2 supplier checks) after you verify your email. One-time, no monthly refill. No card. A supplier risk summary (`fda_manufacturing_risk_summary`) costs 3 credits; most tools cost 1. Keep the key out of any URL.

2. Open `~/.cline/data/settings/cline_mcp_settings.json` (the Cline CLI settings file). Create it if it is missing. In the Cline panel, the same file opens from the MCP Servers icon, then **Configure**, then **Configure MCP Servers**. On the **Remote Servers** tab, set **Transport Type** to **Streamable HTTP**.

3. Set `"type": "streamableHttp"` on the `regdatalab` entry. The value is the camelCase string `streamableHttp`. Cline defaults to the legacy SSE transport when `type` is missing, and an SSE GET to `https://www.regdatalab.com/mcp` returns 405.

4. Add this config. Replace `YOUR_API_KEY` with the key from step 1. Write it as plain text after `Bearer `. If `mcpServers` already has other entries, add `regdatalab` beside them and leave those entries in place.

```json
{
  "mcpServers": {
    "regdatalab": {
      "type": "streamableHttp",
      "url": "https://www.regdatalab.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

5. Shell alternative. `--transport http` is the flag in Cline's current docs. It writes `"type": "streamableHttp"` into `~/.cline/data/settings/cline_mcp_settings.json`:

```bash
cline mcp add regdatalab https://www.regdatalab.com/mcp \
  --transport http \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --yes
```

6. Success test. Ask: "Check Baxter as a supplier." You should see facility and compliance records with FDA source links. A 405 response means `type` is missing or is not `streamableHttp`.
