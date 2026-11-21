import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ANIM, CHAPTERS, PLAYBACK_RATE } from '../config.js';
import { sceneSource } from '../media.js';

const total = String(CHAPTERS.length).padStart(2, '0');

export function SceneVisual({
  className = 'stage-media',
  file,
  videoRef,
  mediaRef,
  onReady,
  onError,
  preload = 'auto',
  load = true,
  autoPlay = false,
  loop = false,
}) {
  const [source, setSource] = useState(null);
  const [ready, setReady] = useState(false);
  const retryRef = useRef(null);

  const clearRetry = () => {
    if (!retryRef.current) return;
    gsap.ticker.remove(retryRef.current);
    retryRef.current = null;
  };

  // VIDEO GUARD (b). The old code revealed the next clip on loadeddata, which can
  // be before enough data is decoded. Wait for showNextWhenReadyState instead and
  // keep retrying on the shared ticker. Safe mode keeps the previous behaviour.
  const requestReveal = (video) => {
    if (!video) return;

    video.playbackRate = PLAYBACK_RATE;
    const threshold = ANIM.safeMode ? 0 : ANIM.videoGuard.showNextWhenReadyState;
    if (video.readyState >= threshold) {
      clearRetry();
      video.classList.add('is-ready');
      setReady(true);
      onReady?.();
      return;
    }

    if (retryRef.current) return;
    const tick = () => {
      if (video.readyState >= threshold || video.error) {
        clearRetry();
        video.classList.add('is-ready');
        setReady(true);
        onReady?.();
      }
    };
    retryRef.current = tick;
    gsap.ticker.add(tick);
  };

  useEffect(() => {
    setReady(false);
    clearRetry();
  }, [file]);

  useEffect(
    () => () => {
      if (retryRef.current) {
        gsap.ticker.remove(retryRef.current);
        retryRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!load) return undefined;

    let cancelled = false;
    sceneSource(file)
      .then((url) => {
        if (!cancelled && url) setSource(url);
      })
      .catch(() => {
        if (!cancelled) onError?.();
      });

    return () => {
      cancelled = true;
    };
  }, [file, load]);

  return (
    <div className={className} ref={mediaRef}>
      <div className="scene-rig">
        <video
          className="scene-video"
          ref={videoRef}
          src={source || undefined}
          muted
          loop={loop}
          playsInline
          autoPlay={autoPlay}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noremoteplayback"
          preload={preload}
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={(event) => requestReveal(event.currentTarget)}
          onCanPlay={(event) => requestReveal(event.currentTarget)}
          onError={onError}
        />
        <div className={`scene-loader${ready ? ' is-hidden' : ''}`} aria-hidden="true" />
      </div>
    </div>
  );
}

export default function SceneStage({
  chapter,
  index,
  active,
  ready,
  failed,
  videoRefs,
  mediaRef,
  copyRef,
  meterRef,
  onReady,
  onError,
  load,
  ghost = false,
  ghostRef,
}) {
  return (
    <>
      <SceneVisual
        file={chapter.file}
        videoRef={(node) => {
          videoRefs.current[index] = node;
          if (node) node.playbackRate = PLAYBACK_RATE;
        }}
        onReady={() => onReady(index)}
        onError={() => onError(index)}
        mediaRef={mediaRef}
        preload="auto"
        load={load}
      />
      <div className="stage-shade" />
      <div className="stage-vignette" aria-hidden="true" />
      {ANIM.video.lightSweep ? (
        <div className={`light-sweep${active ? ' is-on' : ''}`} aria-hidden="true" />
      ) : null}

      {ghost ? (
        <div className="ghost-word" ref={ghostRef} aria-hidden="true">
          {chapter.nav.toUpperCase()}
        </div>
      ) : null}

      <div className="stage-copy" ref={copyRef} aria-hidden={!active}>
        <p className="chapter-count">
          {String(index + 1).padStart(2, '0')} / {total}
        </p>
        <h2>{chapter.title}</h2>
        <p className="chapter-text">{chapter.text}</p>
      </div>

      <div className="stage-meter" aria-hidden="true">
        <i ref={meterRef} />
      </div>

      {failed ? <span className="sr-only">Scene unavailable</span> : null}
    </>
  );
}
