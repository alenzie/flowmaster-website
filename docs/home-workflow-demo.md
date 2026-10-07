# Homepage workflow demo

Owner-approved task (2026-10-07): reuse portfolio26's Flowmaster hero motion graphic, including its WebM footage, directly beneath the Flowmaster.live hero.

Design: retain the existing Inter/Space Grotesk typography and Flowmaster colors (#101010 page, #07080b composition, #f2f2f2 text, #a3a3a3 secondary text, #f43f43 interaction accent). One centered composition at the hero's 1200px width, followed by a compact caption and usable playback controls. Preserve the animation's own visual identity. No extra decorative background or competing frame.

Source: portfolio26 working-tree `public/demos/flowmaster-ux-story`, with `FlowmasterHero.astro` as the embedding reference. Source files were only read. `flowmaster-workflow-source.json` records original hashes, including the owner's existing local edits. The site copy adds an origin-checked playback bridge, offscreen/hidden pause, accessible play button, and reduced-motion CSS. The composition remains click-to-play; media are local to Flowmaster.live, not served from portfolio26. Original runtime loads pinned React/ReactDOM/Babel scripts from unpkg.

The new `WorkflowDemo.astro` sits immediately after Hero and before the existing three-step content. Hero's down arrow targets it. Mobile uses the same full composition plus normal-sized external controls and an Open full view link. Embed mode omits the editing runtime transport so the entire 16:9 composition is visible; standalone mode retains it. Video/audio don't autoplay before user input.

Production build passed. Browser checks against the static build passed at 1440px and 390px (including reduced motion): embedded WebM decodes at 1920px, no initial autoplay, Play/Pause works, media pauses offscreen, the composition is not cropped, and there are no demo asset failures or page errors. Evidence is in `outputs/2026-10-07-home-workflow/`. Signup/recovery, download gating and other product pages remain in the release base; this addition does not publish a desktop installer.

Published 2026-10-07 through PR #4 (https://github.com/alenzie/flowmaster-website/pull/4), merge `8d80cdf3a8eda12c789670aa5b825e7726ba5642`. GitHub Pages run `37668807257` succeeded. The same browser checks passed against https://flowmaster.live/ at desktop and phone widths; see `outputs/2026-10-07-home-workflow/live-verification.json`.
