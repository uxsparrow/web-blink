/**
 * Blink CMS — entry point.
 *
 * topojson is a global from a <script> tag; Three.js is an ES module, imported
 * lazily with the hero's globe so the 700 kB of WebGL never blocks first paint.
 * Nothing else is loaded from vendor/ — GSAP, ScrollTrigger and Lenis were
 * removed with the per-section scroll scenes they drove, and the page's
 * remaining motion is CSS transitions plus two rAF loops.
 *
 * What boot() sets up, in the order it matters:
 *
 *   the chrome        header, overlay menu, section label, cursor ring
 *   the background    the ambient glow's two custom properties
 *   the sections      the one entry animation, then each module's behaviour
 *   the hero          globe (lazy), and the "Watch video" modal
 */

import { onInView } from './lib/motion.js'

import { initCursor, initHeader, initSectionLabel } from './ui/chrome.js'
import {
  initAmbient,
  initCounters,
  initFlow,
  initMarquee,
  initQa,
  initQuotes,
  initRails,
  initReveals,
  initVideoModal,
} from './ui/edition.js'

import { mountPreloader } from './scenes/preloader.js'

// Tells the boot failsafe at the end of index.html that the module ran. Must
// stay the first statement after the imports: if any import above fails this
// never executes, and the page falls back to static markup rather than sitting
// under the preloader with every revealed element at opacity 0.
window.__blinkBooted = true

const q = (sel, root = document) => root.querySelector(sel)
const qq = (sel, root = document) => [...root.querySelectorAll(sel)]
const isMobile = () => window.matchMedia('(max-width: 899px)').matches

/* ── the hero globe ───────────────────────────────────────────── */

/**
 * Three.js is ~700 kB, so it stays out of the critical path — but the fetch
 * starts here, at boot, rather than when the preloader releases. The intro then
 * covers the download and parse instead of the hero sitting empty.
 */
const globeModule = document.querySelector('[data-scene="globe"]')
  ? import('./scenes/globe.js')
  : null

async function mountGlobeLazy() {
  const canvas = q('[data-scene="globe"]')
  if (!canvas || !globeModule) return
  const { mountGlobe } = await globeModule
  const globe = mountGlobe(canvas, {
    tagEls: qq('[data-ping-tag]'),
    dense: !isMobile(),
  })
  const wrap = q('[data-globe-wrap]')
  wrap?.classList.add('is-ready')
  // a WebGL loop running behind eleven sections it cannot be seen from is a
  // real cost, so it stops as soon as the hero leaves the window
  onInView(wrap || canvas, (inView) => globe.setActive(inView), '15%')
}

/* ── boot ─────────────────────────────────────────────────────── */

function boot() {
  initCursor()
  initHeader()
  initSectionLabel()

  initAmbient()

  initReveals()
  initCounters()
  initQa()
  initFlow()
  initQuotes()
  initRails()
  initMarquee()

  initVideoModal()
}

function start() {
  boot()

  const preloader = q('[data-preloader]')
  if (!preloader) {
    mountGlobeLazy()
    return
  }

  // hold the page still while the bureaus load
  document.documentElement.style.overflow = 'hidden'
  let released = false
  const release = () => {
    if (released) return
    released = true
    document.documentElement.style.overflow = ''
    mountGlobeLazy()
  }

  mountPreloader(preloader, release)
  // failsafe: nothing about the intro may leave the page locked
  setTimeout(release, 7000)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start)
} else {
  start()
}
