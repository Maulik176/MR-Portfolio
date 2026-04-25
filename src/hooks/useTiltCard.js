import {useEffect} from 'react';

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

/**
 * Ultra-light pointer tilt: only active on fine pointers and motion-enabled mode.
 * Uses rAF-throttled pointer updates and sets CSS variables on the target element.
 */
export function useTiltCard(ref, {maxDeg = 8} = {}) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return undefined;
    if (prefersReducedMotion() || !isFinePointer()) return undefined;

    let raf = 0;
    let last = null;

    const apply = () => {
      raf = 0;
      if (!last) return;

      const r = el.getBoundingClientRect();
      const cx = (last.clientX - r.left) / Math.max(1, r.width);
      const cy = (last.clientY - r.top) / Math.max(1, r.height);

      const nx = Math.min(1, Math.max(0, cx));
      const ny = Math.min(1, Math.max(0, cy));

      const rx = (0.5 - ny) * maxDeg; // rotateX
      const ry = (nx - 0.5) * maxDeg; // rotateY

      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(nx * 100).toFixed(2)}%`);
      el.style.setProperty('--my', `${(ny * 100).toFixed(2)}%`);
    };

    const onMove = (e) => {
      last = e;
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };

    const reset = () => {
      last = null;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      el.style.setProperty('--rx', `0deg`);
      el.style.setProperty('--ry', `0deg`);
      el.style.setProperty('--mx', `50%`);
      el.style.setProperty('--my', `50%`);
    };

    el.addEventListener('pointermove', onMove, {passive: true});
    el.addEventListener('pointerleave', reset, {passive: true});

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', reset);
      reset();
    };
  }, [ref, maxDeg]);
}

