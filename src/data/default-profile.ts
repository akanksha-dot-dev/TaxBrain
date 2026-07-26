/**
 * TaxBrain — Sample Profiles
 *
 * Pre-built profiles for users to explore TaxBrain before entering
 * their own data. Covers common scenarios across salary ranges.
 *
 * All monetary values are annual whole rupees (integers).
 */

import type { UserProfile } from '../lib/types';

// ============================================================
// EMPTY PROFILE (used when no saved profile exists)
// ============================================================

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  age: 25,
  gender: 'male',
  maritalStatus: 'single',
  city: '',
  isMetroCity: false,
  monthlyRent: 0,

  jobs: [],

  deductions: {
    section80C: {
      epf: 0, ppf: 0, elss: 0, lifeInsurance: 0, nsc: 0,
      taxSavingFD: 0, tuitionFees: 0, homeLoanPrincipal: 0,
      stampDuty: 0, other: 0,
    },
    section80CCD1B: 0,
    section80CCD2: { enabled: false, percentage: 14 },
    section80D: {
      selfPremium: 0, parentsPremium: 0,
      parentsAreSenior: false, preventiveCheckup: 0,
    },
    section24B: 0,
    section80TTA: 0,
    professionalTax: 0,
  },

  optimizations: {
    employerNPS: false,
    mealVouchers: false,
    phoneReimbursement: false,
    monthlyPhoneAmount: 0,
    ltaClaimed: false,
    ltaAmount: 0,
  },

  lifeEvents: {
    planningMarriage: false,
    marriageTimeline: 0,
    planningHouse: false,
    estimatedHomeLoan: 0,
    estimatedEMI: 0,
    expectedSalaryHike: 10,
  },

  financialYear: '2026-27',
  lastUpdated: new Date().toISOString(),
  version: 1,
};

// ============================================================
// SAMPLE PROFILES
// ============================================================

export interface SampleProfile {
  id: string;
  label: string;
  description: string;
  emoji: string;
  ctc: string;
  profile: UserProfile;
}

/** Fresh graduate — simple single-employer, low salary */
const freshGraduate: UserProfile = {
  ...EMPTY_PROFILE,
  name: 'Priya',
  age: 23,
  gender: 'female',
  city: 'Bangalore',
  isMetroCity: false, // Bangalore is NOT metro for HRA
  monthlyRent: 12000,

  jobs: [{
    id: 'job1',
    employer: 'IT Company',
    startMonth: 1,
    endMonth: 12,
    components: {
      basic: 300000,        // ₹25,000/month
      hra: 150000,          // 50% of Basic
      specialAllowance: 250000,
      lta: 0,
      fuelMaintenance: 0,
      flexiBasket: 0,
      managementAllowance: 0,
      otherAllowances: 0,
    },
    variablePay: 50000,
    variablePayPercent: 80,
    employerPF: 36000,      // 12% of Basic
    isCurrentJob: true,
  }],

  deductions: {
    ...EMPTY_PROFILE.deductions,
    section80D: {
      selfPremium: 8000,
      parentsPremium: 0,
      parentsAreSenior: false,
      preventiveCheckup: 0,
    },
    section80TTA: 5000,
  },

  financialYear: '2026-27',
};

/** Mid-career — single employer, moderate salary, home loan */
const midCareer: UserProfile = {
  ...EMPTY_PROFILE,
  name: 'Rahul',
  age: 30,
  gender: 'male',
  maritalStatus: 'married',
  city: 'Pune',
  isMetroCity: false,
  monthlyRent: 0, // Owns home

  jobs: [{
    id: 'job1',
    employer: 'Software MNC',
    startMonth: 1,
    endMonth: 12,
    components: {
      basic: 600000,        // ₹50,000/month
      hra: 300000,          // 50% of Basic
      specialAllowance: 400000,
      lta: 60000,
      fuelMaintenance: 0,
      flexiBasket: 0,
      managementAllowance: 0,
      otherAllowances: 0,
    },
    variablePay: 140000,
    variablePayPercent: 100,
    employerPF: 72000,
    isCurrentJob: true,
  }],

  deductions: {
    ...EMPTY_PROFILE.deductions,
    section80C: {
      epf: 0, ppf: 50000, elss: 0, lifeInsurance: 25000,
      nsc: 0, taxSavingFD: 0, tuitionFees: 0,
      homeLoanPrincipal: 0, stampDuty: 0, other: 0,
    },
    section80CCD1B: 50000,
    section80CCD2: { enabled: true, percentage: 10 },
    section80D: {
      selfPremium: 25000,
      parentsPremium: 25000,
      parentsAreSenior: false,
      preventiveCheckup: 5000,
    },
    section24B: 200000,
    section80TTA: 10000,
  },

  optimizations: {
    employerNPS: true,
    mealVouchers: false,
    phoneReimbursement: false,
    monthlyPhoneAmount: 0,
    ltaClaimed: true,
    ltaAmount: 50000,
  },

  lifeEvents: {
    ...EMPTY_PROFILE.lifeEvents,
    planningHouse: false,
    estimatedHomeLoan: 4000000,
    estimatedEMI: 35000,
    expectedSalaryHike: 12,
  },

  financialYear: '2026-27',
};

/** Job switcher — mid-year change, two employers */
const jobSwitcher: UserProfile = {
  ...EMPTY_PROFILE,
  name: 'Sneha',
  age: 27,
  gender: 'female',
  city: 'Gurugram',
  isMetroCity: false,
  monthlyRent: 18000,

  jobs: [
    {
      id: 'job1',
      employer: 'Previous Company',
      startMonth: 1,
      endMonth: 5,
      components: {
        basic: 900000,       // ₹75,000/month annualized
        hra: 450000,
        specialAllowance: 450000,
        lta: 0,
        fuelMaintenance: 0,
        flexiBasket: 0,
        managementAllowance: 0,
        otherAllowances: 0,
      },
      variablePay: 180000,
      variablePayPercent: 100,
      employerPF: 108000,
      isCurrentJob: false,
    },
    {
      id: 'job2',
      employer: 'New Company',
      startMonth: 6,
      endMonth: 12,
      components: {
        basic: 1200000,      // ₹1,00,000/month annualized
        hra: 600000,
        specialAllowance: 600000,
        lta: 144000,
        fuelMaintenance: 0,
        flexiBasket: 0,
        managementAllowance: 0,
        otherAllowances: 0,
      },
      variablePay: 308571,
      variablePayPercent: 50,
      employerPF: 144000,
      isCurrentJob: true,
    },
  ],

  deductions: {
    ...EMPTY_PROFILE.deductions,
    section80CCD2: { enabled: true, percentage: 14 },
    section80D: {
      selfPremium: 15000,
      parentsPremium: 25000,
      parentsAreSenior: false,
      preventiveCheckup: 0,
    },
    section80TTA: 8000,
  },

  optimizations: {
    employerNPS: true,
    mealVouchers: true,
    phoneReimbursement: true,
    monthlyPhoneAmount: 1500,
    ltaClaimed: false,
    ltaAmount: 0,
  },

  financialYear: '2026-27',
};

/** Senior professional — high salary, married, children */
const seniorPro: UserProfile = {
  ...EMPTY_PROFILE,
  name: 'Vikram',
  age: 38,
  gender: 'male',
  maritalStatus: 'married',
  city: 'Mumbai',
  isMetroCity: true,
  monthlyRent: 45000,

  jobs: [{
    id: 'job1',
    employer: 'Consulting Firm',
    startMonth: 1,
    endMonth: 12,
    components: {
      basic: 1500000,
      hra: 750000,
      specialAllowance: 750000,
      lta: 120000,
      fuelMaintenance: 0,
      flexiBasket: 0,
      managementAllowance: 0,
      otherAllowances: 0,
    },
    variablePay: 500000,
    variablePayPercent: 80,
    employerPF: 180000,
    isCurrentJob: true,
  }],

  deductions: {
    ...EMPTY_PROFILE.deductions,
    section80C: {
      epf: 0, ppf: 0, elss: 50000, lifeInsurance: 30000,
      nsc: 0, taxSavingFD: 0, tuitionFees: 80000,
      homeLoanPrincipal: 0, stampDuty: 0, other: 0,
    },
    section80CCD1B: 50000,
    section80CCD2: { enabled: true, percentage: 14 },
    section80D: {
      selfPremium: 25000,
      parentsPremium: 50000,
      parentsAreSenior: true,
      preventiveCheckup: 5000,
    },
    section24B: 200000,
    section80TTA: 10000,
  },

  optimizations: {
    employerNPS: true,
    mealVouchers: true,
    phoneReimbursement: true,
    monthlyPhoneAmount: 2000,
    ltaClaimed: true,
    ltaAmount: 80000,
  },

  financialYear: '2026-27',
};

// ============================================================
// EXPORTS
// ============================================================

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: 'fresh-graduate',
    label: 'Fresh Graduate',
    description: '₹7.5L CTC, single employer, renting in Bangalore',
    emoji: '🎓',
    ctc: '₹7.5L',
    profile: freshGraduate,
  },
  {
    id: 'mid-career',
    label: 'Mid-Career with Home Loan',
    description: '₹15L CTC, home loan, NPS, PPF investments',
    emoji: '🏠',
    ctc: '₹15L',
    profile: midCareer,
  },
  {
    id: 'job-switcher',
    label: 'Job Switcher',
    description: '₹20L CTC, mid-year job change, salary restructuring',
    emoji: '🔄',
    ctc: '₹20L',
    profile: jobSwitcher,
  },
  {
    id: 'senior-pro',
    label: 'Senior Professional',
    description: '₹35L CTC, married, children, home loan, Mumbai',
    emoji: '💼',
    ctc: '₹35L',
    profile: seniorPro,
  },
];
