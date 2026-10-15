# RegDataLab FDA Research

Research the FDA record of any pharma, biotech, medtech or food company or
manufacturing site from a conversation with Claude or ChatGPT, and get answers
that cite the underlying FDA records.

## What it does

The plugin connects the hosted RegDataLab MCP server
(`https://www.regdatalab.com/mcp`) and adds five research workflows:

- **Company compliance profile** — facilities, inspection outcomes (NAI/VAI/OAI),
  Form 483 citations, warning letters, import alerts, debarments and recalls.
- **Facility due diligence** — a dossier for one site by FEI number.
- **Recall and enforcement research** — recalls by company, product or reason,
  traced to the likely manufacturing site.
- **Supplier risk screen** — triage a list of suppliers or CMOs into red, amber
  and green with the record behind each rating.
- **Product regulatory lookup** — 510(k), PMA, Drugs@FDA, NDC, UDI, product
  codes, drug labels and shortages.

All tools are read-only. The connector cannot change any data.

## Use it

1. Install the plugin, then connect the **RegDataLab** connector from the
   plugin's Connectors tab (Claude) or when prompted (ChatGPT).
2. Sign in with your RegDataLab API key on the RegDataLab consent page. A free
   key is available at https://www.regdatalab.com/signup.
3. Ask, for example: "Summarize Baxter's FDA manufacturing record with
   citations" or "Screen these five CMOs for FDA red flags".

## Data and privacy

- The plugin sends your research questions' tool arguments (company names,
  FEI numbers, product names, date ranges) to RegDataLab at
  `www.regdatalab.com` to look up FDA public data. It sends nothing else and
  stores nothing on your device.
- RegDataLab records each tool call (tool name, arguments, time, credits) on
  your account for billing, rate limiting and abuse prevention. See
  https://www.regdatalab.com/privacy and https://www.regdatalab.com/terms.
- Each tool call uses credits from your RegDataLab plan.
- Answers are research based on FDA public data, not legal or regulatory
  advice. Absence of a record is not evidence of a clean record.

Support: https://github.com/medley/fda-data-mcp/issues
