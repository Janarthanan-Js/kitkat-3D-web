import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM } from '../config.js';

// VIDEO GUARD (g). Small ?debug readout. It reuses the shared gsap.ticker and only
// touches textContent, never layout. Video state is supplied through a ref.
export default function DebugReadout({ stateRef, param }) {
  const nodeRef = useRef(null);

  useEffect(() => {
    if (param !== true) return undefined;
    const node = nodeRef.current;
    if (!node) return undefined;

    let frames = 0;
    let elapsed = 0;
    let fps = 0;

    const tick = (time, deltaTime) => {
      if (document.hidden) return;
      frames += 1;
      elapsed += deltaTime / 1000;
      if (elapsed < ANIM.perf.debugInterval) return;

      fps = frames / elapsed;
      frames = 0;
      elapsed = 0;

      const state = stateRef.current || {};
      const ready = Number.isFinite(state.readyState) ? state.readyState : 0;
      const stalls = state.stalls || 0;
      const seeking = state.seeking ? 'yes' : 'no';
      const frame = Number.isFinite(state.presented) ? state.presented.toFixed(2) : '—';

      node.textContent = `FPS ${fps.toFixed(0)} · Q${state.quality ?? 3} · rs ${ready} · seek ${seeking} · stalls ${stalls} · frame ${frame}`;
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [param, stateRef]);

  if (param !== true) return null;

  return (
    <div className="debug-readout" ref={nodeRef} aria-hidden="true">
      FPS — · Q3 · rs 0 · seek no · stalls 0 · frame —
    </div>
  );
}
