# Install and test the RegDataLab plugins (Claude and ChatGPT)

The plugin lives in [`plugins/regdatalab`](../../plugins/regdatalab). One folder
serves both platforms:

| File | Read by |
|---|---|
| `.claude-plugin/plugin.json`, `.mcp.json` | Claude (claude.ai, Desktop, mobile, Cowork, Claude Code) |
| `plugin.json`, `mcp.json`, `.app.json` | ChatGPT / Codex plugins |
| `skills/*/SKILL.md`, `README.md`, `LICENSE`, `assets/` | both |

Both point at the hosted MCP endpoint `https://www.regdatalab.com/mcp`. No API
key is stored in the plugin: each user signs in through RegDataLab's OAuth
consent page with their own RegDataLab API key, and tool calls use that
account's credits.

> **Status:** OAuth sign-in for hosted Claude/ChatGPT is built but **not yet
> switched on** at `www.regdatalab.com`. Until it is, use the API-key paths
> marked *works today* below. The OAuth steps are marked *after OAuth launch*.

## Where each path works

| Surface | Connector auth | Plugin skills | Notes |
|---|---|---|---|
| claude.ai web / mobile, Claude Desktop, Cowork | OAuth (*after OAuth launch*) | yes | Upload or marketplace install; connect from the plugin's Connectors tab. Mobile uses connectors you already added on web/desktop. |
| Claude Code | OAuth (*after launch*) or API-key header (*works today*) | yes | Loopback sign-in; or add the server with a header. |
| ChatGPT web / desktop / mobile | OAuth (*after launch*) | yes (plugins) | Needs a registered MCP app in ChatGPT (developer mode for testing). |
| Codex CLI | OAuth (*after launch*) | yes | Repo marketplace at `.agents/plugins/marketplace.json`. |
| Claude Desktop raw config / Cursor / Windsurf | API key (*works today*) | no | Desktop-only `?apiKey=` URL or the `npx fda-data-mcp` wrapper; see the main README. These configs do not sync to web or mobile. |

## Validate the package

```bash
npm test                                 # includes the plugin validator tests
node scripts/validate-plugins.js         # offline Claude + ChatGPT rule checks
claude plugin validate ./plugins/regdatalab
claude plugin validate .                 # marketplace manifest
```

## Claude

### Claude Code — works today with an API key

```bash
# Load the skills from this checkout
claude --plugin-dir ./plugins/regdatalab
```

The plugin's connector uses OAuth, which is not live yet. Until it is, add the
server yourself with your key in a header (keep the key out of the plugin):

```bash
claude mcp add --transport http regdatalab-key https://www.regdatalab.com/mcp \
  --header "Authorization: Bearer $REGDATALAB_API_KEY" --scope user
```

Test: run `/mcp` (server shows connected), then ask *"Use the
company-compliance-profile skill for Baxter."* Expect a bottom line plus a
table citing FEI numbers, inspection dates/classifications and warning-letter
dates, with an `as_of` date.

### claude.ai / Desktop / Cowork — after OAuth launch

1. Zip the plugin folder: `cd plugins && zip -r regdatalab.zip regdatalab -x '*.DS_Store'`.
2. claude.ai → **Customize → Plugins → Add → Upload plugin** → choose the zip.
   (For a team: **Add marketplace** with this repository's URL; it reads
   `.claude-plugin/marketplace.json`.)
3. Open the plugin's **Connectors** tab → **Connect** RegDataLab.
4. A RegDataLab page opens: check it names **Claude** and returns to
   `claude.ai`, paste your API key, **Approve**.
5. In a new chat ask: *"Which skills do you have from plugins?"*, then
   *"Summarize Baxter's FDA manufacturing record with citations."*
6. Repeat access: start another chat the next day; it should work without
   signing in again (tokens refresh automatically for up to 30 days of
   inactivity).
7. Sign out: disconnect the connector in Claude's settings. Reconnecting asks
   you to approve again.

## ChatGPT — after OAuth launch

1. Settings → **Security and login → Developer mode** on (test accounts).
2. **Plugins → +** → add an MCP server: URL `https://www.regdatalab.com/mcp`,
   authentication **OAuth**. ChatGPT discovers the sign-in endpoints itself.
   Complete the RegDataLab consent page (check it names **ChatGPT**).
3. Copy the app's technical ID (`plugin_asdk_app…`) into
   `plugins/regdatalab/.app.json` under `apps` (see the submission checklist).
4. Install the plugin from the local marketplace (`.agents/plugins/marketplace.json`)
   or upload the plugin zip in the developer dashboard.
5. Test the same prompts as Claude; then disconnect/reconnect to check sign-out.

## What a good answer looks like

- Opens with a short bottom line.
- Every fact cites an FDA identifier and date returned by the tools (FEI,
  inspection end date + NAI/VAI/OAI, warning-letter date + MARCS-CMS number,
  recall number + class, K/P/NDA numbers, NDC).
- States the data `as_of` date and that absence of a record is not a clean
  bill of health.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "Sign in to RegDataLab to use this tool" | Not connected yet, or the access token expired and refresh failed: reconnect. |
| "That API key wasn't accepted" | Wrong, inactive or expired key; the public demo key is not accepted. Get a free key at regdatalab.com/signup. |
| "No credits remaining" | Account credits are used up; they reset monthly or upgrade at regdatalab.com/pricing. |
| A curation tool says it is unavailable | Connector access is read-only by design. |
| "This sign-in link has expired" | The sign-in attempt timed out (15 minutes) or had 5 wrong keys; start the connection again from the app. |
