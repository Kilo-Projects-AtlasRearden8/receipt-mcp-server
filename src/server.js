import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  addReceipt,
  categorizeReceipt,
  exportTaxReport,
  findReceiptById,
  listReceipts,
  removeReceipt,
  summarizeReceipts,
  suggestCategory,
  updateReceipt,
} from './storage.js';
import {
  AddReceiptInputSchema,
  CategorizeReceiptInputSchema,
  ExportTaxReportInputSchema,
  GetReceiptInputSchema,
  ListReceiptsInputSchema,
  RemoveReceiptInputSchema,
  SummarizeReceiptsInputSchema,
  ToolSchemaList,
  UpdateReceiptInputSchema,
} from './schema.js';

const server = new Server(
  {
    name: 'receipt-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: ToolSchemaList.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    })),
  };
});

function okResponse(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ ok: true, ...data }, null, 2),
      },
    ],
  };
}

function errorResponse(message) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ ok: false, error: message }) }],
    isError: true,
  };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'add_receipt': {
        const { receipt } = AddReceiptInputSchema.parse(args);
        const created = addReceipt(receipt);
        return okResponse({ receipt: created });
      }
      case 'get_receipt': {
        const { id } = GetReceiptInputSchema.parse(args);
        const receipt = findReceiptById(id);
        if (!receipt) {
          return errorResponse(`Receipt with ID ${id} not found`);
        }
        return okResponse({ receipt });
      }
      case 'list_receipts': {
        const filter = ListReceiptsInputSchema.parse(args);
        const receipts = listReceipts(filter);
        return okResponse({ count: receipts.length, receipts });
      }
      case 'update_receipt': {
        const { id, changes } = UpdateReceiptInputSchema.parse(args);
        const updated = updateReceipt(id, changes);
        return okResponse({ receipt: updated });
      }
      case 'remove_receipt': {
        const { id } = RemoveReceiptInputSchema.parse(args);
        removeReceipt(id);
        return okResponse({ id });
      }
      case 'categorize_receipt': {
        const { id, category, suggest } = CategorizeReceiptInputSchema.parse(args);
        if (suggest) {
          const receipt = findReceiptById(id);
          if (!receipt) {
            return errorResponse(`Receipt with ID ${id} not found`);
          }
          const suggested = suggestCategory(receipt.vendor, receipt.notes);
          return okResponse({ id, suggestedCategory: suggested });
        }
        if (!category) {
          return errorResponse('Category is required unless suggest is true');
        }
        const updated = categorizeReceipt(id, category);
        return okResponse({ receipt: updated });
      }
      case 'summarize_receipts': {
        const filter = SummarizeReceiptsInputSchema.parse(args);
        const summary = summarizeReceipts(filter);
        return okResponse({ summary });
      }
      case 'export_tax_report': {
        const options = ExportTaxReportInputSchema.parse(args);
        const { reportFile, text } = exportTaxReport(options);
        return okResponse({ reportFile, text });
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
