import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ANIM } from '../config.js';

// 5. Film grain: a tiny repeating noise tile is redrawn at ~16fps on one canvas.
export default function FilmGrain({ pausedRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const tile = document.createElement('canvas');
    const tileSize = 128;
    tile.width = tileSize;
    tile.height = tileSize;
    const tileCtx = tile.getContext('2d');
    if (!tileCtx) return undefined;

    const image = tileCtx.createImageData(tileSize, tileSize);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.random() * 255;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = Math.random() * 255;
    }
    tileCtx.putImageData(image, 0, 0);

    const pattern = ctx.createPattern(tile, 'repeat');
    if (!pattern) return undefined;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();

    let last = 0;

    const tick = (time) => {
      if (document.hidden) return;
      if (pausedRef?.current?.pending) return;
      if (time - last < 0.09) return;
      last = time;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const offsetX = Math.random() * tileSize;
      const offsetY = Math.random() * tileSize;
      ctx.save();
      ctx.translate(-offsetX, -offsetY);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width + tileSize, height + tileSize);
      ctx.restore();
    };

    gsap.ticker.add(tick);
    window.addEventListener('resize', resize);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas className="film-grain" ref={canvasRef} aria-hidden="true" />;
}
