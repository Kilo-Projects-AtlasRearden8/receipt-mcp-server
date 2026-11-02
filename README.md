# Receipt MCP Server

A local-first Model Context Protocol (MCP) server for organizing receipts:
categorize, summarize, and export tax-ready reports. It stores receipts in a
local JSON file, speaks MCP over stdio, and needs no API keys, accounts, or
cloud services. Nothing leaves your computer.

Built and maintained by **Asdale Dynamics, LLC** — beginner-friendly AI
education, books, guides, and practical tools you can publish or sell. Learn
more at [dylanasdale.github.io](https://dylanasdale.github.io).

## Who this is for

Dylan Asdale is a registered nurse turned AI author and founder of Asdale
Dynamics, LLC (Indiana, formed Oct 2026). His book *The Massive AI Manual* and
hub site dylanasdale.github.io explain AI "like a friend would": plain English,
step by step, never condescending.

This server is part of the LLC's open-source tools and templates — practical,
tested, local-first software for small-business owners, authors, resellers, and
anyone who wants their receipts organized for tax time without handing their
paperwork to a cloud service.

## What it does

This MCP server lets AI assistants and MCP clients manage receipts entirely on
your machine. You can:

- Add a receipt (vendor, date, amount, category, payment method, notes)
- Look up a single receipt by ID
- List all receipts, with optional filters (category, vendor, date range)
- Update or remove a receipt
- Categorize a receipt (pick from standard tax categories, or get a keyword
  suggestion from the vendor name)
- Summarize receipts: totals by category, by month, and overall
- Export a tax-ready report (JSON + plain-text summary) to a local file

Default categories: Office Supplies, Software & Subscriptions, Travel, Meals &
Entertainment, Utilities, Marketing, Professional Services, Insurance, Education
& Training, Equipment, Postage & Shipping, Other.

Everything is stored locally in `receipts.json`. No API keys, secrets, or
personal data are required or stored.

## Install

```bash
git clone https://github.com/yourname/receipt-mcp-server.git
cd receipt-mcp-server
npm install
```

No API keys, no environment variables, no accounts required.

## Run the server

```bash
npm start
```

The server speaks MCP over stdio. Connect it to any MCP-compatible client
(Claude Desktop, Cursor, Continue, etc.) using the stdio transport.

### Example MCP client configuration

```json
{
  "mcpServers": {
    "receipts": {
      "command": "node",
      "args": ["/path/to/receipt-mcp-server/src/server.js"]
    }
  }
}
```

## Available tools

| Tool | Description |
|------|-------------|
| `add_receipt` | Add a new receipt (vendor, date, amount, category, payment method, notes, file path). |
| `get_receipt` | Get a single receipt by ID. |
| `list_receipts` | List all receipts, with optional category/vendor/date filters. |
| `update_receipt` | Update an existing receipt by ID. |
| `remove_receipt` | Remove a receipt by ID. |
| `categorize_receipt` | Assign a category to a receipt (with keyword suggestion). |
| `summarize_receipts` | Totals by category, by month, and overall; optional date/category filter. |
| `export_tax_report` | Export a tax-ready report (JSON + text summary) to a local file. |

## Data storage

All receipts are stored in `receipts.json` in the working directory (or
`$RECEIPT_MCP_DATA_DIR` if set). The file is created automatically on first use.
Tax reports are written to the `tax-reports/` folder. You can back up, edit, or
delete these files by hand at any time.

## Test

```bash
npm test
```

Tests cover the Zod input schemas, the JSON storage layer, summarization, and
tax-report export.

## License

MIT License. Copyright (c) 2026 Asdale Dynamics, LLC.

## Credit

Created by Asdale Dynamics, LLC (dylanasdale.github.io). Beginner-friendly AI
education, books, guides, and practical tools.
