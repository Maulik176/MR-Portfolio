import {gsap as gsapCore} from 'gsap';
import {ScrollTrigger as ScrollTriggerCore} from 'gsap/ScrollTrigger';

// Re-export as explicit named exports to keep bundlers happy.
export const gsap = gsapCore;
export const ScrollTrigger = ScrollTriggerCore;

let registered = false;

export function ensureGsapPlugins() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}
