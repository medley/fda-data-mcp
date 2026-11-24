# Form 483 trends prompt

**Who it is for:** Quality assurance, compliance and regulatory affairs teams analyzing what FDA inspectors cite across a manufacturing site or company family.

## Prompt

Replace `<COMPANY_OR_FEI>` and `<START_DATE>` (for example, `2021-01-01`), then paste into Claude, ChatGPT or Cursor with RegDataLab connected.

```text
Analyze FDA Form 483 inspection observation trends for <COMPANY_OR_FEI> from <START_DATE> onward.

1. Identify every company name and FEI number covered by the search.
2. Pull all FDA inspections and Form 483 citations dated on or after <START_DATE>.
3. Group citations by 21 CFR section in a table showing CFR section, short description, how many times it appeared in the returned inspections, affected site or FEI, and inspection dates (YYYY-MM-DD). Sort repeated sections first.
4. Highlight any 21 CFR sections cited across more than one inspection at the same site or across multiple sites in the same company family.
5. List any inspections in this period classified as OAI or followed by a warning letter, with dates and links to FDA source pages.
6. Present dated FDA records only, without grading the site or company. Note that FDA does not publish every Form 483, state where no matching records were found, and include data freshness dates.
```

## RegDataLab tools usually called

- `fda_resolve_company`
- `fda_search_facilities`
- `fda_inspections`
- `fda_citations`
- `fda_inspection_observation_summary`
- `fda_search_warning_letters`

## What a good answer looks like

- Lists the exact company names and FEI numbers included in the citation pull.
- Groups Form 483 observations by 21 CFR section with short descriptions, affected sites and YYYY-MM-DD inspection dates.
- Separates repeat observations from one-time citations without speculating about root causes.
- Links directly to FDA source records for inspections and warning letters, and states clearly when Form 483 records are unpublished or missing.

---

Requires the [RegDataLab FDA MCP server](https://www.regdatalab.com/fda-mcp-server). See [plans and pricing](https://www.regdatalab.com/pricing) (a free plan needs no card).
