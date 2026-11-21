import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Lenis from 'lenis';
import {
  ANIM,
  CHAPTERS,
  ENTER,
  FINAL_IMAGE,
  MODE,
  PLAYBACK_RATE,
  SCROLL_PER_CHAPTER,
  ZOOM,
} from './config.js';
import Nav from './components/Nav.jsx';
import ProgressLine from './components/ProgressLine.jsx';
import SceneStage from './components/SceneStage.jsx';
import Loader from './components/Loader.jsx';
import DripTransition from './components/DripTransition.jsx';
import FilmGrain from './components/FilmGrain.jsx';
import Particles from './components/Particles.jsx';
import Cursor from './components/Cursor.jsx';
import ChapterCounter from './components/ChapterCounter.jsx';
import Spotlight from './components/Spotlight.jsx';
import Facts from './components/Facts.jsx';
import ChapterFx from './components/ChapterFx.jsx';
import DebugReadout from './components/DebugReadout.jsx';
import { splitChars } from './lib/splitText.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const clampProgress = (value) =>
  Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

const clampSigned = (value) => Math.min(1, Math.max(-1, value));

const easeInOut = (value) => value * value * (3 - 2 * value);

const band = (progress, from, to) =>
  easeInOut(clampProgress((progress - from) / (to - from)));

const WRAP_INDEX = CHAPTERS.findIndex((chapter) => chapter.id === 'wrap');

export default function App() {
  const rootRef = useRef(null);
  const introRef = useRef(null);
  const introMediaRef = useRef(null);
  const introVisualRef = useRef(null);
  const introTitleRef = useRef(null);
  const introCopyRef = useRef(null);
  const introHintRef = useRef(null);
  const heroWordRef = useRef(null);
  const heroSubRef = useRef(null);
  const heroTextTlRef = useRef(null);
  const chapterTextTlsRef = useRef([]);
  const chapterSectionRefs = useRef([]);
  const chapterStageRefs = useRef([]);
  const mediaRefs = useRef([]);
  const copyRefs = useRef([]);
  const meterRefs = useRef([]);
  const ghostRefs = useRef([]);
  const outroRef = useRef(null);
  const finalTiltRef = useRef(null);
  const finalImageRef = useRef(null);
  const finalCopyRef = useRef(null);
  const enterDiveRef = useRef(null);
  const enterDiveImageRef = useRef(null);
  const enterOverlayRef = useRef(null);
  const enterTlRef = useRef(null);
  const enteringRef = useRef(false);
  const videoRefs = useRef([]);
  const targetsRef = useRef(CHAPTERS.map(() => 0));
  const activeRef = useRef(null);
  const progressFillRef = useRef(null);
  const cursorGlowRef = useRef(null);
  const scrollTweenRef = useRef(null);
  const rewindingRef = useRef(false);
  const lenisRef = useRef(null);
  const dripRef = useRef(null);
  const chapterFxRef = useRef(null);
  const snapFlashRef = useRef(null);
  const snapLatchRef = useRef(false);
  const snapFxRef = useRef({});
  const heroLineRefs = useRef([]);
  const heroLineTlRef = useRef(null);
  const pendingEnterRef = useRef(null);
  const gateTickRef = useRef(null);
  const commitEnterRef = useRef(null);
  const stallMapRef = useRef(new Map());
  const stallCountRef = useRef(0);
  const seekStateRef = useRef({ pending: false });
  const warmTimersRef = useRef(new Set());
  const viewportRef = useRef({ w: window.innerWidth, h: window.innerHeight });
  const perfStateRef = useRef({
    fps: 0,
    quality: ANIM.perf.maxQuality,
    readyState: 0,
    seeking: false,
    stalls: 0,
    presented: null,
  });

  const [activeIndex, setActiveIndex] = useState(null);
  const [finalLive, setFinalLive] = useState(false);
  const [booting, setBooting] = useState(true);
  const [loadedScenes, setLoadedScenes] = useState(() => new Set([0]));
  const [ready, setReady] = useState(() => CHAPTERS.map(() => false));
  const [failed, setFailed] = useState(() => CHAPTERS.map(() => false));
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [quality, setQuality] = useState(ANIM.perf.maxQuality);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 768);
  const [isTouch, setIsTouch] = useState(
    () => window.matchMedia('(pointer: coarse)').matches
  );
  const [debug] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has(ANIM.perf.debugParam);
  });

  const safeMode = ANIM.safeMode === true;
  const guardOn = !safeMode && Boolean(ANIM.videoGuard);
  const fx = {
    grade: !safeMode && !reduceMotion && quality >= 2 && ANIM.grade.enabled,
    ghost:
      !safeMode &&
      !reduceMotion &&
      quality >= 3 &&
      ANIM.ghostText.enabled &&
      !isNarrow &&
      !isTouch,
    spotlight:
      !safeMode &&
      !reduceMotion &&
      quality >= 2 &&
      ANIM.spotlight.enabled &&
      !isNarrow &&
      !isTouch,
    facts: !safeMode && !reduceMotion && quality >= 2 && ANIM.facts.enabled,
    snap: !safeMode && !reduceMotion && quality >= 1 && ANIM.snap.enabled,
    snapCrumbs: !safeMode && !reduceMotion && quality >= 2 && ANIM.snap.enabled,
    heroHint:
      !safeMode && !reduceMotion && quality >= 2 && ANIM.heroIntro.scrollHint,
    heroLines:
      !safeMode && !reduceMotion && quality >= 2 && ANIM.heroIntro.lineDraw,
    navRoll:
      !safeMode &&
      !reduceMotion &&
      quality >= 2 &&
      ANIM.navFx.letterRoll &&
      !isNarrow &&
      !isTouch,
    navDots: !safeMode && !reduceMotion && quality >= 1 && ANIM.navFx.dotsFill,
    finalReveal:
      !safeMode && !reduceMotion && quality >= 1 && ANIM.finalReveal.circleWipe,
  };
  snapFxRef.current = {
    snap: fx.snap,
    crumbs: fx.snapCrumbs,
    half: isNarrow || isTouch,
  };

  // Track the OS reduced-motion preference so every animation block can opt out.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReduceMotion(event.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);

  // Cache viewport facts for the new overlays. No per-frame layout reads.
  useEffect(() => {
    const narrowQuery = window.matchMedia('(max-width: 767px)');
    const touchQuery = window.matchMedia('(pointer: coarse)');
    const update = () => {
      setIsNarrow(narrowQuery.matches);
      setIsTouch(touchQuery.matches);
      viewportRef.current = { w: window.innerWidth, h: window.innerHeight };
    };

    update();
    narrowQuery.addEventListener?.('change', update);
    touchQuery.addEventListener?.('change', update);
    window.addEventListener('resize', update);

    return () => {
      narrowQuery.removeEventListener?.('change', update);
      touchQuery.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // PERFORMANCE GOVERNOR. Measures real frame rate on the shared ticker and
  // drops the NEW effects one quality level at a time. The video never loses its
  // existing effects; only the additions below level 3 are switched off.
  useEffect(() => {
    if (!ANIM.perf.adaptive) {
      setQuality(ANIM.perf.maxQuality);
      return undefined;
    }

    const { checkFrames, maxQuality, minQuality, downgradeBelow, upgradeAbove } = ANIM.perf;
    let frames = 0;
    let elapsed = 0;
    let bad = 0;
    let good = 0;
    let current = maxQuality;

    const tick = (time, deltaTime) => {
      if (document.hidden) return;

      frames += 1;
      elapsed += deltaTime / 1000;
      if (frames < checkFrames) return;

      const fps = frames / elapsed;
      frames = 0;
      elapsed = 0;
      perfStateRef.current.fps = fps;

      if (fps < downgradeBelow) {
        bad += 1;
        good = 0;
      } else if (fps > upgradeAbove) {
        good += 1;
        bad = 0;
      } else {
        bad = 0;
        good = 0;
      }

      let next = current;
      if (bad >= 2 && current > minQuality) next = current - 1;
      else if (good >= 4 && current < maxQuality) next = current + 1;

      if (next !== current) {
        current = next;
        bad = 0;
        good = 0;
        setQuality(current);
        // eslint-disable-next-line no-console
        console.info(`[perf] quality ${current} (${fps.toFixed(0)} fps)`);
      }
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  useEffect(() => {
    perfStateRef.current.quality = quality;
  }, [quality]);

  // VIDEO GUARD (e) + (c). Chrome-less attributes on every clip and a per-video
  // stall watchdog. A stuck seek clears after stallTimeoutMs so scrubbing resumes.
  useEffect(() => {
    if (!guardOn) return undefined;

    const stalls = stallMapRef.current;
    const state = seekStateRef.current;
    const nodes = videoRefs.current.filter(Boolean);

    const cleanups = nodes.map((video) => {
      video.disablePictureInPicture = true;
      video.disableRemotePlayback = true;
      video.controlsList = 'nodownload noremoteplayback';

      const onSeeking = () => {
        state.pending = true;
        perfStateRef.current.seeking = true;
        perfStateRef.current.readyState = video.readyState;
        const existing = stalls.get(video);
        if (existing?.timer) clearTimeout(existing.timer);

        const entry = existing || { timer: null, stalled: false };
        entry.stalled = false;
        entry.timer = setTimeout(() => {
          entry.stalled = true;
          entry.timer = null;
          stallCountRef.current += 1;
          perfStateRef.current.stalls = stallCountRef.current;
          state.pending = false;
          console.warn('[videoGuard] seek watchdog fired');
        }, ANIM.videoGuard.stallTimeoutMs);
        stalls.set(video, entry);
      };

      const onSeeked = () => {
        const entry = stalls.get(video);
        if (entry?.timer) clearTimeout(entry.timer);
        if (entry) {
          entry.timer = null;
          entry.stalled = false;
        }
        state.pending = false;
        perfStateRef.current.seeking = false;
        perfStateRef.current.readyState = video.readyState;
      };

      video.addEventListener('seeking', onSeeking);
      video.addEventListener('seeked', onSeeked);

      return () => {
        video.removeEventListener('seeking', onSeeking);
        video.removeEventListener('seeked', onSeeked);
        const entry = stalls.get(video);
        if (entry?.timer) clearTimeout(entry.timer);
        stalls.delete(video);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      state.pending = false;
    };
  }, [guardOn]);

  // VIDEO GUARD (a). Decode the first moments of the next clip while it is still
  // hidden. This is the only play() call made in scrub mode.
  useEffect(() => {
    if (MODE !== 'scrub' || !guardOn || activeIndex === null) return;

    const nextIndex = activeIndex + 1;
    const video = videoRefs.current[nextIndex];
    if (!video || video.dataset.warmed === '1') return;
    if (video.readyState < 1 || !Number.isFinite(video.duration)) return;

    video.dataset.warmed = '1';
    if (!video.paused) return;

    video.muted = true;
    const playAttempt = video.play();
    if (playAttempt?.catch) playAttempt.catch(() => {});

    const timer = setTimeout(() => {
      warmTimersRef.current.delete(timer);
      // Never stop a clip that became the active chapter while it warmed up.
      if (activeRef.current !== nextIndex && !video.paused) video.pause();
    }, ANIM.videoGuard.warmupSeconds * 1000);
    warmTimersRef.current.add(timer);
  }, [guardOn, activeIndex, ready]);

  useEffect(
    () => () => {
      warmTimersRef.current.forEach((timer) => clearTimeout(timer));
      warmTimersRef.current.clear();
    },
    []
  );

  // VIDEO GUARD (f). rVFC is only used to read the presented frame for ?debug.
  useEffect(() => {
    if (!debug || !guardOn || activeIndex === null) return undefined;
    const video = videoRefs.current[activeIndex];
    if (!video || typeof video.requestVideoFrameCallback !== 'function') return undefined;

    let id = 0;
    let cancelled = false;

    const onFrame = (now, metadata) => {
      if (cancelled) return;
      perfStateRef.current.presented = metadata.mediaTime;
      id = video.requestVideoFrameCallback(onFrame);
    };

    id = video.requestVideoFrameCallback(onFrame);

    return () => {
      cancelled = true;
      if (id && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(id);
      }
    };
  }, [debug, guardOn, activeIndex, ready]);

  // 1. Smooth scroll: Lenis drives the scroll position, GSAP drives Lenis' RAF.
  useEffect(() => {
    if (!ANIM.smoothScroll.enabled || reduceMotion) return undefined;

    const lenis = new Lenis({
      lerp: ANIM.smoothScroll.lerp,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduceMotion]);

  const updateProgress = useCallback((value) => {
    if (progressFillRef.current) {
      progressFillRef.current.style.transform = `scaleX(${clampProgress(value)})`;
    }
  }, []);

  const pauseAll = useCallback(() => {
    if (MODE !== 'autoplay') return;
    videoRefs.current.forEach((video) => {
      if (video && !video.paused) video.pause();
    });
  }, []);

  const markSceneLoaded = useCallback((index) => {
    if (index < 0 || index >= CHAPTERS.length) return;
    setLoadedScenes((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  // 3. Per-chapter headline timeline: chars rise through their masks, then the
  // subtitle fades in. Reversing this timeline hides the copy again on exit.
  const buildChapterText = useCallback((index) => {
    const copy = copyRefs.current[index];
    if (!copy) return null;

    const existing = chapterTextTlsRef.current[index];
    if (existing) return existing;

    const heading = copy.querySelector('h2');
    const subtitle = copy.querySelector('.chapter-text');
    if (!heading) return null;

    const tl = gsap.timeline({ paused: true });

    if (reduceMotion) {
      tl.fromTo(
        [heading, subtitle].filter(Boolean),
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power1.out', stagger: 0.08 }
      );
    } else {
      const chars = splitChars(heading);
      tl.fromTo(
        chars,
        { y: ANIM.text.rise, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: ANIM.text.duration,
          stagger: ANIM.text.stagger,
          ease: 'power3.out',
        }
      );

      if (subtitle) {
        tl.fromTo(
          subtitle,
          { opacity: 0, y: ANIM.text.rise * 0.5 },
          { opacity: 1, y: 0, duration: ANIM.text.duration * 0.8, ease: 'power2.out' },
          `-=${ANIM.text.duration * 0.35}`
        );
      }
    }

    chapterTextTlsRef.current[index] = tl;
    return tl;
  }, [reduceMotion]);

  const commitEnterChapter = useCallback((index) => {
    const previous = activeRef.current;
    activeRef.current = index;
    setActiveIndex(index);
    markSceneLoaded(index);
    markSceneLoaded(index - 1);
    markSceneLoaded(index + 1);

    // During the “Watch again” glide, chapters are only shown, not played.
    if (rewindingRef.current) return;

    // 4. Drip only on chapter-to-chapter moves, never on the intro or rewind.
    if (previous !== null && previous !== index) {
      dripRef.current?.play();
    }

    buildChapterText(index)?.play();

    if (MODE === 'autoplay') {
      const video = videoRefs.current[index];
      if (video) {
        video.playbackRate = PLAYBACK_RATE;
        video.play().catch(() => {});
      }
    }

    return previous;
  }, [buildChapterText, markSceneLoaded]);

  commitEnterRef.current = commitEnterChapter;

  const cancelPendingEnter = useCallback((match = null) => {
    if (match !== null && pendingEnterRef.current !== match) return;
    pendingEnterRef.current = null;
    if (gateTickRef.current) {
      gsap.ticker.remove(gateTickRef.current);
      gateTickRef.current = null;
    }
  }, []);

  // VIDEO GUARD (b). Wait until the incoming clip is decodable before swapping.
  // The previous chapter stays active while the shared ticker retries.
  const enterChapter = useCallback(
    (index) => {
      const previous = activeRef.current;

      // Start fetching the incoming scene before the readiness wait begins, or
      // the guard would wait on a clip that has not been given a source yet.
      markSceneLoaded(index);
      markSceneLoaded(index + 1);

      if (
        guardOn &&
        previous !== null &&
        previous !== index &&
        ANIM.videoGuard.holdLastFrame
      ) {
        const video = videoRefs.current[index];
        const threshold = ANIM.videoGuard.showNextWhenReadyState;

        if (video && !video.error && video.readyState < threshold) {
          pendingEnterRef.current = index;

          if (!gateTickRef.current) {
            const tick = () => {
              if (document.hidden) return;
              const pending = pendingEnterRef.current;
              if (pending === null) {
                gsap.ticker.remove(tick);
                gateTickRef.current = null;
                return;
              }

              const target = videoRefs.current[pending];
              if (!target || target.error || target.readyState >= threshold) {
                pendingEnterRef.current = null;
                gsap.ticker.remove(tick);
                gateTickRef.current = null;
                commitEnterRef.current?.(pending);
              }
            };
            gateTickRef.current = tick;
            gsap.ticker.add(tick);
          }

          return previous;
        }
      }

      cancelPendingEnter();
      return commitEnterRef.current?.(index);
    },
    [cancelPendingEnter, guardOn, markSceneLoaded]
  );

  const leaveChapter = useCallback((index) => {
    cancelPendingEnter(index);
    chapterTextTlsRef.current[index]?.reverse();

    if (MODE !== 'autoplay') return;
    const video = videoRefs.current[index];
    if (video && !video.paused) video.pause();
  }, [cancelPendingEnter]);

  const clearStage = useCallback(() => {
    cancelPendingEnter();
    snapLatchRef.current = false;
    if (activeRef.current !== null) {
      chapterTextTlsRef.current[activeRef.current]?.reverse();
    }
    activeRef.current = null;
    setActiveIndex(null);
    pauseAll();
  }, [cancelPendingEnter, pauseAll]);

  const resetClips = useCallback(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Seeking can fail if a source has not loaded its metadata yet.
      }
    });

    targetsRef.current = CHAPTERS.map(() => 0);

    copyRefs.current.forEach((copy) => {
      if (!copy) return;
      copy.style.opacity = '0';
      copy.style.transform = 'translateY(50px)';
      Array.from(copy.children).forEach((child) => {
        child.style.opacity = '';
        child.style.transform = '';
        child.style.filter = '';
        child.style.clipPath = '';
      });
    });

    chapterTextTlsRef.current.forEach((tl) => {
      if (tl) tl.pause(0);
    });

    meterRefs.current.forEach((meter) => {
      if (meter) meter.style.transform = 'scaleX(0)';
    });

    snapLatchRef.current = false;
    chapterStageRefs.current.forEach((stage) => {
      if (stage) stage.style.setProperty('--snap-x', '0px');
    });
    if (snapFlashRef.current) gsap.set(snapFlashRef.current, { opacity: 0 });

    updateProgress(0);
  }, [updateProgress]);

  // “Watch again” and the wordmark glide back up, then reset for a fresh replay.
  const restartShowcase = useCallback(() => {
    if (scrollTweenRef.current) {
      scrollTweenRef.current.kill();
      scrollTweenRef.current = null;
    }

    if (reduceMotion) {
      rewindingRef.current = false;
      window.scrollTo(0, 0);
      clearStage();
      resetClips();
      return;
    }

    // Freeze the scenes on their opening frames while they glide past.
    rewindingRef.current = true;
    resetClips();

    scrollTweenRef.current = gsap.to(window, {
      duration: 1.8,
      ease: 'power2.inOut',
      overwrite: true,
      scrollTo: { y: 0, autoKill: true },
      onComplete: () => {
        scrollTweenRef.current = null;
        rewindingRef.current = false;
        clearStage();
        resetClips();
      },
      onInterrupt: () => {
        scrollTweenRef.current = null;
        rewindingRef.current = false;
        if (activeRef.current !== null) enterChapter(activeRef.current);
      },
    });
  }, [clearStage, enterChapter, reduceMotion, resetClips]);

  useEffect(
    () => () => {
      scrollTweenRef.current?.kill();
      scrollTweenRef.current = null;
      enterTlRef.current?.kill();
      enterTlRef.current = null;
      enteringRef.current = false;
      heroLineTlRef.current?.kill();
      heroLineTlRef.current = null;
      if (gateTickRef.current) {
        gsap.ticker.remove(gateTickRef.current);
        gateTickRef.current = null;
      }
      pendingEnterRef.current = null;
      document.documentElement.classList.remove('is-scroll-locked');
    },
    []
  );

  // “Watch again” focuses into the final image, then restarts from the beginning.
  const watchAgain = useCallback(() => {
    if (enteringRef.current) return;

    const overlay = enterOverlayRef.current;
    const dive = enterDiveRef.current;
    const diveImage = enterDiveImageRef.current;
    const image = finalImageRef.current;
    const copy = finalCopyRef.current;
    const tilt = finalTiltRef.current;
    const introVisual = introVisualRef.current;
    const root = document.documentElement;

    const unlock = () => {
      enteringRef.current = false;
      root.classList.remove('is-scroll-locked');
      lenisRef.current?.start();
    };

    const resetFinal = () => {
      if (image) gsap.set(image, { clearProps: 'transform' });
      if (copy) gsap.set(copy, { opacity: 1, y: 0 });
      if (tilt) {
        gsap.killTweensOf(tilt);
        gsap.set(tilt, { rotationX: 0, rotationY: 0 });
      }
    };

    const resetDive = () => {
      if (dive) gsap.set(dive, { opacity: 0, clipPath: 'inset(0px 0px 0px 0px)' });
      if (diveImage) gsap.set(diveImage, { clearProps: 'transform' });
    };

    scrollTweenRef.current?.kill();
    scrollTweenRef.current = null;
    rewindingRef.current = true;
    enteringRef.current = true;
    root.classList.add('is-scroll-locked');
    lenisRef.current?.stop();

    if (overlay) gsap.set(overlay, { opacity: 0 });
    if (tilt) {
      gsap.killTweensOf(tilt);
      gsap.set(tilt, { rotationX: 0, rotationY: 0 });
    }

    // The dive layer mirrors the final image, then opens to full screen and
    // keeps pushing in until the focus is inside the picture.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = image ? image.getBoundingClientRect() : null;
    const focusX = rect ? rect.left + rect.width / 2 : vw / 2;
    const focusY = rect ? rect.top + rect.height / 2 : vh / 2;

    if (dive) {
      const inset = rect
        ? `inset(${Math.max(0, rect.top)}px ${Math.max(0, vw - rect.right)}px ${Math.max(
            0,
            vh - rect.bottom
          )}px ${Math.max(0, rect.left)}px)`
        : 'inset(0px 0px 0px 0px)';
      gsap.set(dive, { opacity: 0, clipPath: inset });
    }

    if (diveImage) {
      gsap.set(diveImage, {
        scale: 1,
        transformOrigin: `${focusX}px ${focusY}px`,
      });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        // The overlay hides the exit, then the page restarts at the top.
        if (lenisRef.current) {
          lenisRef.current.scrollTo(0, { immediate: true, force: true });
        } else {
          window.scrollTo(0, 0);
        }
        clearStage();
        resetClips();
        setFinalLive(false);
        resetFinal();
        resetDive();
        rewindingRef.current = false;

        if (introVisual) {
          gsap.fromTo(
            introVisual,
            { scale: ENTER.restartZoomFrom },
            {
              scale: 1,
              duration: ENTER.duration,
              ease: 'power3.out',
              clearProps: 'scale',
              overwrite: true,
            }
          );
        }

        const firstVideo = videoRefs.current[0];
        if (firstVideo) {
          gsap.fromTo(
            firstVideo,
            { scale: ENTER.restartZoomFrom },
            {
              scale: 1,
              duration: ENTER.duration,
              ease: 'power3.out',
              clearProps: 'scale',
              overwrite: true,
            }
          );
        }

        if (overlay) {
          gsap.to(overlay, {
            opacity: 0,
            duration: ENTER.duration,
            ease: 'power2.out',
            onComplete: unlock,
          });
        } else {
          unlock();
        }
      },
    });

    enterTlRef.current = tl;

    if (dive) {
      tl.to(dive, { opacity: 1, duration: ENTER.duration * 0.12, ease: 'power1.out' }, 0).to(
        dive,
        {
          clipPath: 'inset(0px 0px 0px 0px)',
          duration: ENTER.duration * 0.4,
          ease: 'power2.inOut',
        },
        0
      );
    }

    if (diveImage) {
      tl.fromTo(
        diveImage,
        { scale: 1 },
        {
          scale: ENTER.scaleTo,
          duration: ENTER.duration,
          ease: 'power2.in',
        },
        0
      );
    }

    if (copy) {
      tl.to(
        copy,
        { opacity: 0, y: -24, duration: ENTER.duration * 0.3, ease: 'power2.in' },
        0
      );
    }

    if (overlay) {
      tl.to(
        overlay,
        {
          opacity: 1,
          duration: ENTER.duration * ENTER.overlayFade,
          ease: 'power2.in',
        },
        ENTER.duration * ENTER.overlayAt
      );
    }
  }, [clearStage, resetClips]);

  const markReady = useCallback((index) => {
    setReady((prev) =>
      prev[index] ? prev : prev.map((value, i) => (i === index ? true : value))
    );

    if (
      !rewindingRef.current &&
      MODE === 'autoplay' &&
      activeRef.current === index
    ) {
      const video = videoRefs.current[index];
      if (video) {
        video.playbackRate = PLAYBACK_RATE;
        video.play().catch(() => {});
      }
    }
  }, []);

  const markFailed = useCallback((index) => {
    setFailed((prev) =>
      prev[index] ? prev : prev.map((value, i) => (i === index ? true : value))
    );
  }, []);

  // 2. Intro: keep the page still until the counter and curtain have finished.
  const handleIntroDone = useCallback(() => setBooting(false), []);

  useEffect(() => {
    const root = document.documentElement;
    if (booting) root.classList.add('is-booting');
    else root.classList.remove('is-booting');
    return () => root.classList.remove('is-booting');
  }, [booting]);

  // Warm light that trails the pointer across the whole showcase.
  useEffect(() => {
    if (reduceMotion) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    const node = cursorGlowRef.current;
    if (!node) return undefined;

    gsap.set(node, { xPercent: -50, yPercent: -50, opacity: 0 });
    const xTo = gsap.quickTo(node, 'x', { duration: 0.55, ease: 'power3.out' });
    const yTo = gsap.quickTo(node, 'y', { duration: 0.55, ease: 'power3.out' });
    let visible = false;

    const onMove = (event) => {
      if (event.pointerType === 'touch') return;
      if (!visible) {
        visible = true;
        gsap.to(node, { opacity: 0.6, duration: 0.7, overwrite: true });
      }
      xTo(event.clientX);
      yTo(event.clientY);
    };

    const onLeave = () => {
      visible = false;
      gsap.to(node, { opacity: 0, duration: 0.4, overwrite: true });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(node);
    };
  }, [reduceMotion]);

  // Final image follows the pointer with a capped, smoothed 3D tilt.
  useEffect(() => {
    const node = finalTiltRef.current;
    if (!node) return undefined;

    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (!finalLive || touch || reduceMotion) {
      gsap.to(node, { rotationX: 0, rotationY: 0, duration: 0.4, overwrite: true });
      return undefined;
    }

    const rotateX = gsap.quickTo(node, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const rotateY = gsap.quickTo(node, 'rotationY', { duration: 0.6, ease: 'power3.out' });

    const onMove = (event) => {
      if (enteringRef.current || event.pointerType === 'touch') return;
      const rect = node.getBoundingClientRect();
      const x = clampSigned((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2));
      const y = clampSigned((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2));
      rotateX(-y * ENTER.tiltMouse);
      rotateY(x * ENTER.tiltMouse);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.to(node, { rotationX: 0, rotationY: 0, duration: 0.4, overwrite: true });
    };
  }, [finalLive, reduceMotion]);

  // 5. Parallax: the stage drifts opposite the pointer, smoothed on the shared
  // GSAP ticker. Touch and narrow screens skip it entirely.
  useEffect(() => {
    if (reduceMotion || ANIM.video.parallaxMouse <= 0) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768) {
      return undefined;
    }

    const root = rootRef.current;
    if (!root) return undefined;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const tick = (time, deltaTime) => {
      const ease = 1 - Math.pow(0.001, deltaTime / 1000);
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      root.style.setProperty('--mx', currentX.toFixed(3));
      root.style.setProperty('--my', currentY.toFixed(3));
    };

    const onMove = (event) => {
      if (event.pointerType === 'touch') return;
      targetX = (event.clientX / window.innerWidth) * 2 - 1;
      targetY = (event.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.ticker.remove(tick);
      root.style.removeProperty('--mx');
      root.style.removeProperty('--my');
    };
  }, [reduceMotion]);

  // 5. Velocity zoom: fast scrolling adds a little scale, then it eases back.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    if (reduceMotion || ANIM.video.velocityZoom <= 0) {
      root.style.setProperty('--anim-vzoom', '0');
      return () => root.style.removeProperty('--anim-vzoom');
    }

    let lastY = window.scrollY;
    let current = 0;

    const tick = (time, deltaTime) => {
      const ratio = Math.max(1, deltaTime / (1000 / 60));
      const y = window.scrollY;
      const velocity = Math.abs(y - lastY) / ratio;
      lastY = y;

      const target = Math.min(1, velocity / 45) * ANIM.video.velocityZoom;
      current += (target - current) * 0.12;
      root.style.setProperty('--anim-vzoom', current.toFixed(4));
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      root.style.removeProperty('--anim-vzoom');
    };
  }, [reduceMotion]);

  // Autoplay can be blocked until the first gesture; retry on any interaction.
  useEffect(() => {
    if (MODE !== 'autoplay') return undefined;

    const unlock = () => {
      const index = activeRef.current;
      const video = index === null ? null : videoRefs.current[index];
      if (video && video.paused) {
        video.playbackRate = PLAYBACK_RATE;
        video.play().catch(() => {});
      }
    };

    const events = ['pointerdown', 'touchstart', 'wheel', 'keydown'];
    events.forEach((event) => window.addEventListener(event, unlock, { passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, unlock));
  }, []);

  // 3. Hero text: characters rise through masks once the intro curtain is gone.
  useLayoutEffect(() => {
    const word = heroWordRef.current;
    const subtitle = heroSubRef.current;
    if (!word) return undefined;

    if (reduceMotion) {
      gsap.set([word, subtitle].filter(Boolean), { opacity: 1, y: 0 });
      return undefined;
    }

    const chars = splitChars(word);
    gsap.set(chars, { y: ANIM.text.rise, opacity: 0 });
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: ANIM.text.rise * 0.4 });

    const tl = gsap.timeline({ paused: true });
    tl.to(chars, {
      y: 0,
      opacity: 1,
      duration: ANIM.text.duration,
      stagger: ANIM.text.stagger,
      ease: 'power3.out',
    });

    if (subtitle) {
      tl.to(
        subtitle,
        { opacity: 1, y: 0, duration: ANIM.text.duration * 0.8, ease: 'power2.out' },
        `-=${ANIM.text.duration * 0.4}`
      );
    }

    heroTextTlRef.current = tl;

    return () => {
      tl.kill();
      heroTextTlRef.current = null;
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (booting) return;
    if (reduceMotion) return;
    heroTextTlRef.current?.play(0);
  }, [booting, reduceMotion]);

  // NEW 6. Hero line draw: four hairlines scale in after the curtain, then settle
  // at a low opacity. Runs once, on the shared GSAP timeline machinery.
  useEffect(() => {
    if (booting || !fx.heroLines) return undefined;

    const lines = heroLineRefs.current.filter(Boolean);
    if (lines.length === 0) return undefined;

    heroLineTlRef.current?.kill();
    lines.forEach((line) => {
      const vertical = line.classList.contains('is-vertical');
      gsap.set(line, vertical ? { scaleY: 0 } : { scaleX: 0 });
    });

    const tl = gsap.timeline({ delay: ANIM.heroIntro.lineDelay });
    tl.to(lines, {
      scaleX: 1,
      scaleY: 1,
      opacity: ANIM.heroIntro.linePeak,
      duration: ANIM.heroIntro.lineDuration,
      ease: ANIM.heroIntro.lineEase,
      stagger: ANIM.heroIntro.lineStagger,
    }).to(lines, {
      opacity: ANIM.heroIntro.lineOpacity,
      duration: ANIM.heroIntro.lineDuration * ANIM.heroIntro.lineSettleFactor,
      ease: ANIM.heroIntro.lineSettleEase,
    });

    heroLineTlRef.current = tl;
    return () => tl.kill();
  }, [booting, fx.heroLines]);

  // NEW 5. Snap moment in the wrap chapter. Latch on the way down, reset on the
  // way back up, and use the shared chapter-fx canvas for the crumbs.
  const triggerSnap = useCallback(() => {
    const options = snapFxRef.current;
    if (!options.snap) return;

    const stage = chapterStageRefs.current[WRAP_INDEX];
    if (stage) {
      const proxy = { x: 0 };
      const pattern = ANIM.snap.shakePattern;
      const segment = ANIM.snap.shakeDuration / pattern.length;

      gsap.killTweensOf(proxy);
      const tl = gsap.timeline({
        onUpdate: () => stage.style.setProperty('--snap-x', `${proxy.x}px`),
        onComplete: () => {
          proxy.x = 0;
          stage.style.setProperty('--snap-x', '0px');
        },
      });

      pattern.forEach((amount) => {
        tl.to(proxy, {
          x: ANIM.snap.shake * amount,
          duration: segment,
          ease: 'power1.inOut',
        });
      });
    }

    const flash = snapFlashRef.current;
    if (flash) {
      gsap.killTweensOf(flash);
      gsap.fromTo(
        flash,
        { opacity: ANIM.snap.flash },
        {
          opacity: 0,
          duration: ANIM.snap.flashDuration,
          ease: 'power2.out',
          overwrite: true,
        }
      );
    }

    if (options.crumbs) {
      chapterFxRef.current?.burst(
        options.half ? Math.ceil(ANIM.snap.crumbs / 2) : ANIM.snap.crumbs
      );
    }
  }, []);

  // NEW 8. Final reveal: a circular clip-path wipe on entry. The existing float,
  // glow, shine and watch-again dive keep running underneath it.
  useEffect(() => {
    const image = finalImageRef.current;
    if (!image) return undefined;

    gsap.killTweensOf(image);
    if (!fx.finalReveal) {
      gsap.set(image, { clearProps: 'clipPath' });
      return undefined;
    }

    if (finalLive) {
      gsap.fromTo(
        image,
        { clipPath: 'circle(0% at 50% 50%)' },
        {
          clipPath: 'circle(150% at 50% 50%)',
          duration: ANIM.finalReveal.duration,
          ease: 'power2.inOut',
        }
      );
    } else {
      gsap.set(image, { clearProps: 'clipPath' });
    }

    return () => gsap.killTweensOf(image);
  }, [finalLive, fx.finalReveal]);

  // GSAP: one sticky scene per chapter. Drives active state, camera, copy and meters.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => updateProgress(self.progress),
        onRefresh: (self) => updateProgress(self.progress),
      });

      if (introRef.current) {
        const introCopyItems = introCopyRef.current
          ? Array.from(introCopyRef.current.children)
          : [];

        if (reduceMotion) {
          gsap.set(introMediaRef.current, {
            scale: 1,
            clipPath: 'inset(0% 0% round 0px)',
          });
          gsap.set(introTitleRef.current, { scale: 1, opacity: 0 });
          gsap.set(introCopyRef.current, { opacity: 1, y: 0 });
          gsap.set(introCopyItems, { opacity: 1, y: 0, filter: 'none' });
          gsap.set(introHintRef.current, { opacity: 0 });
        } else {
          const introTl = gsap.timeline({
            scrollTrigger: {
              trigger: introRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
            },
          });

          introTl
            .fromTo(
              introMediaRef.current,
              { scale: 1.25, clipPath: 'inset(30% 30% round 36px)' },
              {
                scale: 1,
                clipPath: 'inset(0% 0% round 0px)',
                ease: 'none',
                duration: 0.45,
              },
              0
            )
            .fromTo(
              introTitleRef.current,
              { scale: 1, opacity: 1 },
              { scale: 3.2, opacity: 0, ease: 'none', duration: 0.4 },
              0
            )
            .to(
              introHintRef.current,
              { opacity: 0, ease: 'none', duration: 0.1 },
              0.1
            )
            .fromTo(
              introCopyRef.current,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, ease: 'none', duration: 0.18 },
              0.52
            )
            .fromTo(
              introCopyItems,
              { opacity: 0, y: 26, filter: 'blur(10px)' },
              {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                ease: 'none',
                duration: 0.16,
                stagger: 0.05,
              },
              0.55
            )
            .to(
              introCopyRef.current,
              { opacity: 0, y: -40, ease: 'none', duration: 0.12 },
              0.86
            )
            .to(
              introCopyItems,
              {
                opacity: 0,
                y: -26,
                filter: 'blur(8px)',
                ease: 'none',
                duration: 0.1,
                stagger: 0.04,
              },
              0.86
            );
        }
      }

      chapterSectionRefs.current.forEach((section, index) => {
        if (!section) return;
        const media = mediaRefs.current[index];

        // Each scene starts slightly pushed in and settles as the chapter plays out.
        if (media) {
          if (reduceMotion) {
            gsap.set(media, { scale: 1 });
          } else {
            gsap.fromTo(
              media,
              { scale: ZOOM.from },
              {
                scale: ZOOM.to,
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top top',
                  end: 'bottom bottom',
                  scrub: true,
                },
              }
            );
          }
        }

        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          once: true,
          onEnter: () => markSceneLoaded(index),
        });

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onEnter: () => enterChapter(index),
          onEnterBack: () => enterChapter(index),
          onLeave: () => leaveChapter(index),
          onLeaveBack: () => {
            if (index === 0) clearStage();
            else leaveChapter(index);
          },
          onUpdate: (self) => {
            if (!self.isActive) return;
            targetsRef.current[index] = self.progress;

            const copy = copyRefs.current[index];
            if (copy) {
              const fadeIn = band(self.progress, 0.04, 0.18);
              const fadeOut = band(self.progress, 0.84, 0.98);
              copy.style.opacity = String(fadeIn * (1 - fadeOut));
              copy.style.transform = `translateY(${(1 - fadeIn) * 50 - fadeOut * 40}px)`;
            }

            const meter = meterRefs.current[index];
            if (meter) meter.style.transform = `scaleX(${self.progress})`;

            // NEW 2. Ghost text drifts with chapter progress (transform only).
            const ghost = ghostRefs.current[index];
            if (ghost) {
              const shift =
                (self.progress - 0.5) * viewportRef.current.w * ANIM.ghostText.speed;
              ghost.style.transform = `translate3d(calc(-50% + ${shift.toFixed(1)}px), -50%, 0)`;
            }

            // NEW 5. Latch the snap at atProgress and reset when scrolling back.
            if (index === WRAP_INDEX) {
              const past = self.progress >= ANIM.snap.atProgress;
              if (past && !snapLatchRef.current) {
                snapLatchRef.current = true;
                triggerSnap();
              } else if (!past && snapLatchRef.current) {
                snapLatchRef.current = false;
              }
            }
          },
        });
      });

      if (outroRef.current) {
        ScrollTrigger.create({
          trigger: outroRef.current,
          start: 'top 70%',
          end: 'bottom top',
          onEnter: clearStage,
          onLeaveBack: () => enterChapter(CHAPTERS.length - 1),
          onToggle: (self) => setFinalLive(self.isActive),
        });
      }
    }, rootRef);

    ScrollTrigger.refresh();
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const refreshFonts = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refreshFonts).catch(() => {});

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, [
    reduceMotion,
    enterChapter,
    leaveChapter,
    clearStage,
    updateProgress,
    markSceneLoaded,
    triggerSnap,
  ]);

  // Scrub mode: only the active scene is seeked, capped at ~30fps. Seeking every
  // loaded video on every frame is what made playback stutter.
  useEffect(() => {
    if (MODE !== 'scrub') return undefined;

    const smoothing = reduceMotion ? 1 : 0.24;
    const seekInterval = 1000 / 30;
    let lastSeek = 0;

    const tick = (time) => {
      if (document.hidden) return;

      const index = activeRef.current;
      if (index === null) return;

      const now = time * 1000;
      if (now - lastSeek < seekInterval) return;

      const video = videoRefs.current[index];
      if (
        !video ||
        video.readyState < 1 ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      ) {
        return;
      }

      // VIDEO GUARD (g). Feed the ?debug readout from the active clip.
      perfStateRef.current.readyState = video.readyState;
      perfStateRef.current.seeking = video.seeking;

      const target = clampProgress(targetsRef.current[index]) * video.duration;
      const delta = target - video.currentTime;
      const stall = stallMapRef.current.get(video);
      const stuck = stall?.stalled === true;
      if (Math.abs(delta) < 0.08 || (video.seeking && !stuck)) return;

      // VIDEO GUARD (c). A watchdog that fired clears the stuck flag so the next
      // assignment can go through and scrubbing never freezes.
      if (stuck) stall.stalled = false;

      if (!video.paused) video.pause();
      video.currentTime = reduceMotion ? target : video.currentTime + delta * smoothing;
      lastSeek = now;
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [reduceMotion]);

  const scrollToChapter = (index) => {
    if (scrollTweenRef.current) {
      scrollTweenRef.current.kill();
      scrollTweenRef.current = null;
      rewindingRef.current = false;
    }

    if (index < 0) {
      restartShowcase();
      return;
    }

    const behavior = reduceMotion ? 'auto' : 'smooth';
    const section = chapterSectionRefs.current[index];
    if (!section) return;

    // Start loading before the glide so the readiness guard has a head start.
    markSceneLoaded(index);
    markSceneLoaded(index + 1);

    // Land just past the section start; ScrollTrigger's onEnter does not fire
    // when the scroll position stops exactly on its start value.
    const top = section.offsetTop + 1;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(top, {
        duration: reduceMotion ? 0 : 1.1,
        immediate: reduceMotion,
      });
      return;
    }
    window.scrollTo({ top, behavior });
  };

  return (
    <div
      className="site"
      ref={rootRef}
      style={{
        '--anim-red': ANIM.red,
        '--anim-brown': ANIM.transition.color,
        '--anim-vignette': String(ANIM.video.vignette),
        '--anim-grain': String(ANIM.video.grain),
        '--anim-sweep-duration': `${ANIM.text.duration}s`,
        '--anim-parallax': `${-ANIM.video.parallaxMouse}px`,
        '--anim-parallax-y': `${-ANIM.video.parallaxMouse * 0.7}px`,
        '--anim-ghost-opacity': String(ANIM.ghostText.opacity),
        '--anim-hint-duration': `${ANIM.heroIntro.hintDuration}s`,
      }}
    >
      <Loader
        visible={booting}
        ready={ready[0] || failed[0]}
        reduced={reduceMotion}
        onDone={handleIntroDone}
      />
      <Nav
        activeIndex={activeIndex}
        onSelect={scrollToChapter}
        reduced={reduceMotion}
        rollEnabled={fx.navRoll}
        dotsEnabled={fx.navDots}
      />
      <ProgressLine visible fillRef={progressFillRef} />
      {ANIM.counter.enabled ? (
        <ChapterCounter index={activeIndex} reduced={reduceMotion} />
      ) : null}
      <div className="cursor-glow" ref={cursorGlowRef} aria-hidden="true" />
      {!reduceMotion &&
      ANIM.video.grain > 0 &&
      activeIndex !== null &&
      !finalLive ? (
        <FilmGrain
          pausedRef={ANIM.videoGuard.pauseOverlaysWhileSeeking ? seekStateRef : null}
        />
      ) : null}
      {!reduceMotion && ANIM.particles.count > 0 && activeIndex !== null && !finalLive ? (
        <Particles
          pausedRef={ANIM.videoGuard.pauseOverlaysWhileSeeking ? seekStateRef : null}
        />
      ) : null}

      <main>
        <section className="intro" ref={introRef} aria-label="Introduction">
          <div className="intro-stage">
            <div className="intro-media" ref={introMediaRef} aria-hidden="true">
              <div className="intro-visual" ref={introVisualRef} />
            </div>
            <div className="intro-shade" />
            <div className="intro-sparks" aria-hidden="true" />

            {fx.heroLines ? (
              <div className="hero-lines" aria-hidden="true">
                <span
                  className="line-top"
                  ref={(node) => {
                    heroLineRefs.current[0] = node;
                  }}
                />
                <span
                  className="line-bottom"
                  ref={(node) => {
                    heroLineRefs.current[1] = node;
                  }}
                />
                <span
                  className="line-left is-vertical"
                  ref={(node) => {
                    heroLineRefs.current[2] = node;
                  }}
                />
                <span
                  className="line-right is-vertical"
                  ref={(node) => {
                    heroLineRefs.current[3] = node;
                  }}
                />
              </div>
            ) : null}

            <div className="hero-title" ref={introTitleRef}>
              <div className="hero-wordmark" ref={heroWordRef}>
                KitKat
              </div>
              <p ref={heroSubRef}>Look closer.</p>
            </div>

            <div className="intro-copy" ref={introCopyRef}>
              <p className="eyebrow">Inside the Factory</p>
              <h1>
                Beautiful on the outside.
                <br />
                Extraordinary within.
              </h1>
            </div>

            <div className="scroll-hint" ref={introHintRef} aria-hidden="true">
              {fx.heroHint ? (
                <span className="scroll-mouse">
                  <b />
                </span>
              ) : null}
              <span>Scroll</span>
              <i />
            </div>
          </div>
        </section>

        {CHAPTERS.map((chapter, index) => (
          <section
            key={chapter.id}
            className="chapter"
            ref={(node) => {
              chapterSectionRefs.current[index] = node;
            }}
            style={{ height: `${SCROLL_PER_CHAPTER}vh` }}
            aria-label={chapter.title}
            data-scene={chapter.id}
          >
            <div
              className="chapter-stage"
              ref={(node) => {
                chapterStageRefs.current[index] = node;
              }}
            >
              <SceneStage
                chapter={chapter}
                index={index}
                active={activeIndex === index}
                ready={ready[index]}
                failed={failed[index]}
                load={loadedScenes.has(index)}
                videoRefs={videoRefs}
                onReady={markReady}
                onError={markFailed}
                ghost={fx.ghost}
                ghostRef={(node) => {
                  ghostRefs.current[index] = node;
                }}
                mediaRef={(node) => {
                  mediaRefs.current[index] = node;
                }}
                copyRef={(node) => {
                  copyRefs.current[index] = node;
                }}
                meterRef={(node) => {
                  meterRefs.current[index] = node;
                }}
              />
            </div>
            <h2 className="sr-only">{chapter.title}</h2>
          </section>
        ))}

        <section className={`outro${finalLive ? ' is-live' : ''}`} aria-label="Finale" ref={outroRef}>
          <div className="final-glow" aria-hidden="true" />
          <div className="final-stage">
            <div className="final-tilt" ref={finalTiltRef}>
              <img
                className="final-image"
                ref={finalImageRef}
                src={FINAL_IMAGE}
                alt="KitKat"
                draggable="false"
              />
            </div>
            <div className="final-copy" ref={finalCopyRef}>
              <h2>Now you’ve seen inside.</h2>
              <button type="button" className="watch-again" onClick={watchAgain}>
                Watch again
              </button>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <p>
            Concept showcase. The KitKat name is typographic, not the official logo. Not affiliated
            with Nestlé or Hershey.
          </p>
        </footer>
      </main>

      {/* NEW overlays live together above the video, never above nav/cursor. */}
      <div className="fx-overlay" aria-hidden="true">
        {fx.grade
          ? CHAPTERS.map((chapter, index) => (
              <div
                key={`grade-${chapter.id}`}
                className="grade-layer"
                style={{
                  background: `radial-gradient(ellipse at 50% 42%, ${ANIM.grade.colors[chapter.id]} 0%, transparent 64%)`,
                  opacity:
                    activeIndex === index && !finalLive ? ANIM.grade.strength : 0,
                  transitionDuration: `${ANIM.grade.fade}s`,
                  transitionTimingFunction: ANIM.grade.ease,
                }}
              />
            ))
          : null}

        {fx.spotlight ? (
          <Spotlight
            active={activeIndex !== null && !finalLive}
            scale={quality <= 2 ? ANIM.spotlight.scaleAtQuality2 : 1}
          />
        ) : null}

        {fx.facts ? <Facts activeIndex={activeIndex} /> : null}

        {fx.snap ? (
          <div
            className="snap-flash"
            ref={snapFlashRef}
            style={{
              background: `radial-gradient(circle at 50% 50%, ${ANIM.snap.flashColor} 0%, transparent 72%)`,
            }}
          />
        ) : null}

        {fx.snapCrumbs ? (
          <ChapterFx
            ref={chapterFxRef}
            pausedRef={ANIM.videoGuard.pauseOverlaysWhileSeeking ? seekStateRef : null}
          />
        ) : null}
      </div>

      {debug ? <DebugReadout stateRef={perfStateRef} param={debug} /> : null}

      <div className="enter-dive" ref={enterDiveRef} aria-hidden="true">
        <img
          className="enter-dive-image"
          ref={enterDiveImageRef}
          src={FINAL_IMAGE}
          alt=""
          draggable="false"
        />
      </div>
      <div className="enter-overlay" ref={enterOverlayRef} aria-hidden="true" />
      <DripTransition ref={dripRef} reduced={reduceMotion} />
      {ANIM.cursor.enabled ? <Cursor /> : null}
    </div>
  );
}
