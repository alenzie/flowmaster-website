# Google sign in for Flowmaster

Updated 2026-10-07. Owner approved Google signup/sign-in and created Google Cloud project `flowmaster-511000`.

## Implementation and reuse

The account page reuses the existing Supabase Auth client, project `wwuafjftlttmkvhzgtxh`, sessionStorage, account UI, and password-update flow. It calls `signInWithOAuth` with provider `google`, an account chooser, and a fixed return URL `https://flowmaster.live/account`. It does not request Gmail, Calendar, offline access, or extra Google scopes. Existing email confirmation/recovery links keep their current browser implicit flow; the SDK validates the returned session through Auth and clears token fragments. OAuth errors display a safe message rather than arbitrary provider text.

The public Auth settings endpoint controls button availability. It stays disabled if Google is not enabled or settings cannot be loaded. Enabling the Google provider requires no further frontend build. Signup and password recovery remain available independently.

No separate Google account table or trial counter was introduced. Supabase handles signup/sign-in and verified same-email identity linking. Existing server-side account permissions and device trial accounting are unchanged. A Google session does not confer administrator access, Scout status, paid access, or marketing consent.

Desktop login (`flowmastersuite/src/scripts/login-overlay.js`) and admin login (`admin-ui/src/components/AuthGate.tsx`) currently use password authentication. After Google sign-in, the website offers a separate Flowmaster password on the same account using authenticated `updateUser`; it does not ask for the Google password. Native Google sign-in in those applications remains future work. Browser guidance is not an authorization decision.

## Google and Supabase setup

1. Open https://console.cloud.google.com/auth/overview?project=flowmaster-511000. Initialize Google Auth Platform with app name Flowmaster, owner-selected support/contact email, and External audience. Use homepage `https://flowmaster.live`, privacy page `https://flowmaster.live/privacy/`, and authorized domain `flowmaster.live` when configuring branding. Use terms URL `https://flowmaster.live/terms/` (publication tracked in `docs/TERMS_OF_SERVICE.md`).
2. Create a **Web application** client at https://console.cloud.google.com/auth/clients?project=flowmaster-511000. Authorized JavaScript origin: `https://flowmaster.live`. Authorized redirect URI: `https://wwuafjftlttmkvhzgtxh.supabase.co/auth/v1/callback`. This Google callback is different from the website return URL.
3. In Supabase Authentication → Sign In / Providers → Google, enable the provider and paste the web client ID and secret directly into the dashboard. Keep secrets out of chat, the repository, browser code and screenshots. Keep nonce checks and email verification checks enabled.
4. Preserve the current Supabase Site URL and allowed redirect `https://flowmaster.live/account`. Do not replace existing redirects with the Google callback. Only add narrow redirects if genuinely needed.
5. If Google keeps the app in Testing, add the owner's Google account to Test users. Public signup needs the External audience published to Production and any required Google branding checks completed. Only basic identity scopes (`openid`, email, profile) are needed.
6. Confirm the public Auth settings report Google enabled. On the deployed account page, test the real Google chooser → consent → Flowmaster return. Verify account identity and confirmed email server-side, normal logout/relogin, and same-email account linking. Then use the website's Flowmaster password option to verify desktop/admin password compatibility. Never assign administrator access based only on client metadata.

## Verification and remaining work

Eight isolated browser check groups passed against the local site, covering desktop/mobile Google signup redirect, disabled/unreachable provider fallback, cancellation, returned-session cleanup/reload, password setup/mismatch/cancel/logout, existing email signup/password login/recovery, and email recovery callbacks. All Auth requests were intercepted; these checks did not create a real Google identity, send email, or prove Google consent/identity linking. Evidence: `outputs/2026-10-07-google-signin/browser.json` and screenshots in that directory. Production build and the focused account-page Astro check passed (zero errors/warnings). The broad repository Astro check reports 283 errors across existing reference packets, Tailwind/Vite types, legacy components and unrelated pages; it is not a passing repository-wide typecheck. The scoped account-page check includes its imports and returned zero diagnostics.

Live setup readback before this change: Google disabled, no client ID/secret configured, signup enabled, site URL and allow list both `https://flowmaster.live/account`. The owner supplied the web OAuth client export. Its project, client ID, exact callback and origin were verified; credentials were installed directly into Supabase protected provider settings. Management readback and the public Auth settings both confirm Google enabled. No secret was copied into this repository or the frontend. Real Google signup and Google audience/production eligibility remain unverified until a human sign-in is complete. Subsequent owner signup and administrator enrollment are recorded below and in the suite deployment handoff.

Run browser checks with `ACCOUNT_URL`, optional `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` environment variables:

```sh
node scripts/verify-google-signin.mjs
```

The test only mocks Supabase requests. It must not be represented as a live Google authentication test.

## References

- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/auth-identity-linking
- https://developers.google.com/identity/branding-guidelines

Supabase changelog checked 2026-10-07. Listed breaking changes for self-hosted SAML, Management API OAuth status codes, Postgres extensions and Node 20 do not change this browser Auth integration. Development runs Node 24; Pages CI uses Node 22.

## Production rollout

PR #7 merged at `c4e95955d6635874470245efda1cb4c89e08c9f1`; GitHub Pages run `37706638267` succeeded. Live browser checks at 390px and 1440px confirm the button is enabled, email login remains available, and clicking Google reaches `accounts.google.com` with the configured client and no client/redirect error before sign-in. No Google account was signed in by the test. See `outputs/2026-10-07-google-signin/production.json` and the `live-google-signin-*` screenshots. At that rollout checkpoint, owner sign-in was pending; subsequent verified signup and administrator enrollment are recorded below.

## Consent branding and first real account

2026-10-07: owner completed Google signup. Auth records confirm a Google identity and verified email; this proves a real signup, not only an intercepted browser test. Separate administrator enrollment is documented in the suite repository. Existing-account identity linking is still untested.

The owner reported Google's dialog displays `wwuafjftlttmkvhzgtxh.supabase.co`. Google branding verification/publication controls the displayed application name/logo; the actual OAuth callback hostname is a separate setting. Google Cloud project: `flowmaster-511000`, branding page: https://console.cloud.google.com/auth/branding?project=flowmaster-511000. Use Flowmaster name, current approved logo, homepage https://flowmaster.live and a privacy disclosure that accurately covers Google account data. The `/privacy/` page now covers Google account data and the broader Flowmaster service; `/data` remains a linked explanation of trial records. No claim of verification or Google approval has been made.

Proposal: first complete Google brand verification and publish branding. Google's documentation says automated review may take minutes, manual review usually 2–3 business days. For a branded callback hostname, propose `auth.flowmaster.live`; Supabase requires a paid plan and an add-on priced at $0.0137/hour (approximately $10/month), separate from base-plan/compute costs. No paid add-on, DNS change, or custom domain activation is authorized or performed yet. Before activating a future custom domain, add its exact callback in Google's web-client redirect list while retaining the existing callback.

Sources checked 2026-10-07:
- https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/platform/custom-domains
- https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains

## Branding kit and privacy page

Owner requested a desktop branding kit and authorized publication of a privacy page on 2026-10-07. Kit source: `outputs/2026-10-07-google-branding/kit`; desktop copy: `C:/Users/alexb/Desktop/Flowmaster Google Branding Kit`. Logo exports render the exact approved `docs/email/flowmaster-lockup.svg` uniformly on a dark square. No logo parts were rearranged and no credentials are included. Owner selected the existing `support@flowmastersuite.com` for privacy requests.

Policy implementation: `src/pages/privacy.astro`, linked from the site footer, account page, and trial-data page. Covers Google basic identity and use restrictions, account/trial/activity data, local recordings, Supabase/Google/Resend/hosting providers, retention criteria, manual access/correction/deletion requests, revocation and policy updates. No automatic deletion deadline, unprovisioned inbox, custom auth domain, or Google verification approval is claimed. Canonical/OG origins now follow the configured `flowmaster.live` site instead of the historical domain.

Privacy rollout completed: PR #8 merged to `ef0de3affb2b02032b986d7a8eff7779d2f1b215`; Pages deployment `37708239417` succeeded. https://flowmaster.live/privacy/ passed live 390px/1440px browser checks, including public access, canonical URL, support/revocation links and homepage/account/trial navigation. All nine desktop kit files match their repository originals. Evidence: `outputs/2026-10-07-google-branding/deployment.json`. Google branding upload, verification and publication remain owner-side steps; the optional paid custom auth hostname remains unconfigured.
