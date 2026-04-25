import React, { useState, useEffect } from 'react';

import { AppWrap, MotionWrap } from '../../wrapper';
import { ExperienceTimeline, SkillsConstellation } from '../../components';
import { urlFor, client } from '../../client';
import { images } from '../../constants';
import './Skills.scss';

function normalizeSkillKey(name) {
  // Collapse common variants like "React", "ReactJS", "React JS" -> "react"
  const raw = String(name || '').toLowerCase().trim();
  const compact = raw.replace(/[^a-z0-9]+/g, '');
  // Common tech naming: <name>js (nodejs/reactjs/threejs) -> <name>
  return compact.endsWith('js') ? compact.slice(0, -2) : compact;
}

const Skills = () => {
  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    // Exclude drafts to avoid duplicate entries (published + drafts.<id>).
    const query = '*[_type == "experiences" && !(_id in path("drafts.**"))]';
    const skillsQuery = '*[_type == "skills" && !(_id in path("drafts.**"))]';

    client.fetch(query).then((data) => {
      setExperiences(data);
    });

    client.fetch(skillsQuery).then((data) => {
      // De-dupe by normalized name so variants don't create duplicate nodes.
      const list = Array.isArray(data) ? data : [];
      const map = new Map();
      list.forEach((s) => {
        const key = normalizeSkillKey(s?.name);
        if (!key) return;
        const prev = map.get(key);
        // Prefer the one that actually has an icon set in Sanity.
        if (!prev) map.set(key, s);
        else if (!prev?.icon && s?.icon) map.set(key, s);
      });
      setSkills(Array.from(map.values()));
    });
  }, []);

  return (
    <>
      <h2 className="head-text js-reveal">Skills & Experiences</h2>
      <SkillsConstellation
        skills={skills.map((s) => {
          const img = s?.icon ? urlFor(s.icon) : null;
          const iconUrlFromSanity = img && typeof img.url === 'function' ? img.url() : '';
          const nameKey = String(s?.name || '').toLowerCase().trim();
          const fallback = images?.[nameKey] || '';
          const iconUrl = iconUrlFromSanity || fallback;
          return { ...s, iconUrl };
        })}
      />

      <h3 className="skillsSubhead js-reveal">Experience Timeline</h3>
      <div className="js-reveal">
        <ExperienceTimeline experiences={experiences} />
      </div>
    </>
  );
};

export default AppWrap(
  MotionWrap(Skills, 'app__skills'),
  'skills',
  'app__whitebg',
);
