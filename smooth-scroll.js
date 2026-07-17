import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function initSmoothScroll({ anchorOffset = 0 } = {}) {
  if (reduceMotion.matches) return null;

  return new Lenis({
    autoRaf: true,
    duration: 1.35,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.82,
    anchors: { offset: anchorOffset },
  });
}
