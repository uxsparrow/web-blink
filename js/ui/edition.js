/**
 * The edition system — every behaviour the eleven sections have between them.
 *
 * All of it put together is smaller than the old 06 pipeline was on its own,
 * and that is the point: the page has one entry animation, one way to swap a
 * panel, one carousel and one marquee, so a new section needs no new code.
 *
 * Nothing in here measures a layout or writes a size. The sections fit the
 * window because the stylesheet sizes them in `svh`, not because JavaScript
 * checks and corrects them — a reader resizing the window would otherwise see
 * the page catch up one frame late, and a reader with no scripts would see a
 * page that never fits at all.
 */

import { reducedMotion, onScroll, clamp } from '../lib/motion.js'
import { letters } from '../lib/content.js'

const qq = (sel, root = document) => [...root.querySelectorAll(sel)]

/** Cross-fade: hide, swap while hidden, show. The one swap on the page. */
const SWAP_MS = 150

function swap(el, write) {
  if (!el) return
  if (reducedMotion()) {
    write()
    return
  }
  el.classList.add('is-swapping')
  clearTimeout(el._swap)
  el._swap = setTimeout(() => {
    write()
    el.classList.remove('is-swapping')
  }, SWAP_MS)
}

/* ── the one entry animation ──────────────────────────────────── */
/**
 * Adds `.is-in` to a section the first time it is reached; the stylesheet does
 * the rest — fade in, up 24px, 600ms, staggered 80ms by each element's `--i`.
 * Once per section, never reversed, so scrolling back up does not replay it.
 *
 * The threshold is low on purpose. A section is a whole window tall, so by the
 * time 12% of it is showing the reader is already looking at it; waiting for
 * more would mean the headline fades in after they have read it.
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
    { threshold: 0.12 }
  )
  blocks.forEach((b) => io.observe(b))
}

/* ── the ambient glow ─────────────────────────────────────────── */
/**
 * Writes the two custom properties the fixed background layer reads.
 *
 * `--glow` is a cosine of scroll progress, so it is at full strength at the
 * very top and the very bottom and at its softest in the middle: the page
 * opens and closes with the same light. `--drift` runs -1 → 1 and the
 * stylesheet turns that into at most 10% of the viewport, which is enough to
 * feel alive and little enough that nobody notices it moving.
 */
export function initAmbient() {
  const layer = document.querySelector('[data-ambient]')
  if (!layer || reducedMotion()) return

  onScroll(() => {
    const span = document.documentElement.scrollHeight - window.innerHeight
    const p = span > 0 ? clamp(window.scrollY / span) : 0
    layer.style.setProperty('--glow', (0.45 + 0.55 * Math.abs(Math.cos(p * Math.PI))).toFixed(3))
    layer.style.setProperty('--drift', (p * 2 - 1).toFixed(3))
  })
}

/* ── 01 · the stats ───────────────────────────────────────────── */
/** Counts up once, when it is reached. Indian digit grouping, as before. */
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
    const DUR = 1400
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

/* ── 02 + 10 · question list → fixed answer panel ─────────────── */
/**
 * Selecting a question cross-fades the panel's contents. The panel's height is
 * fixed in CSS, so nothing on screen moves and the section cannot grow — the
 * reason this is not an accordion.
 */
export function initQa() {
  qq('[data-qa]').forEach((root) => {
    const buttons = qq('[data-qa-q]', root)
    const panel = root.querySelector('[data-qa-panel]')
    const answer = root.querySelector('[data-qa-a]')
    const count = root.querySelector('[data-qa-count]')
    if (!buttons.length || !panel) return

    const total = String(buttons.length).padStart(2, '0')

    const select = (i) => {
      buttons.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)))
      swap(panel, () => {
        if (answer) answer.textContent = buttons[i].dataset.qaQ
        if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`
      })
    }

    buttons.forEach((b, i) => {
      b.addEventListener('click', () => select(i))
      // a list of questions is a list: up and down should walk it
      b.addEventListener('keydown', (e) => {
        const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
        if (!step) return
        e.preventDefault()
        const next = (i + step + buttons.length) % buttons.length
        buttons[next].focus()
        select(next)
      })
    })

    select(0)
  })
}

/* ── 05 · the flow ────────────────────────────────────────────── */
/** Pointing at or selecting a stage writes the one line under the diagram. */
export function initFlow() {
  const flow = document.querySelector('[data-flow]')
  if (!flow) return

  const stages = qq('[data-flow-stage]', flow)
  const readout = flow.querySelector('[data-flow-read]')
  const name = flow.querySelector('[data-flow-name]')
  const copy = flow.querySelector('[data-flow-copy]')
  if (!stages.length || !readout) return

  let selected = 0

  const show = (i) => {
    swap(readout, () => {
      if (name) name.textContent = stages[i].textContent.trim().toUpperCase()
      if (copy) copy.textContent = stages[i].dataset.flowLine
    })
  }

  stages.forEach((st, i) => {
    st.addEventListener('click', () => {
      selected = i
      stages.forEach((s, k) => s.setAttribute('aria-selected', String(k === i)))
      show(i)
    })
    // hover previews without committing; leaving falls back to the selection
    st.addEventListener('pointerenter', () => show(i))
    st.addEventListener('pointerleave', () => show(selected))
    st.addEventListener('focus', () => show(i))
  })
}

/* ── 08 · the letters ─────────────────────────────────────────── */
export function initQuotes() {
  const root = document.querySelector('[data-quotes]')
  if (!root || letters.length < 2) return

  const panel = root.querySelector('[data-quote-panel]')
  const text = root.querySelector('[data-quote-text]')
  const name = root.querySelector('[data-quote-name]')
  const org = root.querySelector('[data-quote-org]')
  const count = root.querySelector('[data-quote-count]')
  const prev = root.querySelector('[data-quote-prev]')
  const next = root.querySelector('[data-quote-next]')
  if (!panel) return

  const total = String(letters.length).padStart(2, '0')
  let i = 0

  const go = (step) => {
    i = (i + step + letters.length) % letters.length
    const L = letters[i]
    swap(panel, () => {
      if (text) text.textContent = L.text
      if (name) name.textContent = L.name
      if (org) org.textContent = L.org
      if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`
    })
  }

  prev?.addEventListener('click', () => go(-1))
  next?.addEventListener('click', () => go(1))
}

/* ── the carousel dots ────────────────────────────────────────── */
/**
 * A `.rail` is a CSS grid in a tall enough window and a swipe strip otherwise,
 * and the stylesheet decides which. This only builds the dots and keeps them
 * in step; in grid mode the dots are `display: none` and the scroll listener
 * never fires, so there is nothing to tear down when the window grows.
 */
export function initRails() {
  qq('[data-rail]').forEach((rail) => {
    const dots = rail.parentElement?.querySelector('[data-rail-dots]')
    const cards = [...rail.children]
    if (!dots || cards.length < 2) return

    dots.replaceChildren(
      ...cards.map((_, i) => {
        const dot = document.createElement('button')
        dot.type = 'button'
        dot.className = 'rail__dot' + (i === 0 ? ' is-on' : '')
        dot.setAttribute('aria-label', `Card ${i + 1} of ${cards.length}`)
        dot.addEventListener('click', () =>
          rail.scrollTo({ left: cards[i].offsetLeft - rail.offsetLeft, behavior: 'smooth' })
        )
        return dot
      })
    )

    const marks = [...dots.children]
    let raf = 0
    rail.addEventListener(
      'scroll',
      () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          // the step is one card plus the gap, not one viewport: a wide short
          // window shows three cards at a time and the dots track cards
          const step = Math.max(1, cards[1].offsetLeft - cards[0].offsetLeft)
          const at = Math.min(cards.length - 1, Math.round(rail.scrollLeft / step))
          marks.forEach((d, i) => d.classList.toggle('is-on', i === at))
        })
      },
      { passive: true }
    )
  })
}

/* ── the publisher marquee ────────────────────────────────────── */
/**
 * The markup carries one copy of the row; this fills the strip and clones the
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

/* ── the hero's "Watch video" modal ───────────────────────────── */
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
