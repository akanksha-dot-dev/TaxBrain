# TaxBrain — Vision & Principles

> This document defines WHY this project exists, WHO it's for, and the principles that guide every decision.

---

## The Problem

Indian salaried professionals face a confusing, fragmented tax landscape:

1. **No tool tells you what to DO.** Every calculator shows a number. None says: "Restructure ₹1L of Special Allowance into Employer NPS to save ₹27,500."
2. **Job switchers are invisible.** The most common scenario — two employers in one FY — is handled by zero existing calculators.
3. **Old vs New Regime confusion.** The answer depends on YOUR salary structure, YOUR rent, YOUR investments — but guides give generic advice.
4. **Financial literacy gap.** First-time taxpayers don't know what TDS is, what Form 12B means, or why Section 80CCD(2) matters.

## The Solution

**TaxBrain** is a free, privacy-first tax intelligence platform that:
- Takes your actual CTC breakdown (not just "annual income")
- Shows EXACTLY how much tax you'll pay under each regime
- Tells you specifically WHAT to restructure and WHY
- Lets you simulate scenarios (rent changes, home loan, salary hike)
- Teaches tax concepts integrated with YOUR numbers
- Tracks your tax-saving actions with a persistent checklist

All of this runs **100% in your browser**. No account. No data sent anywhere. No privacy risk.

---

## Target Users

### Primary: Indian Salaried Professionals

Any salaried individual in India who:
- Earns ₹3L to ₹3Cr+ annual CTC
- Lives in any Indian city (metro/non-metro auto-detection for HRA)
- Uses either New or Old tax regime
- May have switched jobs mid-year (multi-employer income)
- May be single, married, or have dependents

### Personas

| Persona | Profile | Key Need |
|---|---|---|
| **First-time taxpayer** | 22-25 yrs, ₹5-8L CTC, just started working | "What even is TDS? Do I need to file?" |
| **Mid-career optimizer** | 28-35 yrs, ₹12-25L CTC, some investments | "Am I in the right regime? What should I invest in?" |
| **Job switcher** | Any age, changed jobs this FY | "I had two Form 16s — how does TDS work now?" |
| **Senior professional** | 35+, ₹25L+ CTC, home loan, family | "My tax is huge. What are ALL my options?" |

### How Personalization Works

The **tax engine is universal** — same code for every user. The **user profile is personal** — stored in localStorage, editable, exportable as JSON. New visitors see an onboarding wizard to enter their data, or can explore with 4 built-in sample profiles.

---

## Design Principles

### 1. Intelligence over Information
Don't just show numbers. Explain WHY. "New Regime saves you ₹76,230 because your HRA deduction is too low at ₹13,000 rent to offset the wider New Regime slabs."

### 2. Action over Education
Every insight should end with a DO: "Ask HR for Employer NPS (14% of Basic) on Day 1." The knowledge base exists to support actions, not to be read for fun.

### 3. Trust through Transparency
Show every calculation step. When the tool says "tax = ₹1,76,010," the user can expand to see each slab, each deduction, each exemption. This builds trust with someone who's never filed taxes.

### 4. Privacy by Architecture
No backend is not a limitation — it's a feature. The user's salary data never leaves their browser. No cookies, no tracking, no account. "This tool literally cannot leak your data because it has nowhere to send it."

### 5. 60-Second Time-to-Value
A new visitor should see their first tax saving insight within 60 seconds. The onboarding wizard is 3 steps, with smart defaults. Sample profiles let curious visitors explore instantly.

### 6. Dark Mode First
82-83% of users prefer dark mode. Design system starts dark, offers light toggle. Token-based theming — never CSS `invert()`.

### 7. System Fonts, Instant Load
No external font CDN (privacy risk). System font stack loads in 0ms. The tool's intelligence IS the brand, not a typeface.

### 8. Mobile-First
Many Indian users access financial tools on mobile. Sidebar becomes bottom navigation on phones. Touch-friendly inputs and sliders.

### 9. Annual Maintainability
Tax laws change every Budget. Architecture ensures: update ONE file (`tax-rules.ts`) and the entire app reflects new rules. Zero component hunting.

---

## Competitive Positioning

### What Exists (and Why It's Not Enough)

| Category | Examples | What They Do | What They Don't |
|---|---|---|---|
| Commercial platforms | ClearTax, TaxBuddy, Tax2win | Filing + basic calculation | No salary optimization, no simulation |
| GitHub calculators | TaxCalc, Taxly | Dual regime comparison | No CTC breakdown, no multi-job |
| Government tool | incometax.gov.in | Most accurate raw math | Zero UX, zero optimization |

### TaxBrain's Unique Position

6 features that NO existing tool offers together:
1. **Salary Structure Optimizer** — "Move ₹X from Special Allowance → NPS to save ₹Y"
2. **Multi-Job Income Combiner** — Two employers in one FY
3. **Interactive Scenario Simulator** with break-even finder
4. **Integrated Knowledge Base** — Articles linked to relevant calculator sections
5. **Personalized Action Checklist** — Dynamic, profile-based, persistent
6. **"Why" Explanations** — Not just numbers, but reasoning

---

## Technical Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Astro 7.x | Islands architecture: zero JS for content pages, React for interactive. Cloudflare acquired Astro (Jan 2026) |
| Interactive Islands | React 19 | Best ecosystem for complex stateful UIs (15+ inputs, live calculation) |
| Hosting | Cloudflare Pages | Unlimited free bandwidth, 300+ edge PoPs, $0 at any traffic |
| Styling | Vanilla CSS | Token-based design system with custom properties. No framework lock-in |
| Fonts | System stack | Zero network requests, zero CLS, zero LCP impact |
| Data | localStorage | No backend needed. ~5MB limit sufficient. JSON export for backup |
| Tax Engine | Pure TypeScript | Framework-agnostic, testable. One file to update for law changes |
| Markdown Processor | unified/remark | Via `@astrojs/markdown-remark`. Satteri (Astro 7 default) has Windows native binding issues |

---

## Success Metrics

- [ ] Any Indian salaried professional can see their tax breakdown in under 2 minutes
- [ ] All 4 sample profiles produce accurate, verifiable tax calculations
- [ ] Lighthouse Performance ≥ 98
- [ ] WCAG AA compliant
- [ ] Works offline after first load (PWA)
- [ ] Tax rules updatable by editing one file (`tax-rules.ts`)
- [ ] Zero personal data in codebase or git history
