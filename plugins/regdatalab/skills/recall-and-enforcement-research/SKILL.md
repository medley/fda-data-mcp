---
name: recall-and-enforcement-research
description: Research FDA recalls and enforcement actions by company, product, reason or classification, and trace a recall to its likely manufacturing site. Use when the user asks about recalls, Class I/II/III events, recall reasons, a recall number, or which plant made a recalled product.
---

# Recall and enforcement research

Uses the RegDataLab connector. Calls use the user's RegDataLab credits.

## Steps

1. **Search.**
   - By company or classification and date range: `fda_search_enforcement` (`company`, `classification`, `from_date`, `to_date`, `status`).
   - By free-text reason or product wording: `fda_search_recall_text`.
   - Devices specifically: `fda_device_recalls`.
   - Additional recall-event detail: `fda_ires_enforcement`.
2. **Trace to a facility** when the user asks where a product was made: `fda_recall_facility_trace` with the `recall_number` (preferred) or `firm` + `product`. Report its confidence level as given; a trace is a candidate match, not a confirmation.
3. **Summarize.** Group by classification and year; call out Class I events first.

## Output

- Counts by classification and year, then the notable recalls.
- For each recall cited: recall number, classification, report date, status, product description (short) and reason.
- Facility traces: FEI, match method and confidence exactly as returned.
- State limits: enforcement data reflects FDA's published reports; product descriptions are abbreviated; traces are probabilistic. Not legal or regulatory advice.
