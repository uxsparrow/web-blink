/**
 * Motion primitives.
 *
 * GSAP, ScrollTrigger and Lenis used to be loaded as globals and imported
 * from here. All three are gone. What is left on the page — one entry
 * transition, one count-up, one drawn line and the ambient drift — is an
 * IntersectionObserver, two rAF loops and a handful of CSS transitions, so
 * there is no animation library in the page any more and nothing to register.
 *
 * The easing helpers stay because the preloader's canvas still uses them.
 */

/** Everything that moves checks this; under it, only opacity changes. */
export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── maths, shared with the canvas scenes ──────────────────────── */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
/** Remap p from [a,b] onto [0,1], clamped. */
export const seg = (p, a, b) => clamp((p - a) / (b - a))
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Calls back whenever an element enters or leaves the viewport. The globe uses
 * it to stop rendering when it scrolls away — a WebGL loop running behind
 * eleven sections it cannot be seen from is a real cost.
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

/**
 * One rAF-throttled scroll listener, called once immediately so the first
 * frame is already correct rather than correcting itself after the first
 * wheel event.
 */
export function onScroll(fn) {
  let raf = 0
  const run = () => {
    fn()
    raf = 0
  }
  const handler = () => {
    if (!raf) raf = requestAnimationFrame(run)
  }
  fn()
  window.addEventListener('scroll', handler, { passive: true })
  window.addEventListener('resize', handler)
  return handler
}
