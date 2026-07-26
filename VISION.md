# TaxBrain — Vision & Principles

> This document defines WHY this project exists, WHO it's for, and the principles that guide every decision.

---

## The Problem

Indian salaried professionals — especially first-time taxpayers — face a confusing, fragmented landscape:

1. **No tool tells you what to DO.** Every calculator shows a tax number. None says: "Restructure ₹1L of your Special Allowance into Employer NPS to save ₹27,500."
2. **Job switchers are invisible.** The most common real-world scenario — two employers in one financial year — is handled by ZERO existing calculators. They all assume single-employer income.
3. **Old vs New Regime confusion.** The answer depends on YOUR specific salary structure, YOUR rent, YOUR investments — but every "guide" gives generic advice.
4. **Financial literacy gap.** First-time taxpayers don't know what TDS is, what Form 12B means, or why they should care about Section 80CCD(2).

## The Solution

**TaxBrain** is a personal tax intelligence platform that:
- Takes your actual CTC breakdown (not just "annual income")
- Shows EXACTLY how much tax you'll pay under each regime
- Tells you specifically WHAT to restructure and WHY
- Lets you simulate future scenarios (marriage, house, salary hike)
- Teaches you tax concepts integrated with your own numbers
- Tracks your tax-saving actions with a persistent checklist

All of this runs **100% in your browser**. No account. No data sent anywhere. No privacy risk.

---

## The User

### Primary User: Akanksha (the creator)

| Detail | Value |
|---|---|
| Age | 27-30 |
| Gender | Female |
| Status | Unmarried (marriage planned ~18 months) |
| City | Gurugram, Haryana (non-metro for HRA) |
| Rent | ₹13,000/month |
| Job 1 | Current employer, ₹12.97L CTC, April–July 2026 |
| Job 2 | New employer, ₹25.52L CTC, August 2026–March 2027 |
| Tax History | First-time taxpayer |
| Investments | Zero (two LIC policies, father pays premiums) |
| Tax Regime | **New Tax Regime** (confirmed optimal) |
| Key Goal | "I want to save as much tax as possible" |

### Secondary Users: Any Indian Salaried Professional

The tool generalizes to anyone:
- Any salary range (₹3L to ₹3Cr+)
- Any city (metro/non-metro auto-detection)
- Any regime (old/new with full slab calculation)
- Job switchers (multi-employer income combining)
- Single or married (with life event simulation)

### How Personalization Works

The **tax engine is universal** — same code for everyone. The **user profile is personal** — stored in localStorage, editable, exportable as JSON. Akanksha's data is the default profile. Any new visitor can edit everything to see their own results.

---

## Design Principles

### 1. Intelligence over Information
Don't just show numbers. Explain WHY. "New Regime saves you ₹1,36,770 because your HRA deduction (₹67,410) is too low at ₹13,000 rent to offset the wider slabs."

### 2. Action over Education
Every insight should end with a DO: "Ask HR for Employer NPS (14% of Basic) on Day 1." The knowledge base exists to support actions, not to be read for fun.

### 3. Trust through Transparency
Show every calculation step. When the tool says "tax = ₹1,37,516," the user can expand to see each slab, each deduction, each exemption. This is how you build trust with someone who's never filed taxes before.

### 4. Privacy by Architecture
No backend is not a limitation — it's a feature. The user's salary data never leaves their browser. No cookies, no tracking, no account creation. The trust model is: "this tool literally cannot leak your data because it has nowhere to send it."

### 5. Dark Mode First
82-83% of users prefer dark mode. The design system starts dark and offers a light toggle. Token-based: never CSS `invert()`.

### 6. System Fonts, Instant Load
No external font CDN (privacy risk per Munich court ruling 2022). System font stack loads in 0ms. The tool's intelligence IS the brand, not a typeface.

### 7. Mobile-First, Offline-Capable
Many Indian users access financial tools on mobile. The sidebar becomes bottom navigation on phones. PWA support allows offline use after first load.

### 8. Annual Maintainability
Tax laws change every budget season. The architecture ensures: update ONE file (`tax-rules.ts`) and the entire app reflects the new rules. No hunting through components.

---

## Competitive Positioning

### What Exists (and Why It's Not Enough)

| Category | Examples | What They Do | What They Don't Do |
|---|---|---|---|
| Commercial platforms | ClearTax, TaxBuddy, Tax2win | Filing + basic calculation | No salary optimization, no scenario simulation |
| GitHub calculators | TaxCalc, Taxly | Dual regime comparison | No CTC breakdown, no multi-job, no knowledge base |
| Government tool | incometax.gov.in calculator | Most accurate raw math | Zero UX, zero optimization, intimidating |
| Backend frameworks | OpenTax | Developer API for tax compliance | Not an end-user tool |

### TaxBrain's Unique Position

6 features that NO existing tool offers:
1. **Salary Structure Optimizer** — "Move ₹X from Special Allowance → NPS to save ₹Y"
2. **Multi-Job Income Combiner** — Combine two employer incomes in one FY
3. **Interactive Scenario Simulator** with break-even finder
4. **Integrated Knowledge Base** — Articles link directly to relevant calculator sections
5. **Personalized Action Checklist** — Persistent, prioritized, with explanations
6. **"Why" Explanations** — Not just numbers, but reasoning

---

## Technical Decisions (with Rationale)

| Decision | Choice | Why |
|---|---|---|
| Framework | Astro (latest) | Islands architecture: zero JS for content pages, React for interactive components. Cloudflare acquired Astro (Jan 2026) — strongest funding runway |
| Interactive Islands | React 19 | Best ecosystem for complex stateful UIs (15+ inputs, live calculation) |
| Hosting | Cloudflare Pages | Only platform with unlimited free bandwidth + $0 at any traffic spike. No commercial restriction. 300+ edge PoPs. Acquired Astro |
| Styling | Vanilla CSS | Token-based design system with custom properties. No framework lock-in |
| Fonts | System stack | Zero network requests, zero CLS, zero LCP impact |
| Data | localStorage | No backend needed. ~5MB limit is sufficient. JSON export for backup |
| Tax Engine | Pure TypeScript | Framework-agnostic, testable, agent-parsable. One file to update for law changes |

---

## Success Metrics

### For Akanksha (personal)
- [ ] Accurately calculate tax for FY 2026-27 (both jobs combined)
- [ ] Identify all optimization opportunities (NPS, meal vouchers, phone)
- [ ] Track all Day-1 actions at new job
- [ ] Simulate marriage tax impact for FY 2027-28

### For the Product
- [ ] Any Indian salaried professional can use it in under 2 minutes
- [ ] Lighthouse Performance ≥ 98
- [ ] WCAG AA compliant
- [ ] Works offline after first load
- [ ] Tax rules updatable by editing one file
