# Shared analytics on Neon

Updated: 2026-10-08. Status: free Neon provisioned; collector and site previews verified/prepared; production cutover pending. This revision supersedes the earlier website-only scope.

## Owner decisions

- Use Neon as the shared analytics database.
- Cover three public websites: FlowMaster, Spindle and the Alexander Blair portfolio.
- Exclude Scriptgen. The owner confirmed its website is unfinished and explicitly removed it from this task.
- Centralize website traffic **and FlowMaster's existing app usage analytics** in Neon. After asking specifically about disconnecting Supabase analytics, the owner accepted that recommendation and asked to be guided through setup. The earlier website-only limitation is superseded.
- Neon is to become the sole analytics store after a verified migration. A permanent Supabase-to-Neon duplicate analytics pipeline is not the agreed design.
- FlowMaster accounts, authentication, licenses and other operational records remain on Supabase. Their migration is outside this task. Scriptgen and Spindle desktop telemetry remain excluded.
- Begin with the Neon free plan. No paid plan or add-on is authorized. Database provisioning, tracking activation and source-data deletion must each be reported with actual evidence, not inferred from this plan.

## Source inventory and reuse

| Property | Authoritative website repository | Evidence and integration target |
| --- | --- | --- |
| FlowMaster, `flowmaster.live` | `alenzie/flowmaster-website`, local `flowmaster-site` | `origin/main` at `db973e5`; Astro shared shell `src/layouts/BaseLayout.astro`. GitHub Pages deployment in `.github/workflows/deploy.yml`. The site can send events to a separate collector without changing hosts. A general traffic tracker was not located in the searched current source. Existing live community stats are a different feature. |
| Spindle, `spindle.chat` | `alenzie/spindle-www` | Local source at `6e151b7`; `astro.config.mjs` specifies the domain. Vercel Analytics is already included by `src/components/layout/Layout.astro` and `src/components/loom/LoomLayout.astro`. Reuse these layout entry points. Source presence does not establish live collection. |
| Alexander Blair portfolio | `alenzie/portfolio26` | Current fetched main includes `@vercel/analytics` in `src/layouts/Base.astro`; private pages omit it. Preserve that exclusion. The accessible deployment alias was `alexanderblair.vercel.app`; verify whether `alexanderblair.com` is connected before admitting it as a production origin. |
| FlowMaster app usage | `alenzie/flowmastersuite` | `src-tauri/src/activity_tracker.rs` sends existing events to `supabase/functions/track-user-activity/index.ts`. The `user_activity_log` table is linked to machine/license/account records and feeds `unified_activity_log` and the admin activity endpoint. Payment-completion code also writes usage events. Inventory these producers and readers before moving storage. |

The `flowmastersuite` repository is in scope for analytics migration and admin reporting updates. `Outbound-Tool` and `scriptgen` application code and databases remain outside scope. Public website visitors are not automatically matched to FlowMaster app accounts.

## Proposed architecture

Public websites and FlowMaster app analytics -> appropriate HTTPS ingestion endpoints -> one Neon database -> private reporting dashboard.

- One Neon project for analytics, proposed resource name `alenzie-analytics`. Website identifiers: `flowmaster`, `spindle` and `portfolio`; app source identifier: `flowmaster_app`. Separate website and app event tables and permissions.
- Proposed collector home: an isolated `services/analytics/` package in this repository, deployed as a separate Vercel project. Confirm the package/root settings before implementation so the existing GitHub Pages build remains independent. No hosting move is required for any website.
- Database credentials stay on the server. Browser-visible site identifiers are routing labels, not secrets or proof that an event is genuine.
- Validate event names, route identifiers, production origins, payload sizes and property allowlists before insertion. CORS alone is not authentication; add server-side rate limits and per-site/global admission limits. Treat client traffic as observational and potentially spoofed.
- Use a database role limited to event insertion for the receiver, a separate read role for reporting, and a privileged role only for migrations and retention. The dashboard requires owner authentication; browsers cannot read the database directly.
- Preserve current FlowMaster authentication and machine/account/license authorization when routing app events to Neon. The public website ingestion path must not be able to forge authenticated app events. Database passwords never ship in the desktop client.
- Migrate eligible historical analytics with stable source event IDs and update admin readers. Classify existing event payloads before copying; operational audit, license and billing records stay on Supabase. If older installed clients require the existing Edge Function temporarily, it may forward to Neon during rollout without continuing Supabase analytics inserts. Retire that compatibility path only when installed-client compatibility is addressed.

## Initial measurements

Include page views, top landing pages, referral domains, approved campaign tags, device category and selected website actions such as download-link or outbound-link clicks. Reports must distinguish clicks from completed downloads, registrations or purchases.

For FlowMaster, preserve the approved existing usage event vocabulary and reporting semantics rather than inventing additional tracking. Inventory launches, feature actions, exports, update events and other actual producer calls. Carry only documented event fields; do not blindly transfer arbitrary JSON payloads, IP addresses, secrets or payment-provider identifiers. Any transformation that affects existing reporting must be explicitly documented and verified.

Proposed event envelope: generated event ID, site ID, schema version, event name, approved route ID, bounded event time, server receipt time, optional approved campaign labels, referral hostname and an allowlisted action ID. Deduplicate retries by site and event ID. Route IDs must not include account identifiers, invitation codes, search text, query strings or URL fragments. Store referral hostnames rather than full referring URLs. Do not collect form text, email addresses, license keys or payment details.

The first release can report traffic and click counts without persistent visitor IDs. Unique visitors, sessions, bounce rate and cross-site journeys are not implied by those counts. If those measurements are wanted later, explicitly define their identity/consent rules and accuracy before adding them. Do not use fingerprinting or link identities between sites by default.

Skip account, login, authentication callback, invitation, payment-result, unsubscribe and other private/token-bearing pages. Scope the tracker to a reviewed public-route allowlist, including in both Spindle layouts. Respect the project's chosen tracking preference and Global Privacy Control. Preview, local and synthetic verification events must never enter production reports.

## Storage, reporting and operating limits

- Proposed website retention: raw events for 30 days and daily aggregate counts for 13 months. Do not apply that deletion window to migrated FlowMaster history automatically; inventory existing history and preserve it until its retention is settled. Aggregation must be repeatable without double counting, and raw data is removed only after the corresponding aggregate is successfully recorded.
- Reports: per-site and combined web traffic, top pages, referrals, campaigns and click rates, alongside a separate FlowMaster app usage view. Do not sum app launches into website visits or imply deduplicated people across sites/app without a defined attribution mechanism.
- Use short timeouts and bounded retries. Analytics failures must not delay navigation, downloads or forms; drop events when limits are reached rather than creating unbounded client queues.
- Exclude known bots and synthetic traffic where practical, while labeling the remaining counts as estimates rather than exact human activity.
- Monitor both database storage and compute. Neon announced 1 GB storage and 100 CU-hours per free project on 2026-10-02; verify the actual selected provider/Marketplace plan before creating the resource. Continuous traffic can exhaust compute even when storage is small.
- Neon wakes automatically on a new query after idling. Do not install a keepalive: it would spend the free compute allowance unnecessarily. FlowMaster's separately approved Supabase heartbeat is unaffected.
- Vercel's hosting plan and Neon billing are separate choices. The portfolio's linked Vercel project returned no Marketplace resources in the read-only check; this does not prove that the owner has no Neon account or resources elsewhere. Reuse an appropriate existing resource if discovered. No paid upgrade is authorized by choosing Neon.

## Implementation backlog and acceptance

1. Confirm the portfolio's production hostname. Verify the three current website deployment revisions and tracking preferences. Scriptgen is excluded and is not a prerequisite.
2. Inspect existing Neon resources, confirm the free-plan allowances and provision one suitable project. Set collector and reporting credentials only in server configuration. The current Vercel CLI catalog lists `free_v3`; proposed region is `pdx1` to align with FlowMaster's US West backend. Neon Auth is not needed for this database-only integration.
3. Implement the collector, schema, retention and a minimal private report. Demonstrate payload rejection, retry deduplication, source separation, app authorization, rate limits and a database outage without affecting the website/app.
4. Add the tracker to FlowMaster's public layout and selected link actions. Demonstrate a preview page view and click through collector, stored event and report using an isolated test dataset.
5. Add the same integration to the portfolio and both Spindle layouts, preserving private-page exclusions. Existing Vercel Analytics may coexist during validation, but do not add its counts to Neon counts or attempt an assumed automatic historical import. Decide whether to retain it after comparison.
6. Inventory FlowMaster usage tables, constraints, views, writers, admin readers and installed-client compatibility. Back up historical analytics, backfill the agreed fields into Neon and verify per-event-type counts, timestamps and sampled records without exposing personal payloads in reports.
7. Prepare app ingestion and reporting changes in `flowmastersuite`; verify them against isolated data. Cut over writes to Neon with an explicit boundary and catch-up so events are not lost or counted twice. Update admin readers and verify FlowMaster's operational account/license paths still work.
8. Publish after the production route/origin allowlists, tracking disclosure and reporting checks are complete. Follow each repository's release rules; portfolio production is explicitly gated. Record deployment URLs, enabled sources and the first verified production events in this document.
9. Confirm Supabase analytics inserts have stopped and Neon is the sole analytics store. Keep the old analytics backup/table read-only for a bounded rollback period; obtain explicit confirmation before permanently deleting historical source data. No permanent dual-write architecture.

Rollback: website tracking can be disabled independently. For app migration, retain the old read path and source backup until acceptance; if a write cutover is reversed, reconcile the Neon-only interval by event ID before reporting. No rollback changes operational account/license data.

## Handoff state

This document records the owner's latest approved scope: three websites plus existing FlowMaster usage analytics, with Neon replacing Supabase analytics storage. Do not resume the superseded website-only restriction or the proposed permanent duplicate-store approach. Scriptgen remains excluded. Account/authentication/licensing replacement was not requested. No tracking deployment or data cutover has occurred yet.

## Setup discovery, 2026-10-08

- Existing repository, Supabase management and Vercel CLI access are available. No Neon CLI login or Neon credential environment variable was found in the checked locations; an existing account elsewhere is not ruled out.
- Vercel's read-only Neon catalog advertises `free_v3`, `launch_v3` and `scale_v3`; only the free plan is in scope. Provision without attaching credentials to an existing public website project accidentally.
- A read-only metadata query on FlowMaster's current hosted Supabase project confirmed small relation sizes: `user_activity_log` 98,304 bytes, `admin_activity_log` 114,688 bytes, `downloads` 40,960 bytes, `audit_log` and `crash_reports` 32,768 bytes each. These include table/index overhead; stale or unknown planner row estimates are not proof that any table is empty. Exact history inventory remains pending.


- Exact read-only count of the current hosted `public.user_activity_log`: 0 rows on 2026-10-08. There is no history to backfill from that table at this check. This does not establish whether an older retired project or a separate export contains historical data.
- Team-level Vercel integration inventory contains no Neon installation. A free-only provisioning attempt for `alenzie-analytics` (region `pdx1`, Neon Auth disabled, no connection to existing website projects) returned `action_required: integration_terms_acceptance_required`. No created resource was returned. The owner must complete the Neon Marketplace terms page: https://vercel.com/alexblair63-6415s-projects/~/integrations/accept-terms/neon?source=cli . After acceptance, inspect installation/resource state and continue the same free-only request; do not provision a second database if an existing resource is discovered.

## Provider references checked during this conversation

- [Neon free-plan update, October 2, 2026](https://neon.com/blog/neon-free-plan-1-gb-per-project)
- [Neon scale to zero and automatic wake-up](https://neon.com/docs/introduction/scale-to-zero)
- [Vercel Marketplace storage](https://vercel.com/docs/storage)
- [Vercel Pro plan and usage credit](https://vercel.com/docs/plans/pro-plan)

## Provisioned resource

2026-10-08: `alenzie-analytics` is ready on `free_v3`; Vercel resource `store_KN5ISeeknAHE3UuW`, Neon project `blue-paper-47521812`, installation `icfg_dx2S5ZBg8F1oBHZgIwLqIC8P`, region `pdx1`. No website project was connected automatically.


## Implementation status — October 8, 2026

The free Neon resource is ready. Schema 001 and four restricted database roles are applied. Collector and private reports are implemented in `services/analytics`. The service is configured for preview only. No website production endpoint was set, no app Edge Function was deployed, and `ANALYTICS_BACKEND` was not changed.

- Stable collector/report preview: https://alenzie-analytics-preview.vercel.app
- FlowMaster site preview: https://flowmaster-site-preview-8m2q4nkly-alexblair63-6415s-projects.vercel.app
- Spindle preview: https://spindle-9g74dt154-alexblair63-6415s-projects.vercel.app
- Portfolio preview: https://portfolio26-hlf40lbyj-alexblair63-6415s-projects.vercel.app

Website previews retain Vercel protection. Collector accepts public preview events, while its reports require a verified existing FlowMaster admin sign-in. It stores no owner database connection. Vercel automatically classified the first deployments of the two new staging projects as production, including one explicit `--target preview` invocation; both initial deployments were deleted and their replacements were verified as preview. Existing production website aliases were never changed. Inspect actual deployment target instead of relying solely on CLI flags for a newly created project.

Validation: collector/browser-tracker unit tests passed (7); live role restrictions, origin/route rejection, privacy opt-out, UUID deduplication, authenticated app history, unauthorized report access and repeatable retention passed against the hosted preview; atomic rate limit accepted 30 and rejected the 31st request. All three website builds passed. Deno compatibility bridge successfully wrote/read one synthetic preview event without Supabase analytics access; six bridge tests and all changed Edge Function type checks passed. Site browser verification and owner sign-in review are recorded separately under `outputs/2026-10-08-analytics` and the per-site setup notes.

The current Supabase user analytics export is empty (exact count 0), rechecked during preparation. Older retired-project history remains unverified; no source data was deleted. No paid upgrade was made. Current Vercel team is Hobby: commercial hosting and production rollout need a decision. See `services/analytics/README.md` and `flowmastersuite/docs/shared-analytics-migration.md` for activation, source reconciliation and rollback. Synthetic preview events cannot enter production reports.
