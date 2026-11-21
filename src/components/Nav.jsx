import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM, CHAPTERS } from '../config.js';

export default function Nav({ activeIndex, onSelect, reduced, rollEnabled = false, dotsEnabled = false }) {
  const listRef = useRef(null);
  const indicatorRef = useRef(null);
  const itemRefs = useRef([]);

  // 8. Sliding indicator follows the active chapter (transform + opacity only).
  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;

    if (!list || !indicator || !ANIM.nav.underline) return undefined;

    const move = () => {
      const item = activeIndex === null ? null : itemRefs.current[activeIndex];

      if (!item) {
        gsap.to(indicator, { autoAlpha: 0, duration: 0.2, overwrite: true });
        return;
      }

      const listRect = list.getBoundingClientRect();
      const rect = item.getBoundingClientRect();

      gsap.to(indicator, {
        x: rect.left - listRect.left,
        scaleX: rect.width,
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: true,
      });
    };

    move();
    window.addEventListener('resize', move);
    document.fonts?.ready.then(move).catch(() => {});

    return () => {
      window.removeEventListener('resize', move);
    };
  }, [activeIndex]);

  const canMagnetize = (event) =>
    !reduced &&
    ANIM.nav.magnetic > 0 &&
    event.pointerType !== 'touch' &&
    window.innerWidth >= 768;

  const onItemMove = (event, index) => {
    if (!canMagnetize(event)) return;
    const item = itemRefs.current[index];
    if (!item) return;

    const rect = item.getBoundingClientRect();
    gsap.to(item, {
      x: (event.clientX - (rect.left + rect.width / 2)) * ANIM.nav.magnetic,
      y: (event.clientY - (rect.top + rect.height / 2)) * ANIM.nav.magnetic,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
    });
  };

  const onItemLeave = (index) => {
    const item = itemRefs.current[index];
    if (!item) return;
    gsap.to(item, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.45)',
      overwrite: true,
    });
  };

  // NEW 7. Letter roll: both copies move up by one line height, letter by letter.
  const rollLabel = (index, forward) => {
    if (!rollEnabled) return;
    const item = itemRefs.current[index];
    if (!item) return;

    const top = item.querySelectorAll('.nav-roll-a');
    const bottom = item.querySelectorAll('.nav-roll-b');
    if (top.length === 0) return;

    gsap.killTweensOf([...top, ...bottom]);
    gsap.to([...top, ...bottom], {
      yPercent: forward ? -100 : 0,
      duration: ANIM.navFx.rollDuration,
      ease: ANIM.navFx.rollEase,
      stagger: ANIM.navFx.rollStagger,
      overwrite: true,
    });
  };

  return (
    <header className="site-nav">
      <button
        type="button"
        className="wordmark"
        onClick={() => onSelect(-1)}
        aria-label="KitKat, back to top"
      >
        KitKat
      </button>

      <nav aria-label="Chapters" className="nav-wrap">
        {ANIM.nav.underline ? (
          <span className="nav-indicator" ref={indicatorRef} aria-hidden="true" />
        ) : null}

        <ul
          className={`nav-list${ANIM.nav.underline ? ' has-indicator' : ''}`}
          ref={listRef}
        >
          {CHAPTERS.map((chapter, index) => {
            const active = activeIndex === index;
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  className={`nav-item${active ? ' is-active' : ''}`}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  onClick={() => onSelect(index)}
                  onPointerMove={(event) => onItemMove(event, index)}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== 'touch') rollLabel(index, true);
                  }}
                  onPointerLeave={() => {
                    onItemLeave(index);
                    rollLabel(index, false);
                  }}
                  aria-label={chapter.nav}
                  aria-current={active ? 'true' : undefined}
                >
                  <span className="nav-dot" aria-hidden="true" />
                  <span className="nav-label" aria-hidden="true">
                    {rollEnabled
                      ? Array.from(chapter.nav).map((character, charIndex) => (
                          <span className="nav-roll" key={`${chapter.id}-${charIndex}`}>
                            <span className="nav-roll-a">{character}</span>
                            <span className="nav-roll-b">{character}</span>
                          </span>
                        ))
                      : chapter.nav}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {dotsEnabled ? (
          <span className="nav-dots" aria-hidden="true">
            {CHAPTERS.map((chapter, index) => (
              <i
                key={chapter.id}
                className={`nav-progress-dot${
                  activeIndex !== null && index <= activeIndex ? ' is-filled' : ''
                }`}
              />
            ))}
          </span>
        ) : null}
      </nav>
    </header>
  );
}
