import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM } from '../config.js';

const rand = (min, max) => min + Math.random() * (max - min);

// NEW 5 support. Shared chapter-fx canvas. It owns the snap crumbs and can be
// reused by other chapter effects later. Drawing pauses on hidden tabs and while
// the video guard reports a pending seek.
const ChapterFx = forwardRef(function ChapterFx({ pausedRef }, ref) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ width: 0, height: 0, dpr: 1 });
  const crumbsRef = useRef([]);

  useImperativeHandle(
    ref,
    () => ({
      burst(count = ANIM.snap.crumbs) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { width, height } = stateRef.current;
        if (!width || !height) return;

        const { snap } = ANIM;
        const centerX = width / 2;
        const centerY = height * snap.crumbOriginY;
        const next = crumbsRef.current;

        for (let i = 0; i < count; i += 1) {
          next.push({
            x: centerX + rand(-width * snap.crumbSpread, width * snap.crumbSpread),
            y: centerY + rand(-height * snap.crumbSpread, height * snap.crumbSpread),
            vx: rand(-width * snap.crumbVx, width * snap.crumbVx),
            vy: rand(-height * snap.crumbVyMin, -height * snap.crumbVyMax),
            size: rand(snap.crumbSizeMin, snap.crumbSizeMax),
            rot: rand(0, Math.PI * 2),
            vr: rand(-snap.crumbSpin, snap.crumbSpin),
            life: 0,
            ttl: rand(snap.crumbTtlMin, snap.crumbTtlMax),
            color: snap.crumbColor,
          });
        }

        if (next.length > 0) canvas.classList.add('is-active');
      },
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const state = stateRef.current;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      state.dpr = dpr;
      canvas.width = Math.floor(state.width * dpr);
      canvas.height = Math.floor(state.height * dpr);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
    };

    resize();

    let wasActive = false;

    const tick = (time, deltaTime) => {
      if (document.hidden) return;
      if (pausedRef?.current?.pending) return;

      const crumbs = crumbsRef.current;
      if (crumbs.length === 0) {
        if (wasActive) {
          ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
          ctx.clearRect(0, 0, state.width, state.height);
          canvas.classList.remove('is-active');
          wasActive = false;
        }
        return;
      }

      wasActive = true;
      const dt = Math.min(ANIM.snap.crumbMaxDelta, deltaTime) / 1000;
      const gravity = state.height * ANIM.snap.crumbGravity;

      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      ctx.clearRect(0, 0, state.width, state.height);

      for (let i = crumbs.length - 1; i >= 0; i -= 1) {
        const crumb = crumbs[i];
        crumb.life += dt;
        if (crumb.life >= crumb.ttl) {
          crumbs.splice(i, 1);
          continue;
        }

        crumb.vy += gravity * dt;
        crumb.x += crumb.vx * dt;
        crumb.y += crumb.vy * dt;
        crumb.rot += crumb.vr * dt;

        const fade = Math.max(0, 1 - crumb.life / crumb.ttl);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(crumb.x, crumb.y);
        ctx.rotate(crumb.rot);
        ctx.fillStyle = crumb.color;
        ctx.fillRect(-crumb.size / 2, -crumb.size / 2, crumb.size, crumb.size * 0.62);
        ctx.restore();
      }
    };

    gsap.ticker.add(tick);
    window.addEventListener('resize', resize);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', resize);
      crumbsRef.current = [];
    };
  }, [pausedRef]);

  return (
    <canvas
      className="chapter-fx"
      ref={canvasRef}
      aria-hidden="true"
      style={{ transitionDuration: `${ANIM.snap.canvasFade}s` }}
    />
  );
});

export default ChapterFx;
