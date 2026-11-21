import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM } from '../config.js';

// 7. Custom cursor: an eased circle with a label. Mouse-only, never on touch.
export default function Cursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    if (!ANIM.cursor.enabled) return undefined;

    const fine = window.matchMedia('(pointer: fine)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (!fine || coarse || window.innerWidth < 768) return undefined;

    const node = cursorRef.current;
    if (!node) return undefined;

    const root = document.documentElement;
    root.classList.add('has-custom-cursor');

    gsap.set(node, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.8 });

    const xTo = gsap.quickTo(node, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(node, 'y', { duration: 0.35, ease: 'power3.out' });

    let visible = false;

    const onMove = (event) => {
      if (event.pointerType === 'touch') return;
      if (!visible) {
        visible = true;
        gsap.to(node, { opacity: 1, scale: 1, duration: 0.3, overwrite: true });
      }
      xTo(event.clientX);
      yTo(event.clientY);
    };

    const onOver = (event) => {
      const interactive = event.target.closest?.('button, a, .nav-item');
      gsap.to(node, {
        scale: interactive ? 1.7 : 1,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true,
      });
    };

    const onLeave = () => {
      visible = false;
      gsap.to(node, { opacity: 0, scale: 0.8, duration: 0.25, overwrite: true });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerleave', onLeave);
      root.classList.remove('has-custom-cursor');
      gsap.killTweensOf(node);
    };
  }, []);

  return (
    <div
      className="cursor"
      ref={cursorRef}
      aria-hidden="true"
      style={{
        width: ANIM.cursor.size,
        height: ANIM.cursor.size,
        fontSize: Math.max(8, ANIM.cursor.size * 0.22),
      }}
    >
      <span>{ANIM.cursor.label}</span>
    </div>
  );
}
