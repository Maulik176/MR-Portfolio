import React, {useEffect, useMemo, useRef} from 'react';
import {motion} from 'framer-motion';
import {ensureGsapPlugins, gsap, ScrollTrigger} from '../../lib/gsap';
import './ExperienceTimeline.scss';

function yearSortKey(year) {
  if (!year) return -Infinity;
  if (/present|current|now/i.test(year)) return 9999;
  const m = String(year).match(/\d{4}/);
  if (m) return parseInt(m[0], 10);
  return -Infinity;
}

function normalizeExperiences(experiences) {
  const list = Array.isArray(experiences) ? experiences : [];
  const map = new Map();

  list.forEach((exp) => {
    const year = String(exp?.year || '').trim() || 'Experience';
    const works = Array.isArray(exp?.works) ? exp.works : [];
    const existing = map.get(year) || [];
    map.set(year, existing.concat(works));
  });

  const out = Array.from(map.entries()).map(([year, works]) => ({
    year,
    // De-dupe by (role + company). If duplicates exist, keep the one with the longer description.
    works: (() => {
      const dedup = new Map();
      works
        .filter(Boolean)
        .forEach((w) => {
          const name = String(w?.name || '').trim() || 'Role';
          const company = String(w?.company || '').trim() || '';
          const desc = String(w?.desc || '').trim() || '';
          const key = `${name}||${company}`.toLowerCase();
          const prev = dedup.get(key);
          if (!prev || (desc && desc.length > (prev.desc || '').length)) {
            dedup.set(key, {name, company, desc});
          }
        });
      return Array.from(dedup.values());
    })(),
  }));

  out.sort((a, b) => yearSortKey(b.year) - yearSortKey(a.year));
  return out;
}

export default function ExperienceTimeline({experiences}) {
  const items = useMemo(() => normalizeExperiences(experiences), [experiences]);
  const rootRef = useRef(null);
  const stickyRef = useRef(null);
  const pillRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    ensureGsapPlugins();

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) return undefined;
    if (!items.length) return undefined;

    const root = rootRef.current;
    const sticky = stickyRef.current;
    const pill = pillRef.current;
    const progress = progressRef.current;
    if (!root || !sticky || !pill || !progress) return undefined;

    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (hover: hover) and (pointer: fine)', () => {
      const yearSections = Array.from(root.querySelectorAll('.expYearSection'));
      if (!yearSections.length) return () => {};

      const swapYear = (year) => {
        if (!year) return;
        if (pill.textContent === year) return;
        pill.textContent = year;
        gsap.fromTo(
          pill,
          {opacity: 0, y: 10},
          {opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto'}
        );
      };

      // Set initial year (first section = latest because list is sorted).
      swapYear(yearSections[0].getAttribute('data-year') || items[0]?.year);

      const yearTriggers = yearSections.map((section) =>
        ScrollTrigger.create({
          trigger: section,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => swapYear(section.getAttribute('data-year')),
          onEnterBack: () => swapYear(section.getAttribute('data-year')),
        })
      );

      const progTrigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top+=140',
        end: 'bottom bottom-=140',
        scrub: 0.5,
        onUpdate: (self) => {
          progress.style.transform = `scaleY(${self.progress})`;
        },
      });

      return () => {
        progTrigger.kill();
        yearTriggers.forEach((t) => t.kill());
      };
    });

    return () => {
      mm.revert();
      try {
        ScrollTrigger.refresh();
      } catch (_) {
        // no-op
      }
    };
  }, [items]);

  if (!items.length) return null;

  return (
    <div className="expTimeline" ref={rootRef}>
      <div className="expStickyCol" ref={stickyRef} aria-hidden="true">
        <div className="expStickyYearPill" ref={pillRef}>
          {items[0].year}
        </div>
        <div className="expStickyRail">
          <div className="expStickyProgress" ref={progressRef} />
        </div>
      </div>

      <div className="expScrollCol">
        {items.map((exp) => (
          <section className="expYearSection" data-year={exp.year} key={exp.year}>
            <div className="expYearHeader">
              <span className="expYearDot" aria-hidden="true" />
              <div className="expYearPill">{exp.year}</div>
              <div className="expYearHint">Experience</div>
            </div>

            <div className="expCardsCol">
              {exp.works.map((work, idx) => (
                <motion.article
                  key={`${exp.year}-${work.name}-${idx}`}
                  className="expCard"
                  initial={{opacity: 0, y: 14}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true, amount: 0.2}}
                  transition={{duration: 0.5, ease: 'easeOut'}}
                >
                  <header className="expCard__head">
                    <h3 className="expCard__role">{work.name}</h3>
                    {work.company ? <div className="expCard__company">{work.company}</div> : null}
                  </header>
                  {work.desc ? <p className="expCard__desc">{work.desc}</p> : null}
                </motion.article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
