# FlowMaster Website

Public marketing and distribution site for [FlowMaster](https://flowmaster.live) — an OBS recording automation tool built by Alenzie. Handles feature showcase, tiered license purchasing, beta invite validation, scout ambassador signups, and live stats.

Built with **Astro 5** + **Tailwind CSS v4**, deployed to **GitHub Pages** via GitHub Actions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro 5 (static site generation) |
| Styling | Tailwind CSS v4 |
| Backend / DB | Supabase Edge Functions (lives in separate repo) |
| Payments | Stripe (via Supabase edge function) |
| Deployment | GitHub Pages |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) |

---

## Related Repos

This repo is the **frontend only**. The backend lives separately:

- **`flowmaster-site`** (this repo) — Astro marketing site
- **`flowmastersuite`** — Supabase Edge Functions (Deno/TypeScript) + React 19 admin UI

If you're making changes that touch API calls (pricing, checkout, stats), you likely need both repos.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```sh
# Install dependencies
npm install

# Copy the example env file and fill in your values
cp .env.example .env

# Start the local dev server at http://localhost:4321
npm run dev
```

### All Commands

| Command | Action |
|---|---|
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro check` | Run TypeScript + Astro diagnostics |

---

## Environment Variables

See `.env.example` for all required variables. You need:

- **Stripe publishable key** — get from [dashboard.stripe.com](https://dashboard.stripe.com) under API keys (use the test key for local dev)
- **Supabase URL + anon key** — get from the Supabase project dashboard under Project Settings → API

> For production deployments, these must be set as **GitHub Actions secrets** in the repo settings so the build step can access them. See [GitHub docs on secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions).

---

## Project Structure

```
flowmaster-site/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── public/
│   ├── CNAME                   # Custom domain: flowmaster.live
│   ├── favicon.ico / favicon.svg
│   ├── og-image.png            # Social share image
│   └── docs/                   # Public documentation assets
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro    # Shared HTML shell, meta tags, OG
│   ├── pages/                  # One file = one route
│   │   ├── index.astro         # Home
│   │   ├── about.astro         # About Alenzie / FlowMaster
│   │   ├── features.astro      # Feature showcase
│   │   ├── pricing.astro       # Tiered license pricing
│   │   ├── future.astro        # Product roadmap
│   │   ├── download.astro      # Download page (Windows + coming soon)
│   │   ├── purchase-success.astro  # Post-checkout license key display
│   │   ├── 404.astro           # Custom 404
│   │   ├── invite/             # /invite — beta invite validation
│   │   ├── scout/              # /scout — ambassador signup flow
│   │   └── docs/               # /docs — documentation
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Button.astro
│   │   ├── LiveStats.astro     # Real-time stats (polls Supabase every 60s)
│   │   ├── TierSelector.astro  # Pricing carousel + Stripe checkout
│   │   ├── AnimatedLogo.astro  # Canvas-based logo animation
│   │   ├── ThreeStepAnimation.astro
│   │   ├── ConfettiBackground.astro
│   │   └── animations/         # Per-step animation subcomponents
│   ├── scripts/
│   │   └── logo-parallax.js
│   ├── styles/
│   │   └── global.css
│   └── types/
│       └── stripe.ts           # Stripe type definitions
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Pages / Routes

| Route | Purpose |
|---|---|
| `/` | Home — hero, live stats, how-it-works, features teaser, CTA |
| `/about` | Company story and mission |
| `/features` | Full feature breakdown with animations |
| `/pricing` | Tiered license tiers (fetches live data from Supabase at build + client-side) |
| `/future` | Product roadmap — 4 phases |
| `/download` | Platform download cards + attribution modal |
| `/purchase-success` | Post-Stripe-checkout license key reveal with confetti |
| `/invite` | Beta invite key validation and download unlock |
| `/scout` | Scout ambassador program signup flow |
| `/docs` | Product documentation |
| `/404` | Custom not-found page |

---

## Backend / API Integration

The site calls three **Supabase Edge Functions** (defined in `flowmastersuite`):

| Function | When | What it does |
|---|---|---|
| `get-tier-status` | Build time + every 30s client-side | Fetches tier pricing, availability, and claimed key counts |
| `create-checkout-session` | On purchase CTA click | Creates a Stripe Checkout session, returns redirect URL |
| `get-public-stats` | Every 60s client-side | Returns live download/user stats shown in the homepage counter |

---

## Deployment

Pushes to `main` automatically trigger a GitHub Actions build and deploy to GitHub Pages. The live site is served at [flowmaster.live](https://flowmaster.live) via the `public/CNAME` file.

To deploy manually, trigger the workflow from the **Actions** tab in GitHub.

The workflow file is at `.github/workflows/deploy.yml`.

---

## License Types

Current license tiers recognized by the system: `trial | beta | scout | supporter | pro | pioneer | early_adopter | believer | standard`
