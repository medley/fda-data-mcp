---
name: supplier-risk-screen
description: Screen a list of suppliers, CMOs/CDMOs, API makers or partner companies for FDA compliance red flags and rank them. Use when the user pastes several company names or sites and wants a quick triage of inspection outcomes, warning letters, import alerts, debarments and recalls.
---

# Supplier FDA risk screen

Uses the RegDataLab connector. Calls use the user's RegDataLab credits — tell the user roughly how many calls a long list will take (about 1–3 per supplier) before starting a list longer than 10.

## Steps

1. **Normalize the list.** One row per supplier; keep any FEI or country the user gave.
2. **Per supplier**, call `fda_manufacturing_risk_summary` (use `evidence_limit: 3`, `facility_limit: 5` to keep it fast). If the name is ambiguous, note it rather than guessing.
3. **Escalate only red flags.** For a supplier with an OAI inspection, an open warning letter, an import alert or a debarment, pull one confirming record (`fda_search_warning_letters`, `fda_search_import_alerts`, `fda_search_debarments`, or `fda_citations` by FEI).
4. **Rank.** Red = OAI in last 3 years, open CGMP warning letter, active import alert or debarment. Amber = VAI pattern, recent Class I/II recall, or older OAI/warning letter. Green = no signals found in FDA public data.

## Output

- A table: supplier · sites found · last inspection (date, class) · warning letters · import alerts/refusals · recalls · rating · key citation.
- Every rating cites the record(s) that drove it (identifier + date).
- "Green" means no signal in FDA public data as of the `as_of` date, not a clean bill of health. Not legal or regulatory advice.
