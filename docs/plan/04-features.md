# 04 — Feature Specification

## Feature Tiers

### 🔴 MUST HAVE (MVP — Phase 1)
Features required for the app to deliver its core value proposition.

### 🟡 SHOULD HAVE (Phase 2)
Features that significantly enhance the experience but aren't blocking.

### 🟢 COULD HAVE (Phase 3)
Delighters and advanced features for power users.

---

## Page-by-Page Feature Specification

---

### PAGE 1: Dashboard (`/`)

**Purpose**: At-a-glance view of your tax situation with actionable intelligence.

#### 🔴 Must Have

| Feature | Description | UI Element |
|---|---|---|
| **Hero Savings Card** | Large card showing: "You save ₹X by choosing [regime]" with animated number counter | Gradient card with large typography |
| **Regime Comparison Cards** | Two cards side-by-side: New Regime tax amount vs Old Regime tax amount | Glass cards with accent colors (green for winner, red for loser) |
| **Effective Tax Rate** | Shows your effective tax rate as a percentage | Circular progress ring |
| **Recommended Regime Badge** | Clear "✅ New Regime Recommended" or "✅ Old Regime Recommended" | Pill/badge component |
| **Monthly Take-Home Estimate** | Shows approximate monthly in-hand salary after TDS | Info card |
| **Quick Action Items** | Top 3-5 most important actions to take | Compact action cards with priority colors |

#### 🟡 Should Have

| Feature | Description |
|---|---|
| **Monthly TDS Breakdown** | Show estimated TDS per month (especially useful for job switchers) |
| **Tax Optimization Score** | 0-100 score showing how optimized your tax structure is |
| **"What You're Missing" Alert** | If employer NPS or meal vouchers are not enabled, show potential savings |
| **Year-over-Year Comparison** | If previous year data exists, show improvement/degradation |

#### 🟢 Could Have

| Feature | Description |
|---|---|
| **Animated Donut Chart** | Tax breakdown by slab as a donut chart |
| **Personalized Greeting** | "Good evening, [Name]. Here's your tax snapshot for FY 2026-27" |
| **Calendar Alerts** | Upcoming tax deadlines (ITR filing, advance tax dates) |

---

### PAGE 2: Calculator (`/calculator`)

**Purpose**: Full interactive tax calculator with component-level salary input and optimization toggles.

#### 🔴 Must Have

| Feature | Description | UI Element |
|---|---|---|
| **Salary Component Inputs** | Individual fields for: Basic, HRA, LTA, Special Allowance, Fuel, Flexi, Other | Grouped input form with currency formatting |
| **Multi-Job Support** | Add Job 1 + Job 2 with month ranges for job-switch scenarios | Tabbed job sections with "Add Job" button |
| **Variable Pay Input** | Amount + expected achievement % | Input + slider |
| **City Selector** | Dropdown with metro/non-metro auto-detection | Searchable dropdown |
| **Rent Input** | Monthly rent amount | Currency input |
| **Optimization Toggles** | Checkboxes: Employer NPS (with % selector), Meal Vouchers, Phone Reimbursement | Toggle switches |
| **Old Regime Deductions Panel** | Expandable section with all 80C/80D/80CCD/24B inputs | Accordion with sub-items |
| **Live Dual Calculation** | Real-time tax computation for BOTH regimes as you type | Two result cards, always visible |
| **Step-by-Step Breakdown** | Expandable detailed breakdown: Gross → Deductions → Taxable → Slabs → Tax → Cess | Collapsible calculation steps |
| **Winner Banner** | Clear visual indicator of which regime wins and by how much | Animated banner |
| **Marginal Relief Display** | If applicable, show marginal relief calculation | Info tooltip |

#### 🟡 Should Have

| Feature | Description |
|---|---|
| **Quick Presets** | "Use my profile" button to auto-fill from saved profile |
| **Salary Restructure Suggestions** | "Move ₹X from Special Allowance → NPS to save ₹Y" |
| **PDF Export** | Download calculation as a formatted PDF |
| **Shareable Link** | Encode inputs in URL params so you can share a specific calculation |
| **History** | Save and compare multiple calculation scenarios |

#### 🟢 Could Have

| Feature | Description |
|---|---|
| **Form 16 Parser** | Upload Form 16 PDF → auto-extract salary data |
| **Payslip Scanner** | Upload payslip image → extract components |

---

### PAGE 3: Scenario Simulator (`/simulator`)

**Purpose**: Interactive "what-if" analysis tool for future financial decisions.

#### 🔴 Must Have

| Feature | Description | UI Element |
|---|---|---|
| **Rent Slider** | Drag to change monthly rent (₹5K → ₹1L) and see regime impact in real-time | Range slider with live value display |
| **Salary Slider** | Simulate salary increase (₹10L → ₹1Cr CTC) | Range slider |
| **Home Loan Toggle** | Enable/disable home loan with EMI and interest inputs | Toggle + input group |
| **NPS Percentage Slider** | Employer NPS from 0% → 14% of Basic | Range slider |
| **Live Regime Chart** | Visual chart showing tax under New vs Old regime as slider moves | Canvas/SVG line chart |
| **Break-Even Indicator** | Show the exact point where Old Regime becomes better | Marker on chart + text callout |
| **Recommendation Text** | Dynamic text: "At this rent level, New Regime saves you ₹X" | Auto-updating paragraph |

#### 🟡 Should Have

| Feature | Description |
|---|---|
| **Life Event Presets** | Quick buttons: "I'm getting married", "I'm buying a house", "I got a raise" |
| **Multi-Year Projection** | Show tax trajectory over 3-5 years with expected salary growth |
| **Investment Impact** | "If you invest ₹50K in NPS, your tax drops by ₹X" |
| **Side-by-Side Scenario Compare** | Save and compare two different scenarios |

#### 🟢 Could Have

| Feature | Description |
|---|---|
| **Inflation Adjuster** | Factor in 6-7% annual inflation in rent and expenses |
| **Retirement Projection** | NPS corpus estimation at retirement based on current contribution |

---

### PAGE 4: Knowledge Base (`/knowledge`)

**Purpose**: Comprehensive, searchable library of Indian tax concepts, rules, and strategies.

#### 🔴 Must Have — Articles

| Article | Content |
|---|---|
| **Old vs New Regime Explained** | Complete guide with slab tables, allowed deductions, decision framework |
| **Section 80C Deep Dive** | Every sub-item (EPF, PPF, ELSS, NSC, LIC, etc.) with limits and lock-ins |
| **Section 80D Health Insurance** | Self, parents, senior citizens, preventive checkup rules |
| **HRA Exemption Guide** | Formula, metro vs non-metro, Gurugram case study, with calculator link |
| **NPS Tax Benefits** | 80CCD(1), 80CCD(1B), 80CCD(2), employer contribution strategy |
| **Salary Restructuring Guide** | How to ask HR, NPS, meal vouchers, phone reimbursement, email templates |
| **First-Time Taxpayer Basics** | What is TDS, what is ITR, which form to use, deadlines, penalties. Form 16→Form 130, Form 12BB→Form 124 under new Act |
| **Job Switch Tax Guide** | Form 12B/124, combining incomes, TDS shock, what to submit to new employer |
| **Meal Vouchers 2026 Rules** | New ₹200/meal limit (up from ₹50), both regimes, annual calculation, non-transferable card requirement |
| **Income Tax Act 2025 Changes** | Section number mapping (80C→123, 80D→126, etc.), "Tax Year" replacing FY/AY, form renaming. Rates unchanged. |
| **Understanding Your Salary Structure** | HRA, LTA, Fuel & Maintenance, Special Allowance explained. What's exempt, what's not, common traps (like Fuel without a car) |

#### 🟡 Should Have — Articles

| Article | Content |
|---|---|
| **Home Loan Tax Benefits** | Section 24(b)/new section, 80C principal, stamp duty deduction, loss from house property. THE biggest old-regime lever |
| **Capital Gains Basics** | STCG, LTCG, equity, debt, real estate — overview |
| **LTA Exemption Guide** | Block years (2026-2029), eligible expenses (domestic fare only), family definition, carry-forward rules, old regime only |
| **Marriage & Taxes** | What changes (nothing directly), what doesn’t, spouse income, income clubbing (Sec 64/83), HUF option (later) |
| **Investment Comparison** | ELSS vs PPF vs NPS vs Tax FD — returns, lock-in, risk matrix |
| **Financial Planning for First-Time Taxpayers** | Emergency fund first, personal health insurance, term life insurance, index fund SIPs. New Regime frees you from chasing 80C |

#### 🔴 Must Have — UI

| Feature | Description |
|---|---|
| **Search** | Real-time search across all articles |
| **Category Tags** | Deductions, Regimes, Salary, Investments, Life Events |
| **Cross-Links** | Articles link to relevant calculator features |
| **Reading Time** | Estimated reading time per article |

---

### PAGE 5: Action Tracker (`/actions`)

**Purpose**: Personalized, persistent checklist of tax-saving actions.

#### 🔴 Must Have

| Feature | Description |
|---|---|
| **Priority-Sorted Checklist** | Actions sorted by 🔴 Critical, 🟡 Important, 🟢 Nice-to-have |
| **Persistent Checkboxes** | Completed items saved in localStorage |
| **Progress Bar** | Visual progress showing "X of Y actions completed" |
| **Category Grouping** | Groups: "Before Leaving Current Job", "Day 1 at New Job", "Within Month 1", "Within 3 Months" |
| **Action Details** | Each item expandable with why it matters and how to do it |

#### 🟡 Should Have

| Feature | Description |
|---|---|
| **Document Tracker** | Track which documents you've collected (Form 16, rent agreement, etc.) |
| **Due Date Reminders** | Key tax deadlines highlighted |
| **Custom Actions** | User can add their own action items |

---

## Design System

### Color Palette

```css
/* Primary */
--bg-primary: #0B0D17;         /* Deep dark */
--bg-secondary: #12141F;       /* Card background */
--bg-glass: rgba(255,255,255,0.03); /* Glassmorphism */
--border-glass: rgba(255,255,255,0.06);

/* Accent */
--accent-gradient: linear-gradient(135deg, #667eea, #764ba2);
--accent-primary: #667eea;     /* Purple-blue */
--accent-secondary: #764ba2;   /* Deep purple */

/* Semantic */
--color-success: #00E676;      /* Green — winner, savings */
--color-warning: #FFD740;      /* Yellow — caution, important */
--color-danger: #FF5252;       /* Red — higher tax, critical */
--color-info: #40C4FF;         /* Blue — informational */

/* Text */
--text-primary: #E8E8F0;
--text-secondary: #8888A0;
--text-muted: #55556A;

/* Typography */
--font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

### Design Principles

1. **Dark Mode First** — Premium feel, easy on eyes, modern aesthetic
2. **Glassmorphism Cards** — `backdrop-filter: blur(20px)` with subtle borders
3. **Gradient Accents** — Purple-blue gradient for CTAs and highlights
4. **Micro-Animations** — Number counters, smooth transitions, hover effects
5. **Information Density** — Show a lot of data without feeling cluttered
6. **Mobile-First** — Sidebar collapses to bottom nav on mobile
