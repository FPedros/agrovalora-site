import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function initSmoothScroll({ anchorOffset = 0 } = {}) {
  return new Lenis({
    autoRaf: true,
    duration: 1.35,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.82,
    anchors: { offset: anchorOffset },
  });
}
