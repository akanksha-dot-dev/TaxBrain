/**
 * TaxBrain — Formatting Utilities
 *
 * Currency formatting (Indian notation), percentage display,
 * and input parsing helpers. Framework-agnostic.
 *
 * Rule: All monetary amounts are whole rupees (integers).
 * Display uses Intl.NumberFormat('en-IN') → ₹12,34,567
 */

// ============================================================
// CURRENCY FORMATTING
// ============================================================

const indianFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const indianFormatterWithDecimals = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format amount as Indian currency: ₹12,34,567
 * All amounts are whole rupees — no paise.
 */
export function formatCurrency(amount: number): string {
  return `₹${indianFormatter.format(Math.round(amount))}`;
}

/**
 * Format as short currency: ₹12.3L, ₹1.2Cr, ₹45,000
 * Uses lakhs/crores notation standard in India.
 */
export function formatCurrencyShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    // ₹1Cr+
    const crores = abs / 10000000;
    return `${sign}₹${indianFormatterWithDecimals.format(crores)}Cr`;
  }
  if (abs >= 100000) {
    // ₹1L+
    const lakhs = abs / 100000;
    return `${sign}₹${indianFormatterWithDecimals.format(lakhs)}L`;
  }
  return `${sign}₹${indianFormatter.format(Math.round(abs))}`;
}

/**
 * Format a number with Indian notation (no ₹ symbol).
 * Useful for input fields showing just the number.
 */
export function formatNumber(amount: number): string {
  return indianFormatter.format(Math.round(amount));
}

// ============================================================
// PERCENTAGE FORMATTING
// ============================================================

/** Format as percentage: 25.3% */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format as percentage from a pre-multiplied value: 25.3% */
export function formatPercentRaw(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================================
// DATE / MONTH FORMATTING
// ============================================================

const FY_MONTHS = [
  'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November',
  'December', 'January', 'February', 'March',
] as const;

/**
 * Convert FY month number (1=April, 12=March) to month name.
 */
export function formatFYMonth(monthNum: number): string {
  if (monthNum < 1 || monthNum > 12) return 'Invalid';
  return FY_MONTHS[monthNum - 1];
}

/**
 * Format a month range: "April – July" or "August – March"
 */
export function formatMonthRange(start: number, end: number): string {
  return `${formatFYMonth(start)} – ${formatFYMonth(end)}`;
}

// ============================================================
// INPUT PARSING
// ============================================================

/**
 * Parse a currency string input into a number.
 * Handles: "₹12,34,567", "1234567", "12,34,567", "₹ 12,34,567"
 * Returns 0 for empty/invalid input.
 */
export function parseCurrencyInput(input: string): number {
  if (!input || input.trim() === '') return 0;

  // Remove ₹ symbol, spaces, and commas
  const cleaned = input
    .replace(/₹/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '')
    .trim();

  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Parse a percentage input: "14", "14%", "0.14" → 14
 * Returns the raw percentage number (not decimal).
 */
export function parsePercentInput(input: string): number {
  if (!input || input.trim() === '') return 0;

  const cleaned = input.replace(/%/g, '').trim();
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;

  // If user entered 0.14, interpret as 14%
  if (parsed > 0 && parsed < 1) return parsed * 100;
  return parsed;
}

// ============================================================
// TAX ROUNDING (Section 288B)
// ============================================================

/**
 * Round tax to nearest ₹10 as per Section 288B.
 * Indian tax law: total tax payable is rounded to nearest ₹10.
 * ₹5 rounds up.
 */
export function roundToSection288B(amount: number): number {
  return Math.round(amount / 10) * 10;
}

// ============================================================
// DISPLAY HELPERS
// ============================================================

/** Pluralize a word: "1 month" vs "4 months" */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`;
}

/** Format a savings amount with positive/negative framing */
export function formatSavings(amount: number): string {
  if (amount > 0) return `Save ${formatCurrency(amount)}`;
  if (amount < 0) return `Pay ${formatCurrency(Math.abs(amount))} more`;
  return 'No difference';
}
