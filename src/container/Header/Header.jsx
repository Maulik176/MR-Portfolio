import React, {useEffect, useRef, useState} from 'react';
import { motion } from 'framer-motion';
import { AppWrap } from '../../wrapper';
import { images } from '../../constants';
import {ensureGsapPlugins, gsap, ScrollTrigger} from '../../lib/gsap';
import {client, urlFor} from '../../client';
import './Header.scss';

const scaleVariants = {
  whileInView: {
    scale: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 1,
      ease: 'easeInOut',
    },
  },
};

const Header = () => {
  const rootRef = useRef(null);
  const [serviceNowIcon, setServiceNowIcon] = useState(images.css);

  useEffect(() => {
    let active = true;

    const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    client
      .fetch('*[_type == "skills" && defined(icon)]{name, icon}')
      .then((rows) => {
        if (!active || !Array.isArray(rows)) return;
        const match = rows.find((row) => normalize(row?.name).includes('servicenow'));
        if (!match?.icon) return;
        const img = urlFor(match.icon);
        const iconUrl = img && typeof img.url === 'function' ? img.url() : '';
        if (iconUrl) setServiceNowIcon(iconUrl);
      })
      .catch(() => {
        // Keep CSS icon fallback if Sanity fetch fails.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    ensureGsapPlugins();

    const root = rootRef.current;
    if (!root) return undefined;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    let mm = null;
    const ctx = gsap.context(() => {
      mm = gsap.matchMedia();

      // Lightweight "wow" header background: animated glass orbs + subtle grid.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const fx = root.querySelector('.app__header-bgFx');
        const grid = root.querySelector('.heroGrid');
        const orbs = Array.from(root.querySelectorAll('.heroOrb'));
        const techCircles = Array.from(root.querySelectorAll('.app__header-circles .circle-cmp'));

        if (grid) {
          gsap.to(grid, {
            backgroundPosition: '220px 180px',
            duration: 26,
            ease: 'none',
            repeat: -1,
          });
        }

        orbs.forEach((orb, i) => {
          gsap.to(orb, {
            x: `+=${(i % 2 === 0 ? 1 : -1) * (40 + i * 14)}`,
            y: `+=${(i % 3 === 0 ? -1 : 1) * (28 + i * 10)}`,
            duration: 12 + i * 2.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        });

        // Small parallax on scroll without doing work every frame.
        if (fx) {
          gsap.to(fx, {
            y: -70,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.5,
            },
          });
        }

        // Make the right-side tech circles feel alive (desktop only).
        mm.add('(hover: hover) and (pointer: fine)', () => {
          techCircles.forEach((el, idx) => {
            gsap.to(el, {
              y: idx % 2 === 0 ? -12 : -8,
              duration: 2.8 + idx * 0.35,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
              delay: idx * 0.1,
            });
          });
        });

        return () => {
          // gsap.context() handles cleanup
        };
      });
    }, root);

    return () => {
      if (mm) mm.revert();
      ctx.revert();
      try {
        ScrollTrigger.refresh();
      } catch (_) {
        // no-op
      }
    };
  }, []);

  return (
    <div className="app__header app__flex" ref={rootRef}>
      <div className="app__header-bgFx" aria-hidden="true">
        <div className="heroGrid" />
        <div className="heroOrb orb1" />
        <div className="heroOrb orb2" />
        <div className="heroOrb orb3" />
      </div>
    <motion.div
      whileInView={{ x: [-100, 0], opacity: [0, 1] }}
      transition={{ duration: 0.5 }}
      className="app__header-info"
    >
      <div className="app__header-badge">
        <div className="badge-cmp app__flex">
          <span>👋</span>
          <div style={{ marginLeft: 20 }}>
            <p className="p-text">Hello, I am</p>
            <h1 className="head-text">Maulik Ranadive</h1>
          </div>
        </div>

        <div className="tag-cmp app__flex">
          <p className="p-text">Servicenow Specialist</p>
          <p className="p-text">Full Stack Developer</p>
          <p className="p-text">Building Scalable Systems</p>
        </div>
      </div>
    </motion.div>

    <motion.div
      whileInView={{ opacity: [0, 1] }}
      transition={{ duration: 0.5, delayChildren: 0.5 }}
      className="app__header-img"
    >
      <div className="app__header-portrait">
        <img src={images.profile} alt="Maulik portrait" />
      </div>
    </motion.div>

    <motion.div
      variants={scaleVariants}
      whileInView={scaleVariants.whileInView}
      className="app__header-circles"
    >
      {[images.javascript, images.react, serviceNowIcon || images.css, images.node].map((circle, index) => (
        <div className="circle-cmp app__flex" key={`circle-${index}`}>
          <img src={circle} alt="profile_bg" />
        </div>
      ))}
    </motion.div>
  </div>
  );
};

export default AppWrap(Header, 'home');
