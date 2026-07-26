# 03 — Architecture Design

## The Central Question: Personal vs Generalized

> "How can this be specific to me at the same time generalized and hosted and can be used by anyone?"

### The Answer: **Configuration-Driven Architecture**

The key insight is to separate **logic** from **data**:

```
┌─────────────────────────────────────────────────┐
│                  TaxBrain                       │
│                                                 │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │  TAX ENGINE   │    │  USER PROFILE        │  │
│  │  (Universal)  │    │  (Personal)          │  │
│  │               │    │                      │  │
│  │  Same for     │    │  YOUR salary data    │  │
│  │  everyone.    │◄───│  YOUR city           │  │
│  │  Tax slabs,   │    │  YOUR deductions     │  │
│  │  rules, math  │    │  YOUR optimizations  │  │
│  └──────────────┘    └──────────────────────┘  │
│         │                      │                │
│         ▼                      ▼                │
│  ┌──────────────────────────────────────────┐  │
│  │         PERSONALIZED OUTPUT              │  │
│  │  "You save ₹1,36,770 with New Regime"    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### How It Works

1. **Tax Engine** = Universal. Handles ANY salary, ANY city, ANY regime, ANY financial year. This is the same for all 1.4 billion Indians.

2. **User Profile** = Personal. Stored in `localStorage`. Contains YOUR specific data: salary components, city, rent, deductions, goals.

3. **Default Profile** = YOUR data (from our analysis) is hardcoded as the default. When someone else visits, they can edit everything. When YOU visit, your numbers are already there.

4. **Export/Import** = Users can export their profile as a JSON file and import it on another device. No cloud, no account, no privacy risk.

---

## Data Model

### Tax Configuration (Universal — `src/lib/tax-rules.ts`)

```typescript
// This is the SINGLE file to update when tax laws change
// Income Tax Act, 2025 (effective April 1, 2026) — section numbers mapped below
// Old section numbers (80C, 80D, etc.) used in UI for familiarity
export interface TaxSlab {
  min: number;
  max: number;  // Infinity for last slab
  rate: number; // 0.05 = 5%
  label: string;
}

export interface RegimeConfig {
  id: 'new' | 'old';
  name: string;
  financialYear: string;
  slabs: TaxSlab[];
  standardDeduction: number;
  rebate87A: { incomeLimit: number; maxRebate: number };
  cess: number;
  surchargeSlabs: { min: number; max: number; rate: number }[];
}

export interface DeductionRule {
  section: string;        // "80C", "80D", etc. (old Act numbers for familiarity)
  newActSection: string;   // "123", "126", etc. (Income Tax Act 2025)
  name: string;
  maxLimit: number;       // ₹ amount or percentage
  isPercentOfBasic: boolean;
  availableInNewRegime: boolean;
  availableInOldRegime: boolean;
  description: string;
  subItems: string[];     // EPF, PPF, ELSS under 80C
}

export interface TaxConfig {
  financialYear: string;
  newRegime: RegimeConfig;
  oldRegime: RegimeConfig;
  deductions: DeductionRule[];
  metroCities: string[];
  mealVoucherLimit: number;  // per meal (₹200 from April 2026)
  employerNPSLimit: { newRegime: number; oldRegimePrivate: number }; // 14% / 10%
  employerPFESICLimit: number; // aggregate cap ₹7.5L
  ltaBlockPeriod: { start: number; end: number; maxJourneys: number }; // 2026-2029, 2
  fuelReimbursementRequiresVehicle: boolean; // true — no car = fully taxable
}
```

### User Profile (Personal — `localStorage`)

```typescript
export interface SalaryComponent {
  name: string;
  annual: number;
  monthly: number;
}

export interface JobProfile {
  id: string;
  employer: string;
  startMonth: number;  // 1=April (start of FY)
  endMonth: number;    // 12=March (end of FY)
  components: {
    basic: number;
    hra: number;
    lta: number;
    specialAllowance: number;
    fuelMaintenance: number;
    flexiBasket: number;
    managementAllowance: number;
    otherAllowances: number;
  };
  variablePay: number;
  variablePayPercent: number;  // % expected to receive
  employerPF: number;
  isCurrentJob: boolean;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married';
  city: string;
  isMetroCity: boolean;
  monthlyRent: number;
  
  // Jobs in current FY (supports multiple for job switches)
  jobs: JobProfile[];
  
  // Deductions & Investments
  deductions: {
    section80C: {
      epf: number;        // auto-calculated from salary
      ppf: number;
      elss: number;
      lifeInsurance: number;
      nsc: number;
      taxSavingFD: number;
      tuitionFees: number;
      homeLoanPrincipal: number;
      other: number;
    };
    section80CCD1B: number;  // NPS self-contribution
    section80CCD2: {
      enabled: boolean;
      percentage: number;    // 10% or 14%
    };
    section80D: {
      selfPremium: number;
      parentsPremium: number;
      parentsAreSenior: boolean;
      preventiveCheckup: number;
    };
    section24B: number;      // Home loan interest
    section80TTA: number;    // Savings interest
  };
  
  // Optimization toggles
  optimizations: {
    employerNPS: boolean;
    mealVouchers: boolean;
    phoneReimbursement: boolean;
    monthlyPhoneAmount: number;
    ltaClaimed: boolean;
    ltaAmount: number;
  };
  
  // Life events for simulator
  lifeEvents: {
    planningMarriage: boolean;
    marriageTimeline: number;  // months from now
    planningHouse: boolean;
    estimatedHomeLoan: number;
    estimatedEMI: number;
    expectedSalaryHike: number; // percentage
  };
  
  // Metadata
  financialYear: string;
  lastUpdated: string;
  version: number;
}
```

---

## Component Architecture (Astro + React Islands)

```
src/
├── pages/                        # Astro pages (static HTML)
│   ├── index.astro               # Dashboard page
│   ├── calculator.astro          # Calculator page  
│   ├── simulator.astro           # Simulator page
│   ├── knowledge/                # Knowledge base pages
│   │   ├── index.astro           # Knowledge hub
│   │   ├── [slug].astro          # Dynamic article pages from content
│   └── actions.astro             # Action checklist page
│
├── components/                   # Shared components
│   ├── Layout.astro              # Base layout (nav + main)
│   ├── Sidebar.astro             # Navigation sidebar (static)
│   ├── islands/                  # React islands (interactive)
│   │   ├── Dashboard.tsx         # Dashboard with animated stats
│   │   ├── Calculator.tsx        # Full tax calculator
│   │   ├── RegimeComparison.tsx  # Side-by-side visual comparison
│   │   ├── Simulator.tsx         # Scenario simulator with sliders
│   │   ├── BreakevenChart.tsx    # Canvas chart for break-even
│   │   ├── ActionChecklist.tsx   # Interactive checklist
│   │   └── ProfileEditor.tsx     # Edit your salary/profile
│   └── ui/                      # Shared React UI components
│       ├── Card.tsx
│       ├── Slider.tsx
│       ├── Toggle.tsx
│       ├── CurrencyInput.tsx
│       └── AnimatedNumber.tsx
│
├── lib/                          # Core logic (framework-agnostic)
│   ├── tax-engine.ts             # ALL tax calculations
│   ├── tax-rules.ts              # Tax slab/deduction data
│   ├── profile-store.ts          # localStorage manager
│   ├── formatters.ts             # Currency formatting, etc.
│   └── types.ts                  # TypeScript interfaces
│
├── content/                      # Markdown article source files
│   └── knowledge/                # Knowledge base articles
│       ├── section-80c.md
│       ├── section-80d.md
│       ├── hra-explained.md
│       ├── nps-benefits.md
│       ├── old-vs-new-regime.md
│       ├── salary-restructuring.md
│       ├── first-time-taxpayer.md
│       └── ...
│
├── styles/
│   └── global.css                # All styles (vanilla CSS)
│
└── data/
    └── default-profile.ts        # YOUR default profile data
```

---

## How Personalization + Generalization Coexist

### Flow for YOU (the creator):
1. Open TaxBrain → Default profile loads with YOUR salary data
2. Dashboard shows YOUR tax situation immediately
3. Everything is pre-filled, optimized, personalized

### Flow for ANY NEW USER:
1. Open TaxBrain → Sees the demo/default data
2. Clicks "Edit Profile" → Enters their own salary details
3. Profile saved to THEIR browser's localStorage
4. From now on, TaxBrain shows THEIR personalized data
5. They can export their profile as JSON for backup

### Flow for SHARING:
1. You host TaxBrain on Cloudflare Pages → `tax.akanksha.dev`
2. Share the URL with anyone
3. They see the default data, then customize for themselves
4. Their data never leaves their browser

---

## Agent-Parsability Design

### Why AI agents love this architecture:

1. **Clear directory convention** — `lib/` for logic, `components/` for UI, `content/` for articles. Any agent knows where to look.

2. **Single source of truth for tax rules** — `tax-rules.ts` contains ALL tax data. Agent prompt: "Update tax slabs for FY 2027-28" → agent edits ONE file.

3. **TypeScript interfaces** — All data shapes are explicitly typed. An agent can read `types.ts` and understand every data structure instantly.

4. **Astro's `.astro` files** — Essentially HTML with frontmatter. Even agents unfamiliar with Astro can modify them.

5. **Content Collections** — Knowledge base articles are Markdown files with typed frontmatter. Adding an article = adding a `.md` file. Zero code changes needed.

6. **Tax engine is pure functions** — No side effects, no state, no framework dependency. `calculateTax(income, regime)` → number. Any agent can test and modify these functions.

---

## Privacy & Security Architecture

```
┌────────────────────────────────────┐
│           USER'S BROWSER           │
│                                    │
│  ┌──────────────┐                 │
│  │  localStorage │ ← Profile data │
│  └──────────────┘                 │
│         │                          │
│         ▼                          │
│  ┌──────────────┐                 │
│  │  TaxBrain App │ ← All logic    │
│  │  (Static JS)  │   runs HERE    │
│  └──────────────┘                 │
│                                    │
│  ❌ NO data sent to any server    │
│  ❌ NO cookies, NO tracking       │
│  ❌ NO user accounts              │
│  ✅ User owns ALL their data      │
│  ✅ Export as JSON anytime         │
│  ✅ Works offline after first load │
└────────────────────────────────────┘
```

**No backend. No database. No analytics. No tracking. Zero privacy risk.**
