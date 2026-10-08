# Flowmaster Terms of Service

Updated 2026-10-07. Owner requested a Terms of Service page following the published privacy policy and Google branding kit.

## Scope and reuse

Page: `src/pages/terms.astro`, URL https://flowmaster.live/terms/. Uses the existing BaseLayout, privacy-page visual treatment, site typography, and footer. Linked from footer, account, download, and privacy pages. Google branding kit includes the URL, shortcut, and readable copy. Contact remains owner-approved `support@flowmastersuite.com`.

Sources checked: website account/download/data/privacy pages, `src/data/release.json`, suite `docs/releases/0.2.2-free-trial.md`, `installer/windows/assets/license.txt`, and `src-tauri/LICENSE.txt`. The current public download is unavailable pending verification; this page does not announce an installer release. Trial disclosures match the current shared 30-action device allowance and online requirements.

The existing installer license is a beta evaluation license that prohibits commercial use. Website terms expressly preserve the build-specific license and third-party licenses, rather than silently granting incompatible software rights. The older installer license also contains a historical domain. **Before the first public installer release, owner/legal review should align the bundled license with the intended free-trial commercial-use policy.** No installer license was changed by this website task.

## Published terms and limitations

Covers account responsibility, device trial, local content ownership/backups, abuse restrictions, availability, reasonable access restrictions and support review, privacy/service communications, and prospective changes. Consumer-rights exceptions are explicit. No paid plan, automatic charge, governing jurisdiction, mandatory arbitration, monetary liability cap, or registered-company status was invented.

This is a published service-terms page, not a claim of lawyer approval or universally enforceable terms. Existing signup has visible terms/privacy links but **does not capture versioned affirmative terms acceptance**. Adding stored clickwrap consent and evaluating existing-user acceptance are separate future work, not implemented or implied by this page. Google branding approval is also separate.

Drafting references reviewed 2026-10-07 (not copied boilerplate):
- https://www.ftc.gov/business-guidance/resources/businesspersons-guide-federal-warranty-law — warranty limitations and mandatory rights depend on applicable law/product.
- https://www.ftc.gov/business-guidance/resources/advertising-faqs-guide-small-business — clear material conditions.
- https://www.law.cornell.edu/uscode/text/17/117 — preserve statutory and third-party software rights.

## Verification and rollout

Production build passed; focused Astro diagnostics returned zero errors, warnings, and hints across six files. Browser checks cover public page content, canonical URL, support links, fixed-navigation clearance, no horizontal overflow, and footer/account/download links at 390px and 1440px. PR #9 merged at `eb464dc7ed7abd60b7f75fd492f0d98166c919cf`; GitHub Pages run `37709290569` succeeded. Live browser checks passed at both widths on https://flowmaster.live/terms/. All 11 desktop branding-kit files match the repository sources. Evidence is saved in `outputs/2026-10-07-terms/`. The repository-wide Astro diagnostic baseline has pre-existing failures; a focused check is not a claim that the whole repository passes.
