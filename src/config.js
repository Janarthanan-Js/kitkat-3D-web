// Everything tunable lives here. Paths are relative to /public.
export const MODE = 'autoplay';       // 'autoplay' = plays on entry, 'scrub' = scroll controls video time
export const VIDEO_DIR = `${import.meta.env.BASE_URL}videos`;
export const FINAL_IMAGE = `${import.meta.env.BASE_URL}images/images.jpg`;

export const CHAPTERS = [
  { id:'cocoa',  nav:'Cocoa',  file:'cocoa.mp4',  title:'Where it begins.',       text:'Cocoa beans, roasted to richness.' },
  { id:'refine', nav:'Refine', file:'refine.mp4', title:'Smooth takes time.',     text:'Ground and conched until glossy.' },
  { id:'wafer',  nav:'Wafer',  file:'wafer.mp4',  title:'Crisp, light, layered.', text:'Thin wafer sheets, baked in seconds.' },
  { id:'layers', nav:'Layers', file:'layers.mp4', title:'Layer by layer.',        text:'Wafer, cream, wafer. Four fingers.' },
  { id:'enrobe', nav:'Enrobe', file:'enrobe.mp4', title:'Wrapped in chocolate.',  text:'A curtain of chocolate over every finger.' },
  { id:'wrap',   nav:'Wrap',   file:'wrap.mp4',   title:'Ready to break.',        text:'Foil, sleeve and one satisfying snap.' },
];

export const ZOOM = { from: 1, to: 1.07 };
export const SCROLL_PER_CHAPTER = 250;
export const PLAYBACK_RATE = 0.75; // used by the existing autoplay mode
export const ENTER = {
  duration: 1.6,
  scaleTo: 9,
  tiltMouse: 8,
  restartZoomFrom: 1.5,
  overlayFade: 0.35, // "Watch again" overlay fade-in portion of the dive
  overlayAt: 0.65, // when the overlay starts fading in
};

// ---- ANIMATION SETTINGS (change numbers here, not in code) ----
export const ANIM = {
  // MASTER SWITCH: true = turn OFF every NEW effect (section "NEW" below) to test the video alone
  safeMode: false,

  smoothScroll: { enabled: true, lerp: 0.085 },
  intro: { counterSeconds: 2.2, curtainSeconds: 1.0 },
  text: { stagger: 0.035, duration: 0.8, rise: 40 },
  video: { parallaxMouse: 14, velocityZoom: 0.02, grain: 0.06, vignette: 0.55, lightSweep: true },
  transition: { type: 'drip', duration: 0.9, color: '#3b1a0d' },
  particles: { count: 60, color: '#e8c9a8', maxSize: 3, speed: 0.4 },
  cursor: { enabled: false, size: 38, label: 'Scroll', keepNative: true,
            trail: { enabled: true, count: 8 }, clickRipple: true },
  nav: { underline: true, magnetic: 0.25 },
  counter: { enabled: true, ring: true },
  red: '#e60012',
  perf: { adaptive: true, targetFps: 50, checkFrames: 90, seekMinDelta: 0.04, maxActiveVideos: 2,
          grainFps: 12, particleFps: 30, debugParam: 'debug', debugInterval: 0.4,
          minQuality: 0, maxQuality: 3, downgradeBelow: 42, upgradeAbove: 57 },
  reveal: { videoInset: 0.05, duration: 0.9 },
  breathe: { enabled: true, idleSeconds: 4, amount: 0.012, period: 6 },
  textFx: { scrollSkew: 5, wordSubtitle: true, parallaxText: 0.12 },
  chapterFx: { cocoa: 'steam', refine: 'shine', wafer: 'crumbs', layers: 'none', enrobe: 'shine', wrap: 'sparkle', intensity: 0.6 },
  progress: { glowHead: true },
  buttons: { ripple: true, magnetic: 0.3 },
  finalFx: { crumbBurst: true, glare: true },

  // ================= NEW (all disabled by safeMode) =================
  // Video protection. This is the only part allowed to touch video behaviour.
  videoGuard: {
    warmupSeconds: 0.5,        // decode the first moments of the next video before it is shown
    showNextWhenReadyState: 3, // never show the next video until it can play (HAVE_FUTURE_DATA)
    stallTimeoutMs: 350,       // if a seek never finishes, clear the flag and carry on
    holdLastFrame: true,       // keep the old video visible until the next one is ready
    pauseOverlaysWhileSeeking: true, // skip drawing heavy overlays on frames where a seek is pending
  },
  grade: { enabled: true, strength: 0.18, fade: 0.8, ease: 'ease', // soft colour wash per chapter (gradient overlay, not a filter)
           colors: { cocoa:'#7a4a24', refine:'#8a4a22', wafer:'#c8922e', layers:'#b9783a', enrobe:'#5a2410', wrap:'#e60012' } },
  ghostText: { enabled: true, opacity: 0.07, speed: 0.35 },   // giant outlined chapter name drifting behind the headline
  spotlight: { enabled: true, size: 520, opacity: 0.16, color: '#ff9d6b', ease: 0.4,
               fadeOut: 0.35, moveEase: 'power3.out', scaleAtQuality2: 0.62 }, // warm pointer light
  facts: { enabled: true, stagger: 0.08, outDuration: 0.18, inDuration: 0.45, lineDuration: 0.5,
           dotDuration: 0.35, labelDuration: 0.35, rise: 8, dotScaleFrom: 0.4, offsetFactor: 0.5,
           inEase: 'power3.out', lineEase: 'power2.out', dotEase: 'back.out(1.6)', labelEase: 'power2.out',
           items: { // small labels that draw in on the right (edit freely)
    cocoa:  ['Whole beans', 'Hand sorted'],
    refine: ['Fine milled', 'Smooth finish'],
    wafer:  ['Thin sheets', 'Golden bake'],
    layers: ['5 layers', '4 fingers'],
    enrobe: ['Milk chocolate', 'Full coat'],
    wrap:   ['Foil sealed', 'Snap-ready'] } },
  snap: { enabled: true, atProgress: 0.62, shake: 6, flash: 0.35, flashColor: '#fff2e0',
          flashDuration: 0.3, shakeDuration: 0.26, shakePattern: [1, -1, 0.6, -0.3, 0],
          crumbs: 24, crumbColor: '#e8c9a8', canvasFade: 0.24,
          crumbOriginY: 0.46, crumbSpread: 0.02, crumbVx: 0.24, crumbVyMin: 0.42,
          crumbVyMax: 0.08, crumbSizeMin: 2, crumbSizeMax: 6, crumbSpin: 6,
          crumbTtlMin: 1.1, crumbTtlMax: 1.8, crumbGravity: 1.8, crumbMaxDelta: 34 }, // wrap: shake + flash + crumbs
  heroIntro: { scrollHint: true, lineDraw: true, hintDuration: 1.8, lineDuration: 1.1,
               linePeak: 0.75, lineOpacity: 0.3, lineStagger: 0.08, lineDelay: 0.12,
               lineSettleFactor: 0.5, lineEase: 'power3.out', lineSettleEase: 'power1.out' }, // hero polish
  navFx: { letterRoll: true, dotsFill: true, rollDuration: 0.32, rollStagger: 0.02,
           rollEase: 'power2.inOut' }, // nav hover + chapter dots
  finalReveal: { circleWipe: true, duration: 1.1 },             // final image opens with a circular wipe
};