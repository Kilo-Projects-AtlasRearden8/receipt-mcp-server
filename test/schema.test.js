import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  ReceiptSchema,
  AddReceiptInputSchema,
  GetReceiptInputSchema,
  ListReceiptsInputSchema,
  UpdateReceiptInputSchema,
  RemoveReceiptInputSchema,
  CategorizeReceiptInputSchema,
  SummarizeReceiptsInputSchema,
  ExportTaxReportInputSchema,
  ToolNameSchema,
  ToolSchemaList,
  DEFAULT_CATEGORIES,
} from '../src/schema.js';

describe('ReceiptSchema', () => {
  it('accepts a valid receipt', () => {
    const result = ReceiptSchema.safeParse({
      vendor: 'Corner Cafe',
      date: '2026-01-15',
      amount: 12.5,
      category: 'Meals & Entertainment',
      notes: 'Team lunch',
      taxDeductible: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing vendor', () => {
    expect(ReceiptSchema.safeParse({ date: '2026-01-15', amount: 1, category: 'Other' }).success).toBe(false);
  });

  it('rejects missing date', () => {
    expect(ReceiptSchema.safeParse({ vendor: 'Cafe', amount: 1, category: 'Other' }).success).toBe(false);
  });

  it('rejects missing amount', () => {
    expect(ReceiptSchema.safeParse({ vendor: 'Cafe', date: '2026-01-15', category: 'Other' }).success).toBe(false);
  });

  it('rejects missing category', () => {
    expect(ReceiptSchema.safeParse({ vendor: 'Cafe', date: '2026-01-15', amount: 1 }).success).toBe(false);
  });

  it('rejects negative amount', () => {
    expect(ReceiptSchema.safeParse({ vendor: 'Cafe', date: '2026-01-15', amount: -1, category: 'Other' }).success).toBe(false);
  });

  it('allows zero amount', () => {
    expect(ReceiptSchema.safeParse({ vendor: 'Cafe', date: '2026-01-15', amount: 0, category: 'Other' }).success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = ReceiptSchema.safeParse({
      id: 'rec-123',
      vendor: 'Cafe',
      date: '2026-01-15',
      amount: 5,
      category: 'Other',
      paymentMethod: 'Card',
      notes: 'Lunch',
      filePath: '/home/user/receipt.jpg',
      taxDeductible: false,
      createdAt: '2026-01-15T09:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('AddReceiptInputSchema', () => {
  it('accepts valid input', () => {
    expect(
      AddReceiptInputSchema.safeParse({ receipt: { vendor: 'Cafe', date: '2026-01-15', amount: 5, category: 'Other' } }).success
    ).toBe(true);
  });

  it('rejects missing receipt', () => {
    expect(AddReceiptInputSchema.safeParse({}).success).toBe(false);
  });
});

describe('GetReceiptInputSchema', () => {
  it('accepts valid id', () => {
    expect(GetReceiptInputSchema.safeParse({ id: 'rec-123' }).success).toBe(true);
  });

  it('rejects missing or empty id', () => {
    expect(GetReceiptInputSchema.safeParse({}).success).toBe(false);
    expect(GetReceiptInputSchema.safeParse({ id: '' }).success).toBe(false);
  });
});

describe('ListReceiptsInputSchema', () => {
  it('accepts empty input', () => {
    expect(ListReceiptsInputSchema.safeParse({}).success).toBe(true);
  });

  it('accepts full filter input', () => {
    const result = ListReceiptsInputSchema.safeParse({
      category: 'Travel',
      vendor: 'Delta',
      minDate: '2026-01-01',
      maxDate: '2026-01-31',
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateReceiptInputSchema', () => {
  it('accepts id with partial changes', () => {
    expect(UpdateReceiptInputSchema.safeParse({ id: 'rec-123', changes: { amount: 10 } }).success).toBe(true);
  });

  it('rejects missing id', () => {
    expect(UpdateReceiptInputSchema.safeParse({ changes: {} }).success).toBe(false);
  });
});

describe('RemoveReceiptInputSchema', () => {
  it('accepts valid id', () => {
    expect(RemoveReceiptInputSchema.safeParse({ id: 'rec-123' }).success).toBe(true);
  });

  it('rejects missing id', () => {
    expect(RemoveReceiptInputSchema.safeParse({}).success).toBe(false);
  });
});

describe('CategorizeReceiptInputSchema', () => {
  it('accepts id and category', () => {
    expect(CategorizeReceiptInputSchema.safeParse({ id: 'rec-123', category: 'Travel' }).success).toBe(true);
  });

  it('accepts suggest without category', () => {
    expect(CategorizeReceiptInputSchema.safeParse({ id: 'rec-123', suggest: true }).success).toBe(true);
  });

  it('rejects missing id', () => {
    expect(CategorizeReceiptInputSchema.safeParse({ category: 'Travel' }).success).toBe(false);
  });
});

describe('SummarizeReceiptsInputSchema', () => {
  it('accepts empty input', () => {
    expect(SummarizeReceiptsInputSchema.safeParse({}).success).toBe(true);
  });

  it('accepts filters', () => {
    expect(
      SummarizeReceiptsInputSchema.safeParse({ category: 'Travel', minDate: '2026-01-01' }).success
    ).toBe(true);
  });
});

describe('ExportTaxReportInputSchema', () => {
  it('accepts empty input', () => {
    expect(ExportTaxReportInputSchema.safeParse({}).success).toBe(true);
  });

  it('accepts label and dates', () => {
    expect(
      ExportTaxReportInputSchema.safeParse({ label: '2026-Q1', minDate: '2026-01-01', maxDate: '2026-03-31' }).success
    ).toBe(true);
  });
});

describe('ToolNameSchema', () => {
  it('accepts all known tool names', () => {
    for (const name of [
      'add_receipt',
      'get_receipt',
      'list_receipts',
      'update_receipt',
      'remove_receipt',
      'categorize_receipt',
      'summarize_receipts',
      'export_tax_report',
    ]) {
      expect(ToolNameSchema.safeParse(name).success).toBe(true);
    }
  });

  it('rejects unknown tool names', () => {
    expect(ToolNameSchema.safeParse('delete_all').success).toBe(false);
  });
});

describe('ToolSchemaList', () => {
  it('contains all eight tools with names, descriptions, and input schemas', () => {
    expect(ToolSchemaList).toHaveLength(8);
    const names = ToolSchemaList.map((t) => t.name);
    expect(names).toEqual([
      'add_receipt',
      'get_receipt',
      'list_receipts',
      'update_receipt',
      'remove_receipt',
      'categorize_receipt',
      'summarize_receipts',
      'export_tax_report',
    ]);
    for (const tool of ToolSchemaList) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toBeDefined();
    }
  });

  it('add_receipt requires a receipt object', () => {
    const addTool = ToolSchemaList.find((t) => t.name === 'add_receipt');
    expect(addTool.inputSchema.required).toContain('receipt');
  });

  it('export_tax_report input schema has no required fields', () => {
    const exportTool = ToolSchemaList.find((t) => t.name === 'export_tax_report');
    expect(exportTool.inputSchema.required).toBeUndefined();
  });

  it('default categories include common tax categories', () => {
    expect(DEFAULT_CATEGORIES).toContain('Office Supplies');
    expect(DEFAULT_CATEGORIES).toContain('Meals & Entertainment');
    expect(DEFAULT_CATEGORIES).toContain('Other');
  });
});
