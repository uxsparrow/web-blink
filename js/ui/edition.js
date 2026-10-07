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
export function initReveals() {
  const blocks = qq('#hero, .ed, .ed-footer')
  if (!blocks.length) return

  if (typeof IntersectionObserver === 'undefined') {
    blocks.forEach((b) => b.classList.add('is-in'))
    return
  }

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('is-in')
        io.unobserve(e.target)
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
  const el = document.querySelector('[data-wordmark]')
  if (!el) return

  const fit = () => {
    // the element's OWN content box, not the parent's clientWidth — the
    // parent's includes its 24–48px side padding, and scaling to that put
    // the last letter outside the container
    el.style.setProperty('--wm', '100px')
    const box = el.clientWidth
    const natural = el.scrollWidth
    if (!box || !natural) return
    el.style.setProperty('--wm', Math.floor((box / natural) * 100) + 'px')
  }

  fit()
  window.addEventListener('resize', fit)
  // webfonts land after first layout and change the measurement
  if (document.fonts?.ready) document.fonts.ready.then(fit)
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
  if (reducedMotion() || small) return

  qq('[data-backvid]').forEach((video) => {
    onInView(
      video,
      (inView) => {
        if (!inView) {
          video.pause()
          return
        }
        if (!video.getAttribute('src')) {
          video.addEventListener('canplay', () => video.classList.add('is-playing'), { once: true })
          video.setAttribute('src', video.dataset.src)
        }
        video.play().catch(() => {
          /* autoplay refused, or the file is not there yet; the fallback stands */
        })
      },
      '25%'
    )
  })
}

/**
 * Hides an <img> whose file is missing so the drawn stand-in behind it shows
 * through. Every image path on this page is a placeholder from the brief, so
 * without this the page is a grid of broken-image icons until the client
 * sends the assets.
 */
const missing = new Set()

function hide(img) {
  missing.add(img.getAttribute('src'))
  img.style.display = 'none'
}

export function initImages() {
  qq('.shot__frame img, .post__art img, .deck__card img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) hide(img)
    img.addEventListener('error', () => hide(img))
  })
}

/**
 * Points an <img> at a new file, remembering the ones that are not there.
 * The segment tabs and the letters both swap images, and without the memo
 * every tab click re-requested a file the browser already 404'd — the console
 * filled up and the network panel was unreadable during review.
 */
export function setImage(img, src) {
  if (!img || !src) return
  if (missing.has(src)) {
    img.style.display = 'none'
    img.setAttribute('src', src)
    return
  }
  img.style.display = ''
  img.setAttribute('src', src)
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
