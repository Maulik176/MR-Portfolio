import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HiMenuAlt4, HiX } from 'react-icons/hi';
import { motion } from 'framer-motion';

import './Navbar.scss';
import { images } from '../../constants';
import {ensureGsapPlugins, gsap} from '../../lib/gsap';
const Navbar = () => {
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const linksWrapRef = useRef(null);
  const indicatorRef = useRef(null);

  const items = useMemo(() => ['home', 'about', 'work', 'skills', 'contact'], []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Track active section via IntersectionObserver (smooth + cheap).
    const ids = items;
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the most visible entry.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
        if (!visible.length) return;
        const id = visible[0].target && visible[0].target.id;
        if (id) setActiveSection(id);
      },
      {
        threshold: [0.25, 0.4, 0.55],
        rootMargin: '-30% 0px -55% 0px',
      }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => {
    ensureGsapPlugins();

    const ul = linksWrapRef.current;
    const indicator = indicatorRef.current;
    if (!ul || !indicator) return undefined;
    gsap.set(indicator, {x: 0, y: 0, opacity: 0});

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fine =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (reduced || !fine) return undefined;
    const qx = gsap.quickTo(indicator, 'x', {duration: 0.55, ease: 'expo.out'});
    const qy = gsap.quickTo(indicator, 'y', {duration: 0.55, ease: 'expo.out'});
    const qw = gsap.quickTo(indicator, 'width', {duration: 0.55, ease: 'expo.out'});
    const qh = gsap.quickTo(indicator, 'height', {duration: 0.55, ease: 'expo.out'});
    const qo = gsap.quickTo(indicator, 'opacity', {duration: 0.25, ease: 'power2.out'});

    const moveToEl = (a) => {
      if (!a) return;
      const ulRect = ul.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      const padX = 16;
      const padY = 10;
      const x = r.left - ulRect.left - padX;
      const y = r.top - ulRect.top - padY;
      qx(x);
      qy(y);
      qw(r.width + padX * 2);
      qh(r.height + padY * 2);
      qo(1);
    };

    const moveToActive = () => {
      const a = ul.querySelector(`a[href="#${activeSection}"]`);
      if (!a) {
        qo(0);
        return;
      }
      moveToEl(a);
    };

    // Initial
    const t = window.setTimeout(moveToActive, 50);

    const onResize = () => moveToActive();
    window.addEventListener('resize', onResize);

    const onLeave = () => moveToActive();
    ul.addEventListener('mouseleave', onLeave);

    // Hover preview
    const anchors = Array.from(ul.querySelectorAll('a[href^="#"]'));
    const onEnter = (e) => moveToEl(e.currentTarget);
    anchors.forEach((a) => a.addEventListener('mouseenter', onEnter));

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', onResize);
      ul.removeEventListener('mouseleave', onLeave);
      anchors.forEach((a) => a.removeEventListener('mouseenter', onEnter));
    };
  }, [activeSection, items]);

  return (
    <nav className={`app__navbar ${scrolled ? 'app__navbar--scrolled' : ''}`}>
      
      <div className="app__navbar-logo"> 
        <img src={images.logo} alt="logo" />
      </div>

      <ul className="app__navbar-links" ref={linksWrapRef}> 
        <li className="app__navbar-indicator" ref={indicatorRef} aria-hidden="true" role="presentation" />
        {items.map((item) => (
          <li className="app__flex p-text" key={`link-${item}`}>
            <a
              className={activeSection === item ? 'is-active' : ''}
              href={`#${item}`}
              onClick={() => setActiveSection(item)}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>

      <div className="app__navbar-menu">
        <HiMenuAlt4 onClick={() => setToggle(true)} />
        {toggle && (
          <motion.div
            whileInView={{ x: [300, 0] }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          >
            <HiX onClick={() => setToggle(false)} />
            <ul className="app__navbar-links">
              {['home', 'about', 'work', 'skills', 'contact'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item}`}
                    onClick={() => {
                      setActiveSection(item);
                      setToggle(false);
                    }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
