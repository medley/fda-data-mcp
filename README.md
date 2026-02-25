# FDA Data MCP Docs

Public connection docs for the **FDA Data MCP** server.

## Canonical MCP endpoint

`https://www.regdatalab.com/mcp`

Auth header:

`Authorization: Bearer YOUR_API_KEY`

## Copy/paste config (Claude Code / Claude Desktop)

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

## One-line Claude Code setup

```bash
claude mcp add fda-data https://www.regdatalab.com/mcp --transport http --header "Authorization: Bearer YOUR_API_KEY"
```

## Fast links

- Website: https://www.regdatalab.com
- Sign up: https://www.regdatalab.com/signup
- Connect guide: https://www.regdatalab.com/connect.md
- Tool docs: https://www.regdatalab.com/docs
- LLM context: https://www.regdatalab.com/llms.txt

## Note

If you see older Heroku MCP URLs in any historical examples, replace them with:

`https://www.regdatalab.com/mcp`
