# Homepage workflow demo

Owner-approved task (2026-10-07): reuse portfolio26's Flowmaster hero motion graphic, including its WebM footage, directly beneath the Flowmaster.live hero.

Design: retain the existing Inter/Space Grotesk typography and Flowmaster colors (#101010 page, #07080b composition, #f2f2f2 text, #a3a3a3 secondary text, #f43f43 interaction accent). One centered composition at the hero's 1200px width, followed by a compact caption and usable playback controls. Preserve the animation's own visual identity. No extra decorative background or competing frame.

Source: portfolio26 working-tree `public/demos/flowmaster-ux-story`, with `FlowmasterHero.astro` as the embedding reference. Source files were only read. `flowmaster-workflow-source.json` records original hashes, including the owner's existing local edits. The site copy adds an origin-checked playback bridge, offscreen/hidden pause, accessible play button, and reduced-motion CSS. The composition remains click-to-play; media are local to Flowmaster.live, not served from portfolio26. Original runtime loads pinned React/ReactDOM/Babel scripts from unpkg.

The new `WorkflowDemo.astro` sits immediately after Hero and before the existing three-step content. Hero's down arrow targets it. Mobile uses the same full composition plus normal-sized external controls and an Open full view link. Embed mode omits the editing runtime transport so the entire 16:9 composition is visible; standalone mode retains it. Video/audio don't autoplay before user input.

Production build passed. Browser checks against the static build passed at 1440px and 390px (including reduced motion): embedded WebM decodes at 1920px, no initial autoplay, Play/Pause works, media pauses offscreen, the composition is not cropped, and there are no demo asset failures or page errors. Evidence is in `outputs/2026-10-07-home-workflow/`. Signup/recovery, download gating and other product pages remain in the release base; this addition does not publish a desktop installer.

Published 2026-10-07 through PR #4 (https://github.com/alenzie/flowmaster-website/pull/4), merge `8d80cdf3a8eda12c789670aa5b825e7726ba5642`. GitHub Pages run `37668807257` succeeded. The same browser checks passed against https://flowmaster.live/ at desktop and phone widths; see `outputs/2026-10-07-home-workflow/live-verification.json`.

## Mobile loading repair — 2026-10-07

Owner reported the embedded walkthrough stuck at “Buffering footage + music… 43%” in an iPhone link preview. The original readiness gate waited for every video and the entire 197-second music track to report enough data; its 14-second fallback still required all media to be playable. Browsers can limit preload, so this provided no guaranteed way to start playback. The previous phone-width test used Chromium, not an actual iPhone. Linux WebKit with iPhone emulation loaded the original normally; that does **not** disprove the device report. Blocking media reproduces the old disabled-Play failure.

Implemented in the existing embed/runtime (no second player): Play is available when the composition mounts; preload is metadata-only. The parent's same-origin playback command dispatches synchronously so media.play() runs in the user's interaction stack. Hidden/background playback still pauses. Failed or stalled initial video offers Retry after at most 12 seconds of attempted playback; failed runtime loading offers Retry after 20 seconds. Optional music never gates Play. Full-view Play and keyboard controls use the same media-start path. Changed runtime URLs have a version query to avoid stale cached JSX.

Playback assets are H.264 main/yuv420p 720p MP4 plus AAC music in M4A, both with fast-start metadata, transcoded from the original portfolio WebMs (retained for provenance). The visual composition and footage are unchanged. This improves compatibility without assuming all WebKit versions reject WebM.

Verification: `scripts/verify-workflow-mobile.mjs` exercises Chromium and Linux WebKit with iPhone 13 emulation: normal start, zero preloaded bytes, failed music, stalled video with retry recovery, failed runtime with retry recovery, video time advancing, synchronous media-start dispatch, no autoplay, phone overflow, and offscreen pause. Evidence: `outputs/2026-10-07-mobile-loading/`. `scripts/verify-workflow.mjs` remains the desktop/mobile geometry check; it no longer requires decoded video before Play is offered. Standalone WebKit Play and keyboard pause/resume also passed. These checks do not establish physical iPhone/in-app-browser success; owner retest remains the final device check.

References checked: WebKit's [iOS media policies](https://webkit.org/blog/6784/new-video-policies-for-ios/) and Apple's [Safari video guidance](https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari). The exact owner device's preload/policy behavior remains inferred, not remotely inspected.
