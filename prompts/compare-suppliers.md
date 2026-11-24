# Compare suppliers prompt

**Who it is for:** Procurement, supplier quality and regulatory teams comparing two to five candidate suppliers or CDMOs side by side on public FDA records.

## Prompt

Replace `<SUPPLIER_1>`, `<SUPPLIER_2>`, `<SUPPLIER_3>` (you can list two to five companies) and `<TIMEFRAME>` (for example, `last 5 years`), then paste into Claude, ChatGPT or Cursor with RegDataLab connected.

```text
Compare these suppliers side by side using public FDA records over the <TIMEFRAME>: <SUPPLIER_1>, <SUPPLIER_2>, <SUPPLIER_3>.

1. Resolve each supplier name first and list the canonical name and linked subsidiaries searched for each one.
2. Build one side-by-side comparison table covering: FDA-registered or inspected sites, inspections in the <TIMEFRAME> (split by NAI, VAI and OAI), warning letters, recalls by class, active import alerts and import refusals. If these are device suppliers, also note recent 510(k) clearances.
3. Below the table, add a short section per supplier listing the most recent dated OAI inspections, warning letters, Class I recalls and import alerts, with YYYY-MM-DD dates and inline links to FDA source pages.
4. Write "no matching records" where a category has none. Do not rank, grade or recommend a winner. End with the data freshness dates from the tool responses.
```

## RegDataLab tools usually called

- `fda_resolve_company`
- `fda_compare_companies`
- `fda_supplier_risk_table`
- `fda_search_warning_letters`
- `fda_search_enforcement`
- `fda_search_510k`

## What a good answer looks like

- Uses the same date window and columns for every supplier in the side-by-side table.
- Shows the resolved company family and aliases searched for each company so differences in corporate scope are clear.
- Follows the summary table with dated inline links to key FDA source records (OAI inspections, warning letters, Class I recalls and import alerts) for each supplier.
- Reports factual FDA records without ranking, grading or recommending one supplier over another, and includes data freshness dates.

---

Requires the [RegDataLab FDA MCP server](https://www.regdatalab.com/fda-mcp-server). See [plans and pricing](https://www.regdatalab.com/pricing) (a free plan needs no card).
