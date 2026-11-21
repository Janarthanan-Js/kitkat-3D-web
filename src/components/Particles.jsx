import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM } from '../config.js';

// 6. Cocoa dust: slow drifting specks over the stage. The canvas pauses when the
// tab is hidden and uses half the count below 768px.
export default function Particles({ pausedRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const count = Math.max(6, Math.round(ANIM.particles.count * (mobile ? 0.5 : 1)));
    const maxSize = Math.max(0.4, ANIM.particles.maxSize);
    const speed = ANIM.particles.speed;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.max(0.4, Math.random() * maxSize),
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.18 - Math.random() * 0.6,
      depth: 0.4 + Math.random() * 0.6,
      alpha: 0.25 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();

    let hidden = document.hidden;
    let lastScroll = window.scrollY;
    let scrollDir = 0;

    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden) lastScroll = window.scrollY;
    };

    const tick = (time, deltaTime) => {
      if (hidden) return;
      if (pausedRef?.current?.pending) return;

      const ratio = Math.min(3, deltaTime / (1000 / 60));
      const scrollY = window.scrollY;
      const scrollDelta = scrollY - lastScroll;
      lastScroll = scrollY;
      const targetDir = Math.max(-1, Math.min(1, scrollDelta / 40));
      scrollDir += (targetDir - scrollDir) * 0.08;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = ANIM.particles.color;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        p.x += (p.vx + Math.sin(time * 0.3 + p.phase) * 0.12) * speed * ratio;
        p.y += (p.vy + scrollDir * p.depth * 0.8) * speed * ratio;

        if (p.y < -12) {
          p.y = height + 12;
          p.x = Math.random() * width;
        } else if (p.y > height + 12) {
          p.y = -12;
          p.x = Math.random() * width;
        }

        if (p.x < -12) p.x = width + 12;
        else if (p.x > width + 12) p.x = -12;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    gsap.ticker.add(tick);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas className="particles" ref={canvasRef} aria-hidden="true" />;
}
