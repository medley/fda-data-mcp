# Warning letter watch prompt

**Who it is for:** Regulatory intelligence, supplier quality and legal compliance teams checking recent FDA warning letters across a list of companies.

## Prompt

Replace `<COMPANY_LIST>` (for example, `Company A, Company B, Company C`) and `<START_DATE>` (for example, `2025-01-01`), then paste into Claude, ChatGPT or Cursor with RegDataLab connected.

```text
Check FDA warning letters issued on or after <START_DATE> for this list of companies: <COMPANY_LIST>.

1. Resolve each company name first so subsidiaries and aliases are included. State which names were searched for each company.
2. Return one table of all matching warning letters with: requested company, matched entity name, match type (direct, alias or family member), issue date (YYYY-MM-DD), issuing FDA office, subject, status and link to the FDA warning letter page.
3. For each company that has a matching warning letter, note any recent OAI inspections or related compliance timeline entries around the same date, with dates and FDA links.
4. List every company with no matching warning letters in a separate section as "no matching records" for this period.
5. Keep the report strictly factual with dated FDA records and links. End with the data freshness dates from the tool responses.
```

## RegDataLab tools usually called

- `fda_resolve_company`
- `fda_search_warning_letters`
- `fda_inspections`
- `fda_company_compliance_timeline`

## What a good answer looks like

- Confirms the cut-off date and the resolved corporate names searched for every company on the watchlist.
- Puts all matching warning letters in a single table with issue date, issuing office, subject, status, match type and direct FDA letter URL.
- Explicitly accounts for companies with no matching records instead of omitting them or claiming they had no compliance activity.
- Connects recent warning letters to dated OAI inspections where present and notes the data freshness dates.

---

Requires the [RegDataLab FDA MCP server](https://www.regdatalab.com/fda-mcp-server). See [plans and pricing](https://www.regdatalab.com/pricing) (a free plan needs no card).
