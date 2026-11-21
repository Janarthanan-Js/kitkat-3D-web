import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM } from '../config.js';

const DRIP_PATH =
  'M0 0 H100 V86 ' +
  'C98 86 97 96 94 96 C91 96 90 86 88 86 ' +
  'C86 86 85 94 81.5 94 C78 94 77 86 75 86 ' +
  'C73 86 72 90 69 90 C66 90 65 86 63 86 ' +
  'C61 86 60 98 56.5 98 C53 98 52 86 50 86 ' +
  'C48 86 47 92 44 92 C41 92 40 86 38 86 ' +
  'C36 86 35 97 31 97 C27 97 26 86 24 86 ' +
  'C22 86 21 90 18 90 C15 90 14 86 12 86 ' +
  'C10 86 9 95 5.5 95 C2 95 1 86 0 86 Z';

// 4. Chocolate drip wipe between chapters. One SVG panel drops in, covers the
// frame, then keeps travelling down to reveal the next scene. Scroll is untouched.
const DripTransition = forwardRef(function DripTransition({ reduced }, ref) {
  const rootRef = useRef(null);
  const tlRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      play() {
        if (reduced || ANIM.transition.type !== 'drip') return;

        const root = rootRef.current;
        if (!root) return;

        tlRef.current?.kill();

        const duration = ANIM.transition.duration;
        const tl = gsap.timeline();

        tl.set(root, { autoAlpha: 1, yPercent: -100 })
          .to(root, {
            yPercent: 0,
            duration: duration * 0.45,
            ease: 'power2.in',
          })
          .to(root, {
            yPercent: 100,
            duration: duration * 0.55,
            ease: 'power2.inOut',
          }, '+=0.02')
          .set(root, { autoAlpha: 0, yPercent: -100 });

        tlRef.current = tl;
      },
    }),
    [reduced]
  );

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    []
  );

  return (
    <div className="drip-transition" ref={rootRef} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <path fill={ANIM.transition.color} d={DRIP_PATH} />
      </svg>
    </div>
  );
});

export default DripTransition;
