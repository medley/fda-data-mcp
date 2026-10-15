---
name: facility-due-diligence
description: Produce a cited FDA dossier for one manufacturing site or FEI number. Use when the user names a specific plant, facility, contract manufacturer site, address or FEI and wants its inspection outcomes, 483 citations, warning letters, import alerts or refusals, recalls, or registered products.
---

# Facility (FEI) due diligence

Uses the RegDataLab connector. Calls use the user's RegDataLab credits.

## Steps

1. **Find the FEI.** If the user gave a name or address, call `fda_search_facilities` (filter by `company`, `city`, `state` or `country`). If several sites match, show the candidates (name, city, FEI) and ask which one.
2. **Dossier.** Call `fda_facility_dossier` with the FEI. It returns the profile, recent inspections, citations, warning letters, import refusals, import-alert mentions, recall context and freshness.
3. **Go deeper where the dossier shows a signal:**
   - `fda_inspections` with `fei_number` for the full inspection history.
   - `fda_citations` with `fei_number` (optionally `classification: "OAI"`) for cited CFR sections and finding text.
   - `fda_import_refusals` and `fda_search_import_alerts` for foreign sites.
   - `fda_facility_products` for what the site makes.
4. **Write the answer.**

## Output

- One-paragraph risk read: last inspection date and outcome, any OAI in the last 5 years, open warning letters, import alerts.
- A dated evidence list; every line cites FEI plus the record's own identifier and date (inspection end date, CFR section, MARCS-CMS number, refusal or recall number).
- Note the data `as_of` date and that FDA publishes some records with a delay.
- Absence of a record is not a clean bill of health: "no OAI or warning letter found" can mean the site was not inspected, the record is not yet published, or it sits under another FEI. Say which records were checked.
- Do not infer causes or quality-system maturity beyond what the records state. Not legal or regulatory advice.
