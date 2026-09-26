import { gsap, ScrollTrigger, reducedMotion } from '../lib/motion.js'

/** Lenis smooth scroll wired into the GSAP ticker so ScrollTrigger scrubs in sync. */
export function initSmoothScroll() {
  if (reducedMotion()) return null

  const lenis = new window.Lenis({
    duration: 1.15,
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  })

  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // anchor links go through Lenis
  document.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a[href^="#"]')
    if (!a) return
    const id = a.getAttribute('href').slice(1)
    const target = document.getElementById(id)
    if (!target) return
    e.preventDefault()
    lenis.scrollTo(target, { offset: -70 })
  })

  // handy from the console; plain window.scrollTo will not stick
  window.__lenis = lenis
  window.__ST = ScrollTrigger
  return lenis
}
