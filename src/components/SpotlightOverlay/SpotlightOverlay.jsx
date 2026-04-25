import React, {useEffect} from 'react';
import './SpotlightOverlay.scss';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function isFinePointer() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

export default function SpotlightOverlay() {
  useEffect(() => {
    if (prefersReducedMotion() || !isFinePointer()) return undefined;

    const lowPower =
      typeof navigator !== 'undefined' &&
      ((typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
        (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4));
    if (lowPower) return undefined;

    const root = document.documentElement;
    let raf = 0;
    let last = null;
    let idleTimer = 0;

    const setAlpha = (a) => {
      root.style.setProperty('--spot-a', String(a));
    };

    const apply = () => {
      raf = 0;
      if (!last) return;

      root.style.setProperty('--spot-x', `${last.clientX}px`);
      root.style.setProperty('--spot-y', `${last.clientY}px`);
      setAlpha(0.18);

      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setAlpha(0), 900);
    };

    const onMove = (e) => {
      last = e;
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };

    // Defaults
    root.style.setProperty('--spot-x', '50vw');
    root.style.setProperty('--spot-y', '35vh');
    setAlpha(0);

    window.addEventListener('pointermove', onMove, {passive: true});
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) window.cancelAnimationFrame(raf);
      if (idleTimer) window.clearTimeout(idleTimer);
      setAlpha(0);
    };
  }, []);

  return <div className="app__spotlight" aria-hidden="true" />;
}
