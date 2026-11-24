# openFDA vs FDA inspections

Teams building FDA compliance workflows often expect openFDA to contain inspection outcomes, Form 483 citations and warning letters. Those records live in separate FDA sources.

## Where each FDA dataset lives

- **openFDA API:** Covers drug, device and food enforcement (recall) reports, adverse events, drug labels, NDC, 510(k), PMA and registration listings.
- **FDA Data Dashboard (not openFDA):** Covers FDA inspection classifications (NAI, VAI, OAI) and Form 483 citations.
- **fda.gov pages (not openFDA):** Publish FDA warning letters and import alerts.

## How RegDataLab connects them

[RegDataLab](https://www.regdatalab.com/fda-mcp-server) links these sources by company and site so one question covers them. You can connect the MCP server (`https://www.regdatalab.com/mcp`) in Claude, ChatGPT or Cursor. See [plans and pricing](https://www.regdatalab.com/pricing) (a free plan needs no card) or the [install guide on GitHub](https://github.com/medley/fda-data-mcp).

## Example prompt

Replace `<COMPANY>` and paste into Claude, ChatGPT or Cursor with RegDataLab connected.

```text
Pull public FDA records for <COMPANY> across inspections, Form 483 citations, warning letters, recalls and import alerts.

1. List the company names and FEI numbers searched.
2. Summarize inspection classifications (NAI, VAI, OAI) and repeated Form 483 citations by 21 CFR section.
3. List dated warning letters, recalls (with recall class and reason) and import alerts with YYYY-MM-DD dates and inline links to the FDA source pages.
4. State "no matching records" for any category with none, do not grade the company, and include data freshness dates.
```
