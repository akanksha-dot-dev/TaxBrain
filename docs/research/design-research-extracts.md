# Design Research Extracts

> Key findings from extensive individual website research (18 documents, ~550KB) that directly apply to TaxBrain's implementation. This file exists so the original research folder can be safely deleted. Source documents referenced as DP-XX.

---

## Hosting & Infrastructure (from DP-02, DP-03)

### Cloudflare Pages (Verified July 2026)
- **Free tier:** Unlimited bandwidth and requests. 500 builds/month. 20,000 files/site. 100 custom domains/project
- **Edge network:** 300-330+ cities in 120-125+ countries (largest in industry)
- **Spike resilience:** 375GB spike month = $0. Vercel pauses site. Netlify charges ~$50. Every other platform charges $50-56
- **Pages → Workers migration:** Product is consolidating. No forced migration. Static sites unaffected
- **Preview deployments:** Unlimited, automatic per branch/PR
- **Analytics:** Free, privacy-respecting Web Analytics bundled

### DNS Setup for `tax.akanksha.dev`
- Add domain zone to Cloudflare → get two nameservers → set at registrar
- CNAME: `tax` → `taxbrain.pages.dev` (auto-configured when adding custom domain in Pages)
- SSL: Automatic, free
- If DNSSEC was active on old provider, disable BEFORE switching nameservers

### Deployment Config
- Framework preset: Astro (auto-detected)
- Build command: `npm run build`
- Build output: `dist`
- Wrangler CLI alternative: `npx wrangler pages deploy dist --project-name=taxbrain`

---

## Performance Standards (from DP-09)

### Targets (Half of Google's "Good" — achievable for static sites)
| Metric | Target | Google "Good" |
|---|---|---|
| LCP | < 1.5s | ≤ 2.5s |
| INP | < 100ms | ≤ 200ms |
| CLS | < 0.05 | ≤ 0.1 |
| Non-image weight | < 300KB | — |
| TTI on 3G | < 2s | — |
| Lighthouse Performance | ≥ 98 | — |

### Key Techniques
- **LCP image:** Use `fetchpriority="high"`, NEVER `loading="lazy"` on LCP element
- **Fonts:** System stack = zero network requests. If custom font needed later: one WOFF2 variable font, `font-display: optional` + preload
- **CSS:** Keep under ~15KB total (hand-authored). At that size, inline in `<head>` or serve as single `<link>`. No critical-CSS extraction needed
- **JS budget:** 0KB by default (Astro). Hard ceiling 5KB for nav toggle / theme switch. React islands load separately
- **Image format:** AVIF first, WebP fallback, via `<picture>`. Quality 60-70 AVIF, 75-85 WebP
- **Preload/preconnect:** Limit to 2-4 resources. Over-hinting wastes bandwidth. One test found removing unnecessary preloads = 0.9s faster render

### INP (Interaction to Next Paint)
- INP replaced FID as Core Web Vital (March 2024). Measures WORST interaction across entire visit
- 43% of sites still fail 200ms threshold in 2026
- Lighthouse reports TBT as proxy (can't measure INP in lab)
- Near-zero JS = near-zero INP risk by construction

### CLS (Cumulative Layout Shift)
- System fonts: zero swap shift
- All images: explicit `width` and `height` attributes
- No font-swap CLS if using system stack

---

## Visual Design Language (from DP-05)

### Current Trends (2026-27, verified against shipped production sites)
- **Dark mode as default:** 82-83% of consumers use dark mode. ~18% longer sessions
- **Token-based design systems:** Primitive → semantic → component architecture. "Infrastructure, not aesthetic"
- **Glassmorphism 2.0 (restrained):** Frosted-glass on nav bars and modals ONLY. 15-30% FPS drops on mid-tier Android when overused
- **OKLCH-authored color:** Perceptually uniform. Tailwind v4 uses it. Ship as hex/sRGB fallback
- **Grain/noise overlay:** 2-8% opacity SVG `feTurbulence`. Reads as "human-made" counter-signal to AI smoothness

### What's Dated (Avoid)
- Full-bleed autoplay background video
- Aggressive scroll-jacking parallax
- Generic stock photography as hero imagery
- Dark mode via CSS `invert()` (always broken)
- Heavy neumorphism
- 3D/WebGL heroes (800KB-2MB JS before first paint)

### Color System Architecture
Each system needs:
- 3 background levels: `bg-0` (canvas) → `bg-1` (card) → `bg-2` (modal)
- 3 text levels: `primary` (body/headings), `secondary` (supporting), `tertiary` (captions, 3:1 large-text only)
- 1 accent color + success/warning/danger/info semantic colors
- Every pair verified against WCAG 2 contrast formula (not eyeballed)

---

## Animation & Motion (from DP-07)

### Technology Choices for TaxBrain
- **CSS transitions/animations:** Default for 90% of interactions. Compositor-only
- **CSS scroll-driven animations:** `animation-timeline: view()`. ~85%+ support. Off main thread
- **View Transitions API:** 88.5% global. Cross-fade between pages = one CSS rule: `@view-transition { navigation: auto; }`
- **GSAP:** Now completely free (MIT) including ScrollTrigger, SplitText. Webflow acquired GreenSock Oct 2024, removed paywall April 2025

### Timing Standards
- **100-200ms:** Smallest feedback (hover, press)
- **300-500ms:** Visual distance (menus, panels)
- **`ease-out` for enter, `ease-in` for exit.** Symmetric `ease`/`linear` on UI motion = robotic feel
- **Never gate interaction.** Animation must never make user wait to complete their action

### Scroll Reveals
```css
.reveal {
  animation: fade-up linear both;
  animation-timeline: view();
  animation-range: cover 0% cover 30%;
}
@keyframes fade-up {
  from { opacity: 0; translate: 0 20px; }
}
```
Use `linear` timing (scroll position IS the easing). Gate behind `@supports (animation-timeline: view())`.

### `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Responsive Design (from DP-08)

### Breakpoint Strategy
- **Base (mobile):** 320px-767px — single column, bottom nav
- **Tablet:** 768px — sidebar appears, 2-column layouts
- **Desktop:** 1024px — full layout
- **Wide:** 1440px+ — max-width container

### Technology Stack
- **Grid:** Macro page structure
- **Flexbox:** Micro alignment inside grid areas
- **Container queries:** Reusable components in different contexts (~93-95% support)
- **`clamp()`:** Fluid typography

### Mobile-First Pattern
```css
/* Base = mobile */
.layout { display: block; }

/* Tablet+ */
@media (min-width: 768px) {
  .layout { display: grid; grid-template-columns: 260px 1fr; }
}
```

---

## SEO & AI Discoverability (from DP-10)

### Static HTML = Best SEO
- Most AI crawlers do NOT execute JavaScript. Client-rendered content = blank page for Perplexity, ChatGPT, Claude
- Astro's static HTML output is inherently AI-crawlable

### Structured Data (JSON-LD)
- Use `@graph` + `@id` pattern for linked entities
- `Person` schema on homepage with `sameAs` pointing to GitHub, LinkedIn
- `WebApplication` schema for the calculator
- `Article` schema for knowledge base posts
- `FAQPage` markup still parsed by AI engines (Google removed visual dropdown May 2026, but schema still used)

### GEO (Generative Engine Optimization)
- 76% of AI Overview citations from top-10 results fell to 38% by 2026
- Personal sites compete on: specificity, first-hand experience, freshness, clean structure
- Entity Home: one canonical URL as source of truth about the person

### `llms.txt` File
Place at site root. Markdown format. Points AI agents to key content:
```markdown
# TaxBrain
> Indian tax intelligence platform for salaried professionals

## Documentation
- [Tax Rules](https://tax.akanksha.dev/knowledge/): Complete knowledge base
- [Calculator](https://tax.akanksha.dev/calculator/): Interactive tax calculator
```

---

## Security & Privacy (from DP-12)

### Security Headers (`public/_headers`)
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
```

### Privacy Architecture
- Zero cookies, zero localStorage tracking, zero fingerprinting
- No Google Fonts CDN (sends visitor IP to Google — Munich court Jan 2022)
- No reCAPTCHA (sends behavioral data to Google)
- Cloudflare Analytics is the only external integration (dashboard-level, not in our code)
- No cookie consent banner needed (we have literally nothing to consent to)

### Analytics: Cloudflare Web Analytics
- Free, bundled with Cloudflare
- Privacy-respecting: no cookies, no client-side JS (added via Cloudflare dashboard, not our code)
- No personal data collection

---

## Accessibility (from DP-11)

### WCAG 2.2 AA Compliance
- **Contrast:** 4.5:1 for normal text, 3:1 for large text (≥18pt or ≥14pt bold)
- **Focus indicators:** Visible, 2px solid outline on all interactive elements
- **Keyboard navigation:** All functionality accessible via keyboard
- **Skip links:** "Skip to main content" as first focusable element
- **Landmarks:** `<header>`, `<nav>`, `<main>`, `<footer>` with appropriate `aria-label`
- **Form labels:** Every input has an associated `<label>`
- **Error messages:** Linked to inputs via `aria-describedby`
- **Reduced motion:** Respect `prefers-reduced-motion`
- **Color independence:** Never convey information by color alone (add icons/text)
