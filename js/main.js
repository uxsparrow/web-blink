/**
 * Blink CMS — entry point.
 *
 * GSAP, ScrollTrigger, Lenis and topojson are globals from <script> tags.
 * Three.js is an ES module, imported lazily with the globe so the 700 kB of
 * WebGL never blocks first paint.
 */

import { gsap, ScrollTrigger, onInView, reducedMotion, seg, easeOut, clamp } from './lib/motion.js'
import { liveTicks } from './lib/content.js'

import { initSmoothScroll } from './ui/smooth-scroll.js'
import { initReveals } from './ui/reveal.js'
import { initCounters } from './ui/counter.js'
import { initCursor, initHeader, initSectionLabel } from './ui/chrome.js'
import { initFaq, initTabs, initVideoModal, initWireThumb, initTickers } from './ui/widgets.js'

import { mountPreloader } from './scenes/preloader.js'
import { mountDesk } from './scenes/desk.js'
import { mountPlatform } from './scenes/platform.js'
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

  const platform = q('[data-scene="platform"]')
  if (platform) scenes.platform = gate(mountPlatform(platform), platform)

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
 * 06 · HOW IT WORKS — the pipeline.
 *
 * What comes in, the six stages it passes through, where it goes out. One
 * scrubbed value again, split three ways: the inputs arrive, the spine draws
 * left to right lighting each stage as it reaches it, and the channels light
 * once it gets to them. The edges overlap the spine slightly so the thing
 * reads as one movement rather than three.
 *
 * The curves are the only part that cannot be CSS. They are drawn into an SVG
 * sized in real pixels from the pills' own measured positions, so they stay
 * exact at any width — and redrawn on resize, since a grid column changing
 * width moves every endpoint.
 */
function setupPipeline() {
  const pipe = q('[data-pipe]')
  if (!pipe) return

  const wires = q('[data-pipe-wires]', pipe)
  const stages = qq('[data-pipe-stage]', pipe)
  const ins = qq('[data-pipe-in]', pipe)
  const outs = qq('[data-pipe-out]', pipe)
  const spine = q('.pipe__spine', pipe)
  if (!stages.length) return

  const NS = 'http://www.w3.org/2000/svg'

  /** A flat S-curve from one point to another, horizontal at both ends. */
  const curve = (x1, y1, x2, y2) => {
    const dx = Math.max(28, (x2 - x1) * 0.55)
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }

  const drawWires = () => {
    if (!wires || !spine) return
    const box = pipe.getBoundingClientRect()
    // below lg the diagram is a plain list and the curves are hidden by CSS
    if (getComputedStyle(wires).display === 'none') return

    const rail = spine.getBoundingClientRect()
    const midY = rail.top + rail.height / 2 - box.top
    const leftX = rail.left - box.left
    const rightX = rail.right - box.left

    const d = []
    for (const el of ins) {
      const r = el.getBoundingClientRect()
      d.push(curve(r.right - box.left, r.top + r.height / 2 - box.top, leftX, midY))
    }
    for (const el of outs) {
      const r = el.getBoundingClientRect()
      d.push(curve(rightX, midY, r.left - box.left, r.top + r.height / 2 - box.top))
    }

    wires.setAttribute('width', box.width)
    wires.setAttribute('height', box.height)
    wires.replaceChildren()
    for (const path of d) {
      const p = document.createElementNS(NS, 'path')
      p.setAttribute('d', path)
      p.setAttribute('fill', 'none')
      p.setAttribute('stroke', 'rgba(97,24,234,.34)')
      p.setAttribute('stroke-width', '1.5')
      wires.appendChild(p)
    }
  }

  const paint = (p) => {
    const draw = seg(p, 0.12, 0.82)
    pipe.style.setProperty('--draw', draw)
    pipe.style.setProperty('--in', easeOut(seg(p, 0, 0.2)))
    pipe.style.setProperty('--out', easeOut(seg(p, 0.78, 1)))

    // a stage lights when the spine reaches it; the stages sit at
    // (i + 0.5) / n across the rail, which is where CSS puts them too
    stages.forEach((st, i) => st.classList.toggle('is-on', draw >= (i + 0.5) / stages.length))
    const landed = seg(p, 0.82, 0.94) > 0
    outs.forEach((o) => o.classList.toggle('is-on', landed))
    ins.forEach((o) => o.classList.toggle('is-on', p > 0.06))
  }

  drawWires()
  // a grid column changing width moves every endpoint
  window.addEventListener('resize', drawWires)
  ScrollTrigger.addEventListener('refreshInit', drawWires)

  if (reducedMotion()) {
    paint(1)
    return
  }

  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    ease: 'none',
    onUpdate: () => paint(state.p),
    scrollTrigger: { trigger: pipe, start: 'top 82%', end: 'bottom 72%', scrub: 0.5 },
  })
}

/**
 * 06 · HOW IT WORKS — the three module cards under the pipeline.
 *
 * They had a drawn line and a node each once. The pipeline above them draws
 * the flow now, and two scroll-drawn lines stacked in one section said the
 * same thing twice — so all that is left here is bringing the cards in as
 * they are reached.
 */
function setupSteps() {
  const track = q('[data-steps]')
  const steps = qq('[data-step]')
  if (!track || !steps.length) return

  if (reducedMotion()) {
    steps.forEach((s) => s.classList.add('is-on'))
    return
  }

  steps.forEach((s, i) => {
    ScrollTrigger.create({
      trigger: s,
      start: 'top 86%',
      once: true,
      onEnter: () => setTimeout(() => s.classList.add('is-on'), i * 90),
    })
  })
}

/**
 * 11 · THE RATE CARD — the four plans rise in turn.
 *
 * The slices overlap, unlike 03's, so the four read as a stagger rather than
 * as a queue waiting its turn. The figures themselves are counted up by the
 * existing `[data-count-to]` plumbing — the same device the front page's stats
 * use, which is the whole reason this section needs nothing else.
 */
function setupRates() {
  const grid = q('[data-rates]')
  const cards = qq('[data-rate]')
  if (!grid || !cards.length) return

  const draw = (p) =>
    cards.forEach((c, i) => c.style.setProperty('--rise', easeOut(seg(p, i * 0.14, i * 0.14 + 0.58))))

  if (reducedMotion()) {
    draw(1)
    return
  }

  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    ease: 'none',
    onUpdate: () => draw(state.p),
    scrollTrigger: { trigger: grid, start: 'top 88%', end: 'bottom 80%', scrub: 0.5 },
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
  if (!section) return

  const track = q('[data-letters]')
  const letters = qq('[data-letter]')

  /*
   * The letters are read one at a time, in order: a single scrubbed value
   * across the whole block, sliced per letter, so a letter cannot begin until
   * the one above it has finished. Four separate triggers — what this was
   * before — overlap, and two or three letters light at once.
   *
   * Each letter lights its quote, then the name, then the role, because that
   * is the order the spans sit in the DOM and the order you would read them.
   *
   * Words rest lit in the stylesheet. Dimming them here is what arms the
   * effect, so a dead script leaves four readable letters rather than four
   * grey blocks — the same rule the ON AIR video follows.
   */
  if (track && letters.length) {
    const groups = letters.map((el) => ({
      words: qq('.lw', el),
      rule: el.querySelector('.letter__rule'),
      lit: 0,
    }))

    const paint = (g, t) => {
      g.rule?.style.setProperty('--read', t)
      // finishes a little before its slice ends, so the last words land while
      // the letter is still settled rather than on its way out
      const want = Math.round(clamp(t / 0.88) * g.words.length)
      if (want === g.lit) return
      // only the words that actually crossed, not all thirty every frame
      if (want > g.lit) for (let k = g.lit; k < want; k++) g.words[k].classList.remove('is-dim')
      else for (let k = want; k < g.lit; k++) g.words[k].classList.add('is-dim')
      g.lit = want
    }

    if (reducedMotion()) {
      groups.forEach((g) => paint(g, 1))
    } else {
      groups.forEach((g) => g.words.forEach((w) => w.classList.add('is-dim')))
      const n = groups.length
      const state = { p: 0 }
      gsap.to(state, {
        p: 1,
        ease: 'none',
        onUpdate: () => groups.forEach((g, i) => paint(g, seg(state.p, i / n, (i + 1) / n))),
        scrollTrigger: { trigger: track, start: 'top 80%', end: 'bottom 90%', scrub: 0.4 },
      })
    }
  }

  if (!scenes.signal) return

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
    scenes.platform?.setProgress(0.5)
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
          onUpdate: (self) => scenes.platform?.setProgress(self.progress),
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
 * 14 · ON AIR — the background video.
 *
 * It is 4.4MB, so it carries no `src` until the section is close: the page's
 * whole point is that nothing heavy blocks first paint. It also never loads
 * under `prefers-reduced-motion`, and if it cannot play — no autoplay, a failed
 * fetch — the section keeps the flat #111 it has always had.
 */
function setupOnAirVideo() {
  const video = q('[data-on-air-video]')
  if (!video || reducedMotion()) return

  onInView(
    video,
    (inView) => {
      if (!inView) {
        video.pause()
        return
      }
      if (!video.getAttribute('src')) video.setAttribute('src', video.dataset.src)
      video.play().then(
        () => video.classList.add('is-playing'),
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
  initVideoModal()
  initWireThumb()
  initTickers()

  setupOnAirVideo()

  const scenes = mountScenes()
  setupHero()
  setupPins(scenes)
  setupLeaves()
  setupPipeline()
  setupSteps()
  setupRates()
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
