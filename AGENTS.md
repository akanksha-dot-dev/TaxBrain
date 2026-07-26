# Agent Operating Instructions

> This file is the single entry point for any AI coding agent working on this project.
> Read this FIRST. It tells you what the project is, where everything is, and how to work here.

## Project Identity

- **Name:** TaxBrain
- **URL:** `https://tax.akanksha.dev`
- **Purpose:** Free, open Indian tax intelligence platform for salaried professionals
- **Stack:** Astro 7.x + React 19 Islands + TypeScript + Vanilla CSS + Cloudflare Pages
- **Node.js:** 22+ required
- **Architecture:** 100% client-side. Zero backend. All user data in localStorage. No cookies, no tracking, no accounts.
- **Tax Law:** Income Tax Act, 2025 (effective April 1, 2026). Old section numbers (80C, 80D) used in UI for familiarity; new numbers (123, 126) referenced in code. Mapping in `src/lib/types.ts`.

## One-Command Entry Points

```bash
npm install              # Install dependencies
npm run build            # Build for production (16 pages, ~1s)
npx astro preview        # Preview the built site locally
npx astro check          # Type check all Astro + TS files
npx wrangler pages deploy dist --project-name=taxbrain  # Deploy
```

> **Note:** `npm run dev` uses Astro 7's daemon mode. On Windows in agent environments, the daemon may crash silently. Use `npm run build && npx astro preview` for reliable local testing.

## Context Loading Order

When starting a new session, read these files in this order:

1. **This file** (`AGENTS.md`) — Operating rules, architecture, known issues.
2. **`VISION.md`** — Why this project exists, design principles, competitive positioning.
3. **`docs/plan/05-implementation.md`** — Build phases and file specifications.
4. **`docs/plan/00-master-plan.md`** — Feature roadmap overview.

Only read `docs/plan/01-04` if you need deeper context on market research, architecture, or features.

## Project Structure

```
src/
├── pages/                    # Astro pages → routes
│   ├── index.astro           # Dashboard (/)
│   ├── calculator.astro      # Calculator (/calculator)
│   ├── simulator.astro       # Simulator (/simulator)
│   ├── actions.astro         # Action tracker (/actions)
│   ├── setup.astro           # Onboarding wizard (/setup)
│   └── knowledge/            # Knowledge base (/knowledge/*)
│       ├── index.astro       # Article index with search
│       └── [slug].astro      # Dynamic article pages
├── components/
│   ├── Layout.astro          # HTML shell, SEO, theme toggle
│   ├── Sidebar.astro         # Desktop sidebar + mobile bottom nav
│   └── islands/              # React components (client:load)
│       ├── Dashboard.tsx      # Welcome screen OR tax dashboard
│       ├── Calculator.tsx     # Full dual-regime calculator
│       ├── Simulator.tsx      # What-if slider simulator
│       ├── ActionChecklist.tsx # Dynamic action items
│       └── OnboardingWizard.tsx # 3-step profile setup
├── lib/                      # Core logic — FRAMEWORK AGNOSTIC
│   ├── types.ts              # All TypeScript interfaces
│   ├── tax-rules.ts          # Tax slabs, deduction rules, FY config
│   ├── tax-engine.ts         # All calculation functions (pure)
│   ├── action-generator.ts   # Dynamic action item generator
│   ├── profile-store.ts      # localStorage CRUD (null-first)
│   └── formatters.ts         # Currency formatting, helpers
├── content/                  # Markdown articles (Content Layer API)
│   └── knowledge/            # 10 knowledge base articles
├── data/
│   └── default-profile.ts    # EMPTY_PROFILE + 4 sample profiles
└── styles/
    └── global.css            # Design system (CSS custom properties)
src/content.config.ts         # Content collection schema (glob loader)
public/
├── _headers                  # Security headers for Cloudflare Pages
└── llms.txt                  # LLM-friendly project description
```

## Key Architecture Concepts

### Null-First Profile Store

`loadProfile()` returns `null` when no profile exists (first visit). This triggers:
- **Dashboard** → Welcome screen with feature cards + sample profiles
- **Calculator, Simulator, Actions** → "Set Up Profile" CTA
- **Setup page** → 3-step onboarding wizard

When a user completes onboarding OR loads a sample profile, the profile is saved to localStorage and all pages become fully functional.

### Dynamic Action Generator

`src/lib/action-generator.ts` generates personalized action items based on the user's profile:
- Job switch detected → Form 12B, Form 16, EPF transfer actions
- No employer NPS → Suggest requesting it (biggest tax saver)
- No health insurance → Recommend buying it
- No meal vouchers → Suggest asking HR

This replaces hardcoded action lists, making items relevant to each user's situation.

### Sample Profiles (4)

Defined in `src/data/default-profile.ts`. Users can load these to explore TaxBrain without entering their own data:

| Profile | CTC | Scenario |
|---|---|---|
| 🎓 Fresh Graduate | ₹7.5L | Single employer, renting in Bangalore |
| 🏠 Mid-Career | ₹15L | Home loan, NPS, PPF investments |
| 🔄 Job Switcher | ₹20L | Mid-year job change, salary restructuring |
| 💼 Senior Pro | ₹35L | Married, children, Mumbai, home loan |

### Onboarding Wizard (3 Steps)

1. **Basics:** Name, age, city (dropdown), monthly rent
2. **Salary:** Annual CTC, basic %, job switch toggle + month + new CTC
3. **Optimizations:** NPS, meal vouchers, health insurance, home loan

Smart defaults: Basic = 40% of CTC, HRA = 50% of Basic. Wizard builds a full `UserProfile` and saves to localStorage.

## Coding Rules

### Architecture Rules

1. **`src/lib/` is framework-agnostic.** Files in `lib/` must NEVER import React, Astro, or any framework. They receive data and return results.

2. **React components live ONLY in `src/components/islands/`.** Hydrated as Astro islands using `client:load`.

3. **Content is Markdown.** Knowledge base articles are `.md` files in `src/content/knowledge/` with typed frontmatter. Adding an article = adding a file.

4. **One source of truth for tax rules.** All slabs, limits, and configs live in `src/lib/tax-rules.ts`. When tax laws change, edit ONLY this file.

5. **Profile store returns null, not defaults.** `loadProfile()` returns `null` for first-time visitors. All islands must handle `null` gracefully (show setup CTA).

### TypeScript Rules

6. **Strict mode.** `tsconfig.json` uses `strict: true`. No `any` types. No `@ts-ignore`.

7. **All monetary amounts are whole rupees (integers).** Use `Math.round()` for intermediates. Indian tax law rounds to nearest ₹10 (Section 288B).

8. **Indian number formatting.** Use `Intl.NumberFormat('en-IN')` for all currency display. ₹12,34,567 not ₹1,234,567.

### CSS Rules

9. **Vanilla CSS only.** No Tailwind, no CSS-in-JS. CSS custom properties for the design system.

10. **Dark mode first.** `:root` defines dark theme. `[data-theme="light"]` overrides for light. Theme toggle in sidebar + keyboard shortcut `Ctrl+Shift+T`.

11. **System font stack.** No external font loading. Zero network requests at runtime.

12. **Mobile-first responsive.** Base styles are mobile. `min-width` media queries for larger screens. Sidebar → bottom nav on mobile (<768px).

### Quality Rules

13. **Every calculation step must be visible.** Users see slab-by-slab breakdown, not just final numbers.

14. **WCAG AA accessibility.** 4.5:1 contrast ratio. Visible focus states. `prefers-reduced-motion` support.

15. **No external requests at runtime.** No CDN fonts, no analytics JS, no API calls. Cloudflare Analytics (loaded via their dashboard) is the only exception.

## Tax Engine API

All functions are pure (no side effects). Defined in `src/lib/tax-engine.ts`:

```typescript
calculateSlabTax(income, slabs) → SlabBreakdown[]
calculateNewRegimeTax(profile, config) → TaxResult
calculateOldRegimeTax(profile, config) → TaxResult
compareRegimes(profile, config) → RegimeComparison
findBreakeven(profile, config, parameter) → number
getOptimizationSuggestions(profile, config) → Suggestion[]
```

## Known Issues & TODO

These are known issues that need attention:

### High Priority
- **Profile reset:** Need a clear "Reset Profile" / "Start Over" button accessible from dashboard and setup page that clears localStorage and returns to the welcome/onboarding state.
- **Setup page re-entry:** When a user with an existing profile visits `/setup`, it should pre-fill their current data for editing, not show a blank wizard.
- **Astro 7 dev server on Windows:** The daemon mode crashes silently in agent environments. Workaround: use `npm run build && npx astro preview` instead of `npm run dev`.

### Medium Priority
- **Calculator empty state UX:** The "Set Up Profile" CTA could be more informative. Show what the calculator does with a preview/screenshot.
- **Simulator slider ranges:** Currently hardcoded. Should auto-scale based on user's salary (e.g., rent slider max = 50% of monthly take-home).
- **Mobile responsive testing:** Bottom nav and layout need thorough testing on actual mobile viewports.
- **Input validation:** Onboarding wizard doesn't validate inputs (e.g., CTC = 0 is accepted).

### Low Priority
- **PDF export:** Allow users to export their tax breakdown as a PDF.
- **PWA support:** Service worker for offline capability after first load.
- **Lighthouse audit:** Target Performance ≥ 98, Accessibility 100.
- **Section 288B rounding:** Apply ₹10 rounding to final tax amounts per tax law.

## Deployment

- **Platform:** Cloudflare Pages (free tier, unlimited bandwidth)
- **Domain:** `tax.akanksha.dev` (CNAME → `taxbrain.pages.dev`)
- **Build:** `npm run build` → output in `dist/`
- **CI/CD:** GitHub push → Cloudflare auto-builds and deploys
- **Framework preset:** Astro (auto-detected by Cloudflare)

## What NOT To Do

- Do NOT add a backend, database, or user authentication
- Do NOT use Tailwind CSS or any CSS framework
- Do NOT load external fonts via CDN
- Do NOT use `any` type in TypeScript
- Do NOT put tax calculation logic inside React components
- Do NOT send any user data to any external service
- Do NOT add cookie consent banners (zero cookies)
- Do NOT hardcode any personal/specific user data in the codebase
