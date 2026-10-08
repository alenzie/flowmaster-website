# Shared analytics — flowmaster

Updated 2026-10-08. Implementation prepared in an isolated worktree; production activation is pending.

Owner approved one Neon database for FlowMaster website/app analytics and the Spindle/portfolio websites. Scriptgen and Spindle desktop telemetry are excluded. Collector/schema/reporting live in `alenzie/flowmaster-website`, `services/analytics`.

Set `PUBLIC_ANALYTICS_ENDPOINT` to the approved collector's `/api/events` URL at build time. With no endpoint, this addition is disabled and any existing Vercel Analytics remains as before. With the endpoint set, this site uses Neon instead of its existing Vercel Analytics component. No database credentials belong in this project.

Reviewed public routes: /, /about, /data, /download, /features, /future, /pricing, /privacy, /terms, /docs, /docs/obs-setup, /scout. Other routes remain excluded, including account, booking/confirmation, prototype, review and token-bearing pages. Page URLs never include queries/fragments; referral host only; optional campaign is restricted to `launch`. No visitor IDs, cookies, local storage, form contents, or cross-site identity. Respect DNT/GPC. Counts measure views/clicks, not unique people or completed downloads.

`public/shared-analytics.js` is the identical versioned copy of the collector's `public/tracker.js`. Copy all three site versions when fixing the tracker. No appearance changes. Any new public page requires updating both the component route list and collector config.

Next: verify preview browser → collector → Neon; owner reviews preview; approve commercial hosting and production activation; publish endpoint only after the collector is ready. Keep the old deployment for rollback. No production rollout was performed by these edits.

## Verified preview

https://flowmaster-site-preview-8m2q4nkly-alexblair63-6415s-projects.vercel.app

Build passed. Browser→hosted collector returned 202 and every captured event UUID/field matched one row in Neon preview storage. GPC opt-out passed; FlowMaster account and portfolio confirmation routes omitted tracking. Both Spindle layouts were exercised. Private previews were accessed using origin-scoped, short-lived project credentials; site protection was preserved. Mobile screenshots and sanitized event evidence are under `outputs/2026-10-08-analytics/`.

Shared private report: https://alenzie-analytics-preview.vercel.app . Existing verified FlowMaster administrator sign-in is required. Owner sign-in remains an acceptance check. Preview data contains synthetic verification events only.

Download-click tracking is covered by the browser-script unit test (including collector-outage handling). The current release data did not render an installer link in the preview, so no real installer click/download was claimed in browser evidence.
