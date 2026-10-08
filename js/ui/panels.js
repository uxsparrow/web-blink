/**
 * The five panels that swap their contents in place: the results-night
 * monitor in 02, the comparison table in 06, the segment tabs in 07, the
 * letters in 08 and the chat in 11.
 *
 * They all follow the same two rules, and both exist to protect the
 * fit-to-window system:
 *
 *   · Nothing here changes a section's height. The panels are sized by the
 *     flex layout and their contents cross-fade inside them, so choosing an
 *     answer, a category or a segment moves nothing on screen.
 *   · Auto-advance only runs while the section is on screen, and stops for
 *     good the moment the reader touches it. A carousel that keeps moving
 *     under someone who has started reading is worse than no carousel.
 */

import { onInView, reducedMotion } from '../lib/motion.js'
import { setImage, mediaSrc } from './edition.js'
import { compare } from '../lib/compare.js'

const qq = (sel, root = document) => [...root.querySelectorAll(sel)]
const SWAP_MS = 180

/** Hide, swap while hidden, show. The one swap on the page. */
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

/**
 * Shared auto-advance. Ticks while the element is in view, reports progress
 * through the current step, and gives up permanently on interaction.
 */
function autoCycle(el, count, onStep, onTick, every = 6000) {
  if (!el || count < 2) return { stop() {}, sync() {} }

  let i = 0
  let live = false
  let stopped = reducedMotion()
  let t0 = performance.now()
  let raf = 0

  const frame = (now) => {
    if (stopped || !live) {
      raf = 0
      return
    }
    const p = (now - t0) / every
    onTick?.(i, Math.min(1, p))
    if (p >= 1) {
      t0 = now
      i = (i + 1) % count
      onStep(i, true)
    }
    raf = requestAnimationFrame(frame)
  }

  onInView(
    el,
    (v) => {
      live = v
      if (v && !raf && !stopped) {
        t0 = performance.now()
        raf = requestAnimationFrame(frame)
      }
    },
    '0%'
  )

  return {
    stop() {
      stopped = true
      onTick?.(i, 0)
    },
    sync(next) {
      i = next
      t0 = performance.now()
    },
  }
}

/* ── 02 · the results-night monitor ───────────────────────────── */
export function initMonitor() {
  const monitor = document.querySelector('[data-monitor]')
  const buttons = qq('#problem .qlist__q')
  if (!monitor || !buttons.length) return

  const stage = monitor.querySelector('[data-monitor-stage]')
  const cap = monitor.querySelector('[data-monitor-cap]')
  const steps = qq('i', monitor.querySelector('[data-monitor-steps]'))
  const scenes = qq('.monitor__scene', stage)

  const select = (i, fromTimer) => {
    buttons.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)))
    scenes.forEach((s, k) => {
      // restart the scene's CSS animations by taking the class off and back on
      s.classList.toggle('is-on', k === i)
    })
    steps.forEach((s, k) => {
      s.classList.toggle('is-done', k < i)
      s.style.setProperty('--t', k === i ? '0' : k < i ? '1' : '0')
    })
    swap(cap, () => {
      if (cap) cap.textContent = buttons[i].dataset.cap || ''
    })
    if (!fromTimer) cycle.sync(i)
  }

  const cycle = autoCycle(
    monitor,
    buttons.length,
    (i) => select(i, true),
    (i, p) => steps[i]?.style.setProperty('--t', p.toFixed(3))
  )

  buttons.forEach((b, i) =>
    b.addEventListener('click', () => {
      cycle.stop()
      select(i)
    })
  )
  // pointing at the monitor is also "I am reading this"
  monitor.addEventListener('pointerenter', () => cycle.stop())

  select(0, true)
}

/* ── 06 · the comparison ──────────────────────────────────────── */
/**
 * The card is built from `compare` and nothing else — the rows, the category
 * name and the matrix all come out of the same object, so a row that is not in
 * the client's comparison document cannot appear on the page.
 *
 * The matrix is the section's signature graphic: one column per category, one
 * dot per row inside it, and the open category lit. It is the shape of the
 * comparison rather than a decoration, and it is what the section had instead
 * of a graphic of its own — which is why it read as a plain table on a page
 * where everything else has one.
 */
export function initCompare() {
  const tabs = document.querySelector('[data-vs-tabs]')
  const rows = document.querySelector('[data-vs-rows]')
  if (!tabs || !rows) return

  const buttons = qq('[data-vs-tab]', tabs)
  const catName = document.querySelector('[data-vs-cat]')
  const matrix = document.querySelector('[data-vs-matrix]')

  const el = (tag, cls, text) => {
    const n = document.createElement(tag)
    if (cls) n.className = cls
    if (text != null) n.textContent = text
    return n
  }

  // the matrix is built once; only which column is lit ever changes
  const columns = buttons.map((b) => {
    const set = compare[b.dataset.vsTab]
    const col = el('span', 'vs2__mcol')
    if (set) {
      set.rows.forEach((_, r) => {
        const dot = el('i', 'vs2__dot')
        // counted from the bottom, so a column lights upward
        dot.style.setProperty('--d', String(set.rows.length - 1 - r))
        col.append(dot)
      })
      col.append(el('span', 'meta vs2__mcap', set.label))
    }
    return col
  })
  if (matrix) matrix.replaceChildren(...columns)

  const select = (i) => {
    const set = compare[buttons[i].dataset.vsTab]
    if (!set) return

    buttons.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)))
    columns.forEach((c, k) => c.classList.toggle('is-on', k === i))
    if (catName) catName.textContent = set.label

    swap(rows, () => {
      rows.replaceChildren(
        ...set.rows.map((label, r) => {
          const row = el('div', 'vs2__row')
          row.style.setProperty('--r', String(r))

          const cells = el('span', 'vs2__cells')
          const wp = el('span', 'vs2__cell vs2__cell--no')
          wp.append(el('i', 'vs2__mark', '✘'), el('span', 'vs2__cellname', 'WP'))
          const bl = el('span', 'vs2__cell vs2__cell--yes')
          bl.append(el('i', 'vs2__mark', '✔'), el('span', 'vs2__cellname', 'Blink'))
          wp.setAttribute('aria-hidden', 'true')
          bl.setAttribute('aria-hidden', 'true')
          cells.append(wp, bl)

          // the marks are decoration; this is what a screen reader reads
          const said = el(
            'span',
            'visually-hidden',
            'Not in WordPress out of the box. Included in Blink CMS.'
          )

          row.append(el('span', 'vs2__name', label), cells, said)
          return row
        })
      )
    })
  }

  buttons.forEach((b, i) => b.addEventListener('click', () => select(i)))
  select(0)
}

/* ── 07 · the segment tabs ────────────────────────────────────── */
export function initBeats() {
  const tabs = document.querySelector('[data-beats]')
  if (!tabs) return

  const buttons = qq('[data-beat]', tabs)
  const tag = document.querySelector('[data-beat-tag]')
  const name = document.querySelector('[data-beat-name]')
  const metrics = document.querySelector('[data-beat-metrics]')
  const shotWrap = document.querySelector('[data-shot]')
  const shot = document.querySelector('[data-beat-shot]')
  const glyph = document.querySelector('[data-glyph]')
  const chips = qq('[data-beat-chip]')
  if (!buttons.length || !metrics) return

  const read = (b) => {
    try {
      return JSON.parse(b.dataset.metrics || '[]')
    } catch {
      return []
    }
  }

  const select = (i, fromTimer) => {
    const b = buttons[i]
    buttons.forEach((x, k) => x.setAttribute('aria-selected', String(k === i)))
    const data = read(b)

    swap(metrics, () => {
      if (tag) tag.textContent = b.dataset.tag || ''
      if (name) name.textContent = b.dataset.name || ''
      metrics.replaceChildren(
        ...data.map(([fig, label]) => {
          const cell = document.createElement('span')
          cell.className = 'metric'
          const f = document.createElement('b')
          f.textContent = fig
          const l = document.createElement('span')
          l.className = 'meta'
          l.textContent = label
          cell.append(f, l)
          return cell
        })
      )
      chips.forEach((chip, k) => {
        const m = data[k]
        chip.hidden = !m
        if (m) chip.textContent = `${m[0]} ${m[1]}`
      })
    })

    if (glyph && b.dataset.glyph) {
      glyph.style.opacity = '0'
      setTimeout(() => {
        glyph.textContent = b.dataset.glyph
        glyph.style.opacity = ''
      }, SWAP_MS)
    }

    if (shot && b.dataset.shot) {
      swap(shotWrap, () => setImage(shot, mediaSrc(b.dataset.shot)))
    }

    if (!fromTimer) cycle.stop()
  }

  const cycle = autoCycle(tabs, buttons.length, (i) => select(i, true), null, 7000)
  buttons.forEach((b, i) => b.addEventListener('click', () => select(i)))
  select(0, true)
}

/* ── 08 · the letters ─────────────────────────────────────────── */
export function initQuotes(letters) {
  const root = document.querySelector('[data-quotes]')
  if (!root || !letters || letters.length < 2) return

  const panel = root.querySelector('[data-quote-panel]')
  const text = root.querySelector('[data-quote-text]')
  const name = root.querySelector('[data-quote-name]')
  const role = root.querySelector('[data-quote-role]')
  const org = root.querySelector('[data-quote-org]')
  const count = root.querySelector('[data-quote-count]')
  const prev = root.querySelector('[data-quote-prev]')
  const next = root.querySelector('[data-quote-next]')
  const deck = document.querySelector('[data-deck]')
  const front = deck?.querySelector('.deck__card')
  if (!panel || !deck || !front) return

  const total = String(letters.length).padStart(2, '0')
  let i = 0
  const span = Math.max(1, letters.length - 1)
  const cards = [front]

  /*
   * One card in the deck per letter, built once and held in place.
   * On prev/next, cards shuffle depth and animate according to action
   * direction rather than having their images rewritten in place.
   */
  for (let idx = 1; idx < letters.length; idx++) {
    const card = document.createElement('div')
    card.className = 'deck__card duo'
    const spanMedia = document.createElement('span')
    spanMedia.className = 'pxm deck__media'
    spanMedia.setAttribute('data-pxm', '')
    const img = document.createElement('img')
    img.alt = ''
    img.loading = 'lazy'
    const L = letters[idx]
    if (L?.shot) setImage(img, mediaSrc(L.shot))
    spanMedia.append(img)
    card.append(spanMedia)
    deck.append(card)
    cards.push(card)
  }

  // Apply stack depths (--k, --t, z-index, and front card class)
  const applyStackPositions = (activeIdx) => {
    cards.forEach((card, idx) => {
      const k = (idx - activeIdx + letters.length) % letters.length
      const t = (k / span).toFixed(4)
      card.style.setProperty('--k', String(k))
      card.style.setProperty('--t', t)
      card.style.zIndex = String(10 - k)
      card.classList.toggle('deck__card--front', k === 0)
    })
  }

  let animTimer = 0
  const animateStack = (prevIdx, nextIdx, step) => {
    clearTimeout(animTimer)
    cards.forEach((card) => {
      card.classList.remove('is-animating-next', 'is-animating-prev')
    })

    if (reducedMotion()) {
      applyStackPositions(nextIdx)
      return
    }

    const outgoing = cards[prevIdx]
    const incoming = cards[nextIdx]

    if (step > 0) {
      // NEXT: outgoing card peels out to left, dips behind deck to the deepest slot
      outgoing.style.setProperty('--k', String(span))
      outgoing.style.setProperty('--t', '1.0000')
      outgoing.classList.remove('deck__card--front')
      outgoing.classList.add('is-animating-next')

      // Other cards smoothly advance forward in the stack
      cards.forEach((card, idx) => {
        if (idx === prevIdx) return
        const k = (idx - nextIdx + letters.length) % letters.length
        const t = (k / span).toFixed(4)
        card.style.setProperty('--k', String(k))
        card.style.setProperty('--t', t)
        card.style.zIndex = String(10 - k)
        card.classList.toggle('deck__card--front', k === 0)
      })
    } else {
      // PREV: incoming card sweeps out from the back, rises to top, and snaps onto front
      incoming.style.setProperty('--k-prev', String(span))
      incoming.style.setProperty('--t-prev', '1.0000')
      incoming.style.setProperty('--k', '0')
      incoming.style.setProperty('--t', '0.0000')
      incoming.classList.add('deck__card--front')
      incoming.classList.add('is-animating-prev')

      // Other cards smoothly retreat backward in the stack
      cards.forEach((card, idx) => {
        if (idx === nextIdx) return
        const k = (idx - nextIdx + letters.length) % letters.length
        const t = (k / span).toFixed(4)
        card.style.setProperty('--k', String(k))
        card.style.setProperty('--t', t)
        card.style.zIndex = String(10 - k)
        card.classList.remove('deck__card--front')
      })
    }

    animTimer = setTimeout(() => {
      outgoing.classList.remove('is-animating-next')
      incoming.classList.remove('is-animating-prev')
      applyStackPositions(nextIdx)
    }, 550)
  }

  // an empty field is hidden rather than left as a gap in the byline
  const put = (el, value) => {
    if (!el) return
    el.textContent = value || ''
    el.hidden = !value
  }

  const LONG = 180

  const renderText = () => {
    const L = letters[i]
    panel.classList.toggle('quote--long', (L.text || '').length > LONG)
    if (text) text.textContent = L.text
    put(name, L.name)
    put(role, L.role)
    put(org, L.org)
    if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`
  }

  const go = (step) => {
    const prevIdx = i
    i = (i + step + letters.length) % letters.length
    const nextIdx = i
    swap(panel, renderText)
    animateStack(prevIdx, nextIdx, step)
  }

  prev?.addEventListener('click', () => go(-1))
  next?.addEventListener('click', () => go(1))

  applyStackPositions(0)
  renderText()
}

/* ── 11 · the chat ────────────────────────────────────────────── */
/**
 * A real exchange: the question you pick appears as your own bubble, the desk
 * types for 600ms, then answers. The typing indicator IS the swap rather than
 * decoration over it, so the pause reads as someone replying instead of as a
 * transition.
 */
export function initChat() {
  const list = document.querySelector('[data-chat-list]')
  const chat = document.querySelector('[data-chat]')
  if (!list || !chat) return

  const buttons = qq('.qlist__q', list)
  const ask = chat.querySelector('[data-chat-ask]')
  const answer = chat.querySelector('[data-chat-answer]')
  let timer = 0

  const select = (i, instant) => {
    buttons.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)))
    const q = buttons[i].textContent.replace(/^\s*\d+\s*/, '').trim()

    if (ask) ask.textContent = q
    if (instant || reducedMotion()) {
      if (answer) answer.textContent = buttons[i].dataset.a || ''
      chat.classList.remove('is-typing')
      return
    }

    chat.classList.add('is-typing')
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (answer) answer.textContent = buttons[i].dataset.a || ''
      chat.classList.remove('is-typing')
    }, 600)
  }

  buttons.forEach((b, i) => {
    b.addEventListener('click', () => select(i))
    // a list of questions is a list: up and down should walk it
    b.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
      if (!step) return
      e.preventDefault()
      const visible = buttons.filter((x) => x.offsetParent !== null)
      const at = visible.indexOf(b)
      const nextEl = visible[(at + step + visible.length) % visible.length]
      nextEl.focus()
      select(buttons.indexOf(nextEl))
    })
  })

  select(0, true)
}
