# Release email preferences

2026-10-07 — owner approved the release planner phases, including a separate announcement channel for explicitly opted-in subscribers.

## Implemented website behavior

`src/pages/account.astro` reuses its existing Supabase session. Signed-in, email-verified accounts get a separate Release emails section. The checkbox starts unchecked until the server returns the account's saved preference; account creation, Google signup and password changes do not subscribe anyone. Saving requires an explicit action. Existing subscribers see their saved choice after reload.

The page calls `account-email-preferences` with the signed-in access token and public project key only:

- POST `{operation: 'get'}` reads the preference.
- POST `{operation: 'set', enabled: boolean, consentVersion: 'release-updates-v1'}` saves it.
- Success contains `enabled`, `blocked`, `consentVersion` and `consentText`. The visible checkbox and message reflect the returned state, not the requested value.
- Backend authorization and current verified-account checks remain mandatory. Client visibility is not an authorization gate.

A failed read or write never claims a subscription is confirmed. Failed writes disable opt-in until a fresh read resolves potentially ambiguous state. Unsubscribe remains available after a read failure or delivery suppression, independent of email-sending readiness. Suppressed accounts cannot enable emails from the page. Late responses cannot restore another session's preference or display success after sign-out.

No email is sent by this page. No subscription is included in signup. Account/security emails remain separate. The backend owns token-based unsubscribe links. Its GET redirects to the branded `/email-preferences/` landing with the token in a fragment; Supabase’s default function hostname does not serve HTML as HTML. The landing immediately removes the fragment from navigation history and holds the token only in memory. A visitor must explicitly press Unsubscribe before an unauthenticated POST; page loading never changes consent. A no-referrer policy, restricted CSP, no third-party resources, and omitted credentials limit disclosure. No unsubscribe token is exposed in the signed-in account UI. The privacy page now describes explicit release updates, preference evidence and retention of suppression/consent records without inventing deletion schedules.

## Verification and deployment boundary

`npm run build` passed (20 routes, including the public unsubscribe landing). Focused Astro checking passed with zero errors, warnings or hints across four included files, including the public unsubscribe landing. The eight existing Google/email signup, recovery and password-flow browser groups also passed with the new preferences endpoint intercepted. `scripts/verify-release-email-preferences.mjs` passed 10 browser groups, all Supabase requests intercepted, covering mobile/desktop, save/reload/unsubscribe, signed-out and unverified sessions, read failures, expired authentication, write failure, suppression and responses arriving after logout. Evidence and screenshots: `outputs/2026-10-07-release-email-preferences/`.

`scripts/verify-public-unsubscribe.mjs` additionally passed mobile and desktop explicit-confirmation/failure/retry checks, token fragment cleanup and no-storage/no-referrer assertions, and invalid/missing-token refusal with no network request. Screenshots and `public-unsubscribe.json` are in the same evidence folder.

**Deployment update (2026-10-08 UTC / 2026-10-07 Pacific):** website PR #10 merged at `db973e53f06bf134a38bafb69f2c3422911ac8ab`; GitHub Pages workflow `37716602643` completed successfully. Public `/account/` and `/email-preferences/` both returned HTTP 200. See `outputs/2026-10-07-release-email-preferences/deployment.json`.

The Flowmaster Suite team deployed the release-email schema and `admin-console`, `account-email-preferences`, and `release-email-events` functions. Live testing found that the service role could not read confirmed account email through `auth.users`; migration `20261008020616_release_email_verified_lookup.sql` fixes this through a private service-only lookup, without granting broad auth-table access. Seven hosted API groups subsequently passed, including verified opt-in/out, access denial, frozen-source preparation, approval resets and no-login unsubscribe. Disposable accounts, sessions, drafts and campaign fixtures were removed and cleanup verified. Suite evidence: `outputs/2026-10-07-release-planner/live-api.json`, `database-deployment.json` and `email-configuration.json`.

**Release-email sending remains disabled.** A sender mailing address and a real provider webhook delivery test are still pending. No announcement emails or build dispatches occurred during these checks. The final production admin UI browser pass remains owned by the root release-planner task; website deployment and hosted API verification do not imply that final pass has happened.

## Provider reference

Resend's [unsubscribe guidance](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails) explains that callers managing lists through the send API must maintain their own unsubscribe handling. The backend separately implements preference storage, suppression, token-based unsubscribe and send eligibility; this website only exposes authenticated account choices.
