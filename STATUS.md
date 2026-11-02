# STATUS

## What was built

A local-first Model Context Protocol (MCP) server for organizing receipts:
categorize, summarize, and export tax-ready reports. It runs over stdio and
stores receipts in a local JSON file (`receipts.json`). No API keys, no
accounts, nothing leaves your machine.

Built and maintained by **Asdale Dynamics, LLC** (dylanasdale.github.io).

Features:
- MCP server with stdio transport (`src/server.js`)
- Eight tools: `add_receipt`, `get_receipt`, `list_receipts`, `update_receipt`,
  `remove_receipt`, `categorize_receipt`, `summarize_receipts`,
  `export_tax_report`
- Each receipt tracks: id, vendor, date, amount, category, payment method,
  notes, file path, tax-deductible flag, created-at
- Local JSON storage (`src/storage.js`), data directory configurable via
  `$RECEIPT_MCP_DATA_DIR`; tax reports written to `tax-reports/`
- Zod input validation (`src/schema.js`) with clean JSON Schema tool input
  schemas for MCP clients
- Twelve default tax categories with keyword-based category suggestions
- 55 unit tests covering schemas and storage/summarization/export behavior
  (`test/schema.test.js`, `test/storage.test.js`)
- MIT LICENSE, README, `.gitignore`, `vitest.config.js`, `package-lock.json`

## How to run

```bash
npm install          # install dependencies
npm start            # run the MCP server over stdio
npm test             # run the test suite (55 tests)
```

Connect any MCP-compatible client (Claude Desktop, Cursor, Continue, etc.) via
stdio:

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

## Verification results

- `npm test`: 55 tests passed across 2 test files
- `npm start`: server starts, responds to `initialize` and `tools/list` over stdio
- End-to-end over stdio (shell pipe): `initialize`, `add_receipt`, `get_receipt`,
  `categorize_receipt` (suggest), `summarize_receipts`, `export_tax_report`,
  `remove_receipt` all responded correctly, including cross-call state
  (receipt added then retrieved by id)
- `export_tax_report` writes a JSON report to `tax-reports/` and returns a
  plain-text summary with totals by category and by month
- Storage layer verified directly: add, find, list (with category/vendor/date
  filters), update, remove, duplicate/missing-ID rejection, negative-amount
  rejection, tax-deductible defaults, category suggestions all behave correctly
- `receipts.json` is created automatically on first use and is gitignored
- No `.github/workflows` files added; no API keys, secrets, or personal data in
  any file; LICENSE copyright line is exactly
  `Copyright (c) 2026 Asdale Dynamics, LLC`; README credits Asdale Dynamics, LLC

## Known gaps

- No build step (plain ESM, runs directly with `node`).
- No linting configured beyond vitest.
- Data is stored in a single JSON file with no concurrent-write locking;
  intended for single-client local use.
- `categorize_receipt` suggestions use keyword matching only, not an LLM;
  users can always set a category explicitly.
- `export_tax_report` label defaults to the current year-month or the single
  filtered month; multi-month reports use the current year-month label.

## Files

- `src/server.js` — MCP server, stdio transport, tool handlers
- `src/storage.js` — local JSON storage (CRUD, categorize, summarize, export,
  category suggestions)
- `src/schema.js` — Zod validation schemas + MCP JSON Schema tool definitions
- `test/schema.test.js` — 24 schema unit tests
- `test/storage.test.js` — 31 storage/summarization/export unit tests
- `package.json` — project metadata, `start` and `test` scripts
- `vitest.config.js` — vitest configuration
- `LICENSE` — MIT, Copyright (c) 2026 Asdale Dynamics, LLC
- `README.md` — usage, configuration, credit to Asdale Dynamics, LLC
- `.gitignore` — excludes node_modules, receipts.json, tax-reports, dist,
  coverage
- `package-lock.json` — locked dependencies
