import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CHAPTERS } from '../config.js';

const TOTAL = String(CHAPTERS.length).padStart(2, '0');

// 8. Big outlined chapter counter. Each digit rolls in the direction of travel.
export default function ChapterCounter({ index, reduced }) {
  const tensRef = useRef(null);
  const onesRef = useRef(null);
  const previousRef = useRef(null);

  useLayoutEffect(() => {
    const tens = tensRef.current;
    const ones = onesRef.current;
    if (!tens || !ones) return;

    if (index === null) {
      previousRef.current = null;
      tens.textContent = '0';
      ones.textContent = '0';
      return;
    }

    const value = index + 1;
    const nextTens = Math.floor(value / 10);
    const nextOnes = value % 10;
    const previous = previousRef.current;
    previousRef.current = index;

    if (previous === null || reduced) {
      tens.textContent = String(nextTens);
      ones.textContent = String(nextOnes);
      gsap.set([tens, ones], { yPercent: 0, opacity: 1 });
      return;
    }

    const direction = index > previous ? 1 : -1;

    const roll = (node, next) => {
      const text = String(next);
      if (node.textContent === text) return;

      gsap.killTweensOf(node);
      gsap.timeline()
        .to(node, {
          yPercent: direction * -110,
          opacity: 0,
          duration: 0.22,
          ease: 'power2.in',
        })
        .call(() => {
          node.textContent = text;
        })
        .fromTo(
          node,
          { yPercent: direction * 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.32, ease: 'power3.out' }
        );
    };

    roll(tens, nextTens);
    roll(ones, nextOnes);
  }, [index, reduced]);

  return (
    <div
      className={`chapter-counter${index !== null ? ' is-visible' : ''}`}
      aria-hidden="true"
    >
      <span className="counter-number">
        <span className="counter-cell">
          <span className="counter-digit" ref={tensRef} />
        </span>
        <span className="counter-cell">
          <span className="counter-digit" ref={onesRef} />
        </span>
      </span>
      <span className="counter-sep">/</span>
      <span className="counter-total">{TOTAL}</span>
    </div>
  );
}
