/**
 * TaxBrain — Core Tax Engine
 *
 * All tax calculation logic lives here. Pure functions only.
 * No side effects, no state, no DOM access, no framework imports.
 *
 * Every function receives data and returns results. Period.
 *
 * Monetary values: whole rupees (integers).
 * Final tax: rounded to nearest ₹10 (Section 288B).
 */

import type {
  TaxConfig,
  TaxSlab,
  UserProfile,
  JobProfile,
  TaxResult,
  SlabBreakdown,
  ExemptionItem,
  DeductionItem,
  HRABreakdown,
  RegimeComparison,
  Suggestion,
  BreakevenParameter,
} from './types';

// ============================================================
// CORE CALCULATION PRIMITIVES
// ============================================================

/**
 * Apply income to a slab structure, return per-slab breakdown.
 * This is the fundamental building block of all tax calculations.
 */
export function calculateSlabTax(
  income: number,
  slabs: readonly TaxSlab[]
): SlabBreakdown[] {
  const result: SlabBreakdown[] = [];
  let remaining = Math.max(0, Math.round(income));

  for (const slab of slabs) {
    if (remaining <= 0) {
      result.push({ slab, taxableInSlab: 0, taxOnSlab: 0 });
      continue;
    }

    const slabWidth = slab.max === Infinity
      ? remaining
      : Math.max(0, slab.max - slab.min + 1);

    const taxableInSlab = Math.min(remaining, slabWidth);
    const taxOnSlab = Math.round(taxableInSlab * slab.rate);

    result.push({ slab, taxableInSlab, taxOnSlab });
    remaining -= taxableInSlab;
  }

  return result;
}

/** Calculate 4% Health & Education Cess */
export function calculateCess(tax: number, cessRate: number): number {
  return Math.round(tax * cessRate);
}

/** Calculate surcharge based on income brackets */
export function calculateSurcharge(
  tax: number,
  income: number,
  surchargeSlabs: readonly { min: number; max: number; rate: number }[]
): number {
  for (const slab of surchargeSlabs) {
    if (income >= slab.min && income <= slab.max) {
      const rawSurcharge = Math.round(tax * slab.rate);
      const threshold = slab.min - 1; // e.g. 50,00,000
      const excessIncome = income - threshold;
      // Marginal relief: Surcharge should not exceed income in excess of threshold
      if (rawSurcharge > excessIncome) {
        return Math.max(0, excessIncome);
      }
      return rawSurcharge;
    }
  }
  return 0;
}

/**
 * Calculate Section 87A / Section 156 rebate.
 * If taxable income ≤ limit, rebate = min(tax, maxRebate).
 */
export function calculateRebate(
  tax: number,
  taxableIncome: number,
  incomeLimit: number,
  maxRebate: number
): number {
  if (taxableIncome <= incomeLimit) {
    return Math.min(tax, maxRebate);
  }
  return 0;
}

/**
 * Calculate marginal relief at rebate boundary.
 * If income slightly exceeds the rebate limit, the total tax shouldn't
 * exceed the income above the limit. This prevents a cliff effect.
 */
export function calculateMarginalRelief(
  taxableIncome: number,
  taxBeforeRelief: number,
  rebateIncomeLimit: number
): number {
  if (taxableIncome <= rebateIncomeLimit) return 0;

  const incomeAboveLimit = taxableIncome - rebateIncomeLimit;
  if (taxBeforeRelief > incomeAboveLimit) {
    return taxBeforeRelief - incomeAboveLimit;
  }
  return 0;
}

// ============================================================
// HRA CALCULATION
// ============================================================

/**
 * Calculate HRA exemption using the min-of-3 formula.
 * Only available in old regime.
 *
 * The three components:
 * 1. Actual HRA received
 * 2. 50% of Basic (metro) or 40% of Basic (non-metro)
 * 3. Rent paid - 10% of Basic
 *
 * Exemption = minimum of the three.
 */
export function calculateHRAExemption(params: {
  basic: number;
  hra: number;
  monthlyRent: number;
  months: number;
  isMetro: boolean;
}): HRABreakdown {
  const { basic, hra, monthlyRent, months, isMetro } = params;

  // Pro-rate to the job duration within the FY
  const proRatedBasic = basic;
  const actualHRA = hra;
  const annualRent = monthlyRent * months;

  const percentOfBasic = Math.round(proRatedBasic * (isMetro ? 0.50 : 0.40));
  const rentMinus10PercentBasic = Math.max(0, annualRent - Math.round(proRatedBasic * 0.10));

  const exemption = Math.min(actualHRA, percentOfBasic, rentMinus10PercentBasic);

  return {
    actualHRA,
    rentMinus10PercentBasic,
    percentOfBasic,
    exemption,
    taxableHRA: actualHRA - exemption,
  };
}

// ============================================================
// INCOME COMPUTATION HELPERS
// ============================================================

/**
 * Calculate gross salary from a job profile, pro-rated to months worked.
 * Includes basic, HRA, LTA, special allowance, fuel, flexi, management, other.
 * Variable pay is included at the specified achievement percentage.
 */
function calculateJobGross(job: JobProfile): number {
  const months = Math.max(0, job.endMonth - job.startMonth + 1);
  const c = job.components || {};

  const monthlyFixed = Math.ceil(
    ((c.basic ?? 0) + (c.hra ?? 0) + (c.lta ?? 0) + (c.specialAllowance ?? 0) +
     (c.fuelMaintenance ?? 0) + (c.flexiBasket ?? 0) + (c.managementAllowance ?? 0) +
     (c.otherAllowances ?? 0)) / 12
  );

  const fixedSalary = monthlyFixed * months;

  // Variable pay: annual × months/12 × achievement%
  const variable = Math.round((job.variablePay ?? 0) * months / 12 * ((job.variablePayPercent ?? 0) / 100));

  return fixedSalary + variable;
}

/**
 * Calculate total employee PF contribution across all jobs.
 * Used as 80C deduction in old regime.
 */
function calculateTotalEmployeePF(jobs: readonly JobProfile[]): number {
  let total = 0;
  for (const job of jobs) {
    const months = Math.max(0, job.endMonth - job.startMonth + 1);
    total += Math.round((job.employerPF ?? 0) * (months / 12));
  }
  return total;
}

/**
 * Calculate meal voucher exemption.
 * ₹200/meal × 2 meals × working days in the period.
 * Approximately 22 working days per month.
 */
function calculateMealVoucherExemption(
  months: number,
  perMealLimit: number
): number {
  const validMonths = Math.max(0, months);
  const workingDaysPerMonth = 22;
  const mealsPerDay = 2;
  return perMealLimit * mealsPerDay * workingDaysPerMonth * validMonths;
}

/**
 * Calculate employer NPS deduction.
 * New regime: 14% of Basic. Old regime (private sector): 10% of Basic.
 * Pro-rated to months worked.
 */
function calculateEmployerNPS(
  job: JobProfile,
  regime: 'new' | 'old',
  config: TaxConfig
): number {
  const months = Math.max(0, job.endMonth - job.startMonth + 1);
  const proRatedBasic = Math.round((job.components?.basic ?? 0) * (months / 12));
  const percent = regime === 'new'
    ? config.employerNPS.newRegimePercent
    : config.employerNPS.oldRegimePrivatePercent;
  return Math.round(proRatedBasic * percent);
}

// ============================================================
// FULL REGIME CALCULATIONS
// ============================================================

/**
 * Calculate tax under the New Tax Regime.
 *
 * New regime pipeline:
 * 1. Gross salary (all jobs combined)
 * 2. - Employer NPS (if enabled) [Section 124(2)]
 * 3. - Meal voucher exemption (if enabled)
 * 4. - Phone reimbursement (if enabled)
 * 5. - Standard deduction (₹75,000)
 * 6. = Taxable income
 * 7. Apply slab rates
 * 8. - Rebate (if applicable)
 * 9. + Marginal relief (if applicable)
 * 10. + Surcharge (if applicable)
 * 11. + Cess (4%)
 * 12. = Total tax (rounded to nearest ₹10)
 */
export function calculateNewRegimeTax(
  profile: UserProfile,
  config: TaxConfig
): TaxResult {
  const regime = config.newRegime;
  const exemptions: ExemptionItem[] = [];
  const deductions: DeductionItem[] = [];

  // Step 1: Gross salary
  let grossSalary = 0;
  for (const job of profile.jobs) {
    grossSalary += calculateJobGross(job);
  }

  // Check aggregate employer contribution cap (Sec 17(2)(vii) - ₹7,50,000)
  let totalEmployerContrib = 0;
  for (const job of profile.jobs) {
    const months = job.endMonth - job.startMonth + 1;
    const epf = Math.round(job.employerPF * (months / 12));
    const nps = profile.optimizations.employerNPS ? calculateEmployerNPS(job, 'new', config) : 0;
    totalEmployerContrib += (epf + nps);
  }
  if (totalEmployerContrib > config.employerPFESICCap) {
    const excessPerquisite = totalEmployerContrib - config.employerPFESICCap;
    grossSalary += excessPerquisite;
  }

  // Step 2: Employer NPS exemption
  let totalExemptions = 0;
  if (profile.optimizations.employerNPS) {
    for (const job of profile.jobs) {
      if (job.isCurrentJob || profile.jobs.length === 1) {
        const nps = calculateEmployerNPS(job, 'new', config);
        if (nps > 0) {
          exemptions.push({
            name: 'Employer NPS Contribution',
            section: '80CCD(2)',
            amount: nps,
            details: `14% of Basic (${formatJobPeriod(job)})`,
          });
          totalExemptions += nps;
        }
      }
    }
  }

  // Step 3: Meal voucher exemption
  if (profile.optimizations.mealVouchers) {
    for (const job of profile.jobs) {
      if (job.isCurrentJob || profile.jobs.length === 1) {
        const months = job.endMonth - job.startMonth + 1;
        const mealExemption = calculateMealVoucherExemption(
          months,
          config.mealVoucherPerMealLimit
        );
        if (mealExemption > 0) {
          exemptions.push({
            name: 'Meal Vouchers',
            section: 'Exempt',
            amount: mealExemption,
            details: `₹${config.mealVoucherPerMealLimit}/meal × 2 meals × 22 days × ${months} months`,
          });
          totalExemptions += mealExemption;
        }
      }
    }
  }

  // Step 4: Phone reimbursement
  if (profile.optimizations.phoneReimbursement && profile.optimizations.monthlyPhoneAmount > 0) {
    for (const job of profile.jobs) {
      if (job.isCurrentJob || profile.jobs.length === 1) {
        const months = job.endMonth - job.startMonth + 1;
        const phoneExemption = profile.optimizations.monthlyPhoneAmount * months;
        exemptions.push({
          name: 'Telephone/Internet Reimbursement',
          section: 'Exempt',
          amount: phoneExemption,
          details: `₹${profile.optimizations.monthlyPhoneAmount}/month × ${months} months`,
        });
        totalExemptions += phoneExemption;
      }
    }
  }

  // Step 5: Standard deduction
  const grossTaxableIncome = grossSalary - totalExemptions;
  deductions.push({
    name: 'Standard Deduction',
    section: 'Std',
    newActSection: 'Std',
    claimed: regime.standardDeduction,
    limit: regime.standardDeduction,
    details: `Fixed ₹${regime.standardDeduction.toLocaleString('en-IN')} deduction`,
  });
  const totalDeductions = regime.standardDeduction;

  // Step 6: Taxable income
  const netTaxableIncome = Math.max(0, grossTaxableIncome - totalDeductions);

  // Step 7: Slab tax
  const slabBreakdown = calculateSlabTax(netTaxableIncome, regime.slabs);
  const taxFromSlabs = slabBreakdown.reduce((sum, s) => sum + s.taxOnSlab, 0);

  // Step 8: Rebate
  const rebate = calculateRebate(
    taxFromSlabs,
    netTaxableIncome,
    regime.rebate.incomeLimit,
    regime.rebate.maxRebate
  );

  // Step 9: Marginal relief
  const marginalRelief = calculateMarginalRelief(
    netTaxableIncome,
    taxFromSlabs - rebate,
    regime.rebate.incomeLimit
  );

  const taxAfterRebate = Math.max(0, taxFromSlabs - rebate - marginalRelief);

  // Step 10: Surcharge
  const surcharge = calculateSurcharge(taxAfterRebate, netTaxableIncome, regime.surchargeSlabs);

  // Step 11: Cess
  const cess = calculateCess(taxAfterRebate + surcharge, regime.cessRate);

  // Step 12: Total tax (Section 288B rounding)
  const totalTax = roundToNearest10(taxAfterRebate + surcharge + cess);

  // Derived metrics
  const totalEmployeePF = calculateTotalEmployeePF(profile.jobs);
  const annualTakeHome = grossSalary - totalTax - totalEmployeePF;
  const effectiveTaxRate = grossSalary > 0 ? totalTax / grossSalary : 0;

  return {
    regime: 'new',
    regimeName: regime.name,
    grossSalary,
    exemptions,
    totalExemptions,
    grossTaxableIncome,
    deductions,
    totalDeductions,
    netTaxableIncome,
    slabBreakdown,
    taxBeforeRebate: taxFromSlabs,
    rebate,
    marginalRelief,
    taxAfterRebate,
    surcharge,
    cess,
    totalTax,
    effectiveTaxRate,
    monthlyTDS: Math.round(totalTax / 12),
    annualTakeHome,
    monthlyTakeHome: Math.round(annualTakeHome / 12),
  };
}

/**
 * Calculate tax under the Old Tax Regime.
 *
 * Old regime pipeline:
 * 1. Gross salary
 * 2. - HRA exemption [Section 10(13A)]
 * 3. - LTA exemption [Section 10(5)]
 * 4. - Meal voucher exemption (if enabled)
 * 5. - Phone reimbursement (if enabled)
 * 6. - Standard deduction (₹50,000)
 * 7. = Gross Total Income
 * 8. - Section 80C (EPF + PPF + ELSS + LIC + ...)
 * 9. - Section 80CCD(1B) (NPS self)
 * 10. - Section 80CCD(2) (Employer NPS, 10% for private)
 * 11. - Section 80D (Health insurance)
 * 12. - Section 24(b) (Home loan interest)
 * 13. - Section 80TTA (Savings interest)
 * 14. = Taxable income
 * 15. Apply old regime slabs
 * 16. Rebate, surcharge, cess
 * 17. = Total tax
 */
export function calculateOldRegimeTax(
  profile: UserProfile,
  config: TaxConfig
): TaxResult {
  const regime = config.oldRegime;
  const exemptions: ExemptionItem[] = [];
  const deductions: DeductionItem[] = [];

  // Step 1: Gross salary
  let grossSalary = 0;
  for (const job of profile.jobs) {
    grossSalary += calculateJobGross(job);
  }

  // Step 2: HRA exemption
  let totalExemptions = 0;
  if (profile.monthlyRent > 0) {
    for (const job of profile.jobs) {
      const months = Math.max(0, job.endMonth - job.startMonth + 1);
      if (months <= 0) continue;
      const proRate = months / 12;
      const hra = calculateHRAExemption({
        basic: Math.round((job.components?.basic ?? 0) * proRate),
        hra: Math.round((job.components?.hra ?? 0) * proRate),
        monthlyRent: profile.monthlyRent,
        months,
        isMetro: profile.isMetroCity,
      });
      if (hra.exemption > 0) {
        exemptions.push({
          name: `HRA Exemption (${job.employer})`,
          section: '10(13A)',
          amount: hra.exemption,
          details: `Min of: HRA ₹${hra.actualHRA.toLocaleString('en-IN')}, ` +
            `${profile.isMetroCity ? '50' : '40'}% Basic ₹${hra.percentOfBasic.toLocaleString('en-IN')}, ` +
            `Rent-10%Basic ₹${hra.rentMinus10PercentBasic.toLocaleString('en-IN')}`,
        });
        totalExemptions += hra.exemption;
      }
    }
  }

  // Step 3: LTA exemption (if claimed)
  if (profile.optimizations.ltaClaimed && profile.optimizations.ltaAmount > 0) {
    // LTA is only available in old regime
    exemptions.push({
      name: 'Leave Travel Allowance',
      section: '10(5)',
      amount: profile.optimizations.ltaAmount,
      details: `Claimed for domestic travel (block ${config.lta.blockStart}-${config.lta.blockEnd})`,
    });
    totalExemptions += profile.optimizations.ltaAmount;
  }

  // Step 4: Meal voucher exemption (both regimes)
  if (profile.optimizations.mealVouchers) {
    for (const job of profile.jobs) {
      if (job.isCurrentJob || profile.jobs.length === 1) {
        const months = job.endMonth - job.startMonth + 1;
        const mealExemption = calculateMealVoucherExemption(months, config.mealVoucherPerMealLimit);
        if (mealExemption > 0) {
          exemptions.push({
            name: 'Meal Vouchers',
            section: 'Exempt',
            amount: mealExemption,
            details: `₹${config.mealVoucherPerMealLimit}/meal × 2 × 22 days × ${months} months`,
          });
          totalExemptions += mealExemption;
        }
      }
    }
  }

  // Step 5: Phone reimbursement (both regimes)
  if (profile.optimizations.phoneReimbursement && profile.optimizations.monthlyPhoneAmount > 0) {
    for (const job of profile.jobs) {
      if (job.isCurrentJob || profile.jobs.length === 1) {
        const months = job.endMonth - job.startMonth + 1;
        const phoneExemption = profile.optimizations.monthlyPhoneAmount * months;
        exemptions.push({
          name: 'Phone/Internet Reimbursement',
          section: 'Exempt',
          amount: phoneExemption,
          details: `₹${profile.optimizations.monthlyPhoneAmount}/month × ${months} months`,
        });
        totalExemptions += phoneExemption;
      }
    }
  }

  // Step 6: Standard deduction
  const grossTaxableIncome = grossSalary - totalExemptions;
  deductions.push({
    name: 'Standard Deduction',
    section: 'Std',
    newActSection: 'Std',
    claimed: regime.standardDeduction,
    limit: regime.standardDeduction,
    details: `Fixed ₹${regime.standardDeduction.toLocaleString('en-IN')}`,
  });
  let totalDeductions = regime.standardDeduction;

  // Step 8: Section 80C
  const epfContribution = calculateTotalEmployeePF(profile.jobs);
  const s80c = profile.deductions.section80C || {};
  const total80C = Math.min(
    150000,
    epfContribution +
    (s80c.ppf ?? 0) +
    (s80c.elss ?? 0) +
    (s80c.lifeInsurance ?? 0) +
    (s80c.nsc ?? 0) +
    (s80c.taxSavingFD ?? 0) +
    (s80c.tuitionFees ?? 0) +
    (s80c.homeLoanPrincipal ?? 0) +
    (s80c.stampDuty ?? 0) +
    (s80c.other ?? 0)
  );
  if (total80C > 0) {
    deductions.push({
      name: 'Section 80C',
      section: '80C',
      newActSection: '123',
      claimed: total80C,
      limit: 150000,
      details: `EPF ₹${epfContribution.toLocaleString('en-IN')} + other investments`,
    });
    totalDeductions += total80C;
  }

  // Step 9: Section 80CCD(1B) — NPS self
  const nps1b = Math.min(50000, profile.deductions.section80CCD1B ?? 0);
  if (nps1b > 0) {
    deductions.push({
      name: 'NPS Self-Contribution',
      section: '80CCD(1B)',
      newActSection: '124(3)',
      claimed: nps1b,
      limit: 50000,
      details: 'Additional NPS contribution (above 80C limit)',
    });
    totalDeductions += nps1b;
  }

  // Step 10: Section 80CCD(2) — Employer NPS
  if (profile.optimizations.employerNPS) {
    let totalNPS = 0;
    for (const job of profile.jobs) {
      if (job.isCurrentJob || profile.jobs.length === 1) {
        totalNPS += calculateEmployerNPS(job, 'old', config);
      }
    }
    if (totalNPS > 0) {
      deductions.push({
        name: 'Employer NPS',
        section: '80CCD(2)',
        newActSection: '124(2)',
        claimed: totalNPS,
        limit: totalNPS,
        details: '10% of Basic (private sector old regime limit)',
      });
      totalDeductions += totalNPS;
    }
  }

  // Step 11: Section 80D — Health insurance
  const isSenior = profile.age >= 60;
  const selfLimit = isSenior ? 50000 : 25000;
  const parentsLimit = profile.deductions.section80D?.parentsAreSenior ? 50000 : 25000;
  const selfClaimed = Math.min(
    selfLimit,
    (profile.deductions.section80D?.selfPremium ?? 0) +
    Math.min(5000, profile.deductions.section80D?.preventiveCheckup ?? 0)
  );
  const parentsClaimed = Math.min(parentsLimit, profile.deductions.section80D?.parentsPremium ?? 0);
  const total80D = selfClaimed + parentsClaimed;
  if (total80D > 0) {
    deductions.push({
      name: 'Health Insurance',
      section: '80D',
      newActSection: '126',
      claimed: total80D,
      limit: selfLimit + parentsLimit,
      details: `Self ${isSenior ? '(Senior)' : ''} ₹${selfClaimed.toLocaleString('en-IN')} + Parents ₹${parentsClaimed.toLocaleString('en-IN')}`,
    });
    totalDeductions += total80D;
  }

  // Step 12: Section 24(b) — Home loan interest
  const homeLoanInterest = Math.min(200000, profile.deductions.section24B ?? 0);
  if (homeLoanInterest > 0) {
    deductions.push({
      name: 'Home Loan Interest',
      section: '24(b)',
      newActSection: '(mapped)',
      claimed: homeLoanInterest,
      limit: 200000,
      details: 'Self-occupied property interest',
    });
    totalDeductions += homeLoanInterest;
  }

  // Step 13: Section 80TTA / 80TTB — Interest income
  if (isSenior) {
    const interest80TTB = Math.min(50000, profile.deductions.section80TTA ?? 0);
    if (interest80TTB > 0) {
      deductions.push({
        name: 'Interest Income (Senior)',
        section: '80TTB',
        newActSection: '(mapped)',
        claimed: interest80TTB,
        limit: 50000,
        details: 'Interest from savings & deposits (Sec 80TTB)',
      });
      totalDeductions += interest80TTB;
    }
  } else {
    const savings80TTA = Math.min(10000, profile.deductions.section80TTA ?? 0);
    if (savings80TTA > 0) {
      deductions.push({
        name: 'Savings Interest',
        section: '80TTA',
        newActSection: '(mapped)',
        claimed: savings80TTA,
        limit: 10000,
        details: 'Interest from savings accounts (Sec 80TTA)',
      });
      totalDeductions += savings80TTA;
    }
  }

  // Step 13.5: Section 16(iii) — Professional Tax
  const ptax = Math.min(2500, profile.deductions.professionalTax ?? 0);
  if (ptax > 0) {
    deductions.push({
      name: 'Professional Tax',
      section: '16(iii)',
      newActSection: '(mapped)',
      claimed: ptax,
      limit: 2500,
      details: 'State professional tax paid',
    });
    totalDeductions += ptax;
  }

  // Step 14: Taxable income
  const netTaxableIncome = Math.max(0, grossTaxableIncome - totalDeductions);

  // Step 15: Slab tax
  const slabBreakdown = calculateSlabTax(netTaxableIncome, regime.slabs);
  const taxFromSlabs = slabBreakdown.reduce((sum, s) => sum + s.taxOnSlab, 0);

  // Step 16: Rebate, surcharge, cess
  const rebate = calculateRebate(
    taxFromSlabs,
    netTaxableIncome,
    regime.rebate.incomeLimit,
    regime.rebate.maxRebate
  );
  const marginalRelief = calculateMarginalRelief(
    netTaxableIncome,
    taxFromSlabs - rebate,
    regime.rebate.incomeLimit
  );
  const taxAfterRebate = Math.max(0, taxFromSlabs - rebate - marginalRelief);
  const surcharge = calculateSurcharge(taxAfterRebate, netTaxableIncome, regime.surchargeSlabs);
  const cess = calculateCess(taxAfterRebate + surcharge, regime.cessRate);

  // Step 17: Total tax
  const totalTax = roundToNearest10(taxAfterRebate + surcharge + cess);

  const totalEmployeePF = calculateTotalEmployeePF(profile.jobs);
  const annualTakeHome = grossSalary - totalTax - totalEmployeePF;

  return {
    regime: 'old',
    regimeName: regime.name,
    grossSalary,
    exemptions,
    totalExemptions,
    grossTaxableIncome,
    deductions,
    totalDeductions,
    netTaxableIncome,
    slabBreakdown,
    taxBeforeRebate: taxFromSlabs,
    rebate,
    marginalRelief,
    taxAfterRebate,
    surcharge,
    cess,
    totalTax,
    effectiveTaxRate: grossSalary > 0 ? totalTax / grossSalary : 0,
    monthlyTDS: Math.round(totalTax / 12),
    annualTakeHome,
    monthlyTakeHome: Math.round(annualTakeHome / 12),
  };
}

// ============================================================
// COMPARISON & INTELLIGENCE
// ============================================================

/** Compare both regimes and determine the winner */
export function compareRegimes(
  profile: UserProfile,
  config: TaxConfig
): RegimeComparison {
  const newResult = calculateNewRegimeTax(profile, config);
  const oldResult = calculateOldRegimeTax(profile, config);

  const winner = newResult.totalTax <= oldResult.totalTax ? 'new' : 'old';
  const savings = Math.abs(newResult.totalTax - oldResult.totalTax);
  const loserTax = winner === 'new' ? oldResult.totalTax : newResult.totalTax;
  const savingsPercent = loserTax > 0 ? savings / loserTax : 0;

  let explanation: string;
  if (winner === 'new') {
    explanation = `New Regime saves you ₹${savings.toLocaleString('en-IN')} per year. ` +
      `The wider slab structure (you hit 30% only above ₹24L vs ₹10L in old regime) ` +
      `outweighs the deductions available under old regime at your income level.`;
  } else {
    explanation = `Old Regime saves you ₹${savings.toLocaleString('en-IN')} per year. ` +
      `Your deductions (₹${oldResult.totalDeductions.toLocaleString('en-IN')}) are large enough ` +
      `to overcome the old regime's steeper slab structure.`;
  }

  return { newRegime: newResult, oldRegime: oldResult, winner, savings, savingsPercent, explanation };
}

/**
 * Find the breakeven point where old regime becomes better/worse.
 * Uses binary search on the specified parameter.
 */
export function findBreakeven(
  profile: UserProfile,
  config: TaxConfig,
  parameter: BreakevenParameter
): number {
  let low: number;
  let high: number;

  switch (parameter) {
    case 'rent':
      low = 0;
      high = 200000; // ₹2L/month max
      break;
    case 'salary':
      low = 500000;
      high = 10000000; // ₹1Cr
      break;
    case 'homeLoan':
      low = 0;
      high = 200000; // ₹2L (Section 24b limit)
      break;
  }

  // Binary search for crossover point
  for (let i = 0; i < 30; i++) {
    const mid = Math.round((low + high) / 2);
    const testProfile = applyParameterChange(profile, parameter, mid);
    const comparison = compareRegimes(testProfile, config);

    if (comparison.winner === 'new') {
      // Old regime hasn't won yet — increase the parameter
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

/** Apply a parameter change to create a modified profile for simulation */
function applyParameterChange(
  profile: UserProfile,
  parameter: BreakevenParameter,
  value: number
): UserProfile {
  const modified = structuredClone(profile);

  switch (parameter) {
    case 'rent':
      modified.monthlyRent = value;
      break;
    case 'salary': {
      // Scale all components proportionally
      const currentGross = modified.jobs.reduce((sum, job) => {
        const c = job.components;
        return sum + c.basic + c.hra + c.lta + c.specialAllowance +
          c.fuelMaintenance + c.flexiBasket + c.managementAllowance + c.otherAllowances;
      }, 0);
      if (currentGross > 0) {
        const ratio = value / currentGross;
        for (const job of modified.jobs) {
          const c = job.components;
          c.basic = Math.round(c.basic * ratio);
          c.hra = Math.round(c.hra * ratio);
          c.lta = Math.round(c.lta * ratio);
          c.specialAllowance = Math.round(c.specialAllowance * ratio);
          c.fuelMaintenance = Math.round(c.fuelMaintenance * ratio);
          c.flexiBasket = Math.round(c.flexiBasket * ratio);
          c.managementAllowance = Math.round(c.managementAllowance * ratio);
          c.otherAllowances = Math.round(c.otherAllowances * ratio);
          job.variablePay = Math.round((job.variablePay ?? 0) * ratio);
          job.employerPF = Math.round((job.employerPF ?? 0) * ratio);
        }
      }
      break;
    }
    case 'homeLoan':
      modified.deductions.section24B = value;
      break;
  }

  return modified;
}

/**
 * Get optimization suggestions based on current profile.
 * Analyzes what the user could do to save more tax.
 */
export function getOptimizationSuggestions(
  profile: UserProfile,
  config: TaxConfig
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const comparison = compareRegimes(profile, config);

  // Check if employer NPS is enabled
  if (!profile.optimizations.employerNPS) {
    // Calculate potential savings with NPS
    const withNPS = structuredClone(profile);
    withNPS.optimizations.employerNPS = true;
    const withNPSComparison = compareRegimes(withNPS, config);

    const currentBestTax = Math.min(comparison.newRegime.totalTax, comparison.oldRegime.totalTax);
    const withNPSBestTax = Math.min(withNPSComparison.newRegime.totalTax, withNPSComparison.oldRegime.totalTax);
    const saving = currentBestTax - withNPSBestTax;

    if (saving > 0) {
      suggestions.push({
        id: 'employer-nps',
        title: 'Enable Employer NPS Contribution',
        description: `Ask HR to restructure part of your Special Allowance into NPS (Section 124(2)). ` +
          `This is cost-neutral to your employer — it just moves money between CTC buckets.`,
        potentialSaving: saving,
        regime: 'both',
        actionRequired: 'Contact HR/Payroll to restructure CTC',
        priority: 'high',
      });
    }
  }

  // Check meal vouchers
  if (!profile.optimizations.mealVouchers) {
    const withMeals = structuredClone(profile);
    withMeals.optimizations.mealVouchers = true;
    const withMealsComparison = compareRegimes(withMeals, config);

    const currentBestTax = Math.min(comparison.newRegime.totalTax, comparison.oldRegime.totalTax);
    const withMealsBestTax = Math.min(withMealsComparison.newRegime.totalTax, withMealsComparison.oldRegime.totalTax);
    const saving = currentBestTax - withMealsBestTax;

    if (saving > 0) {
      suggestions.push({
        id: 'meal-vouchers',
        title: 'Opt for Meal Vouchers/Food Card',
        description: `₹${config.mealVoucherPerMealLimit}/meal tax-free (both regimes). ` +
          `Ask HR if they offer Sodexo/Zeta/Zaggle meal cards.`,
        potentialSaving: saving,
        regime: 'both',
        actionRequired: 'Ask HR about meal card facility',
        priority: 'high',
      });
    }
  }

  return suggestions;
}

/**
 * Simulate a scenario by applying partial changes to the profile.
 */
export function simulateScenario(
  profile: UserProfile,
  config: TaxConfig,
  changes: Partial<UserProfile>
): RegimeComparison {
  const modified = { ...structuredClone(profile), ...changes };
  return compareRegimes(modified, config);
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/** Round to nearest ₹10 per Section 288B */
function roundToNearest10(amount: number): number {
  return Math.round(amount / 10) * 10;
}

/** Format job period for display: "August – March" */
function formatJobPeriod(job: JobProfile): string {
  const months = [
    'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November',
    'December', 'January', 'February', 'March',
  ];
  return `${months[job.startMonth - 1]} – ${months[job.endMonth - 1]}`;
}
