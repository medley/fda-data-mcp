---
name: company-compliance-profile
description: Build a cited FDA manufacturing and compliance profile of a company. Use when the user asks about a company's FDA record, inspection history, warning letters, 483 observations, recalls, compliance risk, or wants a pre-meeting or due-diligence brief on a pharma, biotech, medtech or food manufacturer.
---

# Company FDA compliance profile

Uses the RegDataLab connector (read-only FDA research tools). Each tool call uses credits from the user's RegDataLab account, so prefer the summary tools first and drill down only where it matters.

## Steps

1. **Pin the company.** If the name is ambiguous (common words, a parent with many subsidiaries), call `fda_resolve_company` and confirm which entity the user means before spending more calls.
2. **Get the overview.** Call `fda_manufacturing_risk_summary` with the company name. It returns facilities, inspections, warning letters, import-risk signals, debarments and recalls in one pass, with `as_of` freshness.
3. **Build the timeline.** Call `fda_company_compliance_timeline` (default limit 25) for a dated, reverse-chronological feed.
4. **Drill down only where there is a signal:**
   - OAI or VAI inspections → `fda_citations` with the FEI to see the cited CFR sections.
   - Warning letters → `fda_search_warning_letters` with `company_name` (set `dedupe: true`) for the letter subject, office, status and date.
   - A specific site → use the `facility-due-diligence` skill.
   - Subsidiaries that may be missing → `fda_suggest_subsidiaries` (2 credits) and mention candidates to the user; do not assume they belong to the company.
5. **Write the answer.**

## Output

- Lead with a 2–3 sentence bottom line (e.g. "No OAI inspections since 2021; one open CGMP warning letter (2024) at the X site").
- Then a short table: facility / FEI / country / last inspection date + classification / notable actions.
- Cite every factual claim with the FDA record identifier the tool returned: FEI number, inspection end date and classification, warning-letter issue date and MARCS-CMS number, recall number and classification, and the data `as_of` date.
- State coverage limits plainly: FDA public data only; absence of a record is not evidence of a clean record; inspection classifications can lag; subsidiaries resolve only through known aliases.
- This is research, not legal or regulatory advice.
