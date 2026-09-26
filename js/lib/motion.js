/**
 * Motion primitives. GSAP, ScrollTrigger and Lenis are loaded as globals by
 * <script> tags in index.html, so there is nothing to bundle.
 */

const { gsap, ScrollTrigger } = window
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

/** Pinned scenes collapse to a single key frame when this is true. */
export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── easings and maths, shared with the canvas scenes ──────────── */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
/** Remap p from [a,b] onto [0,1], clamped. */
export const seg = (p, a, b) => clamp((p - a) / (b - a))
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOutBack = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Calls back whenever an element enters or leaves the viewport. Scenes use it
 * to stop rendering when they scroll away — several long-running rAF loops on
 * one page is a real cost.
 */
export function onInView(el, cb, margin = '25%') {
  if (!el || typeof IntersectionObserver === 'undefined') {
    cb(true)
    return () => {}
  }
  const io = new IntersectionObserver(([entry]) => cb(entry.isIntersecting), {
    rootMargin: `${margin} 0px ${margin} 0px`,
  })
  io.observe(el)
  return () => io.disconnect()
}
