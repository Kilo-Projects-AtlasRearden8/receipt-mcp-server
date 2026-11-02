import { z } from 'zod';

export const DEFAULT_CATEGORIES = [
  'Office Supplies',
  'Software & Subscriptions',
  'Travel',
  'Meals & Entertainment',
  'Utilities',
  'Marketing',
  'Professional Services',
  'Insurance',
  'Education & Training',
  'Equipment',
  'Postage & Shipping',
  'Other',
];

export const ReceiptSchema = z.object({
  id: z.string().min(1).optional(),
  vendor: z.string().min(1, 'Vendor is required'),
  date: z.string().min(1, 'Date is required (YYYY-MM-DD)'),
  amount: z.number().nonnegative('Amount must be zero or greater'),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  filePath: z.string().optional(),
  taxDeductible: z.boolean().optional(),
  createdAt: z.string().optional(),
});

const ReceiptJsonSchema = {
  type: 'object',
  required: ['vendor', 'date', 'amount', 'category'],
  properties: {
    id: { type: 'string', minLength: 1 },
    vendor: { type: 'string', minLength: 1 },
    date: { type: 'string', minLength: 1, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    amount: { type: 'number', minimum: 0 },
    category: { type: 'string', minLength: 1 },
    paymentMethod: { type: 'string' },
    notes: { type: 'string' },
    filePath: { type: 'string' },
    taxDeductible: { type: 'boolean' },
    createdAt: { type: 'string' },
  },
  additionalProperties: false,
};

export const AddReceiptInputSchema = z.object({
  receipt: ReceiptSchema,
});

export const GetReceiptInputSchema = z.object({
  id: z.string().min(1, 'Receipt ID is required'),
});

export const ListReceiptsInputSchema = z.object({
  category: z.string().min(1).optional(),
  vendor: z.string().min(1).optional(),
  minDate: z.string().min(1).optional(),
  maxDate: z.string().min(1).optional(),
});

export const UpdateReceiptInputSchema = z.object({
  id: z.string().min(1, 'Receipt ID is required'),
  changes: z.object({
    vendor: z.string().min(1).optional(),
    date: z.string().min(1).optional(),
    amount: z.number().nonnegative().optional(),
    category: z.string().min(1).optional(),
    paymentMethod: z.string().optional(),
    notes: z.string().optional(),
    filePath: z.string().optional(),
    taxDeductible: z.boolean().optional(),
  }),
});

export const RemoveReceiptInputSchema = z.object({
  id: z.string().min(1, 'Receipt ID is required'),
});

export const CategorizeReceiptInputSchema = z.object({
  id: z.string().min(1, 'Receipt ID is required'),
  category: z.string().min(1, 'Category is required').optional(),
  suggest: z.boolean().optional(),
});

export const SummarizeReceiptsInputSchema = z.object({
  category: z.string().min(1).optional(),
  vendor: z.string().min(1).optional(),
  minDate: z.string().min(1).optional(),
  maxDate: z.string().min(1).optional(),
});

export const ExportTaxReportInputSchema = z.object({
  label: z.string().min(1).optional(),
  minDate: z.string().min(1).optional(),
  maxDate: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
});

export const ToolNameSchema = z.enum([
  'add_receipt',
  'get_receipt',
  'list_receipts',
  'update_receipt',
  'remove_receipt',
  'categorize_receipt',
  'summarize_receipts',
  'export_tax_report',
]);

const EmptyObjectSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

export const ToolSchemaList = [
  {
    name: 'add_receipt',
    description: 'Add a new receipt (vendor, date, amount, category, payment method, notes, file path).',
    inputSchema: {
      type: 'object',
      required: ['receipt'],
      properties: {
        receipt: ReceiptJsonSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_receipt',
    description: 'Get a single receipt by ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'list_receipts',
    description: 'List all receipts, with optional category, vendor, and date-range filters.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', minLength: 1 },
        vendor: { type: 'string', minLength: 1 },
        minDate: { type: 'string', minLength: 1, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        maxDate: { type: 'string', minLength: 1, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'update_receipt',
    description: 'Update an existing receipt by ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', minLength: 1 },
        changes: {
          type: 'object',
          properties: {
            vendor: { type: 'string', minLength: 1 },
            date: { type: 'string', minLength: 1, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            amount: { type: 'number', minimum: 0 },
            category: { type: 'string', minLength: 1 },
            paymentMethod: { type: 'string' },
            notes: { type: 'string' },
            filePath: { type: 'string' },
            taxDeductible: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'remove_receipt',
    description: 'Remove a receipt by ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'categorize_receipt',
    description: 'Assign a category to a receipt. Set suggest to true to receive a keyword-based category suggestion from the vendor name.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', minLength: 1 },
        category: { type: 'string', minLength: 1 },
        suggest: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'summarize_receipts',
    description: 'Summarize receipts: totals by category, by month, and overall, with optional category, vendor, and date-range filters.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', minLength: 1 },
        vendor: { type: 'string', minLength: 1 },
        minDate: { type: 'string', minLength: 1, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        maxDate: { type: 'string', minLength: 1, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'export_tax_report',
    description: 'Export a tax-ready report (JSON file plus plain-text summary) for a period or category.',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string', minLength: 1 },
        minDate: { type: 'string', minLength: 1, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        maxDate: { type: 'string', minLength: 1, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        category: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
  },
];
