/**
 * TaxBrain — Tax Rules Configuration (FY 2026-27)
 *
 * THE SINGLE SOURCE OF TRUTH for all tax slabs, deduction limits,
 * and regime configurations. When tax laws change, edit ONLY this file.
 *
 * Legal basis: Income Tax Act, 2025 (effective April 1, 2026)
 * Budget 2026 made no changes to slabs or standard deduction.
 * Verified current as of July 26, 2026.
 */

import type {
  TaxConfig,
  DeductionRule,
  SectionMapping,
} from './types';

// ============================================================
// DEDUCTION RULES DETAIL
// (Declared before TAX_CONFIG_FY2026 because const doesn't hoist)
// ============================================================

const DEDUCTION_RULES: readonly DeductionRule[] = [
  {
    section: '80C',
    newActSection: '123',
    name: 'Investments & Expenses',
    maxLimit: 150000,
    isPercentOfBasic: false,
    percentOfBasic: 0,
    availableInNewRegime: false,
    availableInOldRegime: true,
    description: 'PPF, ELSS, EPF, LIC, NSC, SCSS, Tax-saving FD, Tuition, Home Loan Principal, Stamp Duty',
    subItems: ['EPF', 'PPF', 'ELSS', 'LIC', 'NSC', 'SCSS', 'Tax-Saving FD', 'Tuition Fees', 'Home Loan Principal', 'Stamp Duty'],
  },
  {
    section: '80CCD(1B)',
    newActSection: '124(3)',
    name: 'NPS Self-Contribution',
    maxLimit: 50000,
    isPercentOfBasic: false,
    percentOfBasic: 0,
    availableInNewRegime: false,
    availableInOldRegime: true,
    description: 'Additional NPS contribution above 80C limit',
    subItems: ['NPS Tier-I'],
  },
  {
    section: '80CCD(2)',
    newActSection: '124(2)',
    name: 'Employer NPS Contribution',
    maxLimit: 0,
    isPercentOfBasic: true,
    percentOfBasic: 0.14,
    availableInNewRegime: true,
    availableInOldRegime: true,
    description: 'Employer contribution to NPS. New regime: 14% of Basic. Old regime: 10% of Basic (private sector)',
    subItems: ['Employer NPS'],
  },
  {
    section: '80D',
    newActSection: '126',
    name: 'Health Insurance Premium',
    maxLimit: 100000,
    isPercentOfBasic: false,
    percentOfBasic: 0,
    availableInNewRegime: false,
    availableInOldRegime: true,
    description: 'Health insurance for self (₹25K), parents (₹25K/₹50K if senior). Includes ₹5K preventive checkup',
    subItems: ['Self/Family', 'Parents', 'Preventive Checkup'],
  },
  {
    section: '24(b)',
    newActSection: '(mapped)',
    name: 'Home Loan Interest',
    maxLimit: 200000,
    isPercentOfBasic: false,
    percentOfBasic: 0,
    availableInNewRegime: false,
    availableInOldRegime: true,
    description: 'Interest on home loan for self-occupied property. THE biggest old-regime lever for homeowners',
    subItems: ['Self-Occupied Property Interest'],
  },
  {
    section: '80TTA',
    newActSection: '(mapped)',
    name: 'Savings Account Interest',
    maxLimit: 10000,
    isPercentOfBasic: false,
    percentOfBasic: 0,
    availableInNewRegime: false,
    availableInOldRegime: true,
    description: 'Interest on savings account (not FD). ₹10,000 limit for non-senior citizens',
    subItems: ['Savings Account Interest'],
  },
] as const;

// ============================================================
// FY 2026-27 (Tax Year 2026-27) CONFIGURATION
// ============================================================

export const TAX_CONFIG_FY2026: TaxConfig = {
  financialYear: '2026-27',
  taxYear: 'Tax Year 2026-27',

  // ──────────────────────────────────────────────────────────
  // NEW TAX REGIME (Section 202 / old Section 115BAC)
  // Default regime. Lower rates, fewer deductions.
  // ──────────────────────────────────────────────────────────
  newRegime: {
    id: 'new',
    name: 'New Tax Regime',
    financialYear: '2026-27',
    slabs: [
      { min: 0,       max: 400000,   rate: 0,    label: 'Up to ₹4L' },
      { min: 400001,  max: 800000,   rate: 0.05, label: '₹4L – ₹8L' },
      { min: 800001,  max: 1200000,  rate: 0.10, label: '₹8L – ₹12L' },
      { min: 1200001, max: 1600000,  rate: 0.15, label: '₹12L – ₹16L' },
      { min: 1600001, max: 2000000,  rate: 0.20, label: '₹16L – ₹20L' },
      { min: 2000001, max: 2400000,  rate: 0.25, label: '₹20L – ₹24L' },
      { min: 2400001, max: Infinity, rate: 0.30, label: 'Above ₹24L' },
    ],
    standardDeduction: 75000,
    rebate: { incomeLimit: 1200000, maxRebate: 60000 },
    cessRate: 0.04,
    surchargeSlabs: [
      { min: 5000001,  max: 10000000, rate: 0.10 },
      { min: 10000001, max: 20000000, rate: 0.15 },
      { min: 20000001, max: Infinity, rate: 0.25 },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // OLD TAX REGIME
  // Higher rates but allows deductions (80C, 80D, HRA, etc.)
  // ──────────────────────────────────────────────────────────
  oldRegime: {
    id: 'old',
    name: 'Old Tax Regime',
    financialYear: '2026-27',
    slabs: [
      { min: 0,       max: 250000,   rate: 0,    label: 'Up to ₹2.5L' },
      { min: 250001,  max: 500000,   rate: 0.05, label: '₹2.5L – ₹5L' },
      { min: 500001,  max: 1000000,  rate: 0.20, label: '₹5L – ₹10L' },
      { min: 1000001, max: Infinity, rate: 0.30, label: 'Above ₹10L' },
    ],
    standardDeduction: 50000,
    rebate: { incomeLimit: 500000, maxRebate: 12500 },
    cessRate: 0.04,
    surchargeSlabs: [
      { min: 5000001,  max: 10000000, rate: 0.10 },
      { min: 10000001, max: 20000000, rate: 0.15 },
      { min: 20000001, max: 50000000, rate: 0.25 },
      { min: 50000001, max: Infinity, rate: 0.37 },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // DEDUCTION RULES
  // ──────────────────────────────────────────────────────────
  deductions: DEDUCTION_RULES,

  // ──────────────────────────────────────────────────────────
  // METRO CITIES (for HRA: 50% of Basic if metro, 40% if not)
  // Updated April 2026: expanded from 4 to 8 cities
  // ──────────────────────────────────────────────────────────
  metroCities: [
    'Delhi', 'Mumbai', 'Kolkata', 'Chennai',
    'Bengaluru', 'Hyderabad', 'Pune', 'Ahmedabad',
  ],

  // ──────────────────────────────────────────────────────────
  // SALARY OPTIMIZATION LIMITS
  // ──────────────────────────────────────────────────────────
  mealVoucherPerMealLimit: 200, // ₹200/meal, up from ₹50 (April 2026)

  employerNPS: {
    newRegimePercent: 0.14, // 14% of Basic
    oldRegimePrivatePercent: 0.10, // 10% of Basic (private sector)
  },

  employerPFESICCap: 750000, // ₹7.5L aggregate exempt limit

  // ──────────────────────────────────────────────────────────
  // LTA (Leave Travel Allowance)
  // ──────────────────────────────────────────────────────────
  lta: {
    blockStart: 2026,
    blockEnd: 2029,
    maxJourneys: 2,
    domesticOnly: true,
  },

  // ──────────────────────────────────────────────────────────
  // ROUNDING (Section 288B)
  // ──────────────────────────────────────────────────────────
  section288BRounding: 10, // Round total tax to nearest ₹10
} as const;

// ============================================================
// INCOME TAX ACT 2025 — SECTION MAPPING
// Old (1961 Act) → New (2025 Act) for reference/tooltips
// ============================================================

export const SECTION_MAPPINGS: readonly SectionMapping[] = [
  { oldSection: '80C', newSection: '123', description: 'Investments (PPF, ELSS, LIC, EPF) — ₹1.5L limit' },
  { oldSection: '80CCC', newSection: '123', description: 'Consolidated into 123' },
  { oldSection: '80CCD(1)', newSection: '123', description: 'Consolidated into 123' },
  { oldSection: '80CCD(1B)', newSection: '124(3)', description: 'NPS self-contribution (₹50K extra)' },
  { oldSection: '80CCD(2)', newSection: '124(2)', description: 'Employer NPS contribution' },
  { oldSection: '80D', newSection: '126', description: 'Health insurance premium' },
  { oldSection: '80TTA', newSection: '(mapped)', description: 'Savings account interest (₹10K limit)' },
  { oldSection: '10(13A)', newSection: 'Sec 11 + Sch II', description: 'HRA exemption' },
  { oldSection: '24(b)', newSection: '(mapped)', description: 'Home loan interest (₹2L limit)' },
  { oldSection: '87A', newSection: '156', description: 'Rebate (up to ₹12L = zero tax in new regime)' },
  { oldSection: '115BAC', newSection: '202', description: 'New tax regime' },
  { oldSection: '139', newSection: '148', description: 'Return filing obligation' },
  { oldSection: '288A/288B', newSection: '(mapped)', description: 'Rounding rules (nearest ₹10)' },
] as const;

// ============================================================
// FORM RENAMING REFERENCE
// ============================================================

export const FORM_MAPPINGS = {
  'Form 16': 'Form 130',
  'Form 16A': 'Form 131',
  'Form 12BB': 'Form 124',
  'Form 26AS': 'Form 168',
} as const;

// ============================================================
// HELPER — Get deduction rule by old section number
// ============================================================

export function getDeductionRule(section: string): DeductionRule | undefined {
  return TAX_CONFIG_FY2026.deductions.find(d => d.section === section);
}

/** Check if a city is classified as metro for HRA */
export function isMetroCity(city: string): boolean {
  return TAX_CONFIG_FY2026.metroCities.some(
    metro => metro.toLowerCase() === city.toLowerCase()
  );
}

/** Get the NPS percentage limit based on regime */
export function getNPSPercent(regime: 'new' | 'old'): number {
  return regime === 'new'
    ? TAX_CONFIG_FY2026.employerNPS.newRegimePercent
    : TAX_CONFIG_FY2026.employerNPS.oldRegimePrivatePercent;
}
