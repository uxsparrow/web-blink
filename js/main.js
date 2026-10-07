/**
 * Blink CMS — entry point.
 *
 * GSAP, ScrollTrigger and topojson are globals from <script> tags. Three.js is
 * an ES module, imported lazily with the globe so the 700 kB of WebGL never
 * blocks first paint.
 *
 * There is no preloader. The brief forbids holding first paint for more than
 * a second, and an intro that counts bureaus for four is the single biggest
 * thing between this page and its Lighthouse budget. The hero paints
 * immediately and the globe fades in when Three.js resolves.
 *
 * What boot() sets up, in the order it matters:
 *
 *   the chrome        header, overlay menu, section label, cursor ring
 *   the page          ambient glow, parallax layers, the one entry reveal
 *   the panels        02 monitor, 07 segments, 08 letters, 11 chat
 *   the graphics      one per section, each gated on being visible
 *   the hero          globe (lazy), and its twin at the closing CTA
 */

import { onInView, hasGsap, ScrollTrigger } from './lib/motion.js'
import { letters } from './lib/content.js'

import { initHeader, initSectionLabel } from './ui/chrome.js'
import {
  initAmbient,
  initBackVideos,
  initCounters,
  initImages,
  initMarquee,
  initNewsletter,
  initParallax,
  initHeroIntro,
  initLogos,
  initMediaParallax,
  initFixedBg,
  initOrbit,
  initReveals,
  initViewportVar,
  initVideoModal,
  initWordmark,
} from './ui/edition.js'
import { initBeats, initChat, initCompare, initMonitor, initQuotes } from './ui/panels.js'

import { mountIsoGrid, mountWave } from './scenes/dots.js'
import { mountNetwork } from './scenes/network.js'
import { mountBento } from './scenes/bento.js'
import { mountFlow, mountRatesBg } from './scenes/flow.js'
import { mountLive } from './scenes/live.js'

// Tells the boot failsafe at the end of index.html that the module ran. Must
// stay the first statement after the imports: if any import above fails this
// never executes, and the page falls back to static markup rather than sitting
// with every revealed element at opacity 0.
window.__blinkBooted = true

const q = (sel, root = document) => root.querySelector(sel)
const qq = (sel, root = document) => [...root.querySelectorAll(sel)]
const isMobile = () => window.matchMedia('(max-width: 899px)').matches

/* ── the globe, twice ─────────────────────────────────────────── */

/**
 * Three.js is ~700 kB, so it stays off the critical path — but the fetch
 * starts here, at boot, rather than when something scrolls into view, so it is
 * usually resolved before the hero has finished fading in.
 */
const globeModule = q('[data-scene="globe"]') ? import('./scenes/globe.js') : null

async function mountGlobes() {
  if (!globeModule) return
  const { mountGlobe } = await globeModule

  const hero = q('[data-scene="globe"]')
  if (hero) {
    const globe = mountGlobe(hero, { tagEls: qq('[data-ping-tag]'), dense: !isMobile() })
    const wrap = q('[data-globe-wrap]')
    wrap?.classList.add('is-ready')
    onInView(wrap || hero, (v) => globe.setActive(v), '15%')
  }

  /*
   * The same scene again at the closing CTA, rising from the bottom edge so
   * the page ends on what it opened with. Both pause when they scroll away,
   * so there is never more than one WebGL loop actually running — which is
   * what the brief's "ONE shared renderer" is really asking for.
   */
  const cta = q('[data-scene="globe-cta"]')
  if (cta && !isMobile()) {
    const globe = mountGlobe(cta, { tagEls: [], dense: false })
    onInView(cta, (v) => globe.setActive(v), '10%')
  }
}

/* ── boot ─────────────────────────────────────────────────────── */

function boot() {
  initHeader()
  initSectionLabel()

  initViewportVar()
  initAmbient()
  initHeroIntro()
  initReveals()
  initParallax()
  initCounters()
  initWordmark()
  initImages()
  // the logo rows are built before the marquee clones them
  initLogos()
  initMarquee()
  initOrbit()
  initMediaParallax()
  initFixedBg()
  initBackVideos()
  initVideoModal()
  initNewsletter()

  initMonitor()
  initCompare()
  initBeats()
  initQuotes(letters)
  initChat()

  const net = q('[data-net]')
  if (net) mountNetwork(net)

  const iso = q('[data-iso]')
  if (iso) mountIsoGrid(iso)

  const bento = q('[data-bento]')
  if (bento) mountBento(bento)

  const flow = q('[data-flow]')
  if (flow) mountFlow(flow)

  const live = q('[data-live]')
  if (live) mountLive(live)

  const ratesBg = q('[data-rates-bg]')
  if (ratesBg) mountRatesBg(ratesBg)

  const wave = q('[data-wave]')
  if (wave) mountWave(wave)

  mountGlobes()

  // the marquees and the wordmark change the document height as they build
  if (hasGsap) {
    ScrollTrigger.refresh()
    setTimeout(() => ScrollTrigger.refresh(), 500)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
