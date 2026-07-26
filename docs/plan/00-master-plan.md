# TaxBrain — Master Implementation Plan (v2)

> **Free Indian tax intelligence platform at `tax.akanksha.dev`**

---

## 📁 Plan Documents Index

| # | Document | What It Covers |
|---|---|---|
| 1 | [01-market-research.md](01-market-research.md) | 9 GitHub repos + 7 commercial platforms analyzed. Feature matrix. Gaps. What makes TaxBrain unique |
| 2 | [02-technology-stack.md](02-technology-stack.md) | Framework analysis (Astro wins 49/50). **Cloudflare Pages** hosting. Subdomain: `tax.akanksha.dev`. Performance targets |
| 3 | [03-architecture.md](03-architecture.md) | Personal vs Generalized architecture. Data model. Component tree. Agent-parsability |
| 4 | [04-features.md](04-features.md) | 60+ features across 5 pages, 3 priority tiers. Design system specification |
| 5 | [05-implementation.md](05-implementation.md) | File-by-file build plan. Tax engine API. Build phases. Verification |
| 6 | _(removed — personal data, not applicable to public version)_ | — |

### Cross-References to Design Research

Key decisions validated against comprehensive research (extracted into `docs/research/design-research-extracts.md`):

| Our Decision | Research Source | Key Finding Applied |
|---|---|---|
| **Cloudflare Pages** (not Vercel) | DP-02 (Hosting) | "Only platform where $0/month and spike-proof are the same answer." Unlimited bandwidth. No commercial-use restriction |
| **Cloudflare DNS** | DP-03 (DNS) | Free, fastest authoritative resolver. Automatic CNAME setup for subdomains |
| **Astro framework** | DP-USYN (Synthesis) | "Zero JS by default; per-component opt-in hydration." Cloudflare acquired Astro Jan 2026 |
| **System font stack** | DP-09 (Performance) | "Zero network requests, zero swap risk, zero CLS risk, zero LCP delay" |
| **Dark mode + token system** | DP-05 (Design) | "82-83% of consumers use dark mode. ~18% longer sessions" |
| **Performance targets** | DP-09 (Performance) | LCP <1.5s, INP <100ms, CLS <0.05. Achievable on Cloudflare's 300+ PoP network |
| **WCAG AA accessibility** | DP-11 (Accessibility) | Every color pair verified against WCAG 2 contrast formula |
| **Security headers** | DP-12 (Security) | Full CSP, HSTS, X-Frame-Options, Permissions-Policy |
| **Animation patterns** | DP-07 (Motion) | CSS-first, scroll-driven animations, View Transitions API |
| **Responsive strategy** | DP-08 (Responsive) | Grid + Flexbox + container queries, mobile-first breakpoints |
| **SEO + AI discoverability** | DP-10 (SEO) | JSON-LD structured data, llms.txt, static HTML for AI crawlers |

---

## 🏗️ Technical Decision Summary

| Decision | Choice | Source |
|---|---|---|
| **Framework** | **Astro (latest)** + React islands | Islands architecture: static HTML for content, React for interactive tools |
| **Hosting** | **Cloudflare Pages** (free tier) | Unlimited bandwidth, $0 at any spike, no commercial restriction |
| **DNS** | **Cloudflare DNS** | Free, fastest resolver, automatic CNAME for subdomains |
| **Domain** | **`tax.akanksha.dev`** | Short, professional, SEO-friendly, leaves room for ecosystem growth |
| **Styling** | Vanilla CSS + custom properties | Token-based design system, dark-mode-first |
| **Fonts** | System font stack | Zero LCP/CLS impact, instant rendering |
| **Analytics** | Cloudflare Web Analytics (free) | Privacy-respecting, bundled free, no paid add-on needed |
| **Data Storage** | localStorage + JSON export | No backend, zero privacy risk |
| **Tax Engine** | Pure TypeScript module | Framework-agnostic, testable, agent-parsable |
| **Project Name** | **TaxBrain** | Brand name; subdomain is `tax.akanksha.dev` |

---

## 🎯 What Makes This Different from Everything Else

| Existing Tools | TaxBrain |
|---|---|
| Input income → get tax number | Input CTC structure → get **optimized salary restructuring plan** |
| Compare two numbers | Explain **WHY** one regime wins and **AT WHAT POINT** the other becomes better |
| Static, one-time calculation | **Scenario simulator** with sliders: "What if I buy a house?" |
| Generic for everyone | **Personalized dashboard** with YOUR salary, YOUR actions |
| Calculator only | **Knowledge base** integrated with calculator |
| Desktop-only websites | Mobile-first, offline-capable, installable PWA |
| Vercel/Netlify with bandwidth limits | Cloudflare: **unlimited bandwidth, $0 forever** |

---

## 🚀 How to Use These Documents

### For Implementation (in this or a new session):
1. Read `AGENTS.md` (project root) for operating rules and context loading order
2. Read `VISION.md` for project vision and user profile
3. Read this file for technical decisions
4. Start with [05-implementation.md](05-implementation.md) for the build order
5. Reference [04-features.md](04-features.md) for what each screen should contain
6. Use `src/data/default-profile.ts` for sample profiles and empty profile template
7. Follow [03-architecture.md](03-architecture.md) for data model and component structure
8. Apply design patterns from [design-research-extracts.md](../research/design-research-extracts.md)
