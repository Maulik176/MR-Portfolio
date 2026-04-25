import {ensureGsapPlugins, gsap, ScrollTrigger} from './gsap';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Initializes "reveal on scroll" for elements with `.js-reveal`.
 * Supports async content (Sanity fetch) via a throttled MutationObserver.
 */
export function initReveals({selector = '.js-reveal'} = {}) {
  ensureGsapPlugins();
  if (prefersReducedMotion()) return () => {};

  const finePointer =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const created = [];
  let stopped = false;
  let scheduled = false;

  const bindNew = () => {
    if (stopped) return;
    scheduled = false;

    const els = Array.from(document.querySelectorAll(`${selector}:not([data-reveal-bound])`));
    if (!els.length) return;

    els.forEach((el) => {
      el.setAttribute('data-reveal-bound', '1');
    });

    // Set initial state only for motion-enabled mode.
    // Avoid animating `filter: blur(...)` since it forces expensive repaints on scroll.
    // Keep the "cinematic" feel with opacity + transform only.
    gsap.set(els, {opacity: 0, y: 18, scale: finePointer ? 0.985 : 1});

    const triggers = ScrollTrigger.batch(els, {
      interval: 0.12,
      batchMax: 10,
      once: true,
      start: 'top 85%',
      onEnter: (batch) => {
        gsap.to(batch, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          overwrite: 'auto',
        });
      },
    });

    created.push(...triggers);
    ScrollTrigger.refresh();
  };

  const scheduleBind = () => {
    if (scheduled || stopped) return;
    scheduled = true;
    window.requestAnimationFrame(bindNew);
  };

  // Initial bind
  scheduleBind();

  const mo = new MutationObserver(scheduleBind);
  mo.observe(document.body, {subtree: true, childList: true});

  return () => {
    stopped = true;
    try {
      mo.disconnect();
    } catch (_) {
      // no-op
    }
    created.forEach((t) => {
      try {
        t.kill();
      } catch (_) {
        // no-op
      }
    });
  };
}
