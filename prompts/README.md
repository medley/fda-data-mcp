# FDA compliance prompts for Claude, ChatGPT and Cursor

Copy-paste prompts for reviewing public FDA compliance records with the RegDataLab MCP server. Each prompt asks for dated FDA records (inspections, Form 483 citations, warning letters, recalls, import alerts and import refusals) with links back to FDA source pages.

## Connect first

Connect your client to the RegDataLab MCP server before running these prompts:

- MCP URL: `https://www.regdatalab.com/mcp`
- Setup guide for Claude, ChatGPT and Cursor: [regdatalab.com/fda-mcp-server](https://www.regdatalab.com/fda-mcp-server)
- Client configs and wrapper repo: [github.com/medley/fda-data-mcp](https://github.com/medley/fda-data-mcp)
- Plans: [regdatalab.com/pricing](https://www.regdatalab.com/pricing) (a free plan needs no card)

## Prompt library

| File | Use case |
|---|---|
| [supplier-qualification.md](./supplier-qualification.md) | Check one supplier's FDA record before qualifying or renewing it. |
| [audit-prep.md](./audit-prep.md) | Prepare a pre-audit brief from a manufacturing site's FDA inspection history. |
| [form-483-trends.md](./form-483-trends.md) | Group Form 483 observations by CFR section at a site or across a company. |
| [warning-letter-watch.md](./warning-letter-watch.md) | Check recent FDA warning letters for a watchlist of companies. |
| [recalls-and-import-alerts.md](./recalls-and-import-alerts.md) | Pull recalls, import alerts, import refusals and shortages for a company. |
| [compare-suppliers.md](./compare-suppliers.md) | Compare two to five candidate suppliers side by side on public FDA records. |
| [openfda-vs-inspections.md](./openfda-vs-inspections.md) | Plain explainer on what openFDA covers versus FDA inspections, Form 483s, warning letters and import alerts. |

## Notes

RegDataLab is operated by Wasatch Crest Holdings LLC. It is independent of the FDA and uses public FDA data. These prompts and the records they return are not legal or medical advice. Contact: hello@regdatalab.com.
