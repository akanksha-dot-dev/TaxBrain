# 01 — Market Research & Competitive Analysis

## The Landscape: What Already Exists

### A. Open-Source GitHub Projects

| Project | Stack | Stars | Features | Limitations |
|---|---|---|---|---|
| **subhashhhhhh/TaxCalc** | Next.js, TypeScript, Tailwind | Moderate | Dual-regime comparison, PDF download, dark/light mode, recommendation engine | No salary structuring, no scenario simulation, no knowledge base, no personalization |
| **vivekpanchal/Taxly** | Next.js, TypeScript | Moderate | FY 2025-26 slabs, deduction gap analysis, PDF savings plan | Static calculation only, no CTC breakdown, no optimization |
| **Ricky-saha/TaxCalculator** | React.js | Moderate | Real-time side-by-side comparison, 80C/80D support | Basic UI, no salary component input, no HRA calculation |
| **jaikrishnaverma-dev/tax_mui** | React, Material-UI | Low | Clean responsive UI, both regimes | Very basic, no deductions depth |
| **chaitradhake/ITR-Filling-Assistant** | MERN stack + Gemini AI | Low | AI extraction from Form 16, regime comparison | Complex setup, requires server, not a planning tool |
| **Nootus/OpenTax** | Framework (API) | Growing | Developer-first tax API, ITR construction, compliance logic | Not an end-user tool, no UI, purely a backend API |
| **frappe/india-payroll** | Frappe/ERPNext | High | Full payroll compliance (PF, ESI, PT, TDS), statutory | Enterprise-grade, not a personal tool, requires Frappe setup |
| **amrajacivil/taxcalcindia** | Python library | Low | Both regimes, capital gains, salary/business income | CLI only, no web UI |
| **Ammar-32-dev/indian-financial-calculators** | Web | Low | Tax comparison, EMI, SIP calculators | Basic calculators, no integration |

### B. Commercial Platforms

| Platform | Features | Pricing | Key Strengths | Key Gaps |
|---|---|---|---|---|
| **ClearTax** | Filing, 80+ broker integrations, CA network, Form 16 auto-import, AIS/26AS | Freemium (₹0-₹4000+) | Ecosystem breadth, crypto/ESOP/US stocks | Calculator is secondary; filing-focused, no salary optimizer |
| **TaxBuddy** | AI-powered filing, post-filing notice support, embedded in PhonePe/Jio | Freemium | AI pre-fill, free notice resolution | Filing-focused, not a planning tool |
| **MyITReturn** | 9+ language support, guided filing | Freemium | Accessibility, multilingual | Basic calculators, no optimization |
| **Tax2win** | Tax optimization, investment recommendations, regime comparison | Freemium | Tax planning focus | Limited scenario analysis, no live simulation |
| **AiTaxBot** | AI-driven calculation, HRA/SIP/SWP calculators, no login | Free | Quick what-if, no account needed | No salary structuring, no profile persistence |
| **Income Tax Gov.in** | Official Advanced Calculator, multi-source income | Free | Most reliable, authoritative | Zero UX, no optimization, no recommendations, intimidating |
| **Zoho Payroll** | Full payroll, compliance, calculator | Freemium | Business-grade | Not for individual tax planning |

---

## The Feature Matrix: What Exists vs What's Missing

### Comprehensive Feature Comparison

| Feature | Gov.in | ClearTax | Tax2win | TaxCalc (GH) | Taxly (GH) | OpenTax | **TaxBrain** |
|---|---|---|---|---|---|---|---|
| **Basic Tax Calculation** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dual Regime Comparison** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CTC-to-In-Hand Breakdown** | ❌ | Partial | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Salary Structure Optimizer** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **HRA Deep Calculation (metro/non-metro)** | ❌ | Partial | ❌ | ❌ | ❌ | ✅ | ✅ |
| **NPS Employer Optimization** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Meal Voucher / Flexi Optimization** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Scenario Simulator (What-If)** | ❌ | ❌ | Limited | ❌ | ❌ | ❌ | ✅ |
| **Break-Even Finder** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Multi-Job Income Combining** | ❌ | Via ITR | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Pro-Rata Mid-Year Joining** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Knowledge Base / Tax Education** | ❌ | Blog | Blog | ❌ | ❌ | Docs | ✅ |
| **Personalized Action Checklist** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Life Event Planning (Marriage, House)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Profile Persistence (localStorage)** | N/A | Account | Account | ❌ | ❌ | N/A | ✅ |
| **PDF/Export Report** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **100% Client-Side (No Data Sent)** | N/A | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Open Source** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Mobile Responsive** | ❌ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| **AI Agent Parsable Codebase** | N/A | N/A | N/A | Partial | Partial | ✅ | ✅ |
| **Marginal Relief Calculator** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Monthly TDS Estimation** | ❌ | Via ITR | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Surcharge Calculation** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## The Gap Analysis: Where TaxBrain Wins

### 🔴 Critical Gaps No One Fills

1. **Salary Structure Optimizer** — No tool takes your CTC and tells you: "Restructure Special Allowance → NPS + Meal Vouchers to save ₹X." Every user has to figure this out manually or pay a CA.

2. **Scenario Simulator with Break-Even** — "At what rent does Old Regime win?" "What happens if I buy a house with ₹50L loan?" No tool answers these dynamically.

3. **Multi-Job Income Combiner** — The MOST common scenario (job switch mid-year) is handled by ZERO calculators. They all assume single-employer income.

4. **Salary Component-Level Input** — Most tools ask "What's your annual income?" They don't accept Basic/HRA/LTA/Special Allowance separately, which is needed for accurate HRA, NPS, and PF calculations.

5. **Personalized Intelligence** — No tool gives you a "here are 5 things YOU should do on Day 1 of your new job" based on YOUR specific salary structure.

### 🟡 High-Value Differentiators

6. **Knowledge Base integrated with Calculator** — When the tool shows "HRA Exemption: ₹46,000", you can click to learn WHY it's so low and WHAT you can do about it.

7. **Life Event Simulator** — Marriage, house purchase, children — how does each affect your taxes? No tool models these.

8. **Monthly TDS Impact View** — Show users how much TDS they'll see deducted each month, especially after a job switch. Prevents the "TDS shock."

---

## Target Audience

| Segment | % of Indian Workforce | Pain Point | TaxBrain Solution |
|---|---|---|---|
| **First-time taxpayers** (₹7-15L) | Huge, growing | Don't understand tax at all | Knowledge base + guided experience |
| **Mid-career salaried** (₹15-30L) | Large | Old vs New confusion, salary optimization | Regime comparison + optimizer |
| **Senior professionals** (₹30-60L+) | Growing | Complex deductions, home loan, NPS | Full deduction engine + scenario simulator |
| **Job switchers** | Very common | Two salaries in one year, Form 12B | Multi-job combiner |
| **Anyone renting** | Millions | HRA calculation confusion | Deep HRA calculator with city selector |

**TaxBrain is NOT limited to any salary range.** The tax engine handles ₹3L to ₹3Cr+ with full slab, surcharge, and marginal relief accuracy.
