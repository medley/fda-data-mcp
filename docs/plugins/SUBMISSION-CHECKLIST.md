# Marketplace readiness: ChatGPT and Claude

Status legend: **BUILT** = in this repository and tested · **OWNER** = needs the
publisher (account, verification, secrets, live test, submission) · **LIVE** =
needs OAuth switched on at `www.regdatalab.com` first.

Nothing has been submitted or published. Directory listings are reviewed by
OpenAI and Anthropic and are not guaranteed.

## Requirements matrix

| Requirement | ChatGPT (OpenAI plugin directory) | Claude (Anthropic plugin / connector directory) | Status |
|---|---|---|---|
| Package format | `plugin.json` ($schema agent-plugins 1.0.0) + `mcp.json` + `.app.json` + `skills/` | `.claude-plugin/plugin.json` + `.mcp.json` + `skills/` | BUILT |
| Name | `regdatalab` (≤64, lowercase-hyphen) | `regdatalab` (not reserved, product-specific, permanent) | BUILT |
| Display name / short description | "RegDataLab FDA Research" (23) / "FDA compliance research" (23) — limits 30/30 | `displayName` set | BUILT |
| Long description | 4000-char limit; drafted in `plugin.json` | README is the listing text (≥40 words) | BUILT |
| One remote MCP server, HTTPS | `streamable-http` → `https://www.regdatalab.com/mcp` | `http` → same URL | BUILT |
| No secrets in package | validator + tests | validator + tests (`Secret in MCP headers` blocks) | BUILT |
| No top-level `bin/`, no OS files, files <256 KiB, ≤512 files, no symlinks | n/a | blocks/holds in portal | BUILT (plugin lives in `plugins/regdatalab`, away from the npm wrapper's `bin/`) |
| README + license | — | README ≥40 words and LICENSE (MIT) | BUILT |
| Icons | square ≥48 px, PNG ≤5 MiB: `assets/icon.png` 128², `assets/logo.png` 512² | optional | BUILT (owner may replace with final brand art) |
| Screenshots / demo video | video walkthrough of the test cases is **required** | not required | OWNER |
| Tool annotations | every connector tool is `readOnlyHint: true`; write tools are never exposed to OAuth sessions | same | BUILT |
| Per-tool auth metadata | `securitySchemes: [{type: oauth2, scopes: [fda:read]}]` on each tool when OAuth is on | n/a (uses 401 challenge) | BUILT (server side) |
| OAuth 2.1 + PKCE S256 | required | required | BUILT (server), LIVE |
| Client registration | CIMD preferred (`client_id_metadata_document_supported: true`), DCR supported | CIMD (needs `"none"` auth method) or DCR | BUILT, LIVE |
| Redirect URIs | `https://chatgpt.com/connector_platform_oauth_redirect` (needs `iss` in responses — supported) or `/connector/oauth/{id}` | `https://claude.ai/api/mcp/auth_callback`; Claude Code loopback on any port | BUILT, LIVE |
| Resource indicator | `resource` must match `https://www.regdatalab.com/mcp` | `resource` in protected-resource metadata equals the URL users add | BUILT |
| Discovery | `/.well-known/oauth-protected-resource[/mcp]`, `/.well-known/oauth-authorization-server` | 401 + `WWW-Authenticate: Bearer resource_metadata=…` | BUILT, LIVE |
| Token refresh | rotating refresh tokens; `invalid_grant` on reuse/expiry | same; 30 s refresh / 10 s other endpoint budgets | BUILT, LIVE |
| Publisher identity | org owner or "Apps Management Write"; **individual or business verification** | paid plan; on Team/Enterprise an Owner submits | OWNER |
| Developer name | "RegDataLab" (≤80) | `author.name` "RegDataLab" — must not be confusable with other brands | OWNER to confirm the legal publisher name (LICENSE currently says "Medley") |
| Website / privacy / terms / support URLs | all four HTTPS URLs required | privacy policy expected for connectors | Website, privacy, terms exist; **support URL** currently GitHub issues — OWNER to decide (a support page or mailbox is better) |
| Privacy policy accuracy | must cover data sent through the app | same | OWNER: the policy should disclose that tool arguments (company names, search terms) are stored with usage records |
| Domain verification | host OpenAI's challenge token at `/.well-known/openai-apps-challenge` on the MCP host | n/a | OWNER (token issued in the portal) |
| Reviewer access | dedicated test account usable **without MFA, email codes or magic links** | test account for review | OWNER: create a reviewer RegDataLab key with enough credits; sign-in is key-paste, so it qualifies |
| Test cases | exactly **5 positive + 3 negative** cases (below) | eval prompts recommended (`claude plugin eval`) | BUILT (drafts) |
| Policy attestations | in portal at submission | Anthropic Software Directory Policy | OWNER |
| `.app.json` mapping | must contain the registered `plugin_asdk_app…` ID | n/a | OWNER (after registering the MCP app in ChatGPT) |

## Draft review test cases (ChatGPT requires exactly 5 + 3)

Positive:

1. *"Summarize Baxter's FDA manufacturing and compliance record with citations."* → `fda_manufacturing_risk_summary`, `fda_company_compliance_timeline`; answer lists facilities with FEI numbers, latest inspections with classification and dates, warning letters with dates.
2. *"Has FEI <a real FEI from test 1> had an OAI inspection or warning letter in the last five years?"* → `fda_facility_dossier`, `fda_inspections`, `fda_citations`; dated evidence list.
3. *"List Class I recalls for infusion pumps since 2023 and where they were made."* → `fda_search_enforcement` / `fda_search_recall_text`, `fda_recall_facility_trace`; recall numbers, classes, dates, trace confidence.
4. *"Screen these suppliers for FDA red flags: <3–5 company names>."* → `fda_manufacturing_risk_summary` per supplier; red/amber/green table with the record behind each rating.
5. *"What 510(k) clearances does Medtronic have for insulin pumps?"* → `fda_search_510k`; K-numbers, decision dates, product codes.

Negative (the plugin should not act):

1. *"Write a poem about autumn."* — unrelated.
2. *"What's the weather in Boston?"* — unrelated.
3. *"Book a meeting with my team for Tuesday."* — action outside scope; the plugin is read-only research.

## Owner steps, in order

1. **Switch on OAuth** at `www.regdatalab.com` (server release + `OAUTH_ENABLED=true`). This is the only step that makes the hosted plugins usable.
2. Live-test both platforms with your own key (see `INSTALL-AND-TEST.md`), including sign-out and reconnect.
3. Create a reviewer account/key with credits; record it only in the portals' credential fields.
4. Decide publisher name, support URL, and final brand assets; update the privacy policy wording above.
5. **ChatGPT:** verify the organization, register the MCP app (OAuth), put its ID in `.app.json`, host the domain-verification token, record the video, enter the 5+3 cases, upload the plugin zip, resolve automated findings, attest, submit.
6. **Claude:** run `claude plugin validate`, then **Validate** in the developer portal (claude.ai/directory/manage → Submit new → Plugin bundle → this repository, plugin path `plugins/regdatalab`), fix blocking findings, submit. Optionally list the connector itself in the connector directory.
