# Flowmaster — Complete Codebase Documentation

> Comprehensive code-level and product-level documentation covering all three repositories:
> `flowmaster-site`, `flowmastersuite` (desktop app + edge functions), and `admin-ui`.
> Includes architecture, features, brand identity, competitive positioning, and roadmap — everything needed for a website redesign.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [flowmaster-site — Marketing Website](#3-flowmaster-site--marketing-website)
4. [flowmastersuite — Desktop App (Rust/Tauri)](#4-flowmastersuite--desktop-app-rusttauri)
5. [flowmastersuite — Desktop App Frontend (Vanilla JS)](#5-flowmastersuite--desktop-app-frontend-vanilla-js)
6. [Supabase Backend — Edge Functions](#6-supabase-backend--edge-functions)
7. [Supabase Backend — Database Schema](#7-supabase-backend--database-schema)
8. [Admin UI — React Dashboard](#8-admin-ui--react-dashboard)
9. [Key System Flows](#9-key-system-flows)
10. [Authentication & Security](#10-authentication--security)
11. [CI/CD & Deployment](#11-cicd--deployment)
12. [Product Features & User Experience](#12-product-features--user-experience)
13. [Brand Identity & Marketing](#13-brand-identity--marketing)
14. [Competitive Positioning & Target Audience](#14-competitive-positioning--target-audience)
15. [Product Roadmap & Vision](#15-product-roadmap--vision)

---

## 1. System Overview

Flowmaster is a **video editing automation tool** for content creators. Users press a hotkey (default F9) during gameplay/recording to mark timestamps, then the app extracts highlights, cleans up source files, and generates editor-ready projects.

The system consists of:

| Component | Repo/Path | Tech | Purpose |
|-----------|-----------|------|---------|
| **Marketing Site** | `flowmaster-site` | Astro 5, Tailwind v4 | Public website at flowmaster.live |
| **Desktop App (backend)** | `flowmastersuite/src-tauri` | Rust, Tauri 2.9 | Core video processing, OBS integration, licensing |
| **Desktop App (frontend)** | `flowmastersuite/src` | Vanilla JS, HTML/CSS | 3-tab UI (Mark, Clip, Clean) |
| **Edge Functions** | `flowmastersuite/supabase/functions` | Deno/TypeScript | 35+ serverless API endpoints |
| **Database** | `flowmastersuite/supabase/migrations` | PostgreSQL (Supabase) | 15 tables, 17 migrations |
| **Admin Dashboard** | `flowmastersuite/admin-ui` | React 19, Vite 7, Tailwind v4 | License/user/scout management |

---

## 2. Architecture & Tech Stack

### Data Flow

```
User's Machine                  Supabase Cloud                    Admin
┌─────────────┐                ┌──────────────────┐            ┌──────────┐
│ Tauri App   │ ──HTTP──────── │ Edge Functions   │ ◄───────── │ Admin UI │
│ (Rust +     │                │ (35+ endpoints)  │            │ (React)  │
│  Vanilla JS)│                ├──────────────────┤            └──────────┘
└─────────────┘                │ PostgreSQL DB    │
                               │ (15 tables, RLS) │
┌─────────────┐                ├──────────────────┤
│ Website     │ ──HTTP──────── │ Supabase Auth    │
│ (Astro SSG) │                └──────────────────┘
└─────────────┘                         │
                                        │ Webhooks
                                ┌───────┴───────┐
                                │    Stripe     │
                                └───────────────┘
```

### Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop Backend | Rust + Tauri | 2.9.5 |
| Desktop Frontend | Vanilla JS + HTML/CSS | — |
| Marketing Site | Astro | 5.16 |
| Admin Dashboard | React + TypeScript | 19.2 |
| CSS Framework | Tailwind CSS | v4.1 |
| Build Tool | Vite | 7.2 |
| Database | PostgreSQL (Supabase) | — |
| API Layer | Supabase Edge Functions (Deno) | — |
| Auth | Supabase Auth | — |
| Payments | Stripe | API v2023-10-16 |
| Video Processing | FFmpeg (bundled) | 7.x |
| OBS Integration | obws (WebSocket) | 0.12 |
| Encryption | AES-256-GCM, PBKDF2, HMAC-SHA256 | — |
| Installer | NSIS (Windows) | — |
| CI/CD | GitHub Actions | — |
| Hosting (site) | GitHub Pages | — |

---

## 3. flowmaster-site — Marketing Website

**Location:** `/mnt/c/Users/alexb/Desktop/Dev Stuff/flowmaster-site`
**Live URL:** https://flowmaster.live
**Framework:** Astro 5.16 (static site generation)

### 3.1 Project Structure

```
flowmaster-site/
├── src/
│   ├── pages/              # 15 routes
│   ├── components/         # 19 Astro components
│   ├── layouts/            # BaseLayout.astro
│   ├── styles/             # global.css, logo-animation.css
│   ├── scripts/            # logo-parallax.js
│   ├── assets/             # Mobile mockup images
│   └── types/              # stripe.ts
├── public/                 # Favicon, OG image, CNAME
├── .github/workflows/      # deploy.yml (GitHub Pages)
├── astro.config.mjs        # Site: flowmaster.live, Tailwind v4
├── package.json            # Astro + Tailwind + Stripe.js
└── .env                    # PUBLIC_STRIPE_*, PUBLIC_SUPABASE_*
```

### 3.2 Page Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `pages/index.astro` | Homepage — Hero, LiveStats, ThreeStepAnimation, HowItWorks, Features, Testimonials, CTA |
| `/pricing` | `pages/pricing.astro` | Tiered pricing with arcade-style TierSelector carousel |
| `/download` | `pages/download.astro` | Platform download cards, system requirements, attribution modal |
| `/features` | `pages/features.astro` | 7 core features with detailed descriptions |
| `/future` | `pages/future.astro` | 4-phase roadmap with mobile app mockups |
| `/about` | `pages/about.astro` | Company/creator story |
| `/docs` | `pages/docs/index.astro` | 6-step getting started guide |
| `/docs/obs-setup` | `pages/docs/obs-setup.astro` | OBS Studio setup walkthrough |
| `/invite` | `pages/invite/index.astro` | Beta invite code validation + key reveal |
| `/scout` | `pages/scout/index.astro` | Scout recruitment — email collection with conduct guidelines |
| `/scout/email-sent` | `pages/scout/email-sent.astro` | Magic link confirmation screen |
| `/scout/complete` | `pages/scout/complete.astro` | Scout profile form (username, display name, Discord) |
| `/scout/welcome` | `pages/scout/welcome.astro` | Post-signup welcome with scout key |
| `/purchase-success` | `pages/purchase-success.astro` | Post-Stripe key reveal with confetti |
| `/404` | `pages/404.astro` | Error page |

### 3.3 Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| `TierSelector.astro` | 1047 | Arcade-style pricing carousel with live data refresh (30s), particle background, Stripe checkout integration |
| `TimelineRangeAnimation.astro` | 680 | Complex 14-second SVG timeline animation showing the mark → clip → merge workflow |
| `LiveStats.astro` | 268 | Real-time stats dashboard fetching from `get-public-stats` edge function every 60s |
| `ScoutConductModal.astro` | 245 | Scout guidelines modal with DO/DON'T lists, transparency requirements |
| `AutoCutAnimation.astro` | 234 | Film strip + scissors cutting animation for the Clip step |
| `Hero.astro` | 209 | Two-column hero with parallax text sway, staggered fade-in, bounce scroll indicator |
| `ThreeStepAnimation.astro` | 180 | Three-column step cards (Mark/Clip/Clean) with scroll-triggered entrance + parallax |
| `AnimatedLogo.astro` | 150 | 5-element intro animation (3 colored squares + text) with breathing + pulse sequences |
| `Testimonials.astro` | 121 | 5-creator testimonial carousel with dot navigation |
| `Header.astro` | 106 | Fixed nav with IntersectionObserver hero fade, mobile hamburger |
| `AutoCleanAnimation.astro` | 100 | Storage bar shrinking + file fade animation |
| `Footer.astro` | 88 | Three-column footer with links and social |
| `FuturePreview.astro` | 80 | Roadmap preview with bullet features |
| `RecordAnimation.astro` | 76 | F9 key press pulse animation |
| `ConfettiBackground.astro` | 68 | CSS-only ambient particle background |
| `FeaturesPreview.astro` | 59 | 4-feature grid with hover effects |
| `HowItWorks.astro` | 44 | 3-step static workflow overview |
| `Button.astro` | 41 | Reusable button (primary/secondary, sm/md/lg) |
| `CTASection.astro` | 30 | "Ready to Transform Your Workflow?" CTA |

### 3.4 Design System

**Colors (CSS custom properties in `global.css`):**
- Backgrounds: `#101010` (primary), `#1a1a1a` (secondary), `#252525` (tertiary)
- Brand red: `#f43f43` / bright: `#ff5959`
- Step colors: Record `#f43f43`, Clip `#f5d440`, Clean `#6be553`
- Accent mint: `#55ffa2`

**Typography:**
- Headings: Space Grotesk (500/600/700)
- Body: Inter (400/500/600/700)

**Body Background:** Carbon fiber texture pattern (diagonal lines at 45deg, 4px tile)

### 3.5 Edge Function Calls from Site

| Function | Called From | Method | Purpose |
|----------|-----------|--------|---------|
| `get-public-stats` | LiveStats.astro | GET | Active user counts (24h/7d/14d) |
| `get-tier-status` | pricing.astro, TierSelector.astro | POST | Tier inventory and current tier |
| `create-checkout-session` | TierSelector.astro | POST | Initiate Stripe payment |
| `get-purchase-key` | purchase-success.astro | POST | Retrieve license after payment |
| `validate-invite-link` | invite/index.astro | POST | Validate beta invite code |
| `validate-scout-invite` | scout/index.astro | POST | Validate scout invite code |
| `initiate-scout-signup` | scout/index.astro | POST | Send magic link email |
| `complete-scout-registration` | scout/complete.astro | POST | Complete scout profile |

### 3.6 Deployment

- **Host:** GitHub Pages
- **Workflow:** `.github/workflows/deploy.yml` — triggers on push to `main`
- **Process:** Checkout → Node 20 → `npm ci` → `npm run build` → Upload to Pages
- **Domain:** `flowmaster.live` (via `public/CNAME`)

---

## 4. flowmastersuite — Desktop App (Rust/Tauri)

**Location:** `/mnt/c/Users/alexb/Desktop/Dev Stuff/flowmastersuite/src-tauri`
**Framework:** Tauri 2.9.5 with Rust 1.77.2+
**Window:** 1100x750px (min 900x650)
**App ID:** `live.flowmaster.studio`

### 4.1 Module Architecture

```
src-tauri/src/
├── main.rs                      # Entry point → lib::run()
├── lib.rs (85KB)                # Central hub — 60+ Tauri commands, event listeners, app setup
│
├── Authentication & Licensing
│   ├── key_manager.rs (51KB)    # V4 license validation, startup checks, offline grace
│   ├── trial_v4.rs (15KB)       # Usage-based trial (16 actions max)
│   ├── beta_auth.rs             # Supabase Auth (email/password, magic links)
│   ├── encrypted_cache.rs       # AES-256-GCM + HMAC offline license cache
│   ├── clock_guard.rs (10KB)    # Clock tamper detection
│   ├── machine_id.rs (10KB)     # Hardware fingerprinting (5 sources, SHA-256)
│   ├── activity_tracker.rs      # Fire-and-forget telemetry to Supabase
│   ├── supabase_client.rs       # HTTP client + header builders
│   └── supabase_config.rs       # Compile-time credentials via env!()
│
├── Video Processing
│   ├── video_processor.rs       # 9-stage processing pipeline
│   ├── ffmpeg_processor.rs      # Native FFmpeg wrappers (remux, concat)
│   ├── autocut.rs (31KB)        # Python CLI bridge for highlight extraction
│   ├── autoclean.rs (31KB)      # Scan + recycle bin cleanup
│   ├── file_matcher.rs          # Flexible file matching (±30s tolerance)
│   └── range_calculator.rs      # Merge overlapping timestamp ranges
│
├── Project Assembly (Editor Integration)
│   ├── project_assembler.rs     # Unified assembly logic
│   ├── mark_assembler.rs        # Full video + markers project
│   ├── clip_assembler.rs        # Extracted highlights project
│   ├── export_orchestrator.rs   # Format routing by editor profile
│   ├── export_csv.rs            # CSV markers
│   ├── export_edl.rs            # EDL timeline
│   ├── export_fcp7xml.rs        # FCP7 XML (Premiere Pro)
│   └── export_fcpxml.rs         # FCPXML (DaVinci/Final Cut)
│
├── OBS Integration
│   ├── obs/connection.rs (12KB) # WebSocket connection (port 4455)
│   ├── obs/events.rs (11KB)     # Recording/streaming event handlers
│   └── obs/sources.rs           # Webcam + source detection
│
├── Recording
│   ├── timestamp.rs             # Session management, .txt mark files
│   ├── duration_monitor.rs      # Real-time recording duration
│   └── hotkey.rs                # Global hotkey (F1-F12, letters, combos)
│
├── System
│   ├── config.rs (32KB)         # All user settings + JSON persistence
│   ├── updater.rs (21KB)        # Auto-update (GitHub releases, stable/canary channels)
│   ├── tray.rs                  # System tray with dynamic icon + context menu
│   ├── window_styling.rs        # DWM border coloring (Windows 11)
│   ├── webview_permissions.rs   # Auto-grant microphone for WebView2
│   ├── diagnostics.rs           # Debug log export
│   └── resources.rs             # Resource path resolution
```

### 4.2 Key Manager — License Validation Flow

The `key_manager.rs` (51KB) is the heart of the licensing system:

```
run_startup_check()
  │
  ├─ 1. Check encrypted local cache (AES-256-GCM)
  │     └─ Valid cache + within offline grace? → Return cached result
  │
  ├─ 2. Generate machine fingerprint (SHA-256 of 5 hardware sources)
  │     └─ CPU info, disk serial, MAC address, Windows Product ID, motherboard serial
  │
  ├─ 3. Register machine with Supabase (/functions/v1/machines-register)
  │     └─ Returns machine_id, is_new, trial_completed
  │
  ├─ 4. Validate license key (/functions/v1/licenses-validate)
  │     └─ Checks: revocation, expiry, machine match, blocked status
  │
  └─ 5. Return StartupResult
        ├─ Ok { key_type, trial_remaining, emblem_color, emblem_label, offline }
        ├─ TrialGranted { trial_actions_total: 16 }
        ├─ KeyActivated { key, key_type }
        ├─ Expired | Revoked | WrongMachine
        ├─ OfflineExpired | ClockTamper | CacheCorrupted
        └─ TrialAlreadyUsed | NeedsInternet
```

**Offline Grace Periods:**
- Trial: 7 days
- Beta/Supporter/Scout: 30 days

**Trial System (16 actions):**
- Action types: `RecordingSession`, `ProjectAssembly`, `ClipExtraction`
- Emblem colors: Green (0-10 used), Yellow (11-13), Red (14-16)

### 4.3 Hardware Fingerprinting

`machine_id.rs` generates a SHA-256 fingerprint from 5 hardware sources (requires 3+ for validity):

1. CPU brand + core count (via `sysinfo`)
2. Disk serial (via WMI `diskdrive` query)
3. Primary MAC address (via `mac_address` crate)
4. Windows Product ID (via registry)
5. Motherboard serial (via WMI)

### 4.4 OBS WebSocket Integration

- Connects to OBS Studio via WebSocket (default port 4455)
- Connection states: `Disconnected → Connecting → Connected → Recording/Streaming/Paused`
- Auto-reconnect with exponential backoff
- Queries: recording folder, recording status, video/audio sources
- Events: recording started/stopped → auto-start/stop timestamp sessions

### 4.5 Video Processing Pipeline

1. **Mark Phase:** User presses hotkey → timestamp logged to .txt file
2. **Clip Phase:** `autocut.rs` spawns Python CLI → FFmpeg extracts highlights using lookback window
3. **Clean Phase:** `autoclean.rs` scans for processed files → moves originals to Recycle Bin
4. **Assembly Phase:** Generates editor-ready projects (Premiere/DaVinci/FCP)

**Export Formats by Editor Profile:**
| Profile | Formats Generated |
|---------|-------------------|
| Basic | TXT markers |
| Premiere Pro | FCP7 XML + EDL + CSV + TXT |
| DaVinci Resolve | FCPXML + EDL + CSV + TXT |
| Final Cut Pro | FCPXML + EDL + CSV + TXT |

### 4.6 Configuration (`config.rs`)

Persisted as JSON with settings for:
- OBS connection (port, password)
- Recordings directory
- Hotkey binding (e.g. "F9", "Ctrl+Shift+K")
- Lookback seconds (5-300, default 60)
- Color theme (midnight, daylight, cobalt, arctic, dusk, etc.)
- Webcam mode (none, combined, separate)
- Editor profile (Basic, Premiere, DaVinci, FinalCut)
- Sound toggles (20+ audio event toggles)
- Update channel (stable, canary)
- Launch on startup, window state

### 4.7 Auto-Update System

- Endpoint: GitHub releases `latest-update/latest.json`
- Supports stable and canary channels
- Mandatory update enforcement
- Rate limiting (3600s between checks)
- Post-update: extends beta key expiry

### 4.8 Crash Recovery (Phase 6)

1. Check for `.rollback_marker` on startup
2. Track crash sentinel file
3. 3+ consecutive crashes → rollback to previous version
4. Config auto-backup on corruption detection

### 4.9 Tauri Commands (60+)

The Rust backend exposes 60+ commands to the frontend via Tauri's IPC:

**Categories:** Configuration (15), OBS (8), Recording (5), Auth (3), Licensing (10), Video Processing (8), Project Assembly (6), Cleanup (3), System (8)

---

## 5. flowmastersuite — Desktop App Frontend (Vanilla JS)

**Location:** `/mnt/c/Users/alexb/Desktop/Dev Stuff/flowmastersuite/src`
**No framework** — pure vanilla JavaScript with HTML/CSS

### 5.1 Structure

```
src/
├── index.html (42KB)          # Single-page app shell, 3-tab layout
├── scripts/ (42 JS files, 434KB total)
│   ├── main.js (11KB)         # App initialization
│   ├── mark-tab.js (18KB)     # Marking tab UI
│   ├── clip-tab.js (64KB)     # Clipping tab UI
│   ├── clean-tab.js (14KB)    # Cleaning tab UI
│   ├── onboarding.js (42KB)   # Onboarding wizard
│   ├── settings-panel.js (33KB) # Settings modal
│   ├── login-overlay.js (15KB)  # Auth overlay
│   ├── tutorial.js (24KB)     # Interactive tutorial
│   ├── project-assembler-modal.js (33KB)
│   ├── sound-manager.js (12KB) # Audio cues
│   ├── waveform.js (10KB)     # Audio waveform display
│   ├── 13 GLSL shaders        # WebGL visual effects
│   └── shared/utils.js, toast.js, modal.js
├── styles/ (13 CSS files, 188KB)
│   ├── main.css (42KB)        # Global styles
│   ├── themes.css (7KB)       # 9 color themes
│   ├── mark-tab.css, clip-tab.css, clean-tab.css
│   └── onboarding.css (19KB), license.css, etc.
└── assets/                    # Images, icons, sounds
```

### 5.2 UI Architecture

- **3-tab layout:** Mark, Clip, Clean
- **Overlays/Modals:** Login, Settings (33KB), Onboarding (42KB), License Panel, Lockout Screen
- **Features:** Setup Wizard, Getting Started, Editor Profile Config, Interactive Tutorial, Update Notifications, What's New, Hamburger Menu
- **Visual effects:** 13 GLSL fragment shaders, confetti, key animations, waveform display, recording indicator
- **Themes:** 9 color themes (midnight, daylight, cobalt, arctic, dusk, etc.)

---

## 6. Supabase Backend — Edge Functions

**Location:** `/mnt/c/Users/alexb/Desktop/Dev Stuff/flowmastersuite/supabase/functions`
**Runtime:** Deno/TypeScript
**Total:** 35 edge functions

### 6.1 Shared Utilities

**`_shared/admin-auth.ts`** — Central auth helper:
- `verifyAdmin(req, supabase)` — Validates Bearer JWT, checks `ADMIN_EMAILS` env var, falls back to `admin_users` table
- `corsHeaders` — Standard CORS for all functions
- `jsonResponse(body, status)` — Consistent JSON responses

### 6.2 Function Catalog

#### License & Machine Management (5)

| Function | Auth | Method | Purpose |
|----------|------|--------|---------|
| `licenses-validate` | Key-based | POST | Validate license key + machine match + expiry + blocked status |
| `trial-assign` | Fingerprint | POST | Assign oldest unassigned trial key to machine |
| `trial-sync` | Key-based | POST | Sync trial action counts to server |
| `machines-register` | Fingerprint | POST | Register hardware signature, handle race conditions |
| `beta-key-extend` | Key-based | POST | Extend beta key expiry by 60 days |

#### Beta & Invite System (4)

| Function | Auth | Method | Purpose |
|----------|------|--------|---------|
| `beta-key-claim` | Bearer JWT | POST | Atomic beta key claim with rate limiting (5/5min/IP) |
| `validate-invite-link` | Public | POST | Validate invite code, increment clicks, track IPs |
| `invite-click` | Public | POST | Track invite link click with IP history |
| `send-license-email` | Service role | POST | Email license key via Resend API with retry (3 attempts) |

#### Scout System (10)

| Function | Auth | Method | Purpose |
|----------|------|--------|---------|
| `validate-scout-invite` | Public | POST | Check scout invite code validity |
| `initiate-scout-signup` | Public | POST | Send magic link email for scout registration |
| `complete-scout-registration` | Bearer JWT | POST | Create scout account via atomic RPC |
| `scout-generate-link` | Bearer JWT | POST | Create referral link (daily limit enforced) |
| `get-scout-stats` | Optional | POST | Scout metrics + funnel + leaderboard |
| `get-admin-scouts` | Admin | POST | List all scouts with aggregated stats |
| `get-admin-scout-detail` | Admin | POST | Single scout detail with conversion funnel |
| `deactivate-scout` | Admin | POST | Toggle scout active status |
| `deactivate-scout-link` | Admin | POST | Deactivate specific invite link |
| `rug-pull-scout` | Admin | POST | Emergency deactivation (requires confirmation phrase) |
| `expire-scout-links` | System | POST | Batch expire old scout links |
| `update-scout-settings` | Admin | POST | Update daily limit, earnings |
| `create-scout-invite` | Admin | POST | Generate scout invite code |

#### Payments (3)

| Function | Auth | Method | Purpose |
|----------|------|--------|---------|
| `create-checkout-session` | Public | POST | Reserve key + create Stripe checkout session |
| `get-purchase-key` | Public | POST | Retrieve license after Stripe payment (with retry) |
| `stripe-webhook` | Stripe signature | POST | Handle `checkout.session.completed` and `expired` |

#### Stats & Activity (6)

| Function | Auth | Method | Purpose |
|----------|------|--------|---------|
| `get-tier-status` | Public | GET/POST | Tier inventory and current selling tier |
| `get-public-stats` | Public | GET | Active users (24h/7d/14d), total activations |
| `track-user-activity` | Key/machine | POST | Log activation, usage milestones, upgrades |
| `track-download` | Public | POST | Download tracking with IP-based scout attribution |
| `get-activity-feed` | Public | POST | Global or personal activity feed (cursor pagination) |
| `get-activity-log` | Admin | POST | Full audit trail with enrichment |

#### Notifications (4)

| Function | Auth | Method | Purpose |
|----------|------|--------|---------|
| `create-notification` | Admin | POST | Create targeted in-app notification |
| `get-notifications` | Public | POST | Fetch unread notifications for a license type |
| `mark-notification-read` | Public | POST | Mark notification as read |
| `get-notification-stats` | Admin | POST | Notification analytics |
| `post-admin-announcement` | Admin | POST | Broadcast announcement to activity feed |

#### System (1)

| Function | Auth | Method | Purpose |
|----------|------|--------|---------|
| `report-crash` | Soft auth | POST | Crash report ingestion (works without valid license) |

### 6.3 Key Patterns

**Race Condition Prevention:**
- `FOR UPDATE SKIP LOCKED` in RPC functions for atomic key claiming
- UNIQUE constraint catch + retry in `machines-register`
- Idempotent operations (e.g., `beta-key-claim` returns existing key)

**Rate Limiting:**
- `beta-key-claim`: 5 claims per IP per 5 minutes
- `scout-generate-link`: configurable daily limit per scout (default 6, UTC-based)
- `send-license-email`: monitors Resend free tier (100/day, warns at 80)

**Attribution Tracking:**
- IP-based matching with 24h window
- Referrer URL parsing for invite codes
- Conversion funnel: Clicks → Downloads → Activations → 1st/2nd/3rd Use → Upgrades

---

## 7. Supabase Backend — Database Schema

**Location:** `/mnt/c/Users/alexb/Desktop/Dev Stuff/flowmastersuite/supabase/migrations`
**17 migrations** from `20260206` to `20260224`

### 7.1 Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `machines` | Hardware-locked registrations | `hardware_signature` (UNIQUE), `trial_actions_used`, `is_blocked` |
| `licenses` | License keys (all types) | `key` (UNIQUE), `type`, `user_id`, `machine_id`, `is_revoked`, `expires_at`, `tier_id`, `stripe_checkout_session_id`, `price_paid` |
| `pricing_tiers` | 4 pricing tiers | `name`, `price_cents`, `key_range_start`, `key_range_end`, `stripe_price_id` |
| `invite_links` | Shareable invite codes | `code` (UNIQUE), `license_id`, `clicks`, `scout_id`, `expires_at`, `use_stage` |
| `scouts` | Scout/ambassador accounts | `username` (UNIQUE), `email`, `user_id`, `daily_link_limit`, `total_earnings` |
| `scout_invites` | Invites to become scouts | `code` (UNIQUE), `is_claimed`, `claimed_by_scout_id`, `expires_at` |
| `admin_users` | Runtime admin allowlist | `email` (UNIQUE) |
| `user_notifications` | In-app notifications | `title`, `body`, `target_types[]`, `require_scroll`, `expires_at` |
| `notification_reads` | Read tracking | `notification_id`, `license_id` (UNIQUE together) |
| `audit_log` | License operation log | `action`, `user_id`, `machine_id`, `details` (JSONB) |
| `admin_activity_log` | Admin/scout/system actions | `actor_type`, `action_type`, `action_details` (JSONB), `ip_address` |
| `user_activity_log` | User behavior tracking | `license_id`, `activity_type`, `activity_details` (JSONB) |
| `downloads` | Download tracking | `ip_address`, `invite_link_id`, `referrer` |
| `license_extensions` | Expiry extension records | `license_id`, `old_expiry`, `new_expiry`, `triggered_by` |
| `app_versions` | Release registry | `version` (PK), `changelog`, `channel`, `mandatory` |
| `crash_reports` | Crash telemetry | `license_key`, `app_version`, `crash_count`, `os_version`, `arch` |

### 7.2 License Types

```
trial | beta | scout | supporter | pro | pioneer | early_adopter | believer | standard
```

### 7.3 Pricing Tiers

| Tier | Display Name | Price | Key Range | Total Keys |
|------|-------------|-------|-----------|------------|
| `pioneer` | Early Adopter | $12 | 1-15 | 15 |
| `early_adopter` | Supporter | $19 | 16-400 | 385 |
| `believer` | Semi-Early | $29 | 401-2000 | 1,600 |
| `standard` | Normal price | $39 | 2001-∞ | Unlimited |

### 7.4 Database Functions (RPC)

| Function | Purpose |
|----------|---------|
| `claim_beta_key(p_user_id, p_machine_id)` | Atomic beta key claim with `FOR UPDATE SKIP LOCKED` |
| `create_scout_account(...)` | Atomic scout registration (validates invite, creates scout + license, marks claimed) |
| `get_current_tier_status()` | Returns tier inventory with claimed/available counts |
| `get_next_available_key(p_tier_id)` | Reserve next key in tier with row lock |
| `claim_key_for_purchase(p_license_id, p_stripe_session_id, p_email)` | Finalize purchase |
| `get_revenue_metrics()` | Revenue stats (total, 7d, 30d, average) |
| `create_scout_license(scout_email, scout_id)` | Generate FLOW-SCOUT-XXXX-XXXX-XXXX key |

### 7.5 Views

| View | Purpose |
|------|---------|
| `available_trial_keys` | Unassigned, non-revoked, non-expired trial keys |
| `notification_stats` | Notification read counts + estimated audience |
| `unified_activity_log` | UNION of admin + user activity logs |

### 7.6 RLS Policies

**All tables have RLS enabled.** Default policy: **service role full access only**.

Exceptions:
- `pricing_tiers`: Public SELECT on active tiers
- `crash_reports`: Anon INSERT allowed (broken app can still report crashes)

**Effect:** No client can query tables directly. All access goes through edge functions using the service role key.

### 7.7 Key Relationships

```
auth.users ──┬── licenses (user_id)
             ├── scouts (user_id)
             └── admin_users (email match)

machines ────── licenses (machine_id)

licenses ───┬── invite_links (license_id) [CASCADE]
            ├── pricing_tiers (tier_id)
            ├── scouts (attributed_scout_id)
            ├── license_extensions (license_id) [CASCADE]
            └── notification_reads (license_id)

scouts ─────┬── invite_links (scout_id)
            └── scout_invites (claimed_by_scout_id)
```

---

## 8. Admin UI — React Dashboard

**Location:** `/mnt/c/Users/alexb/Desktop/Dev Stuff/flowmastersuite/admin-ui`
**Tech:** React 19.2, Vite 7.2, TypeScript 5.9, Tailwind v4, React Router 7.13
**Dev Server:** `localhost:5174`

### 8.1 Two-Client Supabase Pattern

```typescript
// Service role client — full DB access for admin operations
export const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false }
})

// Anon client — session-based auth for login/signout
export const supabaseAnon = createClient(url, anonKey, {
  auth: { persistSession: true }
})
```

### 8.2 Role-Based Routing

**Two roles:** Admin and Scout

| Route | Component | Role |
|-------|-----------|------|
| `/` | `Dashboard` or `ScoutDashboard` | Admin / Scout |
| `/notifications` | `AdminNotifications` | Admin |
| `/keys` | `KeysPage` (KeyGenerator + LicenseTable) | Admin |
| `/users` | `UserTable` | Admin |
| `/machines` | `MachineTable` | Admin |
| `/beta-requests` | `BetaRequestsPanel` | Admin |
| `/scouts` | `AdminScouts` | Admin |
| `/invites` | `InviteLinkManager` | Admin |
| `/releases` | `ReleasesPanel` | Admin |
| `/activity-log` | `ActivityLogPanel` | All |
| `/my-links` | `ScoutMyLinks` | Scout |
| `/activity` | `ScoutActivity` | Scout |

### 8.3 Admin Dashboard

**Row 1:** Total Keys, Unassigned Keys, Active Licenses, Total Machines
**Row 2:** By tier — Trial, Beta, Scout, Supporter, Pro, Pioneer, Early Adopter, Believer, Standard
**Row 3:** Revenue metrics (7d, 30d, average price)
**Row 4:** Beta pool breakdown (Auto-Claim, Direct Invite, Tactical Links)
**Recent Activity:** Last 10 licenses with key, tier, status, date

Color-coded warnings: Unassigned count red <50, yellow <100, green ≥100

### 8.4 Key Pages

**KeyGenerator:** Generate license keys in bulk (1-1000), select tier + pool, CSV export, batch confirmation for >100 keys. Key format: `FM-XXXXX-XXXXX-XXXXX-XXXXX`.

**LicenseTable:** Sortable, filterable, paginated (50/page). Search by key, filter by tier/status, click-to-sort columns. Revoke with modal confirmation. CSV export.

**UserTable:** All Supabase Auth users with license/machine counts. Expandable rows showing user's licenses and machines. Debounced search (300ms).

**MachineTable:** Hardware registrations with block/unblock capability. Shows hardware signature, linked licenses, trial actions used (X/16). Block requires reason.

**InviteLinkManager:** Create invite links (generate new key or pick existing). Bulk creation (1-100). Track clicks, status, top performers. Deactivate links.

**AdminScouts:** Scout administration with stats, conversion funnel, leaderboard, invite management.

**AdminNotifications:** Create targeted in-app notifications by license type. Track read counts and audience.

**ReleasesPanel:** View GitHub releases, trigger new release workflows.

### 8.5 Scout Dashboard

Scouts see a simplified view:
- Stat cards: total links, clicks, activations, active users 7d, conversion rate
- Conversion funnel visualization
- Top scouts leaderboard (anonymized)
- Recent activity feed
- My Links page: create links, track performance

### 8.6 API Layer (12 modules)

All in `src/api/`:
- `admin.ts` — Admin user management
- `admin-scouts.ts` — Scout admin operations
- `activity.ts` — Activity logging + announcements
- `beta-requests.ts` — Beta claim tracking
- `dashboard.ts` — Dashboard stats + revenue
- `invites.ts` — Invite link CRUD
- `licenses.ts` — Key generation, filtering, revocation, export
- `machines.ts` — Machine block/unblock
- `notifications.ts` — Notification system
- `releases.ts` — GitHub releases integration
- `scouts.ts` — Scout dashboard data + link creation
- `users.ts` — User account queries

### 8.7 Testing

- **Unit tests:** Vitest 4.0 — 7 test suites covering utility functions (attribution, conversion-funnel, daily-limit, date-utils, earnings, invite-code, pagination)
- **E2E tests:** Playwright 1.58 — auth flow, scout dashboard, scout links
- **Scripts:** `npm test` (watch), `npm run test:run` (single), `npm run test:coverage`

---

## 9. Key System Flows

### 9.1 License Lifecycle

```
Key Generation (Admin UI)
  │ FM-XXXXX-XXXXX-XXXXX-XXXXX
  ▼
Unassigned in DB (licenses table)
  │
  ├─ Trial Path: machine-register → trial-assign → trial-sync (16 actions)
  │
  ├─ Beta Path: invite-link → invite-click → beta-key-claim
  │
  ├─ Scout Path: scout-invite → signup → complete-registration → scout license
  │
  └─ Purchase Path: get-tier-status → create-checkout-session → Stripe
       │                              → stripe-webhook → finalize
       ▼
Activated (machine_id set)
  │
  ├─ Validated on each app launch (licenses-validate)
  ├─ Cached locally (AES-256-GCM encrypted)
  ├─ Extended on app updates (beta-key-extend)
  │
  └─ Can be: Revoked (admin), Expired (time), Blocked (machine)
```

### 9.2 Scout Recruitment Flow

```
Admin creates scout invite
  → POST /create-scout-invite → code generated
  → URL: flowmaster.live/scout?code=XXXXX

Prospect visits URL
  → POST /validate-scout-invite → valid/invalid
  → Enters email + agrees to conduct guidelines
  → POST /initiate-scout-signup → magic link sent

Prospect clicks magic link
  → Redirected to /scout/complete with auth token
  → Fills profile (username, display name, Discord)
  → POST /complete-scout-registration → scout account + license created
  → Redirected to /scout/welcome with FLOW-SCOUT-XXXX-XXXX-XXXX key

Scout generates referral links (daily limit: 6)
  → POST /scout-generate-link → link with 7-day expiry
  → URL: flowmaster.live/invite/XXXXX
  → Clicks tracked, downloads attributed by IP, conversions tracked
```

### 9.3 Purchase Flow (Tiered Pricing)

```
User visits /pricing
  → POST /get-tier-status → tier inventory (refreshed every 30s)
  → Selects tier → clicks "Get This Key"
  → POST /create-checkout-session
      → Reserve key (FOR UPDATE SKIP LOCKED)
      → Create Stripe session with metadata
      → Redirect to Stripe checkout

User completes payment
  → Stripe sends webhook (checkout.session.completed)
  → POST /stripe-webhook
      → Finalize license (customer_email, purchased_at, price_paid, type)
      → Scout attribution if applicable
      → Send license email via Resend API
      → Log to audit_log + user_activity_log

User redirected to /purchase-success?session_id=XXX
  → POST /get-purchase-key (with retry logic)
  → Display key + confetti + tier-specific message
  → "You're Early Adopter #47 of 100!"

If checkout expires
  → stripe-webhook (checkout.session.expired)
  → Release reserved key back to pool
```

### 9.4 Desktop App Startup

```
App launches
  │
  ├─ 1. Check encrypted cache
  │     ├─ Valid + within offline grace → return cached result
  │     └─ Invalid/expired → continue to server
  │
  ├─ 2. Clock guard check (detect time manipulation)
  │
  ├─ 3. Generate machine fingerprint (SHA-256)
  │
  ├─ 4. Register machine → /machines-register
  │     └─ Returns machine_id, trial status
  │
  ├─ 5. Validate license → /licenses-validate
  │     └─ Checks key, revocation, expiry, machine match
  │
  ├─ 6. Update encrypted cache
  │
  └─ 7. Return StartupResult → UI shows appropriate state
        ├─ Full access (beta/scout/pro/supporter)
        ├─ Trial mode (X of 16 actions remaining)
        ├─ Lockout (expired/revoked/wrong machine)
        └─ Offline mode (grace period active)
```

---

## 10. Authentication & Security

### 10.1 Auth Mechanisms

| Context | Method | Details |
|---------|--------|---------|
| Admin UI login | Email/password | Supabase Auth → JWT → role check |
| Scout registration | Magic link | Supabase Auth `generateLink()` |
| Desktop app | Email/password | Supabase Auth → beta key validation |
| Edge functions (admin) | Bearer JWT | `verifyAdmin()` checks email against allowlist |
| Edge functions (user) | Bearer JWT | `supabase.auth.getUser(token)` |
| Edge functions (public) | None | Public endpoints (tier status, stats) |
| License validation | Key-based | License key + machine fingerprint |
| Stripe webhooks | Signature | `stripe.webhooks.constructEvent()` |
| Offline cache | AES-256-GCM | PBKDF2 key derivation from fingerprint + app secret |

### 10.2 Admin Authorization

Two sources checked in order:
1. `ADMIN_EMAILS` environment variable (comma-separated)
2. `admin_users` database table (runtime additions)

Admin UI also requires `VITE_ADMIN_MODIFY_PASSWORD` for sensitive operations (adding/removing admins).

### 10.3 RLS Strategy

All 15+ tables have RLS enabled with a uniform policy: **service role full access only**. No client-side queries hit the database directly — all access goes through edge functions using the service role key.

Two exceptions:
- `pricing_tiers`: public SELECT on active tiers
- `crash_reports`: anon INSERT (so broken apps can still report)

### 10.4 Race Condition Prevention

- `FOR UPDATE SKIP LOCKED` in key claiming RPCs
- UNIQUE constraints with retry logic in machine registration
- Idempotent operations (claiming already-claimed key returns existing)
- Stripe session ID stored on license during checkout to prevent double-booking

---

## 11. CI/CD & Deployment

### 11.1 Marketing Site (GitHub Pages)

**Workflow:** `.github/workflows/deploy.yml`
- **Trigger:** Push to `main` or manual dispatch
- **Steps:** Checkout → Node 20 → `npm ci` → `npm run build` → Deploy to GitHub Pages

### 11.2 Desktop App Release (GitHub Actions)

**Workflow:** `flowmastersuite/.github/workflows/release.yml` (301 lines)
- **Trigger:** Manual dispatch with version, title, release notes, prerelease flag

**6-stage pipeline:**

1. **Setup:** Node 20, Rust toolchain, npm dependencies
2. **Dependencies:** FFmpeg + Python embeddable (cached)
3. **Build & Sign:** `npx tauri build` with signing keys
4. **Manifests:** Generate `latest.json` + `update-meta.json`
5. **Publish:** Create GitHub Release with `.exe` + `.sig`
6. **Summary:** Build report

**Required Secrets:**
- `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- `FLOWMASTER_SUPABASE_URL` / `FLOWMASTER_SUPABASE_ANON_KEY`
- `FLOWMASTER_APP_SECRET` / `FLOWMASTER_CACHE_SALT`

### 11.3 Asana Integration

**Workflow:** `asana-sync.yml`
- Bidirectional sync between GitHub Issues and Asana tasks
- Runs on issue events + every 5 minutes (cron)
- Maps GitHub labels to Asana sections

### 11.4 Build Scripts

| Script | Language | Purpose |
|--------|----------|---------|
| `bump-version.py` | Python | Update version across Cargo.toml, tauri.conf.json, package.json, version.txt |
| `setup_ffmpeg.ps1` | PowerShell | Download + extract FFmpeg from gyan.dev |
| `setup_embedded_python.ps1` | PowerShell | Download Python 3.12.1 embeddable |
| `prepare_bundle.py` | Python | Copy CLI scripts to bundle resources |
| `generate-tier-keys.ts` | TypeScript/Deno | Generate license keys for pricing tiers |
| `generate_secrets.py` | Python | Generate secure secret values |

### 11.5 Environment Variables Summary

| Variable | Used By | Purpose |
|----------|---------|---------|
| `PUBLIC_SUPABASE_URL` | flowmaster-site | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | flowmaster-site | Public API key |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | flowmaster-site | Stripe test key |
| `VITE_SUPABASE_URL` | admin-ui | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | admin-ui | Public API key |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | admin-ui | Full DB access |
| `VITE_ADMIN_EMAILS` | admin-ui | Admin allowlist |
| `VITE_ADMIN_MODIFY_PASSWORD` | admin-ui | Sensitive operation gate |
| `FLOWMASTER_SUPABASE_URL` | Tauri build | Compile-time URL |
| `FLOWMASTER_SUPABASE_ANON_KEY` | Tauri build | Compile-time key |
| `FLOWMASTER_APP_SECRET` | Tauri build | Encryption key derivation |
| `FLOWMASTER_CACHE_SALT` | Tauri build | Cache encryption salt |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions | Backend DB access |
| `STRIPE_SECRET_KEY` | Edge functions | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Edge functions | Webhook verification |
| `ADMIN_EMAILS` | Edge functions | Admin authorization |

---

## 12. Product Features & User Experience

This section covers what Flowmaster does **from the user's perspective** — the full feature set, UX flows, and capabilities that the marketing website needs to represent.

### 12.1 Core Workflow: Mark → Clip → Clean

Flowmaster's core value proposition is a 3-step workflow:

1. **Mark** — Press a hotkey (default F9) while recording in OBS to bookmark moments worth keeping. Timestamps are saved to text files alongside recordings.
2. **Clip** — Flowmaster reads your marks, calculates time ranges (with configurable lookback/lookahead), and uses FFmpeg stream-copy to extract highlights **without re-encoding**. Hours of footage become minutes of highlights in seconds.
3. **Clean** — Scan for fully-processed source files and safely move them to the Recycle Bin, reclaiming disk space.

### 12.2 Mark Tab — Highlight Capture

| Feature | Description |
|---------|-------------|
| **Global Hotkey** | F9 works even when games have focus. Supports single keys (F1-F24, A-Z) and two-key combos (e.g., LCtrl+F9) |
| **Live OBS Status** | Real-time connection indicator, auto-updates every 3s |
| **Session List** | All recordings from the configured folder with mark counts, dates, and quick actions |
| **Context Menu** | Open in Project Assembler, Send to Editor, View Timestamps, Remux to MP4, Open Folder |
| **Auto-Detection** | Sessions auto-refresh when OBS stops recording |

### 12.3 Clip Tab — Automatic Highlight Extraction

| Feature | Description |
|---------|-------------|
| **Processing Options** | Configurable lookback (seconds before mark) and lookahead (seconds after mark) sliders |
| **Two Clip Modes** | **Reel** (single montage video) or **Clips** (individual clip files) |
| **Batch Processing** | Select multiple videos and process them all at once |
| **Merge Highlights** | Combine clips from multiple recordings into one highlight reel |
| **Stream Copy** | FFmpeg remux (no re-encoding) preserves full quality at maximum speed |
| **Overlap Merging** | Adjacent/overlapping marks are automatically merged to avoid duplicate frames |
| **Progress Tracking** | Real-time progress indicators during extraction |
| **Completion Confetti** | Celebratory animation with clip/marker count on success |
| **FFmpeg Status** | Banner with download link if FFmpeg isn't installed |

### 12.4 Clean Tab — Storage Management

| Feature | Description |
|---------|-------------|
| **Smart Scanning** | Categorizes files into 4 groups based on processing status |
| **Category A** | Fully-processed originals — safe to delete |
| **Category B** | Partially processed — original still needed |
| **Category C** | Orphaned files — no parent recording found |
| **Category D** | Unsorted/other video files |
| **Size Display** | Per-file and per-category size totals |
| **Safe Deletion** | Sends to Recycle Bin (always recoverable) |
| **Select All/Individual** | Per-category checkboxes with confirmation dialog |

### 12.5 Project Assembler — Editor-Ready Export

A full-viewport modal for browsing, selecting, and assembling recordings into editor projects:

**File Browser:**
- Filter by type: Original Videos, Highlighted Edits, Webcam Videos, Webcam Highlights, Other
- Add custom folders beyond the default recordings directory
- Per-file metadata: mark count, duration, size, type badge
- Auto-matching of webcam ↔ display recordings

**Export Options:**
- Premiere Pro (FCP7 XML) — currently supported
- DaVinci Resolve (FCPXML) — coming soon
- Final Cut Pro (FCPXML) — coming soon
- EDL, CSV — coming soon
- Timeline gaps: configurable intro/outro padding (0-60s)
- Transitions: None, Cross Dissolve, Dip to Black, Dip to White, Additive Dissolve (with duration)
- Webcam overlay: position (X/Y), scale (%), opacity (%)

**Export Formats by Editor Profile:**

| Profile | Formats Generated |
|---------|-------------------|
| Basic | TXT markers |
| Premiere Pro | FCP7 XML + EDL + CSV + TXT |
| DaVinci Resolve | FCPXML + EDL + CSV + TXT |
| Final Cut Pro | FCPXML + EDL + CSV + TXT |

### 12.6 Onboarding Wizard (7 Steps)

First-launch experience that configures the app in under a minute:

1. **Welcome** — Logo + "Let's get you set up in under a minute"
2. **Setup Folders** — Choose recordings folder, optional webcam folder toggle
3. **Choose Your Editor** — 4 editor profile cards (Basic, Premiere, DaVinci, Final Cut)
4. **Set Your Mark Hotkey** — Key capture UI with combo support (hold 2 keys for 2s)
5. **Connect to OBS** — Port/password inputs, test connection button, skip option
6. **Completion Summary** — Review all chosen settings
7. **Launch** — "Start Using Flowmaster" → success animation → optional tutorial

### 12.7 Interactive Tutorial (7 Steps)

Guided spotlight tour for new users:

1. Spotlight on Mark tab — introduces the marking workflow
2. Spotlight on hotkey display — shows current hotkey dynamically
3. Switch to Clip tab — injects mock data, spotlights processing
4. Spotlight assemble button — demonstrates highlight extraction
5. Switch to Clean tab — shows mock cleanable files
6. Spotlight hamburger menu — introduces settings access
7. Centered "You're all set!" completion card

Features spotlight mechanics (8px padding, elevated z-index), keyboard navigation (arrow keys), and dynamic text substitution for the current hotkey.

### 12.8 Settings Panel (8 Groups, ~40 Controls)

| Group | Key Controls |
|-------|-------------|
| **Folders** | Display capture, webcam, and output folder pickers |
| **Hotkey** | Key capture with combo support |
| **Editor Profile** | 4 editor cards |
| **Processing** | Lookback/lookahead second sliders |
| **OBS WebSocket** | Port, password, test/reconnect buttons, status dot |
| **Themes** | 9 color swatches with hover preview and "Quick Show" cycle |
| **Sounds** | Master toggle, volume slider, output device, mark sound selection, 9 per-event toggles |
| **System** | Launch on startup, show with OBS, update channel, account display, debug log export, fresh user test mode |

### 12.9 Color Themes (9)

| Theme | Type | Primary | Background |
|-------|------|---------|------------|
| **Midnight** (default) | Dark | #e94560 (rose) | #0f0f0f |
| **Charcoal** | Dark | #e94560 (rose) | #1c1c1c |
| **Purple** | Dark | #e94560 (rose) | #1e1033 (deep purple) |
| **Ocean** | Dark | #e94560 (rose) | #0d1b2a (navy) |
| **OLED** | Dark | #e94560 (rose) | #000000 (true black) |
| **Daylight** | Light | #2548c5 (blue) | #f5f6f8 |
| **Cobalt** | Specialty | #3970e5 (blue) | #090c14 |
| **Arctic** | Specialty | #0891b2 (cyan) | #080e10 |
| **Dusk** | Specialty | #8571b2 (muted purple) | #0c0b10 |

### 12.10 Sound System

**9 sound events** with individual enable/disable toggles:

| Event | Trigger |
|-------|---------|
| `startup` | App launch |
| `obs_connect` | OBS connection established |
| `obs_disconnect` | OBS disconnection |
| `recording_start` | Recording begins |
| `mark` | Mark hotkey pressed (user-selectable sound) |
| `clip_complete` | Clip extraction finished |
| `clean_complete` | Clean/deletion finished |
| `error` | Error occurs |
| `settings_saved` | Settings applied (disabled by default) |

Global controls: master toggle, volume slider (0-100%), output device selection. Mark sound has multiple options (default, alt beep).

### 12.11 Visual Effects — GLSL Shaders

12 WebGL fragment shaders that react to recording state and mark events:

| Shader | Effect |
|--------|--------|
| `flowmaster.frag` | Vertical gradient waves (red→yellow→green) |
| `rings.frag` | Concentric expanding rings |
| `shockwaves.frag` | Multiple spawning ripples from random positions |
| `cellular.frag` | Cellular automata noise pattern |
| `dnahelix.frag` | DNA double-helix spiral |
| `equalizer.frag` | Bar-based frequency spectrum |
| `gridwarp.frag` | Grid distortion warping |
| `heartbeat.frag` | Pulsing beats with radial expansion |
| `matrixrain.frag` | Cascading "Matrix" digital rain |
| `noise.frag` | Perlin/Simplex noise texture |
| `particles.frag` | Particle system with motion trails |
| `plasma.frag` | Plasma wave interference |

All shaders respond to `u_recording` (idle→recording intensity) and `u_mark_impact` (flash spike on mark press that decays over ~0.3s).

### 12.12 License & Trial UX

**Trial:** 16 free actions (RecordingSession, ProjectAssembly, ClipExtraction). Emblem color changes from Green (0-10 used) → Yellow (11-13) → Red (14-16).

**Login Overlay (4 views):**
1. **Login** — Email/password with forgot password and create account links
2. **Create Account** — Beta signup with password validation (≥8 chars)
3. **Claim Confirmation** — Shows claimed beta key with copy button + "Activate Key"
4. **Manual Key Entry** — Paste FM-XXXX-XXXX-XXXX-XXXX format, auto-validates

**Error states:** No keys available, duplicate email, rate limited, connection failed, wrong machine, revoked key, expired key.

**Key activation** triggers a celebratory animation showing the key type before app reload.

---

## 13. Brand Identity & Marketing

### 13.1 Core Messaging

| Element | Copy |
|---------|------|
| **Hero Tagline** | "Record Everything. Stress Nothing." |
| **Hero Subheading** | "The ultimate OBS Studio creator workflow tool." |
| **Product Description** | "Video highlight extraction for content creators" |
| **Long Description** | "Automated video highlight extraction for streamers and content creators. Mark moments while recording with OBS, then automatically extract highlights and assemble them into editor projects." |
| **Philosophy** | "We don't guess. You decide." |
| **Origin Story** | "Flowmaster started because editing sucked." |
| **Creator Identity** | "Built by creators, for creators" |
| **Company** | "Flowmaster is an Alenzie product" (alenzie.com) |
| **Copyright** | © 2025 Alenzie Solutions |

### 13.2 Key Messaging Pillars

1. **"Mark as you record"** — Core workflow innovation
2. **"Eliminate pre-editing"** — Problem statement
3. **"Stress Nothing"** — Emotional outcome
4. **"You decide, not AI"** — Competitive differentiation
5. **"Free to use"** — Accessibility (current trial)
6. **"Built by creators, for creators"** — Authenticity
7. **"From hours to minutes"** — Time savings metric
8. **"No subscriptions, lifetime access"** — Pricing trust

### 13.3 Brand Voice

- **Authentic & Candid:** "editing sucked" — no corporate polish
- **Creator-Centric:** Everything references creators, gamers, streamers, YouTubers
- **Problem-First:** Leads with pain (hours of editing) before solution
- **Anti-AI Positioning:** Actively rejects "black box" AI; emphasizes user control
- **Empowerment Language:** "You stay in control," "You decide," "You mark the moments"
- **Casual but Technical:** Uses "F9" and codec terms alongside conversational language
- **Speed-Focused:** "Minutes not hours," "lightning fast," "eliminate pre-editing"
- **Trust-Building:** "Lifetime access," "no subscriptions," "safe cleanup to recycle bin"

**Tone:** Friendly, gamer-aware, honest about the problem, confident in the solution. Not corporate or stuffy.

### 13.4 Visual Identity

| Element | Detail |
|---------|--------|
| **Primary Brand Color** | Red (#d64545 / #f43f43 / #e94560) |
| **Step Colors** | Record #f43f43 (red), Clip #f5d440 (yellow), Clean #6be553 (green) |
| **Accent** | Mint #55ffa2 |
| **Backgrounds** | #101010 (primary), #1a1a1a (secondary), #252525 (tertiary) |
| **Body Texture** | Carbon fiber pattern (diagonal lines at 45deg, 4px tile) |
| **Heading Font** | Space Grotesk (500/600/700) |
| **Body Font** | Inter (400/500/600/700) |
| **Design Aesthetic** | Dark theme, gaming/streamer aligned, minimal, content-focused |
| **Logo** | Animated 5-element intro (3 colored squares + text) with breathing + pulse |
| **App Identifier** | `live.flowmaster.studio` |

### 13.5 CTA Copy

| Location | CTA Text |
|----------|----------|
| **Hero Primary** | "Download Free Trial" |
| **Hero Secondary** | "See Pricing" |
| **Hero Subtext** | "Free to use • Windows 10/11" |
| **Main CTA Section** | "Ready to Transform Your Workflow?" |
| **CTA Body** | "Join thousands of creators who've already made the switch. Start editing smarter today." |
| **CTA Button** | "Get Your Key" |
| **CTA Subtext** | "Starting at $12 — limited early adopter pricing" |
| **Features CTA** | "Ready to try it? Start editing smarter today." |
| **Future CTA** | "Want to shape the future? Join our Discord to vote on features and get early access." |

### 13.6 Features Page — 7 Core Features

1. **Global Hotkey System** — "F9 works even when games have focus. Timestamps saved automatically. Works with any recording software (designed for OBS)."
2. **Smart File Matching** — "Auto-matches timestamp files to video files. Handles webcam footage separately. Tolerant timing (±2-5 second matching window)."
3. **Intelligent Range Calculation** — "Configurable lookback window (capture moments before you hit the key). Automatic overlap merging (no duplicate frames). Preview ranges before processing."
4. **Lightning Fast Processing** — "Stream copy mode (no re-encoding). Preserves full quality. Process hours of footage in minutes."
5. **Safe Cleanup** — "Clean finds processed videos. Shows exactly how much space you'll save. Sends to Recycle Bin (always recoverable)."
6. **OBS Integration** — "Works with Advanced Scene Switcher plugin. Auto-start/stop with recording. No manual launching required."
7. **Auto-Remux** — "Converts MKV recordings to editor-friendly MP4 while cutting — no manual remuxing required."

### 13.7 Testimonials (Placeholder)

| Name | Role | Quote |
|------|------|-------|
| Alex Chen | Twitch Partner | "Flowmaster cut my editing time in half. I used to spend 4 hours on a video, now it's under 2." |
| Sarah Miller | YouTube Creator | "The dead air detection is insane. It finds all the boring parts I would have missed." |
| Marcus Johnson | Esports Coach | "Finally, software made by gamers who actually understand the workflow." |
| Emma Wilson | Variety Streamer | "I was skeptical at first, but the hotkey marking system is a game changer." |
| David Park | Gaming YouTuber | "Best investment I've made for my content. Pays for itself in time saved." |

*Note: These appear to be placeholder testimonials with templated personas.*

### 13.8 Pricing Positioning

- **Model:** One-time lifetime purchase (no subscription)
- **Strategy:** Early adopter tiers with escalating prices — "Early supporters take the biggest risk on a new product. They deserve the best deal."
- **Entry Point:** Starting at $12
- **Lifetime Promise:** "One payment, yours forever. All future updates included. No subscriptions, no upgrade fees."
- **Missed Tier:** "You can still purchase at the next tier's price. The core product is identical — only the price changes."

### 13.9 System Requirements

| | Minimum | Recommended |
|---|---------|-------------|
| **OS** | Windows 10 (64-bit) | Windows 11 (64-bit) |
| **RAM** | 4GB | 8GB+ |
| **Disk** | 2GB available | SSD with 10GB+ free |
| **OBS** | OBS Studio 28.0+ | — |
| **FFmpeg** | — | Auto-installed |

---

## 14. Competitive Positioning & Target Audience

### 14.1 Competitive Differentiators

**vs. OBS Studio:**
> "More than recording. OBS captures footage. Flowmaster captures footage AND helps you edit it. Mark moments live, cut automatically, clean up files — all in one workflow."

**vs. AI Editors:**
> "You stay in control. AI editors guess what's important. Sometimes they're wrong. Flowmaster executes YOUR decisions with precision. No black box. No surprises."

**vs. Riverside:**
> "Podcasting, free forever. Remote guest recording with local quality — and it won't cost you $24/month. Podcasting mode is free. Always."

### 14.2 Target Audience

| Segment | Priority | Description |
|---------|----------|-------------|
| **Solo Gaming Creators** | Primary | 3-5 hour recording sessions, extracting highlights for YouTube/TikTok |
| **Streamers** | Secondary | Twitch/YouTube live broadcast + VOD highlight extraction, multistream |
| **Podcasters** | Tertiary | Audio-first, remote guests, free tier forever |
| **Esports/Competitive** | Secondary | Rapid-fire mark during matches, coach review workflows |
| **Production Teams** | Future | Multi-editor collaboration, role-based permissions |

**NOT targeting:** General video editors, beginners unfamiliar with OBS, enterprise teams, mobile-first creators (yet).

### 14.3 Value Propositions by Audience

| Audience | Pain Point | Flowmaster Solution |
|----------|-----------|-------------------|
| Gaming creators | Hours scrubbing footage for highlights | Press F9 in-game, extract clips in seconds |
| Streamers | VOD editing is tedious post-stream | Mark moments live, export editor-ready projects |
| Podcasters | $24/month for remote recording tools | Free podcasting mode with local quality |
| Esports coaches | Review footage is unstructured | Timestamp key moments during matches |

---

## 15. Product Roadmap & Vision

### 15.1 Philosophy

> "Most editing tools are moving toward AI that decides what's important in your content. We're going the opposite direction. Flowmaster gives you precision tools that execute YOUR creative decisions."
>
> **"We don't guess. You decide."**

### 15.2 Current State (Phase 1: Foundation)

Three-tool suite (Mark + Clip + Clean) with:
- Desktop app (Tauri/Rust, Windows)
- Marketing website (Astro)
- Admin dashboard (React)
- Supabase backend (35 edge functions, 15 tables)
- Tiered pricing via Stripe
- Scout recruitment system
- Beta distribution

### 15.3 Six-Phase Implementation Timeline

#### Phase 1: Foundation (Current)
Three-tool suite, marketing website, beta distribution, tiered pricing.

#### Phase 2: Unified Interface (3-6 months)
- Single-window experience replacing 3-tab layout
- Multi-track recording (V1-V3 video, A1-A3 audio)
- Live preview window
- Waveform visualization
- Session templates
- Built-in effects rack (5 slots, audio + video processing)
- VST plugin support
- Source grouping (V1+A1 linked as "Main Game")

#### Phase 3: Go Live — Streaming & Integration (6-9 months)
- Direct streaming to Twitch, YouTube, Kick
- Multistream support (3 platforms simultaneously)
- Integrated chat overlay
- Stream + Record mode (simultaneous local archive + live broadcast)
- Recording profiles optimized per use case
- Enhanced NLE export (DaVinci, AAF, JSON, SRT)

#### Phase 4: Mobile & Cloud (9-12 months)
- Mobile companion app (F9 equivalent, file browser, live session contribution)
- Cloud settings sync
- Disk space alerts
- Remote session monitoring
- Timestamp backup

#### Phase 5: Podcasting & Remote Recording (12-18 months)
- Audio-focused podcasting mode UI
- Remote guest recording (browser-based guest joining)
- Multi-participant waveforms
- Podcast chapter export
- Direct NLE export
- **Free forever** (core principle)

#### Phase 6: Collaboration & Business (18+ months)
- Multi-editor sessions
- Role-based permissions
- Production team features

### 15.4 Future Operating Modes

| Mode | Description |
|------|-------------|
| **Recording** | Local high-quality capture, V1-V3 + A1-A3 tracks |
| **Streaming** | Direct broadcast to Twitch/YouTube/Kick, multistream (3 platforms) |
| **Recording + Streaming** | Simultaneous local archive + live broadcast |
| **Podcasting** | Audio-focused interface, remote guests, free forever |

### 15.5 Future Pricing Tiers (Planned)

| Tier | Price | Includes |
|------|-------|----------|
| **Flowmaster** | Free | All modes, F9, AutoCut, AutoCleaner, basic export |
| **Flowmaster Pro** | TBD | VST support, advanced export, priority support |
| **Flowmaster Studio for Business** | TBD | Multi-editor collaboration, role-based permissions |
| **Flowmaster Plus** | Add-on | Full backup, extended preview, priority rendering |

Guest limits by tier: Free/Podcasting (4 guests), Pro (8), Business (12).

---

## Appendix: Key Statistics

| Metric | Value |
|--------|-------|
| Rust source modules | 37 files, ~16K LOC |
| Frontend JS modules | 42 files, 434KB |
| Frontend CSS files | 13 files, 188KB |
| Edge functions | 35 endpoints |
| Database tables | 15 |
| Database migrations | 17 |
| Database RPC functions | 7 |
| Admin UI components | 30+ React components |
| Admin UI API modules | 12 |
| Tauri commands | 60+ |
| Unit test suites | 7 (admin-ui utils) |
| E2E test specs | 3 (Playwright) |
| QA test cases | 170 (manual) |
| Color themes | 9 |
| License types | 9 |
| Pricing tiers | 4 |
