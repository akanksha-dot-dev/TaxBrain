# 02 — Technology Stack Analysis (UPDATED)

## The Core Question: What Framework Should TaxBrain Use?

This analysis evaluates four options from **first principles**, scoring each against the actual requirements of TaxBrain.

---

## TaxBrain's Actual Requirements

| Requirement | Priority | Description |
|---|---|---|
| **R1: Content-heavy pages** | 🔴 Must | Knowledge base with 20+ articles on tax rules, deductions, strategies |
| **R2: Highly interactive calculators** | 🔴 Must | Real-time salary calculator, regime comparison, with 15+ input fields |
| **R3: Scenario simulator** | 🔴 Must | Interactive sliders with live chart updates |
| **R4: Client-side only** | 🔴 Must | No backend, no database, no user accounts |
| **R5: SEO optimized** | 🟡 Should | For knowledge base pages to be discoverable via Google |
| **R6: AI agent parsable** | 🟡 Should | Clean code structure that any AI agent can read and modify |
| **R7: Fast performance** | 🟡 Should | Instant load, no spinner on calculation |
| **R8: Free hosting** | 🟡 Should | Deployable at zero cost with unlimited bandwidth |
| **R9: Future maintainable** | 🟡 Should | Tax laws change annually; updates must be simple |
| **R10: Mobile responsive** | 🟡 Should | Works beautifully on phones |
| **R11: PWA / Installable** | 🟢 Nice | Can be installed on phone home screen |
| **R12: Offline capable** | 🟢 Nice | Works without internet after first load |

---

## Framework Comparison

### Option 1: Vanilla HTML/CSS/JS

| Criterion | Score | Analysis |
|---|---|---|
| R1: Content pages | ⭐⭐ | Manual HTML for every page. No templating, no components. Knowledge base becomes copy-paste hell |
| R2: Interactive calc | ⭐⭐⭐ | Works, but managing complex state (15+ inputs → live output) in vanilla JS becomes messy fast |
| R3: Simulator | ⭐⭐ | Canvas/SVG charts by hand. Doable but painful |
| R4: Client-side | ⭐⭐⭐⭐⭐ | Perfect. Zero server needed |
| R5: SEO | ⭐⭐⭐⭐⭐ | Native HTML = best SEO possible |
| R6: AI parsable | ⭐⭐⭐⭐ | Simple files. But lacks structured architecture for large codebases |
| R7: Performance | ⭐⭐⭐⭐⭐ | Zero overhead |
| R8: Hosting | ⭐⭐⭐⭐⭐ | Any static host, even file:// |
| R9: Maintainable | ⭐⭐ | No component reuse. Changing a shared element means editing 20+ files |
| R10: Mobile | ⭐⭐⭐⭐ | Manual CSS media queries |
| **Total** | **37/50** | |

**Verdict**: Good for tiny projects. TaxBrain has 5+ pages, 20+ interactive elements, and a knowledge base — vanilla becomes spaghetti code fast. **Not the right choice.**

---

### Option 2: Vite + React (SPA)

| Criterion | Score | Analysis |
|---|---|---|
| R1: Content pages | ⭐⭐⭐ | React components work, but knowledge base articles are verbose as JSX |
| R2: Interactive calc | ⭐⭐⭐⭐⭐ | React excels at complex, stateful UIs |
| R3: Simulator | ⭐⭐⭐⭐⭐ | React state + Canvas = perfect |
| R4: Client-side | ⭐⭐⭐⭐⭐ | Vite builds a static SPA bundle |
| R5: SEO | ⭐⭐ | SPA = client-rendered. Knowledge base won't rank well |
| R6: AI parsable | ⭐⭐⭐⭐ | Well-structured but React-specific patterns add cognitive load |
| R7: Performance | ⭐⭐⭐ | Ships React runtime (~40KB). Entire app loads even if user only wants the calculator |
| R8: Hosting | ⭐⭐⭐⭐⭐ | Static build → any host |
| R9: Maintainable | ⭐⭐⭐⭐ | Components are reusable |
| R10: Mobile | ⭐⭐⭐⭐ | Standard responsive |
| **Total** | **41/50** | |

**Verdict**: Great for the calculator/simulator, overkill for the knowledge base. Ships unnecessary JS for static content. **Good but not optimal.**

---

### Option 3: Next.js (Full-Stack)

| Criterion | Score | Analysis |
|---|---|---|
| R1: Content pages | ⭐⭐⭐⭐⭐ | MDX support, static generation |
| R2: Interactive calc | ⭐⭐⭐⭐⭐ | Full React ecosystem |
| R3: Simulator | ⭐⭐⭐⭐⭐ | Full React ecosystem |
| R4: Client-side | ⭐⭐⭐ | CAN be fully static, but Next.js nudges toward server features |
| R5: SEO | ⭐⭐⭐⭐⭐ | SSG/SSR = perfect SEO |
| R6: AI parsable | ⭐⭐⭐ | Complex: app router, server/client components, middleware |
| R7: Performance | ⭐⭐⭐ | Ships React runtime + Next.js hydration. Over-architected for client-only tool |
| R8: Hosting | ⭐⭐⭐⭐ | Best on Vercel, but Vercel has ToS/billing concerns (see hosting analysis) |
| R9: Maintainable | ⭐⭐⭐⭐ | Good architecture, but version upgrades can be painful |
| R10: Mobile | ⭐⭐⭐⭐ | Standard responsive |
| **Total** | **41/50** | |

**Verdict**: Over-engineered. TaxBrain needs ZERO server-side features. Next.js on Vercel also carries Hobby ToS and billing risk. **Not the right choice.**

---

### Option 4: Astro (latest) + React Islands ⭐ WINNER

| Criterion | Score | Analysis |
|---|---|---|
| R1: Content pages | ⭐⭐⭐⭐⭐ | **Built for this.** Content Collections + MDX = zero JS for articles |
| R2: Interactive calc | ⭐⭐⭐⭐⭐ | React components as "islands" — `<Calculator client:load />` |
| R3: Simulator | ⭐⭐⭐⭐⭐ | React island with full state management |
| R4: Client-side | ⭐⭐⭐⭐⭐ | Static-first by design. Output = HTML/CSS/JS |
| R5: SEO | ⭐⭐⭐⭐⭐ | **Best in class.** All pages are pre-rendered HTML |
| R6: AI parsable | ⭐⭐⭐⭐⭐ | Explicit agentic support, MCP server, `.astro` files are basically HTML |
| R7: Performance | ⭐⭐⭐⭐⭐ | **Zero JS by default.** Only calculators ship JS. 40-60% less than React SPA |
| R8: Hosting | ⭐⭐⭐⭐⭐ | Static output → Cloudflare Pages (perfect match, see hosting doc) |
| R9: Maintainable | ⭐⭐⭐⭐⭐ | Content = Markdown. Logic = TypeScript. Tax updates = edit one `.ts` file |
| R10: Mobile | ⭐⭐⭐⭐ | Standard responsive |
| **Total** | **49/50** | |

### Why Astro Wins — The First-Principles Argument

TaxBrain is fundamentally **two things**:

1. **A content site** (knowledge base, tax guides) → needs static HTML, zero JS, perfect SEO
2. **An interactive tool** (calculator, simulator) → needs JavaScript, state management, reactivity

Astro's **Island Architecture** serves both perfectly:
- Knowledge base articles ship **0 bytes of JavaScript** — pure HTML
- Calculator/simulator components hydrate as React islands — JS loads **only for those widgets**
- No other framework offers this split without compromise

**Additional factor from existing research (DP-USYN)**: Your individual website research confirms Astro as the recommended framework for "any site needing interactive components" with Content Collections and Zod-validated frontmatter. Cloudflare acquired Astro in January 2026, ensuring strong funding runway and first-class Cloudflare Pages integration.

---

## Hosting Decision: Cloudflare Pages ⭐ (Not Vercel)

### Why Cloudflare Pages over Vercel — Evidence from Your Own Research

Your existing hosting research ([DP-02-hosting-infrastructure.md](file:///d:/temp/tax_saving/individual%20website%20research/decisions/DP-02-hosting-infrastructure.md)) conducted rigorous, source-verified analysis of every hosting platform. The conclusion was **definitive**:

> *"Cloudflare Pages is the clearest fit... the only platform in this entire report where $0/month and spike-proof are the same answer."*

| Factor | Cloudflare Pages | Vercel |
|---|---|---|
| **Free bandwidth** | **Unlimited** — no GB cap, verified on official docs | 100GB/month, then **site pauses** |
| **Spike resilience** | $0 at 375GB/month spike | Site goes **dark** on free tier during the exact moment it gets attention |
| **Commercial use** | ✅ No restriction | ❌ **Hobby tier = non-commercial only** per ToS. A "hire me" page may violate this |
| **Edge network** | **300-330+ cities, 120-125+ countries** — largest in this comparison | 126 PoPs, 94 cities, 51 countries |
| **Analytics** | Free, privacy-respecting, bundled | Paid add-on |
| **Billing risk** | **None** — free is genuinely free, forever | **Documented $1K-$23K surprise bills** on Pro tier (no default spend cap) |
| **HTTPS** | Free, automatic, unlimited | Free, automatic |
| **Preview URLs** | Unlimited, automatic per PR | Automatic per PR |
| **Security** | Clean record | April 2026 security incident — third-party AI tool compromised employee access |
| **Astro support** | **First-class** — Cloudflare acquired Astro (Jan 2026). Framework auto-detected | Good generic support |

### The Decisive Evidence (from DP-02 stress test):

At a **300K visitor spike** (375GB in one month):
- **Cloudflare**: **$0**, no action needed, site stays up
- **Vercel Hobby**: Site **pauses for the rest of the month** at exactly the wrong time
- **Vercel Pro ($20/mo)**: Fine at 375GB, but you're paying $20/mo permanently for insurance
- **Netlify**: ~$50 that month on top of $20 base
- **Every other platform**: $50-$56 in bandwidth charges

**Cloudflare is the only platform where success doesn't cost money.**

### Honest trade-offs (acknowledged):
- Dashboard/Wrangler CLI has a steeper learning curve than Vercel
- Product is mid-transition from "Pages" branding to "Workers + Static Assets" (no forced migration for existing sites)
- For pure developer experience, Vercel is smoother — but the financial/ToS/performance advantages of Cloudflare outweigh this

---

## Subdomain & Domain Strategy

### Domain: `akanksha.dev`

Your `.dev` TLD is a good choice per your research (DP-03):
- Signals technical credibility
- HSTS-preloaded (HTTPS-only) — a feature, not a limitation for production
- Google-operated registry, stable

### Subdomain Name: `tax.akanksha.dev` ⭐

| Option | URL | Verdict |
|---|---|---|
| `tax.akanksha.dev` | ⭐ **Winner** | Short, clean, professional. "Tax" is immediately understood. Memorable, easy to type on mobile. SEO-friendly for "tax calculator" searches |
| `taxbrain.akanksha.dev` | Good | More branded, but longer to type. Works as a project name, less natural as a URL |
| `calc.akanksha.dev` | Decent | Too generic — could be any calculator |
| `taxcalc.akanksha.dev` | Decent | Descriptive but longer. Not as clean as `tax` |
| `plan.akanksha.dev` | Too vague | Could be project planning, event planning, etc. |

**Final choice: `tax.akanksha.dev`**

This is clean, authoritative, and leaves room for `blog.akanksha.dev`, `projects.akanksha.dev`, etc. as your personal site ecosystem grows. The project itself is still called "TaxBrain" as its brand name.

### DNS Setup (from DP-03 research):

Since your domain is on `.dev` (Google registry, HSTS-preloaded):

1. **Ensure DNS is on Cloudflare** (your research already recommends this)
2. **Add CNAME record**: `tax` → `taxbrain.pages.dev` (Cloudflare Pages auto-configures this when you add the custom domain)
3. **SSL**: Automatic, free, handled by Cloudflare
4. **No A records needed** — CNAME is sufficient for a subdomain

---

## Final Stack Decision (UPDATED)

```
┌──────────────────────────────────────────┐
│          TECHNOLOGY STACK                │
├──────────────────────────────────────────┤
│  Framework:    Astro (latest)           │
│  Islands:      React 19                 │
│  Language:     TypeScript (strict)       │
│  Styling:      Vanilla CSS              │
│  Tax Engine:   Pure TypeScript module    │
│  Data Store:   localStorage             │
│  Fonts:        System stack (zero cost)  │
│  Charts:       Lightweight Canvas/SVG    │
│  Hosting:      Cloudflare Pages (free)   │
│  DNS:          Cloudflare DNS (free)     │
│  Domain:       tax.akanksha.dev          │
│  Analytics:    Cloudflare Analytics(free)│
│  CI/CD:        GitHub → CF auto-deploy   │
│  Package Mgr:  npm                       │
└──────────────────────────────────────────┘
```

### Font Decision (from DP-09 performance research):

Your existing performance research recommends **system font stack** as the default:
> *"Zero network requests, zero swap risk, zero CLS risk, zero LCP delay. For a personal site where brand differentiation from a specific typeface is a 'nice to have' rather than a requirement, this eliminates an entire category of risk."*

For TaxBrain, this is the right call — the UI's intelligence (tax calculations, charts, recommendations) IS the brand, not a specific typeface. System fonts load instantly and look native on every device.

If a custom font is desired later, the research recommends: one self-hosted, subsetted WOFF2 variable font with `font-display: optional` paired with `<link rel="preload">`.

### Performance Targets (from DP-09):

| Metric | Target | Why achievable |
|---|---|---|
| LCP | < 1.5s | Static HTML from Cloudflare's 300+ PoP edge. No render-blocking JS |
| INP | < 100ms | Near-zero JS outside React islands. Islands don't block main thread |
| CLS | < 0.05 | System fonts (no swap shift). Explicit width/height on all elements |
| Total non-image weight | < 300KB | Astro ships 0KB JS by default. Only calculator components add JS |
| Lighthouse Performance | ≥ 98 | Static site on world's largest CDN |
