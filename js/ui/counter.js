import { gsap, reducedMotion } from '../lib/motion.js'

/** Giant stats that count up once, when they scroll in. */
export function initCounters() {
  const reduced = reducedMotion()

  document.querySelectorAll('[data-count-to]').forEach((el) => {
    const value = Number(el.dataset.countTo)
    const suffix = el.dataset.suffix || ''
    const write = (n) => {
      el.textContent = Math.round(n).toLocaleString('en-IN') + suffix
    }

    if (reduced) {
      write(value)
      return
    }

    const obj = { n: 0 }
    gsap.to(obj, {
      n: value,
      duration: 1.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => write(obj.n),
    })
  })
}
