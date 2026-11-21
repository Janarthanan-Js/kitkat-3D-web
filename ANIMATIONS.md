# Animation audit (pre-change)

Every item below was present in the code before this polish pass. The "Driven by" column
names the single loop/timeline that owns the motion, so it can be re-checked after the
change. A second section records animations that existed only as `ANIM` settings.

## Existing animations found in the code

| # | Animation | File | What drives it |
|---|-----------|------|----------------|
| 1 | Smooth scroll | `src/App.jsx` (`smoothScroll` effect), `src/styles.css` (`.lenis*`) | Lenis, stepped from the shared `gsap.ticker`; disabled by `ANIM.smoothScroll.enabled` / reduced motion |
| 2 | Intro counter | `src/components/Loader.jsx` | GSAP proxy tween (`ANIM.intro.counterSeconds`), capped at 97% until scene 0 is ready |
| 3 | Intro curtain | `src/components/Loader.jsx` | GSAP timeline (`ANIM.intro.curtainSeconds`) after counter + video are ready |
| 4 | Split text (hero + chapter headlines/subtitles) | `src/lib/splitText.js`, `src/App.jsx`, `src/components/SceneStage.jsx` | GSAP timelines (`ANIM.text.*`); chapter timelines pause/reverse on enter/leave |
| 5 | Chocolate drip transition | `src/components/DripTransition.jsx` | Imperative GSAP timeline (`ANIM.transition.duration`) called by `enterChapter` |
| 6 | Video parallax | `src/App.jsx` (`parallax` effect), `.scene-rig` CSS | Pointer target eased inside the shared `gsap.ticker`, written to `--mx` / `--my` |
| 7 | Velocity zoom | `src/App.jsx` (`velocityZoom` effect), `.scene-video` CSS | Shared `gsap.ticker` reads scroll delta, writes `--anim-vzoom` |
| 8 | Camera zoom per chapter | `src/App.jsx` ScrollTrigger, `ZOOM` | ScrollTrigger scrub on each `.stage-media` (`scale` 1 → 1.07) |
| 9 | Film grain | `src/components/FilmGrain.jsx` | Shared `gsap.ticker`, noise tile redrawn every ~90 ms (`ANIM.video.grain`) |
| 10 | Vignette | `.stage-vignette` CSS, `ANIM.video.vignette` | Static gradient variable (no animation loop) |
| 11 | Light sweep | `.light-sweep` CSS, `ANIM.video.lightSweep` | CSS keyframes restarted by the `is-on` class on chapter entry (`ANIM.text.duration`) |
| 12 | Particles / cocoa dust | `src/components/Particles.jsx` | Shared `gsap.ticker`; visibility pause + half count below 768 px |
| 13 | Cursor follower + label | `src/components/Cursor.jsx` | Disabled via `ANIM.cursor.enabled: false`; the native cursor and the separate soft pointer glow remain |
| 14 | Cursor glow | `src/App.jsx` (cursor glow effect), `.cursor-glow` CSS | GSAP `quickTo` from pointer events |
| 15 | Magnetic nav | `src/components/Nav.jsx` | GSAP `to` on pointer move/leave (`ANIM.nav.magnetic`) |
| 16 | Nav sliding indicator | `src/components/Nav.jsx`, `.nav-indicator` | GSAP `to` on active chapter / resize / fonts ready |
| 17 | Chapter counter digits | `src/components/ChapterCounter.jsx` | GSAP roll timeline on digit change (direction-aware) |
| 18 | Progress line + glow + shimmer | `src/components/ProgressLine.jsx`, `src/App.jsx`, CSS | Global ScrollTrigger writes `scaleX`; shimmer is CSS keyframes |
| 19 | Chapter copy fade/slide + meter | `src/App.jsx` chapter ScrollTrigger (`onUpdate`) | Scroll progress writes `opacity`/`transform` on copy and `scaleX` on meter |
| 20 | Stage ambient drift / dust | `.chapter-stage::before/::after` CSS | CSS keyframes (`stage-drift`, `stage-dust`) |
| 21 | Intro ambient drift / sparks | `.intro-visual::before/::after`, `.intro-sparks` CSS | CSS keyframes (`intro-drift`, `intro-sweep`, `intro-sparks`) |
| 22 | Hero wordmark float + subtitle breathe | `.hero-wordmark`, `.hero-title p` CSS | CSS keyframes (`hero-float`, `look-breathe`) |
| 23 | Scroll hint line pulse | `.scroll-hint i` CSS | CSS keyframes (`scroll-pulse`) |
| 24 | Final image float | `.final-image` CSS | CSS keyframes (`final-float`) |
| 25 | Final glow rings | `.final-glow::before/::after` CSS | CSS keyframes (`ring-spin`, `glow-breathe`) |
| 26 | Final entrance rise | `.outro.is-live .final-stage` CSS | CSS keyframes (`outro-rise`) |
| 27 | Final headline shine | `.final-copy h2` CSS | CSS keyframes (`text-shine`) |
| 28 | Watch again button shine / pulse | `.watch-again` CSS | CSS transitions + `watch-pulse` keyframes |
| 29 | "Watch again" dive | `src/App.jsx` (`watchAgain`) | GSAP timeline: mirrored image clip-path inset → full screen, scale to `ENTER.scaleTo`, overlay fade, rewind |
| 30 | Rewind glide | `src/App.jsx` (`restartShowcase`) | GSAP `scrollTo` tween (1.8 s) + `rewindingRef` guard |
| 31 | Footer line + copy reveal | `.site-footer::before`, `.site-footer p` CSS | CSS keyframes + `animation-timeline: view()` where supported |
| 32 | Tab-hidden behaviour | `Particles`, scrub tick, scrub seek | `document.hidden` checks (not all existing effects pause) |
| 33 | Scene loader spinner | `.scene-loader::after` CSS | CSS keyframes (`scene-spin`) |
| 34 | Scene crossfade | `.scene-video` CSS, `SceneStage.jsx` | `is-ready` class adds opacity transition after `loadeddata`/`canplay` |

## Configured but not implemented before this pass

These keys existed in `ANIM` but no code consumed them. They are listed here so the
absence is explicit rather than treated as a regression.

- `ANIM.cursor.trail`, `ANIM.cursor.clickRipple`
- `ANIM.buttons.magnetic` (nav has its own `ANIM.nav.magnetic`)
- `ANIM.counter.ring`
- `ANIM.reveal`, `ANIM.breathe`, `ANIM.textFx`, `ANIM.chapterFx`, `ANIM.progress.glowHead`
- `ANIM.finalFx.crumbBurst`, `ANIM.finalFx.glare`
- `ANIM.perf` had no governor or `?debug` readout
- Every key under "NEW" in `ANIM` (`videoGuard`, `grade`, `ghostText`, `spotlight`,
  `facts`, `snap`, `heroIntro`, `navFx`, `finalReveal`)

## Added in this polish pass

| # | Animation / behavior | File | What drives it |
|---|----------------------|------|----------------|
| 35 | Next-clip warm-up decode (scrub mode) | `src/App.jsx` | Plays the incoming muted clip briefly while still hidden, then pauses it if it is no longer active (`warmupSeconds`); autoplay starts each clip from 0 as before |
| 36 | Readiness gate before reveal | `src/components/SceneStage.jsx`, `src/App.jsx` | Retries on `gsap.ticker` until `readyState >= showNextWhenReadyState`; nav entry waits while `holdLastFrame` keeps the current chapter |
| 37 | Seek watchdog + overlay pause | `src/App.jsx`, `FilmGrain`, `Particles`, `ChapterFx` | Per-video `seeking`/`seeked` listeners; a timeout clears a stuck seek and heavy canvases skip pending-seek frames |
| 38 | Per-chapter colour grade | `.grade-layer`, `ANIM.grade` | CSS opacity transition between radial washes, one layer per chapter |
| 39 | Ghost chapter word drift | `src/components/SceneStage.jsx`, `.ghost-word` | Chapter ScrollTrigger progress writes a transform on the outline word |
| 40 | Pointer spotlight | `src/components/Spotlight.jsx` | GSAP `quickTo` from pointer events; smaller at Q2; disabled for touch/narrow |
| 41 | Chapter fact labels | `src/components/Facts.jsx` | GSAP timeline: rows rise, SVG lines draw with `stroke-dashoffset`, dots and labels fade in; rows leave before the chapter swaps |
| 42 | Wrap snap | `src/App.jsx`, `src/components/ChapterFx.jsx`, `.snap-flash` | Chapter progress latch fires a shake proxy, a flash tween and a canvas crumb burst |
| 43 | Hero hairlines + scroll mouse | `src/App.jsx`, `.hero-lines`, `.scroll-mouse` | One GSAP timeline after the curtain; mouse wheel uses CSS keyframes |
| 44 | Nav letter roll + chapter dots | `src/components/Nav.jsx`, `.nav-roll`, `.nav-dots` | GSAP letter roll on hover; dots fill from active chapter state |
| 45 | Final circular clip reveal | `src/App.jsx`, `.final-image` | GSAP `clipPath` wipe from `circle(0%)` to `circle(150%)` when the outro goes live |
| 46 | Quality governor + `?debug` | `src/App.jsx`, `src/components/DebugReadout.jsx` | Shared `gsap.ticker` FPS sampling switches `fx` flags between Q3 and Q0; the readout only writes text |

## Re-check status (filled in after the polish pass)

- Status: **complete**.
- Existing animations 1-34 were left in place; the new work only adds overlays, the
  readiness gate and the governor. The scene scrub/crossfade path was not restructured.
- New effects were checked in a headless Chrome run at `/?debug`: the app boots past
  the loader, sequential scrolling activates Cocoa -> Refine -> Wafer -> Layers ->
  Enrobe -> Wrap with matching facts, the Wrap snap fires crumbs + flash, the outro
  reveals the final image with `circle(150%)`, `Watch again` returns to the top and
  unlocks scrolling, and no console exceptions were recorded.
- Quality mapping was verified by forcing `maxQuality`: Q0 removes every new effect,
  Q1 keeps only nav dots, snap shake/flash and the final wipe, Q2 removes ghost text
  and shrinks the spotlight, Q3 renders everything. The governor also dropped itself
  from Q3 to Q2 under headless CPU load and logged `[perf] quality 2`.
- `ANIM.safeMode: true` removed every new effect (including the final clip wipe) while
  chapters, nav, copy and `Watch again` still worked.
- `prefers-reduced-motion: reduce` removed every new effect, disabled Lenis and kept
  the loader working after reload.
- Build: `npm run build` succeeds (58 modules; only the expected large-chunk warnings).
- Autoplay `MODE` was re-checked headlessly: the active clip plays at
  `PLAYBACK_RATE`, the previous clip pauses, hidden clips stay paused at 0, and
  the outro still reveals without console errors.
- Layout probe: at 1440px the facts, nav, dots and debug readout do not overlap,
  the overlay stays `pointer-events: none` below the nav, and there is no horizontal
  overflow. At 390px (touch emulation) facts and dots are hidden, spotlight, ghost
  and nav roll are absent, and `scrollWidth` still matches the viewport.
- Scrub media was the main source of lag: every source clip had only one
  keyframe, so a seek took ~246ms on average. The checked-in clips are now
  H.264, 1280px wide, keyframe every 4 frames, no audio, and stream directly
  from `/videos`. The same seek test averages ~23ms and the headless governor
  now stays at Q3 while scrolling.
- The custom "Scroll" cursor is disabled (`ANIM.cursor.enabled: false`); the
  native cursor and soft pointer glow remain.
- `FINAL_IMAGE` now points at the existing `/images/images.jpg` (it previously
  referenced a missing `/images/final.png`).
- Not runtime-tested: real mobile GPUs, visual 60fps smoothness, and audio
  (all clips are muted).
