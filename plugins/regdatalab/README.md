# RegDataLab

Review public FDA records for a supplier, a manufacturing site or a product, from a conversation. RegDataLab links FDA inspections, Form 483 observations, warning letters, import alerts and recalls by company and site, and shows the source documents, dates and data freshness for each finding.

## Install

In Claude Code:

```
/plugin install regdatalab --marketplace medley/fda-data-mcp
```

Then run `/mcp`, pick regdatalab and sign in with your RegDataLab account. No key goes in a config file.

## Use it

Connect the RegDataLab connector from the plugin's Connectors tab and sign in with a RegDataLab account (free to start). Then ask in plain words. The plugin's skills tell the assistant which records to pull and how to lay out the answer:

| Skill | Ask something like |
|---|---|
| Supplier due diligence | "Do due diligence on Hospira before we renew the contract." |
| Facility inspection brief | "Prepare a pre-audit brief for FEI 3004387156." |
| Recall and warning letter check | "Has Pfizer had any Class I recalls or warning letters since 2023?" |
| Changes since last review | "What is new for our three API suppliers since our audit on 2025-03-01?" |
| Company match check | "Which Pfizer companies and sites does RegDataLab include?" |

Every answer cites the FDA source and date for each finding. An empty result means RegDataLab has no matching records; it does not mean a company or site is safe or compliant.

## Data

The connector sends the company names, FEI numbers, product terms and dates in your requests to www.regdatalab.com and returns public FDA records. It reads public data only and cannot change anything. RegDataLab is independent of the FDA and does not provide medical or legal advice.

Support: hello@regdatalab.com. Privacy: https://www.regdatalab.com/privacy. Terms: https://www.regdatalab.com/terms.
