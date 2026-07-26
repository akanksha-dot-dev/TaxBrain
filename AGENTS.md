# Agent Operating Instructions

> This file is the single entry point for any AI coding agent working on this project.
> Read this FIRST. It tells you what the project is, where everything is, and how to work here.

## Project Identity

- **Name:** TaxBrain
- **URL:** `https://tax.akanksha.dev`
- **Purpose:** Indian tax intelligence platform for salaried professionals
- **Stack:** Astro (latest) + React Islands + TypeScript + Vanilla CSS + Cloudflare Pages
- **Node.js:** 22+ required
- **Architecture:** 100% client-side. Zero backend. All data in localStorage.
- **Tax Law:** Income Tax Act, 2025 (effective April 1, 2026). Old section numbers (80C, 80D) used for familiarity; see `06-my-tax-profile.md` for full mapping to new numbers (123, 126, etc.).

## One-Command Entry Points

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=taxbrain
```

## Context Loading Order

When starting a new session, read these files in this order:

1. **This file** (`AGENTS.md`) — You're here. Operating rules and project overview.
2. **`VISION.md`** — Project vision, user profile, and design principles.
3. **`docs/plan/00-master-plan.md`** — Implementation plan hub with links to 6 sub-documents.
4. **`docs/plan/06-my-tax-profile.md`** — The user's personal tax data (default profile).
5. **`docs/plan/05-implementation.md`** — Build phases and file specifications.

Only read the remaining plan files (`01-04`) if you need deeper context on a specific topic.

## Project Structure Convention

```
src/
├── pages/              # Astro pages → routes
│   ├── index.astro     # Dashboard (/)
│   ├── calculator.astro # Calculator (/calculator)
│   ├── simulator.astro  # Simulator (/simulator)
│   ├── actions.astro    # Action tracker (/actions)
│   └── knowledge/       # Knowledge base (/knowledge/*)
├── components/
│   ├── Layout.astro     # Base page layout
│   ├── Sidebar.astro    # Navigation sidebar
│   └── islands/         # React components (client-side interactive)
│       ├── Dashboard.tsx
│       ├── Calculator.tsx
│       ├── Simulator.tsx
│       └── ActionChecklist.tsx
├── lib/                 # Core logic — FRAMEWORK AGNOSTIC
│   ├── types.ts         # All TypeScript interfaces
│   ├── tax-rules.ts     # Tax slabs, deduction rules, FY config
│   ├── tax-engine.ts    # All calculation functions (pure)
│   ├── profile-store.ts # localStorage read/write
│   └── formatters.ts    # Currency formatting, helpers
├── content/             # Markdown articles (Content Layer API)
│   └── knowledge/       # Knowledge base articles
├── data/
│   └── default-profile.ts # Default user profile data
└── styles/
    └── global.css       # Design system (CSS custom properties)
content.config.ts        # Content collection definitions (project root)
public/
└── _headers             # Security headers for Cloudflare Pages
```

## Coding Rules

### Architecture Rules

1. **`src/lib/` is framework-agnostic.** Files in `lib/` must NEVER import React, Astro, or any framework. They receive data and return results. This is the tax calculation brain — it must work in any JS/TS environment.

2. **React components live ONLY in `src/components/islands/`.** They are hydrated as Astro islands using `client:load` or `client:visible` directives.

3. **Content is Markdown.** Knowledge base articles are `.md` files in `src/content/knowledge/` with typed frontmatter. Adding an article = adding a file. Zero code changes.

4. **One source of truth for tax rules.** All tax slabs, deduction limits, and regime configurations live in `src/lib/tax-rules.ts`. When tax laws change, edit ONLY this file.

### TypeScript Rules

5. **Strict mode.** `tsconfig.json` uses `strict: true`. No `any` types. No `@ts-ignore`.

6. **All monetary amounts are whole rupees (integers).** Use `Math.round()` for intermediate percentage calculations. Indian tax law ignores paise and rounds to nearest ₹10 (Section 288B). JavaScript integers are exact up to 2^53 — no floating-point risk for rupee-level arithmetic.

7. **Indian number formatting.** Use `Intl.NumberFormat('en-IN')` for all currency display. ₹12,34,567 not ₹1,234,567.

### CSS Rules

8. **Vanilla CSS only.** No Tailwind, no CSS-in-JS. Use CSS custom properties for the design system.

9. **Dark mode first.** `:root` defines dark theme. `[data-theme="light"]` overrides for light mode. Token-based: primitive → semantic → component.

10. **System font stack.** `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;` No external font loading.

11. **Mobile-first responsive.** Base styles are mobile. Use `min-width` media queries to add complexity for larger screens. Sidebar becomes bottom nav on mobile (<768px).

### Quality Rules

12. **Every calculation step must be visible.** Users see HOW tax was calculated (slab-by-slab breakdown), not just the final number.

13. **WCAG AA accessibility.** Every text/background color pair must pass 4.5:1 contrast ratio (3:1 for large text). Visible focus states. `prefers-reduced-motion` support.

14. **No external requests at runtime.** No Google Fonts CDN, no external analytics JS, no API calls. Everything is self-contained. Cloudflare Analytics is the only exception (loaded via their dashboard, not our code).

## Tax Engine API (Key Functions)

The core tax engine exposes these functions — all are pure (no side effects):

```typescript
// Core
calculateSlabTax(income, slabs) → SlabBreakdown[]
calculateNewRegimeTax(profile, config) → TaxResult
calculateOldRegimeTax(profile, config) → TaxResult

// Intelligence
compareRegimes(profile, config) → RegimeComparison
findBreakeven(profile, config, parameter) → number
getOptimizationSuggestions(profile, config) → Suggestion[]

// Simulation
simulateScenario(profile, config, changes) → RegimeComparison
```

## Verification Values

The tax engine MUST produce these results for the default profile:

| Scenario | New Regime Tax | Old Regime Tax |
|---|---|---|
| FY 2026-27, combined income, no optimization | ₹1,76,010 | ₹2,52,240 |
| FY 2026-27, with NPS + meal vouchers | ₹1,37,520 | — |
| FY 2027-28, full year, with optimizations | ₹1,99,140 | ₹3,30,220 |

> Note: Old regime values use corrected 10% employer NPS (private sector limit under old regime).
> New regime uses 14% employer NPS. All values to be confirmed during tax engine implementation.

## Deployment

- **Platform:** Cloudflare Pages (free tier, unlimited bandwidth)
- **Domain:** `tax.akanksha.dev` (CNAME → `taxbrain.pages.dev`)
- **Build:** `npm run build` → output in `dist/`
- **CI/CD:** GitHub push → Cloudflare auto-builds and deploys
- **Framework preset:** Astro (auto-detected by Cloudflare)

## What NOT To Do

- Do NOT add a backend, database, or user authentication system
- Do NOT use Tailwind CSS or any CSS framework
- Do NOT load external fonts via CDN (privacy risk per DP-12 research)
- Do NOT use `any` type in TypeScript
- Do NOT put tax calculation logic inside React components
- Do NOT send any user data to any external service
- Do NOT add cookie consent banners (we have zero cookies)
