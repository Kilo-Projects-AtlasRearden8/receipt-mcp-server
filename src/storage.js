import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function dataDir() {
  return process.env.RECEIPT_MCP_DATA_DIR || process.cwd();
}

function dataFile() {
  return join(dataDir(), 'receipts.json');
}

const DEFAULT_CATEGORIES = [
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

const CATEGORY_KEYWORDS = {
  'Office Supplies': ['paper', 'pen', 'staple', 'folder', 'binder', 'ink', 'toner', 'notebook', 'envelope', 'label'],
  'Software & Subscriptions': ['software', 'subscription', 'saas', 'app', 'monthly', 'annual', 'license', 'microsoft', 'adobe', 'google workspace', 'dropbox'],
  Travel: ['hotel', 'airbnb', 'flight', 'airline', 'uber', 'lyft', 'taxi', 'train', 'rental car', 'mileage', 'airbnb'],
  'Meals & Entertainment': ['restaurant', 'cafe', 'coffee', 'dinner', 'lunch', 'breakfast', 'meal', 'food', 'pub', 'bar', 'movie', 'ticket'],
  Utilities: ['electric', 'electricity', 'gas', 'water', 'internet', 'wifi', 'phone', 'mobile', 'cable', 'utility'],
  Marketing: ['ad', 'ads', 'facebook', 'instagram', 'flyer', 'banner', 'promo', 'marketing', 'advertisement', 'business card'],
  'Professional Services': ['lawyer', 'attorney', 'accountant', 'cpa', 'bookkeeper', 'consultant', 'legal', 'professional'],
  Insurance: ['insurance', 'premium', 'liability', 'malpractice', 'policy'],
  'Education & Training': ['course', 'class', 'book', 'training', 'seminar', 'webinar', 'certification', 'ce ', 'continuing education'],
  Equipment: ['laptop', 'computer', 'monitor', 'printer', 'scanner', 'camera', 'phone', 'hardware', 'device'],
  'Postage & Shipping': ['stamp', 'postage', 'shipping', 'fedex', 'ups', 'usps', 'dhl', 'courier'],
};

function ensureDataFile() {
  const file = dataFile();
  if (!existsSync(file)) {
    mkdirSync(dataDir(), { recursive: true });
    writeFileSync(file, JSON.stringify([], null, 2), 'utf8');
  }
}

function readReceipts() {
  ensureDataFile();
  const raw = readFileSync(dataFile(), 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function writeReceipts(receipts) {
  writeFileSync(dataFile(), JSON.stringify(receipts, null, 2), 'utf8');
}

function newId() {
  return `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeReceipt(input) {
  const vendor = String(input.vendor || '').trim();
  if (!vendor) {
    throw new Error('Vendor is required');
  }
  const date = String(input.date || '').trim();
  if (!date) {
    throw new Error('Date is required (YYYY-MM-DD)');
  }
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Amount must be zero or greater');
  }
  const category = String(input.category || 'Other').trim() || 'Other';
  return {
    id: input.id || newId(),
    vendor,
    date,
    amount,
    category,
    paymentMethod: String(input.paymentMethod || '').trim(),
    notes: String(input.notes || '').trim(),
    filePath: String(input.filePath || '').trim(),
    taxDeductible: input.taxDeductible !== false,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function listReceipts(filter) {
  const receipts = readReceipts();
  if (!filter) {
    return receipts;
  }
  return receipts.filter((receipt) => {
    if (filter.category && receipt.category !== filter.category) {
      return false;
    }
    if (filter.vendor) {
      const needle = String(filter.vendor).toLowerCase();
      if (!receipt.vendor.toLowerCase().includes(needle)) {
        return false;
      }
    }
    if (filter.minDate && receipt.date < filter.minDate) {
      return false;
    }
    if (filter.maxDate && receipt.date > filter.maxDate) {
      return false;
    }
    return true;
  });
}

export function findReceiptById(id) {
  return readReceipts().find((receipt) => receipt.id === id);
}

export function addReceipt(input) {
  const receipt = normalizeReceipt(input);
  const receipts = readReceipts();
  if (receipts.some((existing) => existing.id === receipt.id)) {
    throw new Error(`Receipt with ID ${receipt.id} already exists`);
  }
  receipts.push(receipt);
  writeReceipts(receipts);
  return receipt;
}

export function updateReceipt(id, changes) {
  const receipts = readReceipts();
  const index = receipts.findIndex((receipt) => receipt.id === id);
  if (index === -1) {
    throw new Error(`Receipt with ID ${id} not found`);
  }
  receipts[index] = { ...receipts[index], ...normalizeReceipt({ ...receipts[index], ...changes }) };
  writeReceipts(receipts);
  return receipts[index];
}

export function removeReceipt(id) {
  const receipts = readReceipts();
  const filtered = receipts.filter((receipt) => receipt.id !== id);
  if (filtered.length === receipts.length) {
    throw new Error(`Receipt with ID ${id} not found`);
  }
  writeReceipts(filtered);
  return true;
}

export function categorizeReceipt(id, category) {
  const receipts = readReceipts();
  const index = receipts.findIndex((receipt) => receipt.id === id);
  if (index === -1) {
    throw new Error(`Receipt with ID ${id} not found`);
  }
  receipts[index] = { ...receipts[index], category };
  writeReceipts(receipts);
  return receipts[index];
}

function summarizeGroup(receipts) {
  return receipts.reduce(
    (acc, receipt) => {
      acc.count += 1;
      acc.total += Number(receipt.amount) || 0;
      if (receipt.taxDeductible !== false) {
        acc.deductibleTotal += Number(receipt.amount) || 0;
        acc.deductibleCount += 1;
      }
      return acc;
    },
    { count: 0, total: 0, deductibleTotal: 0, deductibleCount: 0 }
  );
}

export function summarizeReceipts(filter) {
  const receipts = listReceipts(filter);
  const overall = summarizeGroup(receipts);

  const byCategory = {};
  for (const receipt of receipts) {
    const cat = receipt.category || 'Other';
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, total: 0, deductibleTotal: 0, deductibleCount: 0 };
    }
    const group = byCategory[cat];
    group.count += 1;
    group.total += Number(receipt.amount) || 0;
    if (receipt.taxDeductible !== false) {
      group.deductibleTotal += Number(receipt.amount) || 0;
      group.deductibleCount += 1;
    }
  }

  const byMonth = {};
  for (const receipt of receipts) {
    const month = receipt.date.slice(0, 7) || 'unknown';
    if (!byMonth[month]) {
      byMonth[month] = { count: 0, total: 0, deductibleTotal: 0, deductibleCount: 0 };
    }
    const group = byMonth[month];
    group.count += 1;
    group.total += Number(receipt.amount) || 0;
    if (receipt.taxDeductible !== false) {
      group.deductibleTotal += Number(receipt.amount) || 0;
      group.deductibleCount += 1;
    }
  }

  return {
    receiptCount: receipts.length,
    total: overall.total,
    deductibleTotal: overall.deductibleTotal,
    deductibleCount: overall.deductibleCount,
    nonDeductibleTotal: overall.total - overall.deductibleTotal,
    byCategory,
    byMonth,
    generatedAt: new Date().toISOString(),
  };
}

function reportDir() {
  return join(process.env.RECEIPT_MCP_DATA_DIR || process.cwd(), 'tax-reports');
}

export function exportTaxReport(options = {}) {
  const filter = {};
  if (options.minDate) {
    filter.minDate = options.minDate;
  }
  if (options.maxDate) {
    filter.maxDate = options.maxDate;
  }
  if (options.category) {
    filter.category = options.category;
  }

  const summary = summarizeReceipts(filter);
  const receipts = listReceipts(filter);

  const yearMonth = options.label || (summary.byMonth && Object.keys(summary.byMonth).length === 1
    ? Object.keys(summary.byMonth)[0]
    : new Date().toISOString().slice(0, 7));

  mkdirSync(reportDir(), { recursive: true });
  const safeLabel = String(yearMonth).replace(/[^a-z0-9_-]/gi, '_');
  const reportFile = join(reportDir(), `tax-report-${safeLabel}.json`);

  const report = {
    label: yearMonth,
    generatedAt: new Date().toISOString(),
    filter,
    summary,
    receipts,
  };

  writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');

  const lines = [
    `Tax-ready report: ${yearMonth}`,
    `Generated: ${report.generatedAt}`,
    `Receipts: ${summary.receiptCount}`,
    `Total: $${summary.total.toFixed(2)}`,
    `Tax-deductible: $${summary.deductibleTotal.toFixed(2)} (${summary.deductibleCount} receipts)`,
    `Non-deductible: $${summary.nonDeductibleTotal.toFixed(2)}`,
    '',
    'By category:',
  ];
  for (const [category, group] of Object.entries(summary.byCategory).sort()) {
    lines.push(
      `  ${category}: $${group.total.toFixed(2)} (${group.count} receipts, $${group.deductibleTotal.toFixed(2)} deductible)`
    );
  }
  lines.push('', 'By month:');
  for (const [month, group] of Object.entries(summary.byMonth).sort()) {
    lines.push(
      `  ${month}: $${group.total.toFixed(2)} (${group.count} receipts)`
    );
  }

  return {
    reportFile,
    report,
    text: lines.join('\n'),
  };
}

export { DEFAULT_CATEGORIES };

export function suggestCategory(vendor, notes) {
  const haystack = `${vendor || ''} ${notes || ''}`.toLowerCase();
  const scores = {};
  for (const category of DEFAULT_CATEGORIES) {
    let score = 0;
    for (const keyword of CATEGORY_KEYWORDS[category] || []) {
      if (haystack.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    scores[category] = score;
  }
  let best = 'Other';
  let bestScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return best;
}
