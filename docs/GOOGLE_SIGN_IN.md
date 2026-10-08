# Google sign in for Flowmaster

Updated 2026-10-07. Owner approved Google signup/sign-in and created Google Cloud project `flowmaster-511000`.

## Implementation and reuse

The account page reuses the existing Supabase Auth client, project `wwuafjftlttmkvhzgtxh`, sessionStorage, account UI, and password-update flow. It calls `signInWithOAuth` with provider `google`, an account chooser, and a fixed return URL `https://flowmaster.live/account`. It does not request Gmail, Calendar, offline access, or extra Google scopes. Existing email confirmation/recovery links keep their current browser implicit flow; the SDK validates the returned session through Auth and clears token fragments. OAuth errors display a safe message rather than arbitrary provider text.

The public Auth settings endpoint controls button availability. It stays disabled if Google is not enabled or settings cannot be loaded. Enabling the Google provider requires no further frontend build. Signup and password recovery remain available independently.

No separate Google account table or trial counter was introduced. Supabase handles signup/sign-in and verified same-email identity linking. Existing server-side account permissions and device trial accounting are unchanged. A Google session does not confer administrator access, Scout status, paid access, or marketing consent.

Desktop login (`flowmastersuite/src/scripts/login-overlay.js`) and admin login (`admin-ui/src/components/AuthGate.tsx`) currently use password authentication. After Google sign-in, the website offers a separate Flowmaster password on the same account using authenticated `updateUser`; it does not ask for the Google password. Native Google sign-in in those applications remains future work. Browser guidance is not an authorization decision.

## Google and Supabase setup

1. Open https://console.cloud.google.com/auth/overview?project=flowmaster-511000. Initialize Google Auth Platform with app name Flowmaster, owner-selected support/contact email, and External audience. Use homepage `https://flowmaster.live`, privacy page `https://flowmaster.live/data`, and authorized domain `flowmaster.live` when configuring branding. Do not invent a terms URL.
2. Create a **Web application** client at https://console.cloud.google.com/auth/clients?project=flowmaster-511000. Authorized JavaScript origin: `https://flowmaster.live`. Authorized redirect URI: `https://wwuafjftlttmkvhzgtxh.supabase.co/auth/v1/callback`. This Google callback is different from the website return URL.
3. In Supabase Authentication → Sign In / Providers → Google, enable the provider and paste the web client ID and secret directly into the dashboard. Keep secrets out of chat, the repository, browser code and screenshots. Keep nonce checks and email verification checks enabled.
4. Preserve the current Supabase Site URL and allowed redirect `https://flowmaster.live/account`. Do not replace existing redirects with the Google callback. Only add narrow redirects if genuinely needed.
5. If Google keeps the app in Testing, add the owner's Google account to Test users. Public signup needs the External audience published to Production and any required Google branding checks completed. Only basic identity scopes (`openid`, email, profile) are needed.
6. Confirm the public Auth settings report Google enabled. On the deployed account page, test the real Google chooser → consent → Flowmaster return. Verify account identity and confirmed email server-side, normal logout/relogin, and same-email account linking. Then use the website's Flowmaster password option to verify desktop/admin password compatibility. Never assign administrator access based only on client metadata.

## Verification and remaining work

Eight isolated browser check groups passed against the local site, covering desktop/mobile Google signup redirect, disabled/unreachable provider fallback, cancellation, returned-session cleanup/reload, password setup/mismatch/cancel/logout, existing email signup/password login/recovery, and email recovery callbacks. All Auth requests were intercepted; these checks did not create a real Google identity, send email, or prove Google consent/identity linking. Evidence: `outputs/2026-10-07-google-signin/browser.json` and screenshots in that directory. Production build and the focused account-page Astro check passed (zero errors/warnings). The broad repository Astro check reports 283 errors across existing reference packets, Tailwind/Vite types, legacy components and unrelated pages; it is not a passing repository-wide typecheck. The scoped account-page check includes its imports and returned zero diagnostics.

Live setup readback before this change: Google disabled, no client ID/secret configured, signup enabled, site URL and allow list both `https://flowmaster.live/account`. The owner supplied the web OAuth client export. Its project, client ID, exact callback and origin were verified; credentials were installed directly into Supabase protected provider settings. Management readback and the public Auth settings both confirm Google enabled. No secret was copied into this repository or the frontend. Real Google signup and Google audience/production eligibility remain unverified until a human sign-in is complete. Existing owner administrator enrollment is still pending verified account creation.

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

PR #7 merged at `c4e95955d6635874470245efda1cb4c89e08c9f1`; GitHub Pages run `37706638267` succeeded. Live browser checks at 390px and 1440px confirm the button is enabled, email login remains available, and clicking Google reaches `accounts.google.com` with the configured client and no client/redirect error before sign-in. No Google account was signed in by the test. See `outputs/2026-10-07-google-signin/production.json` and the `live-google-signin-*` screenshots. The owner still needs to complete their first real Google sign-in; administrator membership remains a separate verified-account step.
