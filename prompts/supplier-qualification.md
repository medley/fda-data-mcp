# Supplier qualification prompt

**Who it is for:** Supplier quality, procurement and regulatory teams checking one manufacturer, CDMO or API supplier before onboarding or contract renewal.

## Prompt

Replace `<COMPANY>` and `<TIMEFRAME>` (for example, `last 5 years`), then paste into Claude, ChatGPT or Cursor with RegDataLab connected.

```text
Review public FDA compliance records for <COMPANY> over the <TIMEFRAME> so I can prepare for supplier qualification.

1. Resolve <COMPANY> across legal names, aliases and linked subsidiaries. List the names searched and note any former subsidiaries that were excluded.
2. Build a table of FDA-registered or inspected facilities with facility name, city, country, FEI number, latest inspection date and latest inspection classification (NAI, VAI or OAI).
3. List dated OAI inspections, published Form 483 observations, warning letters, recalls (including recall class, product and stated reason), import alerts and import refusals in this period.
4. Include an inline link to the FDA source document for every dated record, using YYYY-MM-DD dates.
5. State clearly when a category returns no matching records. Do not rate, grade or recommend approval of the supplier. End with the data freshness dates from the tool responses.
```

## RegDataLab tools usually called

- `fda_resolve_company`
- `fda_manufacturing_risk_summary`
- `fda_search_facilities`
- `fda_search_warning_letters`
- `fda_search_enforcement`
- `fda_search_import_alerts`
- `fda_import_refusals`

## What a good answer looks like

- Names the resolved company, every subsidiary or alias searched, and any excluded former subsidiaries.
- Shows a site table with facility name, city and country, FEI number, latest inspection date and classification (NAI, VAI or OAI).
- Lists dated warning letters, recalls (with recall class and reason), import alerts, import refusals and Form 483 observations, each with a direct FDA source link.
- Reports "no matching records" for empty categories without claiming the supplier has no issues, and ends with data freshness dates.

---

Requires the [RegDataLab FDA MCP server](https://www.regdatalab.com/fda-mcp-server). See [plans and pricing](https://www.regdatalab.com/pricing) (a free plan needs no card).
