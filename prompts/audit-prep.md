# Supplier audit prep prompt

**Who it is for:** Quality auditors and supplier quality engineers preparing a pre-audit brief from a single manufacturing site's FDA history.

## Prompt

Replace `<FEI>` (or replace `<FEI>` with `<COMPANY>` and `<CITY>` if you do not have the FEI yet), then paste into Claude, ChatGPT or Cursor with RegDataLab connected.

```text
Prepare a pre-audit brief for FDA manufacturing site <FEI> using public FDA records.

1. Confirm the facility name, street address, city, country and FEI number.
2. List every FDA inspection on record in reverse date order with end date (YYYY-MM-DD), program area and classification (NAI, VAI or OAI).
3. Pull Form 483 citations for this FEI and group them by 21 CFR section. Put repeated CFR sections first, with the dates they were cited.
4. List any warning letters, recalls, import alerts or import refusals tied to this site. Keep parent-company records in a separate section and label them as company-level context.
5. Write 3 to 5 factual audit follow-up questions. Tie each question to a specific dated FDA record at this FEI.
6. Link every record to its FDA source page. Do not grade the site. Note when published Form 483 documents are not available, when a search returns no matching records, and what the data freshness dates are.
```

## RegDataLab tools usually called

- `fda_search_facilities`
- `fda_inspections`
- `fda_citations`
- `fda_inspection_observation_summary`
- `fda_search_warning_letters`
- `fda_search_import_alerts`
- `fda_import_refusals`

## What a good answer looks like

- Confirms the exact facility name, address and FEI number before summarizing records.
- Gives a reverse-chronological inspection table with dates, program areas and NAI, VAI or OAI classifications.
- Groups Form 483 citations by 21 CFR section so repeat citations across multiple inspections appear first, with inspection dates and FDA links.
- Separates site-specific evidence from parent-company records, and grounds every audit question in a dated FDA finding at that FEI.
- States data freshness dates and notes clearly when a Form 483 is unpublished or a category has no matching records.

---

Requires the [RegDataLab FDA MCP server](https://www.regdatalab.com/fda-mcp-server). See [plans and pricing](https://www.regdatalab.com/pricing) (a free plan needs no card).
