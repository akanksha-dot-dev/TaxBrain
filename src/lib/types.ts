/**
 * TaxBrain — Core TypeScript Types
 *
 * All interfaces for the tax calculation engine, user profile,
 * and UI components. Framework-agnostic — no React/Astro imports.
 *
 * Legal framework: Income Tax Act, 2025 (effective April 1, 2026)
 * Old section numbers (80C, 80D) used for familiarity.
 */

// ============================================================
// TAX CONFIGURATION TYPES
// ============================================================

/** A single tax slab with rate and label */
export interface TaxSlab {
  readonly min: number;
  readonly max: number; // Infinity for the last slab
  readonly rate: number; // 0.05 = 5%
  readonly label: string; // "₹4L – ₹8L"
}

/** Surcharge rule based on income bracket */
export interface SurchargeRule {
  readonly min: number;
  readonly max: number;
  readonly rate: number;
}

/** Section 87A / Section 156 rebate configuration */
export interface RebateConfig {
  readonly incomeLimit: number; // Taxable income up to this → rebate applies
  readonly maxRebate: number; // Maximum rebate amount
}

/** Full configuration for one tax regime (new or old) */
export interface RegimeConfig {
  readonly id: 'new' | 'old';
  readonly name: string;
  readonly financialYear: string;
  readonly slabs: readonly TaxSlab[];
  readonly standardDeduction: number;
  readonly rebate: RebateConfig;
  readonly cessRate: number; // 0.04 = 4%
  readonly surchargeSlabs: readonly SurchargeRule[];
}

/** A single deduction rule (80C, 80D, etc.) */
export interface DeductionRule {
  readonly section: string; // "80C" — old Act, used in UI
  readonly newActSection: string; // "123" — Income Tax Act 2025
  readonly name: string;
  readonly maxLimit: number; // ₹ amount (absolute cap)
  readonly isPercentOfBasic: boolean; // true for NPS employer
  readonly percentOfBasic: number; // 0.14 or 0.10
  readonly availableInNewRegime: boolean;
  readonly availableInOldRegime: boolean;
  readonly description: string;
  readonly subItems: readonly string[];
}

/** Employer NPS limits differ by regime for private sector */
export interface EmployerNPSConfig {
  readonly newRegimePercent: number; // 0.14 (14%)
  readonly oldRegimePrivatePercent: number; // 0.10 (10%)
}

/** LTA block period configuration */
export interface LTAConfig {
  readonly blockStart: number; // 2026
  readonly blockEnd: number; // 2029
  readonly maxJourneys: number; // 2
  readonly domesticOnly: boolean;
}

/** Top-level tax configuration for a financial year */
export interface TaxConfig {
  readonly financialYear: string;
  readonly taxYear: string; // "Tax Year 2026-27" (new Act terminology)
  readonly newRegime: RegimeConfig;
  readonly oldRegime: RegimeConfig;
  readonly deductions: readonly DeductionRule[];
  readonly metroCities: readonly string[];
  readonly mealVoucherPerMealLimit: number; // ₹200
  readonly employerNPS: EmployerNPSConfig;
  readonly employerPFESICCap: number; // ₹7,50,000
  readonly lta: LTAConfig;
  readonly section288BRounding: number; // 10 (round to nearest ₹10)
}

// ============================================================
// SECTION NUMBER MAPPING (Income Tax Act 1961 → 2025)
// ============================================================

export interface SectionMapping {
  readonly oldSection: string;
  readonly newSection: string;
  readonly description: string;
}

// ============================================================
// USER PROFILE TYPES
// ============================================================

/** Individual salary components (annual amounts in whole rupees) */
export interface SalaryComponents {
  basic: number;
  hra: number;
  lta: number;
  specialAllowance: number;
  fuelMaintenance: number;
  flexiBasket: number;
  managementAllowance: number;
  otherAllowances: number;
}

/** A single job within the financial year */
export interface JobProfile {
  id: string;
  employer: string;
  startMonth: number; // 1 = April (start of FY)
  endMonth: number; // 12 = March (end of FY)
  components: SalaryComponents;
  variablePay: number;
  variablePayPercent: number; // 0–100, expected achievement
  employerPF: number; // Annual employer PF contribution
  isCurrentJob: boolean;
}

/** Section 80C sub-items */
export interface Section80C {
  epf: number;
  ppf: number;
  elss: number;
  lifeInsurance: number;
  nsc: number;
  taxSavingFD: number;
  tuitionFees: number;
  homeLoanPrincipal: number;
  stampDuty: number;
  other: number;
}

/** Section 80D health insurance */
export interface Section80D {
  selfPremium: number;
  parentsPremium: number;
  parentsAreSenior: boolean;
  preventiveCheckup: number; // Max ₹5,000
}

/** Employer NPS configuration per job */
export interface EmployerNPSToggle {
  enabled: boolean;
  percentage: number; // 10 or 14, applied to basic
}

/** All deductions (old regime primarily) */
export interface UserDeductions {
  section80C: Section80C;
  section80CCD1B: number; // NPS self-contribution (₹50K cap)
  section80CCD2: EmployerNPSToggle; // Employer NPS
  section80D: Section80D;
  section24B: number; // Home loan interest
  section80TTA: number; // Savings account interest (₹10K cap)
  professionalTax: number; // Professional Tax (Sec 16(iii), ₹2,500 cap)
}

/** Optimization toggles for salary restructuring */
export interface OptimizationToggles {
  employerNPS: boolean;
  mealVouchers: boolean;
  phoneReimbursement: boolean;
  monthlyPhoneAmount: number; // ₹ per month
  ltaClaimed: boolean;
  ltaAmount: number;
}

/** Life events for simulator scenarios */
export interface LifeEvents {
  planningMarriage: boolean;
  marriageTimeline: number; // months from now
  planningHouse: boolean;
  estimatedHomeLoan: number;
  estimatedEMI: number;
  expectedSalaryHike: number; // percentage
}

/** Complete user profile stored in localStorage */
export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married';
  city: string;
  isMetroCity: boolean;
  monthlyRent: number;

  jobs: JobProfile[];

  deductions: UserDeductions;
  optimizations: OptimizationToggles;
  lifeEvents: LifeEvents;

  // Metadata
  financialYear: string;
  lastUpdated: string;
  version: number; // Schema version for migrations
}

// ============================================================
// CALCULATION RESULT TYPES
// ============================================================

/** Breakdown of tax for a single slab */
export interface SlabBreakdown {
  readonly slab: TaxSlab;
  readonly taxableInSlab: number;
  readonly taxOnSlab: number;
}

/** A single exemption line item */
export interface ExemptionItem {
  readonly name: string;
  readonly section: string; // "10(13A)" for HRA
  readonly amount: number;
  readonly details: string;
}

/** A single deduction line item */
export interface DeductionItem {
  readonly name: string;
  readonly section: string; // "80C"
  readonly newActSection: string; // "123"
  readonly claimed: number;
  readonly limit: number;
  readonly details: string;
}

/** HRA exemption calculation breakdown */
export interface HRABreakdown {
  readonly actualHRA: number;
  readonly rentMinus10PercentBasic: number;
  readonly percentOfBasic: number; // 40% or 50% depending on city
  readonly exemption: number; // min of the three
  readonly taxableHRA: number; // HRA received - exemption
}

/** Complete tax calculation result for one regime */
export interface TaxResult {
  readonly regime: 'new' | 'old';
  readonly regimeName: string;

  // Income computation
  readonly grossSalary: number;
  readonly exemptions: readonly ExemptionItem[];
  readonly totalExemptions: number;
  readonly grossTaxableIncome: number;

  // Deductions (Chapter VI-A)
  readonly deductions: readonly DeductionItem[];
  readonly totalDeductions: number;
  readonly netTaxableIncome: number;

  // Tax computation
  readonly slabBreakdown: readonly SlabBreakdown[];
  readonly taxBeforeRebate: number;
  readonly rebate: number;
  readonly marginalRelief: number;
  readonly taxAfterRebate: number;
  readonly surcharge: number;
  readonly cess: number;
  readonly totalTax: number;

  // Derived metrics
  readonly effectiveTaxRate: number; // totalTax / grossSalary
  readonly monthlyTDS: number;
  readonly annualTakeHome: number;
  readonly monthlyTakeHome: number;
}

/** Side-by-side regime comparison */
export interface RegimeComparison {
  readonly newRegime: TaxResult;
  readonly oldRegime: TaxResult;
  readonly winner: 'new' | 'old';
  readonly savings: number; // How much the winner saves
  readonly savingsPercent: number; // savings / loser's tax
  readonly explanation: string; // Human-readable why
}

// ============================================================
// INTELLIGENCE LAYER TYPES
// ============================================================

/** A tax optimization suggestion */
export interface Suggestion {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly potentialSaving: number;
  readonly regime: 'new' | 'old' | 'both';
  readonly actionRequired: string;
  readonly priority: 'high' | 'medium' | 'low';
}

/** Action checklist item */
export interface ActionItem {
  id: string;
  text: string;
  category: 'before-leaving' | 'day-1' | 'month-1' | 'month-3' | 'annual';
  priority: 'critical' | 'important' | 'nice';
  completed: boolean;
  details: string;
}

/** Breakeven analysis parameter */
export type BreakevenParameter = 'rent' | 'salary' | 'homeLoan';
