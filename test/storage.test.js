import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  addReceipt,
  findReceiptById,
  listReceipts,
  removeReceipt,
  updateReceipt,
  categorizeReceipt,
  summarizeReceipts,
  exportTaxReport,
  suggestCategory,
  DEFAULT_CATEGORIES,
} from '../src/storage.js';

const TMP_DIRS = [];

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'receipt-mcp-test-'));
  TMP_DIRS.push(dir);
  process.env.RECEIPT_MCP_DATA_DIR = dir;
  return dir;
}

afterEach(() => {
  for (const dir of TMP_DIRS) {
    rmSync(dir, { recursive: true, force: true });
  }
  TMP_DIRS.length = 0;
  delete process.env.RECEIPT_MCP_DATA_DIR;
});

const baseReceipt = {
  vendor: 'Corner Cafe',
  date: '2026-01-15',
  amount: 12.5,
  category: 'Meals & Entertainment',
  notes: 'Team lunch',
};

describe('receipt storage', () => {
  beforeEach(() => {
    makeTempDir();
  });

  it('creates the data file automatically in the configured data dir', () => {
    listReceipts();
    expect(require('node:fs').existsSync(join(process.env.RECEIPT_MCP_DATA_DIR, 'receipts.json'))).toBe(true);
  });

  it('adds a receipt and assigns an id', () => {
    const created = addReceipt(baseReceipt);
    expect(created.id).toMatch(/^rec-/);
    expect(created.vendor).toBe('Corner Cafe');
    expect(created.amount).toBe(12.5);
    expect(created.createdAt).toBeDefined();
  });

  it('rejects missing vendor', () => {
    expect(() => addReceipt({ ...baseReceipt, vendor: '' })).toThrow();
  });

  it('rejects negative amount', () => {
    expect(() => addReceipt({ ...baseReceipt, amount: -3 })).toThrow();
  });

  it('defaults taxDeductible to true', () => {
    const created = addReceipt(baseReceipt);
    expect(created.taxDeductible).toBe(true);
  });

  it('finds a receipt by id', () => {
    const created = addReceipt(baseReceipt);
    const found = findReceiptById(created.id);
    expect(found.vendor).toBe('Corner Cafe');
  });

  it('returns undefined for unknown id', () => {
    expect(findReceiptById('rec-missing')).toBeUndefined();
  });

  it('lists all receipts', () => {
    addReceipt(baseReceipt);
    addReceipt({ ...baseReceipt, vendor: 'Acme Supplies', amount: 4.2, category: 'Office Supplies' });
    expect(listReceipts()).toHaveLength(2);
  });

  it('filters list by category', () => {
    addReceipt(baseReceipt);
    addReceipt({ ...baseReceipt, vendor: 'Acme Supplies', amount: 4.2, category: 'Office Supplies' });
    expect(listReceipts({ category: 'Office Supplies' })).toHaveLength(1);
    expect(listReceipts({ category: 'Office Supplies' })[0].vendor).toBe('Acme Supplies');
  });

  it('filters list by vendor substring', () => {
    addReceipt(baseReceipt);
    addReceipt({ ...baseReceipt, vendor: 'Corner Bakery', amount: 5 });
    expect(listReceipts({ vendor: 'Corner' })).toHaveLength(2);
    expect(listReceipts({ vendor: 'Cafe' })).toHaveLength(1);
  });

  it('filters list by date range', () => {
    addReceipt({ ...baseReceipt, date: '2026-01-15' });
    addReceipt({ ...baseReceipt, vendor: 'Later', date: '2026-02-20' });
    expect(listReceipts({ minDate: '2026-02-01' })).toHaveLength(1);
    expect(listReceipts({ maxDate: '2026-01-31' })).toHaveLength(1);
  });

  it('updates a receipt by id', () => {
    const created = addReceipt(baseReceipt);
    const updated = updateReceipt(created.id, { amount: 20, notes: 'Updated lunch' });
    expect(updated.amount).toBe(20);
    expect(updated.notes).toBe('Updated lunch');
    expect(findReceiptById(created.id).vendor).toBe('Corner Cafe');
  });

  it('update throws for unknown id', () => {
    expect(() => updateReceipt('rec-missing', { amount: 1 })).toThrow(/not found/);
  });

  it('removes a receipt by id', () => {
    const created = addReceipt(baseReceipt);
    expect(removeReceipt(created.id)).toBe(true);
    expect(findReceiptById(created.id)).toBeUndefined();
    expect(listReceipts()).toHaveLength(0);
  });

  it('remove throws for unknown id', () => {
    expect(() => removeReceipt('rec-missing')).toThrow(/not found/);
  });

  it('categorizes a receipt', () => {
    const created = addReceipt(baseReceipt);
    const updated = categorizeReceipt(created.id, 'Travel');
    expect(updated.category).toBe('Travel');
    expect(findReceiptById(created.id).category).toBe('Travel');
  });

  it('categorize throws for unknown id', () => {
    expect(() => categorizeReceipt('rec-missing', 'Travel')).toThrow(/not found/);
  });

  it('suggests a category from vendor name', () => {
    expect(suggestCategory('Corner Cafe', '')).toBe('Meals & Entertainment');
    expect(suggestCategory('Acme Ink & Paper', '')).toBe('Office Supplies');
    expect(suggestCategory('Unknown Vendor Xyz', '')).toBe('Other');
  });

  it('includes default categories', () => {
    expect(DEFAULT_CATEGORIES).toContain('Office Supplies');
    expect(DEFAULT_CATEGORIES).toContain('Other');
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThan(0);
  });
});

describe('summarizeReceipts', () => {
  beforeEach(() => {
    makeTempDir();
  });

  it('summarizes empty storage', () => {
    const summary = summarizeReceipts();
    expect(summary.receiptCount).toBe(0);
    expect(summary.total).toBe(0);
    expect(summary.deductibleTotal).toBe(0);
  });

  it('totals by category and month', () => {
    addReceipt({ ...baseReceipt, vendor: 'Cafe A', date: '2026-01-10', amount: 10, category: 'Meals & Entertainment', taxDeductible: true });
    addReceipt({ ...baseReceipt, vendor: 'Cafe B', date: '2026-01-20', amount: 20, category: 'Meals & Entertainment', taxDeductible: false });
    addReceipt({ ...baseReceipt, vendor: 'Staples', date: '2026-02-05', amount: 30, category: 'Office Supplies', taxDeductible: true });

    const summary = summarizeReceipts();
    expect(summary.receiptCount).toBe(3);
    expect(summary.total).toBe(60);
    expect(summary.deductibleTotal).toBe(40);
    expect(summary.nonDeductibleTotal).toBe(20);
    expect(summary.byCategory['Meals & Entertainment'].total).toBe(30);
    expect(summary.byCategory['Meals & Entertainment'].count).toBe(2);
    expect(summary.byCategory['Office Supplies'].deductibleTotal).toBe(30);
    expect(summary.byMonth['2026-01'].total).toBe(30);
    expect(summary.byMonth['2026-02'].total).toBe(30);
  });

  it('respects filters', () => {
    addReceipt({ ...baseReceipt, vendor: 'Cafe A', date: '2026-01-10', amount: 10, category: 'Meals & Entertainment' });
    addReceipt({ ...baseReceipt, vendor: 'Staples', date: '2026-02-05', amount: 30, category: 'Office Supplies' });
    const summary = summarizeReceipts({ category: 'Office Supplies' });
    expect(summary.receiptCount).toBe(1);
    expect(summary.total).toBe(30);
    const byMonth = summarizeReceipts({ minDate: '2026-02-01' });
    expect(byMonth.receiptCount).toBe(1);
  });
});

describe('exportTaxReport', () => {
  beforeEach(() => {
    makeTempDir();
  });

  it('writes a tax report file and returns a text summary', () => {
    addReceipt({ ...baseReceipt, vendor: 'Cafe A', date: '2026-03-10', amount: 10, category: 'Meals & Entertainment' });
    addReceipt({ ...baseReceipt, vendor: 'Staples', date: '2026-03-12', amount: 30, category: 'Office Supplies' });

    const result = exportTaxReport({ label: '2026-03' });
    expect(result.reportFile).toContain('tax-report-2026-03.json');
    expect(require('node:fs').existsSync(result.reportFile)).toBe(true);
    expect(typeof result.text).toBe('string');
    expect(result.text).toContain('Total: $40.00');
    expect(result.text).toContain('Receipts: 2');

    const report = JSON.parse(require('node:fs').readFileSync(result.reportFile, 'utf8'));
    expect(report.label).toBe('2026-03');
    expect(report.summary.receiptCount).toBe(2);
    expect(report.receipts).toHaveLength(2);
  });

  it('creates the tax-reports directory', () => {
    addReceipt(baseReceipt);
    exportTaxReport();
    expect(require('node:fs').existsSync(join(process.env.RECEIPT_MCP_DATA_DIR, 'tax-reports'))).toBe(true);
  });
});
