/**
 * TaxBrain — Dynamic Action Item Generator
 *
 * Generates personalized tax action items based on the user's profile.
 * Framework-agnostic — no React/Astro imports.
 *
 * Instead of hardcoded items, actions are derived from what the user
 * has and hasn't set up in their profile.
 */

import type { UserProfile, ActionItem, TaxConfig } from './types';

/**
 * Generate personalized action items based on user's profile.
 * Returns items sorted by priority (critical → important → nice).
 */
export function generateActions(
  profile: UserProfile,
  _config: TaxConfig,
): ActionItem[] {
  const actions: ActionItem[] = [];
  const hasMultipleJobs = profile.jobs.length > 1;
  const currentJob = profile.jobs.find(j => j.isCurrentJob) || profile.jobs[profile.jobs.length - 1];

  // ── Job Switch Actions ──
  if (hasMultipleJobs) {
    actions.push({
      id: 'gen-form12b',
      text: 'Submit Form 12B (Form 124) to new employer',
      category: 'day-1',
      priority: 'critical',
      completed: false,
      details: 'Without this, your new employer won\'t account for previous income — leading to under-deduction of TDS and a large tax bill at filing.',
    });

    actions.push({
      id: 'gen-form16',
      text: 'Get Form 16 (Form 130) from previous employer',
      category: 'before-leaving',
      priority: 'critical',
      completed: false,
      details: 'Your salary certificate from the previous employer. Needed for Form 12B submission and ITR filing.',
    });

    actions.push({
      id: 'gen-payslips',
      text: 'Collect all payslips from previous employer',
      category: 'before-leaving',
      priority: 'important',
      completed: false,
      details: 'Download and save payslips for all months at previous employer. Essential backup for income verification.',
    });

    actions.push({
      id: 'gen-epf-transfer',
      text: 'Transfer EPF from previous employer to new account',
      category: 'month-1',
      priority: 'important',
      completed: false,
      details: 'Use the EPFO portal (unifiedportal-mem.epfindia.gov.in) to initiate a transfer. Keeps your PF consolidated.',
    });

    actions.push({
      id: 'gen-verify-tds',
      text: 'Verify first payslip — check TDS reflects combined income',
      category: 'month-1',
      priority: 'important',
      completed: false,
      details: 'After submitting Form 12B, confirm your monthly TDS accounts for income from both employers.',
    });
  }

  // ── Employer NPS ──
  if (!profile.optimizations.employerNPS && currentJob) {
    actions.push({
      id: 'gen-nps',
      text: 'Request employer NPS contribution (14% of Basic)',
      category: hasMultipleJobs ? 'day-1' : 'month-1',
      priority: 'critical',
      completed: false,
      details: 'The single biggest tax saver under New Regime. Ask HR to restructure salary — moves money from taxable Special Allowance to exempt NPS. Zero cost to employer.',
    });
  }

  // ── Meal Vouchers ──
  if (!profile.optimizations.mealVouchers) {
    actions.push({
      id: 'gen-meals',
      text: 'Ask HR about meal voucher / food card benefit',
      category: hasMultipleJobs ? 'day-1' : 'month-1',
      priority: 'critical',
      completed: false,
      details: 'Up to ₹1,05,600/year tax-free (₹200/meal × 2 meals × 22 days × 12 months). Available in BOTH regimes since April 2026.',
    });
  }

  // ── Phone Reimbursement ──
  if (!profile.optimizations.phoneReimbursement) {
    actions.push({
      id: 'gen-phone',
      text: 'Ask HR about telephone/internet reimbursement',
      category: 'month-1',
      priority: 'important',
      completed: false,
      details: 'Reimbursement against actual bills is tax-exempt. Typically ₹1,500–2,000/month. Submit phone and broadband bills.',
    });
  }

  // ── Health Insurance ──
  if (profile.deductions.section80D.selfPremium === 0) {
    actions.push({
      id: 'gen-health',
      text: 'Buy personal health insurance (independent of employer)',
      category: 'month-3',
      priority: 'critical',
      completed: false,
      details: 'Employer group insurance ends the day you leave. A personal policy (₹5-10L sum insured, ~₹15-20K/year) stays with you. Essential financial protection.',
    });
  }

  if (profile.deductions.section80D.parentsPremium === 0) {
    actions.push({
      id: 'gen-parent-health',
      text: 'Buy health insurance for parents',
      category: 'month-3',
      priority: 'important',
      completed: false,
      details: 'Covers parents\' medical expenses. If parents are senior citizens (≥60), you can claim up to ₹50,000 under Section 80D.',
    });
  }

  // ── Rent Documentation ──
  if (profile.monthlyRent > 0) {
    actions.push({
      id: 'gen-rent-agreement',
      text: 'Ensure you have a valid rent agreement',
      category: 'month-1',
      priority: 'important',
      completed: false,
      details: 'Required documentation for HRA exemption claims. Get an 11-month agreement. If rent > ₹1L/year, you need landlord\'s PAN.',
    });
  }

  // ── Regime Declaration ──
  actions.push({
    id: 'gen-regime',
    text: 'Declare your tax regime choice to employer',
    category: hasMultipleJobs ? 'day-1' : 'month-1',
    priority: 'critical',
    completed: false,
    details: 'New Regime is default since FY 2023-24. Explicitly confirm your choice with HR so TDS is calculated correctly.',
  });

  // ── Investment Declarations ──
  actions.push({
    id: 'gen-invest-dec',
    text: 'Submit investment declarations to employer',
    category: 'month-1',
    priority: 'important',
    completed: false,
    details: 'Declare your planned investments (80C, 80D, HRA, etc.) so employer adjusts TDS monthly instead of deducting maximum upfront.',
  });

  // ── Emergency Fund ──
  actions.push({
    id: 'gen-emergency',
    text: 'Build emergency fund (3 months of expenses)',
    category: 'month-3',
    priority: 'important',
    completed: false,
    details: 'Non-negotiable financial safety net before any investments. Keep in a high-interest savings account (6-7%).',
  });

  // ── ITR Filing ──
  actions.push({
    id: 'gen-itr',
    text: 'File ITR by July 31 (mandatory if income > ₹2.5L)',
    category: 'annual',
    priority: 'critical',
    completed: false,
    details: 'Income Tax Return must be filed even if employer deducted correct TDS. Late filing attracts ₹5,000 penalty + interest.',
  });

  // Sort by priority
  const priorityOrder: Record<string, number> = { critical: 0, important: 1, nice: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions;
}
