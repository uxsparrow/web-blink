/**
 * Motion primitives.
 *
 * GSAP and ScrollTrigger are globals from <script> tags. They drive the
 * scrubbed graphics — the map assembling, the story card on the fibre, the
 * live counter, the comparison divider, every parallax layer — and they
 * **never pin**. Pinning and scroll-jacking are out by brief; a scrub reverses
 * naturally when the reader scrolls back up, which is the whole point.
 *
 * `hasGsap` is checked rather than assumed. If the library is blocked the page
 * still has to work: panels still swap, tabs still switch, the modal still
 * opens. Only the scrubbed motion goes quiet, and every scene that needs it
 * draws its finished state instead of nothing.
 */

export const gsap = window.gsap
export const ScrollTrigger = window.ScrollTrigger
export const hasGsap = !!(gsap && ScrollTrigger)

if (hasGsap) gsap.registerPlugin(ScrollTrigger)

/** Everything that moves checks this; under it, only opacity changes. */
export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── maths ─────────────────────────────────────────────────────── */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
/** Remap p from [a,b] onto [0,1], clamped. */
export const seg = (p, a, b) => clamp((p - a) / (b - a))
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/* ── scroll and visibility ─────────────────────────────────────── */

/**
 * Calls back whenever an element enters or leaves the viewport. Every ambient
 * loop on the page is gated on this: twelve sections of canvas and CSS
 * animation all running at once is exactly how a page loses 60fps on a phone.
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

/** One rAF-throttled scroll listener, run once so the first frame is right. */
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

/**
 * The standard scrub: 0 → 1 across a section, reversing on the way back up.
 * `draw` is called with the progress every frame it changes.
 *
 * With reduced motion or no GSAP it calls `draw(1)` once, so a scene that
 * would have assembled arrives already assembled rather than never arriving.
 * That is the rule for every scrubbed graphic in this build.
 */
export function onScrub(trigger, draw, opts = {}) {
  if (!trigger) return
  if (!hasGsap || reducedMotion()) {
    draw(1)
    return
  }
  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    ease: 'none',
    onUpdate: () => draw(state.p),
    scrollTrigger: {
      trigger,
      start: opts.start || 'top bottom',
      end: opts.end || 'bottom top',
      scrub: opts.scrub ?? 0.5,
    },
  })
}
