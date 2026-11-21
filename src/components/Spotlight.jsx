import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM } from '../config.js';

// NEW 3. Pointer spotlight: a warm radial gradient that trails the pointer.
// The native pointer and the existing Cursor follower are untouched.
export default function Spotlight({ active, scale = 1 }) {
  const nodeRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    const node = nodeRef.current;
    if (!node) return undefined;

    const size = ANIM.spotlight.size * scale;
    gsap.set(node, {
      width: size,
      height: size,
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      opacity: 0,
    });

    const xTo = gsap.quickTo(node, 'x', {
      duration: ANIM.spotlight.ease,
      ease: ANIM.spotlight.moveEase,
    });
    const yTo = gsap.quickTo(node, 'y', {
      duration: ANIM.spotlight.ease,
      ease: ANIM.spotlight.moveEase,
    });

    let visible = false;

    const onMove = (event) => {
      if (event.pointerType === 'touch') return;
      if (!visible) {
        visible = true;
        gsap.to(node, {
          opacity: ANIM.spotlight.opacity,
          duration: ANIM.spotlight.ease,
          overwrite: true,
        });
      }
      xTo(event.clientX);
      yTo(event.clientY);
    };

    const onLeave = () => {
      visible = false;
      gsap.to(node, { opacity: 0, duration: ANIM.spotlight.fadeOut, overwrite: true });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(node);
    };
  }, [active, scale]);

  return (
    <div
      className="spotlight"
      ref={nodeRef}
      aria-hidden="true"
      style={{
        background: `radial-gradient(circle, ${ANIM.spotlight.color} 0%, transparent 68%)`,
      }}
    />
  );
}
