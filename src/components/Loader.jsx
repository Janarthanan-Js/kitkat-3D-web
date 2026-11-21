import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM } from '../config.js';

export default function Loader({ visible, ready, reduced, onDone }) {
  const rootRef = useRef(null);
  const darkRef = useRef(null);
  const curtainRef = useRef(null);
  const pctRef = useRef(null);
  const wordRef = useRef(null);
  const barRef = useRef(null);
  const readyRef = useRef(ready);
  const stageRef = useRef('idle');
  const finishRef = useRef(null);
  const finishTweenRef = useRef(null);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  // 2. Intro: the counter is capped below 100 until the first scene can play.
  const finish = useCallback(() => {
    if (stageRef.current === 'finishing' || stageRef.current === 'done') return;
    stageRef.current = 'finishing';

    const dark = darkRef.current;
    const curtain = curtainRef.current;

    // The load is real, so snap the last few percent only when it is ready.
    if (pctRef.current) pctRef.current.textContent = '100';
    if (barRef.current) barRef.current.style.transform = 'scaleX(1)';

    if (reduced) {
      const fade = gsap.to(dark, {
        opacity: 0,
        duration: 0.45,
        ease: 'power1.out',
        onComplete: () => {
          stageRef.current = 'done';
          onDone?.();
        },
      });
      finishTweenRef.current = fade;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        stageRef.current = 'done';
        onDone?.();
      },
    });

    tl.to([pctRef.current, wordRef.current, barRef.current], {
      opacity: 0,
      y: -16,
      duration: 0.28,
      ease: 'power2.in',
    }, 0)
      .to(dark, { opacity: 0, duration: 0.35, ease: 'none' }, 0.05)
      .to(curtain, { opacity: 1, duration: 0.25, ease: 'none' }, 0.05)
      .to(curtain, {
        yPercent: -100,
        duration: ANIM.intro.curtainSeconds,
        ease: 'power4.inOut',
      }, 0.28);

    finishTweenRef.current = tl;
  }, [onDone, reduced]);

  finishRef.current = finish;

  useEffect(
    () => () => {
      finishTweenRef.current?.kill();
      finishTweenRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (!visible) return undefined;
    stageRef.current = 'counting';

    const proxy = { value: 0 };
    const paint = () => {
      const cap = readyRef.current ? 100 : 97;
      const value = Math.min(proxy.value, cap);
      if (pctRef.current) pctRef.current.textContent = String(Math.floor(value));
      if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`;
    };

    paint();

    if (reduced) {
      proxy.value = 100;
      paint();
      stageRef.current = 'counter-done';
      finishRef.current?.();
      return undefined;
    }

    const counter = gsap.to(proxy, {
      value: 100,
      duration: ANIM.intro.counterSeconds,
      ease: 'power1.inOut',
      onUpdate: paint,
      onComplete: () => {
        stageRef.current = 'counter-done';
        if (readyRef.current) finishRef.current?.();
      },
    });

    return () => counter.kill();
  }, [visible, reduced]);

  // The curtain only opens once the counter has finished AND the video is ready.
  useEffect(() => {
    if (!visible || !ready) return;
    if (stageRef.current !== 'counter-done') return;
    finishRef.current?.();
  }, [visible, ready]);

  return (
    <div
      className={`loader${visible ? '' : ' is-hidden'}`}
      role="status"
      aria-label="Loading"
      aria-hidden={!visible}
      ref={rootRef}
    >
      <div className="loader-dark" ref={darkRef}>
        <div className="loader-inner">
          <p className="loader-word" ref={wordRef}>
            KitKat
          </p>
          <p className="loader-count">
            <span ref={pctRef}>0</span>
            <i>%</i>
          </p>
          <div className="loader-track" aria-hidden="true">
            <i ref={barRef} />
          </div>
        </div>
      </div>
      <div className="loader-curtain" ref={curtainRef} aria-hidden="true" />
    </div>
  );
}
