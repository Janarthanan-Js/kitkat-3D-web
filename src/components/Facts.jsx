import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ANIM, CHAPTERS } from '../config.js';

// NEW 4. Fact labels for the active chapter. The thin SVG lines draw in with
// stroke-dashoffset (pathLength="1") and the rows leave before the next chapter
// swaps in. Nothing here reads layout on a frame.
export default function Facts({ activeIndex }) {
  const rootRef = useRef(null);
  const tlRef = useRef(null);
  const [displayIndex, setDisplayIndex] = useState(activeIndex);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    if (activeIndex === displayIndex) return undefined;

    tlRef.current?.kill();

    if (activeIndex === null) {
      tlRef.current = gsap.to(root, {
        opacity: 0,
        duration: ANIM.facts.outDuration,
        ease: 'power1.in',
        onComplete: () => setDisplayIndex(null),
      });
      return undefined;
    }

    if (displayIndex === null) {
      setDisplayIndex(activeIndex);
      return undefined;
    }

    tlRef.current = gsap.timeline({
      onComplete: () => setDisplayIndex(activeIndex),
    });
    tlRef.current.to(root, {
      opacity: 0,
      duration: ANIM.facts.outDuration,
      ease: 'power1.in',
    });

    return () => tlRef.current?.kill();
  }, [activeIndex, displayIndex]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || displayIndex === null) return undefined;

    const rows = root.querySelectorAll('.fact');
    const lines = root.querySelectorAll('.fact-line line');
    const dots = root.querySelectorAll('.fact-dot');
    const labels = root.querySelectorAll('.fact-label');

    tlRef.current?.kill();
    gsap.set(root, { opacity: 1 });
    gsap.set(rows, { opacity: 0, y: ANIM.facts.rise });
    gsap.set(lines, { strokeDashoffset: 1 });
    gsap.set(dots, { opacity: 0, scale: ANIM.facts.dotScaleFrom });
    gsap.set(labels, { opacity: 0 });

    const tl = gsap.timeline();
    tl.to(rows, {
      opacity: 1,
      y: 0,
      duration: ANIM.facts.inDuration,
      ease: ANIM.facts.inEase,
      stagger: ANIM.facts.stagger,
    })
      .to(
        lines,
        {
          strokeDashoffset: 0,
          duration: ANIM.facts.lineDuration,
          ease: ANIM.facts.lineEase,
          stagger: ANIM.facts.stagger,
        },
        0
      )
      .to(
        dots,
        {
          opacity: 1,
          scale: 1,
          duration: ANIM.facts.dotDuration,
          ease: ANIM.facts.dotEase,
          stagger: ANIM.facts.stagger,
        },
        ANIM.facts.stagger * ANIM.facts.offsetFactor
      )
      .to(
        labels,
        {
          opacity: 1,
          duration: ANIM.facts.labelDuration,
          ease: ANIM.facts.labelEase,
          stagger: ANIM.facts.stagger,
        },
        ANIM.facts.stagger * ANIM.facts.offsetFactor
      );

    tlRef.current = tl;
    return () => tl.kill();
  }, [displayIndex]);

  if (displayIndex === null) {
    return <div className="facts" ref={rootRef} aria-hidden="true" />;
  }

  const items = ANIM.facts.items[CHAPTERS[displayIndex]?.id] ?? [];

  return (
    <div className="facts" ref={rootRef} aria-hidden="true">
      {items.map((item, index) => (
        <div className="fact" key={`${CHAPTERS[displayIndex]?.id}-${item}-${index}`}>
          <svg className="fact-line" viewBox="0 0 100 1" preserveAspectRatio="none" focusable="false">
            <line x1="0" y1="0.5" x2="100" y2="0.5" pathLength="1" />
          </svg>
          <span className="fact-dot" />
          <span className="fact-label">{item}</span>
        </div>
      ))}
    </div>
  );
}
