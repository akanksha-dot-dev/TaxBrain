# 05 — Implementation Plan

## Build Phases

### Phase 1: Foundation (Core MVP)
> **Goal**: Working calculator + dashboard with your personal data

| Step | Task | Files | Est. Effort |
|---|---|---|---|
| 1.1 | Initialize Astro project with React integration | `astro.config.mjs`, `package.json`, `tsconfig.json` | 15 min |
| 1.2 | Create TypeScript types and interfaces | `src/lib/types.ts` | 30 min |
| 1.3 | Build tax rules data file (FY 2026-27) | `src/lib/tax-rules.ts` | 45 min |
| 1.4 | Build core tax engine (all calculation functions) | `src/lib/tax-engine.ts` | 2 hrs |
| 1.5 | Build profile store (localStorage manager) | `src/lib/profile-store.ts` | 30 min |
| 1.6 | Build utility functions (formatters, helpers) | `src/lib/formatters.ts` | 20 min |
| 1.7 | Create default profile with YOUR data | `src/data/default-profile.ts` | 30 min |
| 1.8 | Design global CSS (dark theme, design system) | `src/styles/global.css` | 1.5 hrs |
| 1.9 | Build Layout + Sidebar components | `src/components/Layout.astro`, `Sidebar.astro` | 45 min |
| 1.10 | Build Calculator island (React) | `src/components/islands/Calculator.tsx` | 3 hrs |
| 1.11 | Build Dashboard island (React) | `src/components/islands/Dashboard.tsx` | 2 hrs |
| 1.12 | Create Astro pages for dashboard + calculator | `src/pages/index.astro`, `calculator.astro` | 30 min |
| 1.13 | Test all calculations against known values | Manual verification | 1 hr |

**Phase 1 Total**: ~13 hours

---

### Phase 2: Intelligence Layer
> **Goal**: Scenario simulator + action tracker

| Step | Task | Files |
|---|---|---|
| 2.1 | Build Simulator island with sliders | `src/components/islands/Simulator.tsx` |
| 2.2 | Build break-even chart (Canvas/SVG) | `src/components/islands/BreakevenChart.tsx` |
| 2.3 | Build Action Checklist island | `src/components/islands/ActionChecklist.tsx` |
| 2.4 | Create simulator + actions pages | `src/pages/simulator.astro`, `actions.astro` |
| 2.5 | Build Profile Editor island | `src/components/islands/ProfileEditor.tsx` |

---

### Phase 3: Knowledge & Polish
> **Goal**: Knowledge base + PWA + deployment

| Step | Task | Files |
|---|---|---|
| 3.1 | Set up Content Layer API for knowledge base | `src/content.config.ts` |
| 3.2 | Write all knowledge base articles (Markdown) | `src/content/knowledge/*.md` |
| 3.3 | Build knowledge hub + article layout | `src/pages/knowledge/` |
| 3.4 | Add search functionality | Component + search logic |
| 3.5 | Add PWA manifest + service worker | `public/manifest.json` |
| 3.6 | Deploy to Cloudflare Pages | Cloudflare config |
| 3.7 | Final polish: animations, responsive, testing | Throughout |

---

## File-by-File Specification

### `src/lib/tax-engine.ts` — The Brain

This is the most critical file. All tax logic lives here. It must be:
- **Pure functions** — No side effects, no state, no DOM access
- **Framework-agnostic** — Can be extracted and used in any JS/TS project
- **Fully typed** — TypeScript interfaces for all inputs/outputs
- **Testable** — Each function can be unit tested independently

```typescript
// Public API surface:

// Core calculations
calculateSlabTax(income: number, slabs: TaxSlab[]): SlabBreakdown[]
calculateCess(tax: number, cessRate: number): number
calculateSurcharge(tax: number, income: number, surchargeSlabs: SurchargeRule[]): number
calculateRebate87A(tax: number, taxableIncome: number, rebateConfig: Rebate87AConfig): number
calculateMarginalRelief(income: number, tax: number, threshold: number): number

// HRA
calculateHRAExemption(params: {
  basic: number;
  hra: number;
  monthlyRent: number;
  months: number;
  isMetro: boolean;
}): HRABreakdown

// Full regime calculations
calculateNewRegimeTax(profile: UserProfile, config: TaxConfig): TaxResult
calculateOldRegimeTax(profile: UserProfile, config: TaxConfig): TaxResult

// Comparison & intelligence
compareRegimes(profile: UserProfile, config: TaxConfig): RegimeComparison
findBreakeven(profile: UserProfile, config: TaxConfig, parameter: 'rent' | 'salary' | 'homeLoan'): number
getOptimizationSuggestions(profile: UserProfile, config: TaxConfig): Suggestion[]

// Scenario simulation
simulateScenario(profile: UserProfile, config: TaxConfig, changes: Partial<UserProfile>): RegimeComparison

// Result types
interface TaxResult {
  grossSalary: number;
  exemptions: ExemptionItem[];
  totalExemptions: number;
  grossTaxableIncome: number;
  deductions: DeductionItem[];
  totalDeductions: number;
  netTaxableIncome: number;
  slabBreakdown: SlabBreakdown[];
  taxBeforeRebate: number;
  rebate: number;
  marginalRelief: number;
  taxAfterRebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveTaxRate: number;
  monthlyTDS: number;
  monthlyTakeHome: number;
}

interface RegimeComparison {
  newRegime: TaxResult;
  oldRegime: TaxResult;
  winner: 'new' | 'old';
  savings: number;
  savingsPercent: number;
  explanation: string;  // Human-readable "Why X regime is better for you"
}
```

### `src/lib/tax-rules.ts` — The Single Source of Truth

```typescript
// Contains ALL tax rules for the current FY
// WHEN TAX LAWS CHANGE: Update ONLY this file

export const TAX_CONFIG_2026_27: TaxConfig = {
  financialYear: "2026-27",
  newRegime: {
    id: 'new',
    name: 'New Tax Regime',
    slabs: [
      { min: 0, max: 400000, rate: 0, label: "Up to ₹4L" },
      { min: 400001, max: 800000, rate: 0.05, label: "₹4L – ₹8L" },
      { min: 800001, max: 1200000, rate: 0.10, label: "₹8L – ₹12L" },
      { min: 1200001, max: 1600000, rate: 0.15, label: "₹12L – ₹16L" },
      { min: 1600001, max: 2000000, rate: 0.20, label: "₹16L – ₹20L" },
      { min: 2000001, max: 2400000, rate: 0.25, label: "₹20L – ₹24L" },
      { min: 2400001, max: Infinity, rate: 0.30, label: "Above ₹24L" }
    ],
    standardDeduction: 75000,
    rebate87A: { incomeLimit: 1200000, maxRebate: 60000 },
    cess: 0.04,
    surchargeSlabs: [
      { min: 5000001, max: 10000000, rate: 0.10 },
      { min: 10000001, max: 20000000, rate: 0.15 },
      { min: 20000001, max: Infinity, rate: 0.25 }
    ]
  },
  oldRegime: {
    id: 'old',
    name: 'Old Tax Regime',
    slabs: [
      { min: 0, max: 250000, rate: 0, label: "Up to ₹2.5L" },
      { min: 250001, max: 500000, rate: 0.05, label: "₹2.5L – ₹5L" },
      { min: 500001, max: 1000000, rate: 0.20, label: "₹5L – ₹10L" },
      { min: 1000001, max: Infinity, rate: 0.30, label: "Above ₹10L" }
    ],
    standardDeduction: 50000,
    rebate87A: { incomeLimit: 500000, maxRebate: 12500 },
    cess: 0.04,
    surchargeSlabs: [
      { min: 5000001, max: 10000000, rate: 0.10 },
      { min: 10000001, max: 20000000, rate: 0.15 },
      { min: 20000001, max: 50000000, rate: 0.25 },
      { min: 50000001, max: Infinity, rate: 0.37 }
    ]
  },
  metroCities: ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Pune", "Ahmedabad"],
  mealVoucherPerMealLimit: 200,
  employerNPSMaxPercent: 14,
  employerAggregateContributionCap: 750000,
  deductions: [/* ... all 80C/80D/80CCD/24B rules ... */]
};
```

---

## Verification Strategy

### Automated Verification
```bash
# Type checking
npx tsc --noEmit

# Build verification
npm run build

# Dev server
npm run dev
```

### Manual Calculation Verification

The tax engine MUST produce these exact results for the default profile:

| Scenario | Expected New Regime Tax | Expected Old Regime Tax |
|---|---|---|
| FY 2026-27, Combined (both jobs), No optimization | ₹1,76,010 | ₹2,52,240 |
| FY 2026-27, Combined, With NPS + Meal Vouchers | ₹1,37,520 | — |
| FY 2027-28, Full year new job, With NPS + Meal Vouchers | ₹1,99,140 | ₹3,30,220 |

### Browser Testing
- Chrome (latest), Firefox, Safari, Mobile Chrome
- Test localStorage persistence (save → refresh → data preserved)
- Test responsive layout at 375px (mobile), 768px (tablet), 1440px (desktop)

---

## Project Initialization Commands

```bash
# Navigate to project directory
cd d:\temp\tax_saving

# Create Astro project (installs latest version)
npm create astro@latest ./ -- --template minimal --install --git

# Add React integration
npx astro add react

# Install any additional dependencies
npm install

# Start dev server
npm run dev
```

### Astro Configuration for Cloudflare Pages

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',  // Pure static output — no SSR, no Workers overhead
  site: 'https://tax.akanksha.dev',
  integrations: [react()],
  build: {
    assets: '_assets',  // Clean asset directory
  },
});
```

### Deployment to Cloudflare Pages

```bash
# Option 1: Via Cloudflare Dashboard (Recommended for first setup)
# 1. Push code to GitHub
# 2. In Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
# 3. Select repo, set:
#    - Framework preset: Astro
#    - Build command: npm run build
#    - Build output directory: dist
# 4. Deploy — auto-deploys on every push

# Option 2: Via Wrangler CLI
npx wrangler pages deploy dist --project-name=taxbrain
```

### Custom Domain Setup

```bash
# In Cloudflare Dashboard:
# 1. Pages project → Custom domains → Set up custom domain
# 2. Enter: tax.akanksha.dev
# 3. Cloudflare auto-creates the CNAME record (since DNS is on Cloudflare)
# 4. SSL certificate issued automatically within minutes
```

---

## Key Implementation Rules

1. **Tax engine MUST be framework-agnostic** — `tax-engine.ts` must NOT import React, Astro, or any framework code. It receives data and returns results. Period.

2. **All tax numbers in whole rupees internally** — Store amounts as integers (rupees). Use `Math.round()` for percentage calculations. Indian tax law rounds to nearest ₹10 (Section 288B) — paise add complexity for zero benefit.

3. **Currency inputs MUST handle Indian formatting** — ₹12,34,567 (not ₹1,234,567). Use Intl.NumberFormat('en-IN').

4. **Every calculation step must be visible** — Users should be able to see HOW the tax was calculated, not just the final number. This builds trust and understanding.

5. **Default profile = YOUR data** — The app should show meaningful, realistic data by default, not zeros or dummy values.

6. **Content Collection articles must link to calculator** — When explaining HRA, include a link/button: "Calculate YOUR HRA exemption →"

7. **Mobile sidebar becomes bottom navigation** — The 5 nav items become a bottom tab bar on mobile (< 768px).

8. **System font stack** — Use `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Zero network requests, zero CLS. (Per DP-09 performance research.)

9. **Dark mode first, with light mode toggle** — 82-83% of consumers use dark mode. Token-based design system, not CSS `invert()`. (Per DP-05 design research.)

10. **WCAG AA accessibility** — Every color pair verified against contrast formula. Visible focus states. `prefers-reduced-motion` support. (Per DP-11 accessibility research.)
