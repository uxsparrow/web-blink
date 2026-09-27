/**
 * Blink CMS — entry point.
 *
 * GSAP, ScrollTrigger, Lenis and topojson are globals from <script> tags.
 * Three.js is an ES module, imported lazily with the globe so the 700 kB of
 * WebGL never blocks first paint.
 */

import { gsap, ScrollTrigger, onInView, reducedMotion, seg, easeOut } from './lib/motion.js'
import { liveTicks } from './lib/content.js'

import { initSmoothScroll } from './ui/smooth-scroll.js'
import { initReveals } from './ui/reveal.js'
import { initCounters } from './ui/counter.js'
import { initCursor, initHeader, initSectionLabel } from './ui/chrome.js'
import { initFaq, initTabs, initFilmModal, initWireThumb, initTickers } from './ui/widgets.js'

import { mountPreloader } from './scenes/preloader.js'
import { mountDesk } from './scenes/desk.js'
import { mountConveyor } from './scenes/conveyor.js'
import { mountPress } from './scenes/press.js'
import { mountReaderSignal } from './scenes/reader-signal.js'
import { mountHalftoneWordmark } from './scenes/halftone-wordmark.js'
import { mountBackPageMap } from './scenes/back-page-map.js'

const q = (sel, root = document) => root.querySelector(sel)
const qq = (sel, root = document) => [...root.querySelectorAll(sel)]
const isMobile = () => window.matchMedia('(max-width: 899px)').matches

/* ── canvas scenes ────────────────────────────────────────────── */

/** Mounts a scene and pauses its loop whenever it scrolls out of view. */
function gate(scene, el, margin = '12%') {
  if (!scene) return null
  onInView(el, (inView) => scene.setActive(inView), margin)
  return scene
}

function mountScenes() {
  const scenes = {}
  const mobile = isMobile()

  const desk = q('[data-scene="desk"]')
  if (desk) scenes.desk = gate(mountDesk(desk, { mobile }), desk)

  const conveyor = q('[data-scene="conveyor"]')
  if (conveyor) scenes.conveyor = gate(mountConveyor(conveyor), conveyor)

  const press = q('[data-scene="press"]')
  if (press) scenes.press = gate(mountPress(press, { mobile }), press)

  const signal = q('[data-scene="signal"]')
  if (signal) scenes.signal = gate(mountReaderSignal(signal), signal, '10%')

  const wordmark = q('[data-scene="wordmark"]')
  if (wordmark) mountHalftoneWordmark(wordmark, 'BLINKCMS')

  const map = q('[data-scene="map"]')
  if (map) mountBackPageMap(map)

  return scenes
}

/**
 * Three.js is ~700 kB, so it stays out of the critical path — but the fetch
 * starts here, at boot, rather than when the preloader releases. The intro
 * then covers the download and parse instead of the hero sitting empty.
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
  onInView(wrap || canvas, (inView) => globe.setActive(inView), '15%')
}

/* ── scroll story ─────────────────────────────────────────────── */

function setupHero() {
  const hero = q('#hero')
  if (!hero || reducedMotion()) return

  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  })
  // the violet sky rises from the bottom and takes the page to white
  tl.fromTo(q('[data-hero-sky]'), { yPercent: 104 }, { yPercent: 0, ease: 'none' }, 0)
  tl.to(q('[data-hero-copy]'), { yPercent: -18, opacity: 0, ease: 'none' }, 0.12)
  /*
   * The dim runs on the inner layer, never on `[data-globe-wrap]` itself. The
   * wrap's opacity belongs to the lazy reveal: it is 0 until the Three.js
   * import resolves and `is-ready` fades it in. GSAP records a target's
   * starting value the first time a tween renders and restores it when the
   * playhead rewinds past that tween — so tweening the wrap recorded the
   * pre-reveal 0 and, on the way back up, wrote it back as an inline style,
   * which beats `.is-ready`. The hero came back empty. The inner layer rests
   * at opacity 1, so there is nothing to sample wrong.
   */
  tl.to(q('[data-globe-dim]'), { yPercent: -10, scale: 0.94, opacity: 0.25, ease: 'none' }, 0.1)
}

/**
 * 03 · WHY NEWSROOMS LEAVE — the answers arrive as you scroll.
 *
 * Same architecture as 06's delivery line: one scrubbed number, and CSS decides
 * what it means. Here it is sliced per row, so each answer wipes in over its
 * own share of the section while the question stays readable throughout — the
 * question is the reader's own thought and should never be the thing withheld.
 */
function setupLeaves() {
  const list = q('[data-leaves]')
  const rows = qq('[data-leave]')
  if (!list || !rows.length) return

  const draw = (p) =>
    rows.forEach((row, i) =>
      // eased, or the wipe runs at a constant rate and reads mechanical
      row.style.setProperty('--reveal', easeOut(seg(p, i / rows.length, (i + 1) / rows.length)))
    )

  if (reducedMotion()) {
    draw(1)
    return
  }

  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    ease: 'none',
    onUpdate: () => draw(state.p),
    scrollTrigger: { trigger: list, start: 'top 82%', end: 'bottom 72%', scrub: 0.5 },
  })
}

/**
 * 06 · HOW IT WORKS — the delivery line draws itself.
 *
 * One scrubbed value does all of it: `--draw` goes 0 → 1 across the section
 * and CSS decides what that means, so the line runs left-to-right on a desktop
 * and top-to-bottom on a phone without this function knowing which. A step
 * lights when the line reaches its node — the nodes are evenly spaced, so
 * that is simply `i / steps.length`.
 */
function setupSteps() {
  const track = q('[data-steps]')
  const steps = qq('[data-step]')
  if (!track || !steps.length) return

  const draw = (p) => {
    track.style.setProperty('--draw', p)
    // The nodes are evenly spaced, so the head reaches node i at i/length and
    // the step lights exactly there. The p > 0.02 is only to keep the first
    // one — whose node is the line's own origin — dark until the line moves.
    steps.forEach((s, i) => s.classList.toggle('is-on', p > 0.02 && p >= i / steps.length))
  }

  if (reducedMotion()) {
    draw(1)
    return
  }

  /*
   * The scrub is on a tween of a plain object, not on the element. A bare
   * ScrollTrigger.create takes `scrub` but has no animation to scrub, so its
   * onUpdate would run at raw scroll position and the line would track the
   * wheel 1:1 — the one thing the rest of this page never does. Tweening a
   * proxy gives the same eased catch-up as the pinned scenes, and writing the
   * custom property by hand keeps it off CSSPlugin's custom-property support.
   */
  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    ease: 'none',
    onUpdate: () => draw(state.p),
    scrollTrigger: {
      trigger: track,
      start: 'top 78%',
      end: 'bottom 76%',
      scrub: 0.5,
    },
  })
}

function setupLive() {
  const strip = q('[data-live-strip]')
  const card = q('[data-live-card]')
  const stamp = q('[data-live-stamp]')
  if (!strip || !card || reducedMotion()) return

  gsap.fromTo(
    card,
    { top: '2%' },
    {
      top: '86%',
      ease: 'none',
      scrollTrigger: {
        trigger: strip,
        start: 'top 72%',
        end: 'bottom 88%',
        scrub: 0.5,
        onUpdate: (self) => {
          const i = Math.min(liveTicks.length - 1, Math.floor(self.progress * liveTicks.length))
          if (stamp) stamp.textContent = liveTicks[i]
        },
      },
    }
  )
}

function setupLetters(scenes) {
  const section = q('#letters')
  if (!section || !scenes.signal) return

  if (reducedMotion()) {
    scenes.signal.setProgress(0.42)
    return
  }
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => scenes.signal.setProgress(self.progress),
  })
}

/**
 * The three pinned scenes. gsap.matchMedia rebuilds them when the breakpoint
 * flips and reverts the old set automatically.
 */
function setupPins(scenes) {
  const desk = q('#desk .pin-stage')
  const platform = q('#platform .pin-stage')
  const press = q('#press .pin-stage')

  if (reducedMotion()) {
    scenes.desk?.setProgress(0.74)
    scenes.conveyor?.setProgress(0.5)
    scenes.press?.setProgress(0.45)
    gsap.set(qq('[data-platform-card]'), { opacity: 1, rotateX: 0, y: 0 })
    gsap.set(qq('[data-press-feature]'), { opacity: 1, y: 0 })
    return
  }

  const mm = gsap.matchMedia()

  const build = (long, short) => (context) => {
    const { isDesktop } = context.conditions
    const len = isDesktop ? long : short

    /* 04 · THE DESK */
    if (desk) {
      ScrollTrigger.create({
        trigger: desk,
        start: 'top top',
        end: `+=${len.desk}%`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => scenes.desk?.setProgress(self.progress),
      })
    }

    /* 05 · OUR PLATFORM */
    if (platform) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: platform,
          start: 'top top',
          end: `+=${len.platform}%`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          onUpdate: (self) => scenes.conveyor?.setProgress(self.progress),
        },
      })
      // the giant word slides against the run of the rail
      tl.fromTo(q('[data-platform-word]'), { xPercent: 12 }, { xPercent: -46, ease: 'none' }, 0)
      // each platform card unfolds off the rail in turn
      qq('[data-platform-card]').forEach((card, i) => {
        tl.fromTo(
          card,
          { opacity: 0, y: 70, rotateX: -84 },
          { opacity: 1, y: 0, rotateX: 0, ease: 'power3.out', duration: 0.6 },
          0.06 + i * 0.125
        )
      })
    }

    /* 08 · THE PRESS */
    if (press) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: press,
          start: 'top top',
          end: `+=${len.press}%`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          onUpdate: (self) => scenes.press?.setProgress(self.progress),
        },
      })
      const head = q('[data-press-head]')
      tl.fromTo(head, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5 }, 0.02)
      tl.to(head, { scale: 0.82, opacity: 0.9, duration: 0.5 }, 0.5)
      tl.to(head, { opacity: 0, duration: 0.22 }, 0.84)

      qq('[data-press-feature]').forEach((f, i) => {
        tl.fromTo(
          f,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, ease: 'power2.out', duration: 0.34 },
          0.5 + i * 0.06
        )
        tl.to(f, { opacity: 0, duration: 0.18 }, 0.86)
      })
      // the pages flutter away and the page goes white
      tl.fromTo(q('[data-press-flash]'), { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.12 }, 0.93)
    }
  }

  mm.add(
    { isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' },
    build(
      { desk: 500, platform: 650, press: 650 },
      { desk: 250, platform: 320, press: 320 }
    )
  )
}

/**
 * 13 · ON AIR — the background film.
 *
 * It is 4.4MB, so it carries no `src` until the section is close: the page's
 * whole point is that nothing heavy blocks first paint. It also never loads
 * under `prefers-reduced-motion`, and if it cannot play — no autoplay, a failed
 * fetch — the section keeps the flat #111 it has always had.
 */
function setupOnAirFilm() {
  const film = q('[data-on-air-film]')
  if (!film || reducedMotion()) return

  onInView(
    film,
    (inView) => {
      if (!inView) {
        film.pause()
        return
      }
      if (!film.getAttribute('src')) film.setAttribute('src', film.dataset.src)
      film.play().then(
        () => film.classList.add('is-playing'),
        () => {} // autoplay refused; the scrim and #111 carry the section
      )
    },
    '25%'
  )
}

/* ── boot ─────────────────────────────────────────────────────── */

function boot() {
  initSmoothScroll()
  initCursor()
  initHeader()
  initSectionLabel()
  initReveals()
  initCounters()
  initFaq()
  initTabs()
  initFilmModal()
  initWireThumb()
  initTickers()

  setupOnAirFilm()

  const scenes = mountScenes()
  setupHero()
  setupPins(scenes)
  setupLeaves()
  setupSteps()
  setupLive()
  setupLetters(scenes)

  // pinned scenes change the document height as they initialise
  ScrollTrigger.refresh()
  setTimeout(() => ScrollTrigger.refresh(), 400)
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
    ScrollTrigger.refresh()
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
