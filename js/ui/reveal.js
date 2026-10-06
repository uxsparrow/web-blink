import { gsap, reducedMotion } from '../lib/motion.js'

/**
 * Teleprompter reveal: each line sits in its own mask and rolls up from below
 * as the block enters. The text stays live HTML.
 */
export function initReveals() {
  const reduced = reducedMotion()

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const inners = el.querySelectorAll('.line-inner')
    if (!inners.length) return

    if (reduced || !el.closest('#hero')) {
      gsap.set(inners, { yPercent: 0, opacity: 1 })
      return
    }

    gsap.fromTo(
      inners,
      { yPercent: 112, opacity: 0.25 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.05,
        stagger: 0.085,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: el.dataset.revealStart || 'top 84%', once: true },
      }
    )
  })
}
