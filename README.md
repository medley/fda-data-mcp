# FDA Data MCP (Public Setup Docs)

Public setup/config repo for connecting AI agents to **FDA Data MCP** — a production MCP server for FDA facilities, recalls, inspections, 510(k), PMA, and company intelligence.

## Canonical links

- Website: https://www.regdatalab.com
- MCP endpoint: `https://www.regdatalab.com/mcp`
- Connect guide: https://www.regdatalab.com/connect.md
- Tool docs: https://www.regdatalab.com/docs
- LLM context: https://www.regdatalab.com/llms.txt
- Full LLM context: https://www.regdatalab.com/llms-full.txt
- Pricing / signup: https://www.regdatalab.com/pricing · https://www.regdatalab.com/signup

## Quick start (Claude Code)

```bash
claude mcp add fda-data https://www.regdatalab.com/mcp --transport http --header "Authorization: Bearer YOUR_API_KEY"
```

## MCP config JSON (Claude Desktop / Cursor / Windsurf)

```json
{
  "mcpServers": {
    "fda-data": {
      "url": "https://www.regdatalab.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## What this MCP server covers

- FDA facility lookup + company resolution
- Enforcement / recall search and traceability
- 510(k) clearances, PMA approvals, Drugs@FDA, NDC
- Inspection, citations, compliance action signals
- LLM-friendly output with stable tool contracts

## Discovery notes

This repository is intentionally lightweight and points to the canonical docs on **regdatalab.com**. For AI crawler discoverability, use:

- `https://www.regdatalab.com/robots.txt`
- `https://www.regdatalab.com/llms.txt`
- `https://www.regdatalab.com/llms-full.txt`

## Main product repository

- `medley/fda-data` (private): core server, ingestion, and web app

---

If you find outdated examples using old Heroku URLs, replace with:

`https://www.regdatalab.com/mcp`
