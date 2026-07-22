/**
 * gsapScroll.ts — FabLab Platform
 * Central setup for GSAP + ScrollTrigger + Lenis.
 * Import `initSmoothScroll()` once at the app root.
 * All scroll-based animations use Lenis for smooth scroll,
 * GSAP/ScrollTrigger for element choreography.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function initSmoothScroll() {
  // Destroy previous instance if hot-reloaded
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }

  // Mobile: reduce duration for better feel
  const isMobile = window.innerWidth < 768;

  lenis = new Lenis({
    duration: isMobile ? 1.0 : 1.3,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: isMobile ? 0.8 : 1,
    touchMultiplier: isMobile ? 1.2 : 2,
  });

  // Wire Lenis to ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroySmoothScroll() {
  if (lenis) {
    lenis.destroy();
    lenis = null;
    ScrollTrigger.killAll();
    gsap.ticker.remove(() => {});
  }
}

export function getLenis() {
  return lenis;
}

export { gsap, ScrollTrigger };
