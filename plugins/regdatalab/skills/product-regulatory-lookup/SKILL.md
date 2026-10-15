---
name: product-regulatory-lookup
description: Look up FDA regulatory records for a drug or device product — 510(k) clearances, PMA approvals, Drugs@FDA applications, NDC listings, UDI records, device classification and product codes, drug labels, and shortages. Use when the user names a product, application number, NDC, product code or device type.
---

# Product regulatory lookup

Uses the RegDataLab connector. Calls use the user's RegDataLab credits.

## Pick the right tool

| User gives | Tool |
|---|---|
| Device name, company or K-number | `fda_search_510k` |
| PMA device or P-number | `fda_search_pma` |
| Drug brand, company or application number | `fda_search_drugs` |
| NDC or drug product listing | `fda_search_ndc` (and `fda_search_nsde` for structured product data) |
| Device identifier (UDI/DI) | `fda_device_udi_lookup` or `fda_device_udi` |
| Device type or three-letter product code | `fda_product_code_lookup`, `fda_device_class` |
| Label text, indications, warnings | `fda_drug_labels` |
| Ingredient or UNII | `fda_substance_lookup` |
| Shortage status | `fda_drug_shortages`, `fda_device_supply_status` |
| "Who makes products like X" | `fda_search_by_product` |

## Output

- Answer the question directly, then list the records: identifier (K/P/NDA/ANDA/BLA number, NDC, product code), applicant or labeler, decision or approval date, and status.
- Cite every claim with the record's identifier and date as returned.
- If several records match, show the most relevant few and say how many more exist.
- Absence of a record is not a clean bill of health: "no 510(k) found" can mean the device is exempt, cleared under another name or applicant, or not yet published.
- Note the data `as_of` date. Regulatory status can change after publication; for clinical or compliance decisions, the user should confirm with the FDA source. Not legal or regulatory advice.
