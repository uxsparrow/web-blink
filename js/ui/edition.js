/**
 * The page-wide behaviours: the one entry reveal, the ambient glow, the
 * count-ups, the parallax layers, the marquees, the footer wordmark, the
 * video modal, the newsletter form, and the two bits of asset plumbing that
 * let the brief's placeholder paths ship before the files exist.
 *
 * Nothing here measures a layout in order to size it. Sections fit and fill
 * because the stylesheet makes `.ed__gfx` a flex child that takes the room
 * the text leaves — not because JavaScript checks and corrects, which would
 * always be one frame late and would do nothing at all with scripts off.
 */

import { gsap, hasGsap, onInView, onScroll, reducedMotion, clamp } from '../lib/motion.js'
import { imageSrc, imageSize, logos, posterSrc, videoSrc } from '../../assets/media.js'

const qq = (sel, root = document) => [...root.querySelectorAll(sel)]

/* ── the one entry reveal ─────────────────────────────────────── */
/**
 * Adds `.is-in` the first time a section is reached; the stylesheet does the
 * rest — fade in, up 24px, 600ms, staggered 80ms by each element's `--i`.
 * Once per section, never reversed, so scrolling back up does not replay it.
 *
 * The threshold is low on purpose. A section is a whole window tall, so by
 * the time 10% of it shows the reader is already looking at it.
 */
/**
 * Containers whose children each take their own place in the stagger.
 *
 * Marking the container rather than every child keeps the markup readable and
 * keeps lists that are built at runtime — the logo rows, the footer columns —
 * in the same rhythm as the ones written by hand. The container's own `--i`
 * is the starting number, so a grid that arrives third in its section starts
 * counting at three rather than at zero.
 *
 * Deliberately NOT here: `.metrics` and `.vs2__rows`, which are rebuilt every
 * time a tab changes. Those already cross-fade through `swap()`, and a reveal
 * on top of a cross-fade is two animations arguing about the same element.
 */
const STAGGER = [
  '.stats',
  '.qlist',
  '.bento',
  '.rates',
  '.addons',
  '.wire',
  '.tabs',
  '.vtabs',
  '.live__mini',
  '.cta-buttons',
  '.logos',
  '.news',
  '.ed-footer__cols',
  '.ed-footer__base',
]

function expandStagger() {
  STAGGER.forEach((sel) =>
    qq(sel).forEach((group) => {
      const base = Number(group.style.getPropertyValue('--i')) || 0
      // the container stops being a revealed thing and becomes a plain box;
      // otherwise its children move 24px inside a parent moving 24px
      group.removeAttribute('data-in')
      ;[...group.children].forEach((child, i) => {
        if (child.hasAttribute('data-in')) return
        child.setAttribute('data-in', '')
        child.style.setProperty('--i', String(base + i))
      })
    })
  )
}

export function initReveals() {
  expandStagger()

  const blocks = qq('#hero, .ed, .ed-footer')
  if (!blocks.length) return

  if (typeof IntersectionObserver === 'undefined') {
    blocks.forEach((b) => b.classList.add('is-in'))
    return
  }

  /*
   * THE SAFETY NET, and it is not optional.
   *
   * Every revealed element on this page starts at `opacity: 0` and waits for
   * `.is-in`. If the observer never runs, the page is blank — not degraded,
   * blank. And there is a real case where it never runs: a document that
   * loads HIDDEN. A background tab, a minimised window, a preview pane that
   * is not on screen — Chrome does not deliver IntersectionObserver callbacks
   * for a hidden document at all. (This was found exactly that way: the whole
   * page measured as unrevealed, and a plain observer on a full-viewport
   * element reported nothing, because `document.visibilityState` was
   * `hidden`.)
   *
   * So: reveal anything already in the viewport whenever the page becomes
   * visible, and once more on a timer regardless. The observer still does the
   * normal work; this only catches the case where it cannot.
   */
  const reveal = (el) => {
    el.classList.add('is-in')
    io.unobserve(el)
  }

  const sweep = () => {
    blocks.forEach((b) => {
      if (b.classList.contains('is-in')) return
      const r = b.getBoundingClientRect()
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) reveal(b)
    })
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sweep()
  })
  setTimeout(sweep, 2500)

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        reveal(e.target)
      }),
    /*
     * threshold 0 with a negative bottom margin, not a percentage of the
     * section. A section is a whole window tall, so a percentage threshold
     * can be jumped clean over by a fast scroll or an in-page link — and a
     * section that never gets `.is-in` stays at opacity 0 forever. This fires
     * the moment any part of it crosses 92% of the viewport, which nothing
     * short of a page reload can skip.
     */
    { threshold: 0, rootMargin: '0px 0px -8% 0px' }
  )
  blocks.forEach((b) => io.observe(b))
}

/* ── the ambient glow ─────────────────────────────────────────── */
/**
 * `--glow` is a cosine of scroll progress: full at the very top and the very
 * bottom, softest in the middle, so the page opens and closes on the same
 * light. `--drift` runs -1 → 1 and the stylesheet turns it into at most 9% of
 * the viewport.
 */
export function initAmbient() {
  const layer = document.querySelector('[data-ambient]')
  if (!layer || reducedMotion()) return

  onScroll(() => {
    const span = document.documentElement.scrollHeight - window.innerHeight
    const p = span > 0 ? clamp(window.scrollY / span) : 0
    layer.style.setProperty('--glow', (0.4 + 0.6 * Math.abs(Math.cos(p * Math.PI))).toFixed(3))
    layer.style.setProperty('--drift', (p * 2 - 1).toFixed(3))
  })
}

/* ── the viewport width, minus the scrollbar ──────────────────── */
/**
 * Writes `--vpw`. The graphics that bleed to the window edge are sized off it
 * rather than off `100vw`, because `100vw` includes the scrollbar: on a 1920
 * window with a 15px scrollbar the bleed overshot the layout by exactly that,
 * and the section reported horizontal overflow it could do nothing about.
 */
export function initViewportVar() {
  const set = () =>
    document.documentElement.style.setProperty('--vpw', document.documentElement.clientWidth + 'px')
  set()
  window.addEventListener('resize', set)
}

/* ── parallax ─────────────────────────────────────────────────── */
/**
 * Three depths per section — back 0.3, mid 0.7, floating chips 1.15 — written
 * as `--py` on each `[data-depth]` element from its section's own scroll
 * progress. Capped at ±80px, which is the difference between depth and
 * seasickness.
 *
 * Content itself is never parallaxed. Depth 1.0 in the brief is the content
 * layer: it moves with the page, which is to say it does not move.
 */
export function initParallax() {
  if (!hasGsap || reducedMotion()) return

  qq('.ed, .ed-footer').forEach((section) => {
    const layers = qq('[data-depth]', section)
    if (!layers.length) return

    const state = { p: 0 }
    const draw = () => {
      // -1 at the top of its pass, +1 at the bottom
      const t = state.p * 2 - 1
      layers.forEach((el) => {
        const depth = Number(el.dataset.depth) || 0.3
        const shift = clamp(t * (1 - depth) * 160, -80, 80)
        el.style.setProperty('--py', shift.toFixed(1) + 'px')
      })
    }

    gsap.to(state, {
      p: 1,
      ease: 'none',
      onUpdate: draw,
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    })
  })
}

/* ── count-ups ────────────────────────────────────────────────── */
/** Counts up once, when it is reached. Indian digit grouping. */
export function initCounters() {
  const els = qq('[data-count-to]')
  if (!els.length) return

  const write = (el, n, suffix) => {
    el.textContent = Math.round(n).toLocaleString('en-IN') + suffix
  }

  const run = (el) => {
    const value = Number(el.dataset.countTo)
    const suffix = el.dataset.suffix || ''
    if (reducedMotion()) {
      write(el, value, suffix)
      return
    }
    const t0 = performance.now()
    const DUR = 1500
    const tick = (now) => {
      const t = clamp((now - t0) / DUR)
      write(el, value * (1 - Math.pow(1 - t, 3)), suffix)
      if (t < 1) requestAnimationFrame(tick)
    }
    // starts from zero rather than from the number already in the markup,
    // which is there so the figure reads correctly with no scripts at all
    write(el, 0, suffix)
    requestAnimationFrame(tick)
  }

  if (typeof IntersectionObserver === 'undefined') {
    els.forEach(run)
    return
  }

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        io.unobserve(e.target)
        run(e.target)
      }),
    { threshold: 0.4 }
  )
  els.forEach((el) => io.observe(el))
}

/* ── marquees ─────────────────────────────────────────────────── */
/**
 * The markup carries one copy of each row; this fills the strip and clones the
 * track so the loop is seamless. With no JavaScript the row still reads, it
 * just does not move.
 */
export function initMarquee() {
  qq('[data-marquee]').forEach((marquee) => {
    const track = marquee.querySelector('.marquee-track')
    if (!track) return

    const items = [...track.children]
    const need = Math.ceil(marquee.offsetWidth / Math.max(1, track.offsetWidth)) + 1
    for (let i = 0; i < need; i++) {
      items.forEach((item) => track.appendChild(item.cloneNode(true)))
    }
    marquee.appendChild(track.cloneNode(true))
  })
}

/* ── the footer wordmark ──────────────────────────────────────── */
/**
 * Scales BLINKCMS to exactly the container width.
 *
 * `vw` cannot do this. The container is capped at 1440px and padded, so a
 * vw-sized wordmark either overflows the container on a wide monitor or
 * leaves a gap at the sides on a narrow one — which is the bug this fixes.
 * Measure the rendered width at a known size, then scale by the ratio.
 */
export function initWordmark() {
  const svg = document.querySelector('[data-wordmark-svg]')
  if (!svg) return

  const texts = qq('[data-wordmark-text]', svg)
  const mask = svg.querySelector('#wmMask rect')
  if (!texts.length) return

  /*
   * The SVG already fills its container at every width — that is what a
   * viewBox does, and it is why this is SVG and not text with a font-size
   * measured by script. The one thing left to do is make the viewBox the
   * glyphs' OWN bounding box, so the type touches both edges with no side
   * bearing left over. Measured once, and again after the webfont lands,
   * because the bearings change with the face.
   */
  const fit = () => {
    let box
    try {
      box = texts[0].getBBox()
    } catch {
      return // not rendered yet (display:none, detached); try again later
    }
    if (!box.width || !box.height) return

    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`)
    if (mask) {
      mask.setAttribute('x', box.x)
      mask.setAttribute('y', box.y)
      mask.setAttribute('width', box.width)
      mask.setAttribute('height', box.height)
    }
  }

  fit()
  if (document.fonts?.ready) document.fonts.ready.then(fit)
  // the box is in viewBox units, so a resize cannot change it — but a font
  // swapping in late can, and that is what `fonts.ready` is for
}

/* ── background video and placeholder images ──────────────────── */
/**
 * The two pieces of asset plumbing that let this ship before the client sends
 * the files.
 *
 * A background video carries `data-src`, never `src`, so nothing is requested
 * until its section is close; it fades in only on `canplay`. A 404 on one of
 * the brief's placeholder paths is therefore invisible — the drawn fallback
 * behind it is what the section was always going to show first anyway.
 *
 * It never loads at all under reduced motion, and never below 768px, where
 * the brief asks for a still instead.
 */
export function initBackVideos() {
  const small = window.matchMedia('(max-width: 767px)').matches
  // below md the brief asks for the still with its slow zoom instead, and
  // under reduced motion there is no video at all
  if (reducedMotion() || small) return

  qq('[data-backvid]').forEach((video) => {
    const file = videoSrc(video.dataset.backvid) || video.querySelector('source')?.getAttribute('src') || video.getAttribute('src')
    // no file yet: the poster behind it is the slot, and nothing is requested
    if (!file) return

    video.addEventListener('canplay', () => video.classList.add('is-playing'), { once: true })
    video.addEventListener('playing', () => video.classList.add('is-playing'))

    onInView(
      video,
      (inView) => {
        if (!inView) {
          video.pause()
          return
        }
        if (!video.getAttribute('src') && !video.querySelector('source')) {
          video.addEventListener('canplay', () => video.classList.add('is-playing'), { once: true })
          video.setAttribute('src', file)
        } else {
          video.classList.add('is-playing')
        }
        video.play().catch(() => {
          /* autoplay refused; the poster carries the slot */
        })
      },
      '25%'
    )
  })
}

/* ── the hero intro ───────────────────────────────────────────── */
/**
 * The hero headline rolls up ONCE, on load, and then stops existing as
 * animation state.
 *
 * This is the fix for the title coming back cut after scrolling down and up
 * again. It used to be keyed to the section's `.is-in`, which an
 * IntersectionObserver owns — so a late callback, a resize or a reload at
 * mid-page could catch it mid-transition or leave it at its start value,
 * which is 112% down and behind the header. Now: one class on <html> at
 * load, and once the transition has run, `.hero-done` takes the transform
 * and the transition off the lines entirely. There is no state left for
 * anything to put back.
 */
export function initHeroIntro() {
  const root = document.documentElement
  const head = document.querySelector('.hero-head')
  if (!head) return

  const settle = () => root.classList.add('hero-done')

  // two frames, so the start value is painted before the end value is set
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      root.classList.add('is-loaded')
      const lines = qq('.line-inner', head)
      if (!lines.length || reducedMotion()) {
        settle()
        return
      }
      // whichever comes first: the transition ending, or a timeout well past
      // its 1.05s + 0.085s stagger, so a dropped event cannot strand it
      lines[lines.length - 1].addEventListener('transitionend', settle, { once: true })
      setTimeout(settle, 1800)
    })
  )
}

/* ── media ────────────────────────────────────────────────────── */
/**
 * Every <img> and <video> on the page gets its source from assets/media.js,
 * never from the markup. `data-img="wire_1"` and `data-poster="live_video"`
 * are all the HTML says; this resolves them. When the client supplies a real
 * file, one `src` in media.js changes and nothing here or in index.html does.
 */
const missing = new Set()

function hide(img) {
  missing.add(img.getAttribute('src'))
  img.style.display = 'none'
}

/** The URL for a media key, so panels can swap images without importing. */
export function mediaSrc(key) {
  return imageSrc(key)
}

export function initImages() {
  // images, with their box reserved so a late picture cannot shift the layout
  qq('[data-img]').forEach((img) => {
    const key = img.dataset.img
    const { w, h } = imageSize(key)
    img.width = w
    img.height = h
    img.setAttribute('src', imageSrc(key))
  })

  // the still behind every video slot
  qq('[data-poster]').forEach((img) => {
    img.setAttribute('src', posterSrc(img.dataset.poster))
  })

  qq('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) hide(img)
    img.addEventListener('error', () => hide(img))
  })
}

/**
 * Points an <img> at a new file, remembering the ones that are not there.
 * The segment tabs and the letters both swap images, and without the memo
 * every tab click re-requested a file the browser already failed on.
 */
export function setImage(img, src) {
  if (!img || !src) return
  img.style.display = missing.has(src) ? 'none' : ''
  img.setAttribute('src', src)
}

/**
 * 01's two marquees, built from the logo list. A logo with an SVG shows the
 * image; one without shows the publisher's name as type, which is what the
 * page does today. The rows are split in half and run in opposite directions.
 */
export function initLogos() {
  qq('[data-logos]').forEach((row) => {
    const half = Math.ceil(logos.length / 2)
    const slice = Number(row.dataset.logos) === 0 ? logos.slice(0, half) : logos.slice(half)
    const track = document.createElement('div')
    track.className = 'marquee-track'
    slice.forEach((logo) => {
      if (logo.src) {
        const img = document.createElement('img')
        img.src = logo.src
        img.alt = logo.name
        img.loading = 'lazy'
        track.appendChild(img)
      } else {
        const span = document.createElement('span')
        span.className = 'display'
        span.textContent = logo.name
        track.appendChild(span)
      }
    })
    row.replaceChildren(track)
  })
}

/**
 * 12's orbiting publisher chips. Eight of them on a slow circle around the
 * globe, each offset so they do not all cross the horizon together.
 */
export function initOrbit() {
  const orbit = document.querySelector('[data-cta-orbit]')
  if (!orbit) return

  const picked = logos.slice(0, 8)
  orbit.replaceChildren(
    ...picked.map((logo, i) => {
      const el = document.createElement('span')
      el.textContent = logo.name
      el.style.setProperty('--a', String(i / picked.length))
      return el
    })
  )

  if (reducedMotion()) {
    // parked, evenly spaced, rather than orbiting
    place(0)
    return
  }

  let live = false
  let raf = 0
  const t0 = performance.now()

  function place(t) {
    ;[...orbit.children].forEach((el, i) => {
      const a = (i / picked.length) * Math.PI * 2 + t * 0.12
      // an ellipse, wider than tall, so the chips read as going round a globe
      const x = Math.cos(a) * 46
      const y = Math.sin(a) * 19 - 4
      el.style.transform = `translate(-50%, -50%) translate(${x}%, ${y}vh)`
      // behind the globe on the far half
      el.style.opacity = String(0.25 + 0.75 * ((Math.sin(a) + 1) / 2))
    })
  }

  const tick = (now) => {
    if (!live) {
      raf = 0
      return
    }
    place((now - t0) / 1000)
    raf = requestAnimationFrame(tick)
  }

  onInView(
    orbit,
    (v) => {
      live = v
      if (v && !raf) raf = requestAnimationFrame(tick)
    },
    '5%'
  )
}

/**
 * The parallax inside a picture: the image is scaled 1.15 and slides between
 * -8% and 8% as its section crosses the window. `overflow: hidden` on the
 * mask is fine here and nowhere else — what it clips is a picture that was
 * deliberately made oversized to have somewhere to travel, not content.
 */
export function initMediaParallax() {
  if (!hasGsap || reducedMotion()) return

  qq('[data-pxm]').forEach((mask) => {
    const section = mask.closest('.ed') || mask
    const state = { p: 0 }
    gsap.to(state, {
      p: 1,
      ease: 'none',
      onUpdate: () => mask.style.setProperty('--pxy', ((state.p * 2 - 1) * 8).toFixed(2) + '%'),
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    })
  })
}

/* ── the fixed back layer ─────────────────────────────────────── */
/**
 * The fallback for the fixed back layer, and only the fallback.
 *
 * Where the browser has scroll-driven animations the CSS does this on the
 * compositor and this function returns immediately — see `.vidslot--fixed`.
 * Doing it from a scroll event cannot be smooth: the event reports a scroll
 * the browser has already painted, so the transform lands a frame behind the
 * section moving over it and the picture judders. Everywhere that leaves, a
 * frame-late picture beats one that does not hold still at all.
 *
 * The value is deliberately not rounded. Snapping to whole pixels trades the
 * lag for a visible 1px stagger, which reads worse at this size.
 *
 * Unlike every other motion on the page this runs under reduced motion too: a
 * background that holds still is the calmer option, not the busier one, and
 * leaving `--fy` unwritten would let the picture scroll with the section.
 */
export function initFixedBg() {
  if (CSS.supports('animation-timeline', '--x')) return

  const slots = qq('[data-fixedbg]')
  if (!slots.length) return

  onScroll(() => {
    slots.forEach((slot) => {
      const host = slot.parentElement
      if (!host) return
      slot.style.setProperty('--fy', (-host.getBoundingClientRect().top).toFixed(2) + 'px')
    })
  })
}

/* ── the "Watch video" modal ──────────────────────────────────── */
export function initVideoModal() {
  const modal = document.querySelector('[data-video-modal]')
  if (!modal) return

  const embed = modal.querySelector('[data-video-embed]')

  /*
   * The embed carries `data-src`, never `src`, so YouTube is not contacted at
   * all until someone opens the modal. Stripping it again on close is what
   * stops playback: hiding the modal would leave the video running behind it.
   */
  const set = (open) => {
    modal.classList.toggle('is-open', open)
    modal.setAttribute('aria-hidden', String(!open))
    if (!embed) return
    if (open) embed.setAttribute('src', embed.dataset.src)
    else embed.removeAttribute('src')
  }

  qq('[data-open-video]').forEach((b) => b.addEventListener('click', () => set(true)))
  qq('[data-close-video]').forEach((b) => b.addEventListener('click', () => set(false)))
  modal.addEventListener('click', (e) => {
    if (e.target === modal) set(false)
  })
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false)
  })
  set(false)
}

/* ── the newsletter form ──────────────────────────────────────── */
/**
 * There is no endpoint to post to yet, so the form does not pretend there is.
 * It validates, says what will happen, and leaves a single obvious place to
 * add the real submit.
 */
export function initNewsletter() {
  const form = document.querySelector('[data-news]')
  if (!form) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const input = form.querySelector('input[type="email"]')
    const ok = input?.checkValidity()
    const note = form.querySelector('[data-news-note]') || document.createElement('span')
    if (!note.dataset.newsNote) {
      note.dataset.newsNote = ''
      note.className = 'meta'
      note.setAttribute('role', 'status')
      note.style.cssText = 'flex:1 0 100%'
      form.appendChild(note)
    }
    note.textContent = ok
      ? 'NOT WIRED UP YET — POST THIS TO YOUR LIST PROVIDER'
      : 'THAT DOES NOT LOOK LIKE AN EMAIL ADDRESS'
    note.style.color = ok ? 'var(--lavender)' : 'var(--live)'
  })
}
