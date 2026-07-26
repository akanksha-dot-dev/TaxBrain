# TaxBrain — Indian Tax Intelligence Platform

> **Live at:** `tax.akanksha.dev` (coming soon)

A personal tax intelligence platform that helps Indian salaried professionals optimize their tax liability through salary restructuring, regime comparison, scenario simulation, and actionable knowledge — all running 100% client-side with zero data sent to any server.

## Quick Start

```bash
npm install
npm run dev
```

## Project Structure

```
├── src/
│   ├── pages/           # Astro pages (static HTML)
│   ├── components/      # Astro + React components
│   │   └── islands/     # React islands (interactive)
│   ├── lib/             # Core logic (framework-agnostic)
│   │   ├── tax-engine.ts    # ALL tax calculations
│   │   ├── tax-rules.ts     # Tax slab/deduction data
│   │   ├── profile-store.ts # localStorage manager
│   │   └── types.ts         # TypeScript interfaces
│   ├── content/         # Astro Content Collections (knowledge base)
│   ├── data/            # Default profile data
│   └── styles/          # Global CSS
├── public/              # Static assets
├── docs/                # Project documentation
│   ├── plan/            # Implementation plan (7 files)
│   └── research/        # Design research extracts
└── AGENTS.md            # Agent operating instructions
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro (latest) + React (Islands) |
| Language | TypeScript (strict) |
| Styling | Vanilla CSS (token-based, dark-first) |
| Hosting | Cloudflare Pages (free, unlimited bandwidth) |
| DNS | Cloudflare DNS |
| Analytics | Cloudflare Web Analytics (free, privacy-respecting) |
| Data | localStorage (zero backend) |

## Key Features

- **Dual Regime Comparison** — Compare New vs Old tax regime with detailed slab-by-slab breakdown
- **Salary Structure Optimizer** — Restructure CTC for maximum savings (NPS, meal vouchers, phone reimbursement)
- **Multi-Job Income Combiner** — For job switchers: combine two employer incomes in one FY
- **Scenario Simulator** — Interactive sliders: "What if I buy a house?" "What if I get a raise?"
- **Break-Even Finder** — Exact point where one regime becomes better than the other
- **Knowledge Base** — 15+ articles on Indian tax concepts, linked to relevant calculators
- **Action Tracker** — Personalized, persistent checklist of tax-saving actions

## Documentation

| Document | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Instructions for AI coding agents |
| [VISION.md](VISION.md) | Project vision and principles |
| [docs/plan/](docs/plan/) | Detailed implementation plan (7 files) |

## License

MIT
