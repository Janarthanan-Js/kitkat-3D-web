# KitKat — Inside the Factory

A chapter-based, scroll-driven scene showcase built with **Vite + React**, plain CSS and **GSAP ScrollTrigger**.

The page opens with an intro, moves through one scroll chapter per scene, then closes with an outro, a “Watch again” button and the concept disclaimer. Scene timing, titles and pacing are read from `src/config.js`.

## Run it

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Project structure

```
public/
  images/        final KitKat image (FINAL_IMAGE)
  videos/        scene MP4s, streamed directly with range requests
src/
  media.js       resolves each chapter file to its URL under /videos
  config.js      MODE, video paths, final image, CHAPTERS, ZOOM, ENTER
  App.jsx        page sections + GSAP scroll logic
  components/    Nav, SceneStage, ProgressLine, Loader, Spotlight, Facts, ChapterFx, DebugReadout
  styles.css     layout, typography, fixed scene stage, mobile and reduced-motion styles
```

Scene MP4s live in `public/videos` and are streamed directly by the browser with range requests; `SceneStage` renders each as a muted, chrome-less background video. The first chapter loads at page start and each later scene is fetched as its section approaches. Each scene shows a warm `#140b08` loader until the video can play, then crossfades over 400ms.

Each chapter is a 250vh scroll track with a sticky 100svh stage, a 1→1.07 camera move, scroll-linked copy and a per-scene meter. The intro is a cocoa-free gradient stage; its card expands to fullscreen while a giant wordmark scales up and fades, and the first Cocoa scene appears in chapter 01. The final screen uses `FINAL_IMAGE` with a pointer-tracked 3D tilt and an `ENTER`-driven “Watch again” fly-in: the image expands to full screen and keeps pushing in until the focus is inside the picture, then the page jumps back to the top and restarts the loop. Ambient motion runs throughout: a pointer glow, drifting stage light and dust, staggered copy reveals, a shimmering meter, animated glow rings around the final image, and a scroll-drawn footer reveal.

## Replacing scenes

1. Drop your new MP4 into `public/videos/`.
2. Update the matching entry in `src/config.js`:

```js
{ id: 'cocoa', nav: 'Cocoa', file: 'cocoa.mp4',
  title: 'Where it begins.', text: 'Cocoa beans, roasted to richness.' }
```

- `file` is resolved against `VIDEO_DIR` (`/videos`); `FINAL_IMAGE` is served from `public/images/`.
- Add or remove entries in `CHAPTERS`; the nav, scroll sections, stage layers and progress line all derive from the array.
- Sources should be muted-friendly MP4/H.264. They are streamed directly and rendered as muted, chrome-less background videos. No controls are shown.
- Smooth `scrub` playback needs frequent keyframes. Every-frame (`-g 1`) is smoothest but large; the checked-in clips use a keyframe every 4 frames.
  `ffmpeg -i in.mp4 -an -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset veryfast -crf 26 -g 4 -keyint_min 4 -sc_threshold 0 -bf 0 -movflags +faststart -pix_fmt yuv420p out.mp4`
- Keep sources roughly the same aspect ratio (16:9 or wider works best with `object-fit: cover`).
- If a source is missing or fails, the warm background and loader stay on screen.

## Switching MODE

Open `src/config.js` and change:

```js
export const MODE = 'autoplay'; // or 'scrub'
```

- **`autoplay`** — the active chapter scene plays once at `PLAYBACK_RATE` (0.75× by default), holds its final frame, and pauses on leave. Scrolling changes chapters and drives the camera, copy and meter. The intro is a static gradient stage, so Cocoa appears only once, in chapter 01. The checked-in config uses `autoplay`.
- **`scrub`** — scrolling through a chapter maps its scroll progress to the scene's timeline, smoothed with a small lerp on GSAP's ticker. Nothing advances until the viewer scrolls.

## Performance and safe mode

Everything added in the polish pass is controlled from `ANIM` in `src/config.js`.

- **`ANIM.safeMode: true`** turns off every new visual effect and restores the
  pre-polish behavior (the video guard is off too). Use it to test the video alone.
- **Adaptive quality governor.** `ANIM.perf` samples real frame rate on the shared
  `gsap.ticker` and moves between four quality levels:

  | Level | New effects |
  | --- | --- |
  | Q3 | Everything: grade, spotlight, facts, ghost text, nav roll, hero lines, snap crumbs, final wipe |
  | Q2 | Ghost text off; spotlight smaller; everything else stays |
  | Q1 | Grade, facts, spotlight, nav letter roll and hero polish off; snap shake/flash, nav dots and final wipe stay |
  | Q0 | All new visual effects off; the video guard still runs unless `safeMode` |

  Tune it with `minQuality`, `maxQuality`, `downgradeBelow`, `upgradeAbove`,
  `checkFrames` and `adaptive`. Each change logs `[perf] quality N` to the console.
- **`?debug`** shows a small readout with FPS, quality, active video `readyState`,
  whether a seek is pending, watchdog stalls and the last presented video frame
  (via `requestVideoFrameCallback` when supported). Set `ANIM.perf.debugParam` to
  use a different query parameter.
- **Video guard.** In scrub mode the next clip is warmed up quietly, scenes only reveal after
  `ANIM.videoGuard.showNextWhenReadyState`, navigation waits for the incoming clip,
  and a seek watchdog clears a stuck seek after `stallTimeoutMs`. Videos are muted,
  chrome-less (no PiP, remote playback, download or controls) and overlays pause
  while a seek is pending. Scrub mode only seeks the active clip.
- **Reduced motion / touch.** `prefers-reduced-motion: reduce` disables all new
  effects (and Lenis). Touch or screens under 768px disable the spotlight, ghost
  text and nav letter roll; snap crumbs are halved. Under 680px the facts and nav
  dots are hidden by CSS.

Animation timings, easing curves, colours, sizes and thresholds live in `ANIM`;
see `ANIMATIONS.md` for the full pre-existing inventory and the re-check list.

## Other tuning

```js
export const ZOOM = { from: 1, to: 1.07 }; // scroll-linked camera pull-back
export const SCROLL_PER_CHAPTER = 250;      // vh of scroll per chapter
export const PLAYBACK_RATE = 0.75;          // slow autoplay speed
```

On mobile the chapter nav becomes dots and pointer parallax is disabled for touch. Ambient and scroll animations run for every visitor, and the explicit “Watch again” dive always plays. Per-scene loaders hide once each video can play.

---

Concept showcase. The KitKat name is typographic, not the official logo. Not affiliated with Nestlé or Hershey.
