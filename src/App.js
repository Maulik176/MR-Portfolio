import React, {useEffect} from 'react';
import { About, Footer, Header, Skills, Testimonial, Work} from './container';
import { Navbar, SpotlightOverlay } from './components';
import {ensureGsapPlugins, gsap, ScrollTrigger} from './lib/gsap';
import {initReveals} from './lib/reveals';
import './App.scss';
const App = () => {
  useEffect(() => {
    ensureGsapPlugins();

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lowPower =
      typeof navigator !== 'undefined' &&
      ((typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
        (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4));

    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(max-width: 800px)').matches;

    const cleanupReveals = initReveals();

    // Global aurora drift tied to scroll (ultra-smooth scrub).
    let auroraTween = null;
    // Scrubbing CSS vars on scroll can repaint large blurred layers; keep it desktop-only.
    if (!reduced && !lowPower && !isMobile) {
      const root = document.documentElement;
      root.style.setProperty('--aur1x', '25%');
      root.style.setProperty('--aur1y', '18%');
      root.style.setProperty('--aur2x', '78%');
      root.style.setProperty('--aur2y', '62%');
      root.style.setProperty('--aurA', '0.75');

      auroraTween = gsap.to(root, {
        '--aur1x': '38%',
        '--aur1y': '28%',
        '--aur2x': '62%',
        '--aur2y': '72%',
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
        },
      });
    } else {
      // Static aurora defaults for mobile/low-power.
      const root = document.documentElement;
      root.style.setProperty('--aur1x', '25%');
      root.style.setProperty('--aur1y', '18%');
      root.style.setProperty('--aur2x', '78%');
      root.style.setProperty('--aur2y', '62%');
      root.style.setProperty('--aurA', isMobile ? '0.55' : '0.7');
    }

    return () => {
      cleanupReveals();
      if (auroraTween) {
        try {
          auroraTween.scrollTrigger && auroraTween.scrollTrigger.kill();
        } catch (_) {
          // no-op
        }
        try {
          auroraTween.kill();
        } catch (_) {
          // no-op
        }
      }
      // Avoid killing other triggers created by components (HeroCanvas, ExperienceTimeline, etc).
      try {
        ScrollTrigger.refresh();
      } catch (_) {
        // no-op
      }
    };
  }, []);

  return (
    <div className="app">
        <div className="app__aurora" aria-hidden="true" />
        <SpotlightOverlay />
        <Navbar />
        <Header />
        <About />
        <Work />
        <Skills />
        <Testimonial />
        <Footer />
    </div>
  )
};

export default App;
