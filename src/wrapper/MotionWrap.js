import React from 'react';

// Keep this wrapper purely structural.
// Section-level reveals are handled centrally via GSAP/ScrollTrigger to avoid double animations.
const MotionWrap = (Component, classNames) => function HOC() {
  return (
    <div className={`${classNames} app__flex`}>
      <Component />
    </div>
  );
};

export default MotionWrap;
