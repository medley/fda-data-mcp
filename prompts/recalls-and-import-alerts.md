# Recalls and import alerts prompt

**Who it is for:** Supply chain, quality assurance, pharmacovigilance and trade compliance teams checking recalls, import alerts and import refusals for a company.

## Prompt

Replace `<COMPANY>` and `<START_DATE>` (for example, `2024-01-01`), then paste into Claude, ChatGPT or Cursor with RegDataLab connected.

```text
Check FDA recalls, import alerts and import refusals for <COMPANY> from <START_DATE> onward.

1. Resolve <COMPANY> and list the company names and subsidiaries included in the search.
2. Pull FDA enforcement recall reports dated on or after <START_DATE>. Summarize counts by recall class (Class I, Class II, Class III), and list Class I and the most recent recalls with date (YYYY-MM-DD), recall number, class, product description, reason for recall, status and FDA link.
3. If the company makes medical devices, also pull FDA device recall records to include product code and stated root cause. If it makes drugs, check FDA drug shortage listings.
4. Pull FDA import alerts (alert number, title, date listed, red or green list status and link) and FDA import refusals (refusal date, product and reason). Keep import alerts separate from individual shipment refusals.
5. Put key events in a short chronological summary with links to FDA sources. Do not rate the company. State "no matching records" for any empty category and note the data freshness dates.
```

## RegDataLab tools usually called

- `fda_resolve_company`
- `fda_search_enforcement`
- `fda_device_recalls`
- `fda_search_import_alerts`
- `fda_import_refusals`
- `fda_drug_shortages`
- `fda_company_compliance_timeline`

## What a good answer looks like

- Opens with dated counts for each category checked (recalls by class, import alerts, import refusals and drug shortages if applicable) for the exact period requested.
- Lists the product and stated reason for each recall rather than only totals, with inline links to FDA records.
- Keeps import alerts (detention without physical examination) separate from individual import shipment refusals.
- Notes which rows matched the company name, an alias or a subsidiary, and points out that recall and import alert records match by firm name rather than FEI.
- States "no matching records" where nothing was returned and includes data freshness dates.

---

Requires the [RegDataLab FDA MCP server](https://www.regdatalab.com/fda-mcp-server). See [plans and pricing](https://www.regdatalab.com/pricing) (a free plan needs no card).
