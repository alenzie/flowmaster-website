# Shared analytics

A separate Vercel collector and private report, backed by one free Neon database. Three public websites and FlowMaster app usage share the database with separate tables and permissions. No production cutover has occurred. Accounts, licenses, billing, operational audit records and authentication remain on Supabase.

## Local operation

Requires Node 24. Run `npm ci`. Put the owner's pooled Neon `DATABASE_URL` in ignored `.env.local`. `node tools/setup-db.mjs` applies the checksummed migration once and creates four restricted login roles; credentials are written only to ignored local files. Preserve `.env.roles.local` securely. A failure after `.env.roles.pending.local` is written requires checking which roles exist and recovering those generated credentials before retrying; never blindly recreate passwords.

Copy `.env.example` runtime settings into `.env.runtime.local`, configure exact origins and routes from `config/sites.json`, and set `ANALYTICS_ENABLED=true` for testing. Add only verified administrator emails. Start with `npm run dev`. `npm test` verifies validation and admin authorization. `node tools/smoke-preview.mjs` writes known synthetic preview events to live Neon, verifies restricted roles, deduplication, history and retention, then removes its rows. This requires owner credentials locally, never on the deployed collector.

`node tools/configure-preview.mjs` uploads runtime settings and restricted role connections to the existing collector project's **preview** environment. It never uploads owner `DATABASE_URL`. Always deploy with `vercel deploy --target preview`: Inspect the returned target as well: during this setup Vercel made first deployments production, including an explicit preview request. Initial staging deployments were removed and replacements verified as preview.

## Data contract and permissions

- `POST /api/events`: reviewed public site/origin/route; page view, download click or marked outbound click; random event UUID, device class, referral hostname and approved campaign only. No URL query, form contents, cookies, local storage IDs, email, fingerprint or account matching. Honors GPC/DNT and skips obvious bots. Origin checks are an abuse filter, not authentication.
- `POST /api/app-events`: separate backend bearer secret, verified FlowMaster account/machine/license context supplied by its existing Edge Function. Accepts UUID-linked app events and bounded object details. No IP storage in Neon. No operational authorization is delegated to browser analytics.
- Website database role can execute only the ingestion function; app role inserts/selects its own table; report role reads event tables; maintenance role executes retention only. RLS enabled on private tables; no PUBLIC schema/function access. HTTP pooled Neon driver and bounded request/query timeouts.
- App event idempotency uses `(environment,id)`, website uses `(environment,site,event_id)`. Backend retries reuse IDs. Existing desktop clients do not yet supply a stable request ID: two separate client requests can still represent the same real-world event. This migration does not claim exactly-once tracking across legacy client retries.
- Website raw events roll into daily aggregates after 30 days; daily counts expire after 13 months. Retention is one atomic function, so retries cannot count the same raw rows twice. App history is never automatically deleted. Cron runs once daily on production only and requires `CRON_SECRET`.
- Website limits: 30 accepted events per rotating address hash/minute and 10,000 per site/day. Address hashes are stored only for rate limiting, rotate daily and expire after two days. No raw IP or user agent in event tables. These limits can undercount busy pages or shared networks; they don't replace Vercel's request controls.
- Preview data is excluded from production reports. Preview and production share one schema; DB credentials must stay private. Limits, outages, ad blockers and opt-outs mean counts are observational, not a billing ledger. Reports show event counts, not unique people/sessions.

## Reports

Open the collector URL and use an existing verified FlowMaster administrator's email/password. The browser sends credentials directly to Supabase Auth; the collector revalidates the access token and administrator allowlist on every report request. Tokens stay in page memory. Update `ADMIN_EMAILS` when administrators change. The dashboard's web breakdown is capped at 500 groups and app breakdown at 100 event types; the screen notes the web cap. Full admin app activity remains in the existing FlowMaster admin screen after its reader is switched.

## Release checklist (pending owner approval)

1. Settle commercial hosting: the current Vercel team is Hobby, while commercial use requires Pro or a suitable alternative host. Neon remains free. No upgrade authorized.
2. Review site previews and sign into the report. Confirm real domains; `alexanderblair.com` was not connected at inspection. Preview allowlists use exact URLs, never `*.vercel.app`.
3. Generate **separate production ingestion/report/cron/rate secrets** and set production environment settings. Connect restricted database roles only, never the owner URL. Deploy collector explicitly to production only after approval. Add exact production origins and keep preview endpoint/config distinct.
4. Follow `flowmastersuite/docs/shared-analytics-migration.md` for source inventory, export/backfill, Edge writer/reader deployment and the one-store cutover. Recount current source at cutover, despite the earlier zero-row inventory. Do not delete historical source data.
5. Publish the approved `/api/events` endpoint at build time as `PUBLIC_ANALYTICS_ENDPOINT` for each site. FlowMaster uses a GitHub repository variable consumed by its Pages workflow; Spindle/portfolio use Vercel environment configuration. Where present, existing Vercel Analytics is omitted when Neon tracking is enabled.
6. Verify a real page view and marked click, an authenticated app event, existing admin history, and that Supabase analytics row counts stop growing. Confirm operational account/license flows still work. Check retention after its first scheduled run.
7. Observe Neon compute/storage and hosting usage after launch. Do not keep Neon awake artificially: it wakes on requests. Free quotas can still stop service when exhausted.

Disable a site's endpoint and rebuild to roll back web collection. For app rollback, reconcile Neon-only events by ID before reverting the analytics backend; otherwise its history would disappear from the old reader. Never delete the source table/export until the owner explicitly approves deletion.
