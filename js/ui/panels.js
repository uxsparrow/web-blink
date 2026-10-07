/**
 * The four panels that swap their contents in place: the results-night
 * monitor in 02, the segment tabs in 07, the letters in 08 and the chat in 11.
 *
 * They all follow the same two rules, and both exist to protect the
 * fit-to-window system:
 *
 *   · Nothing here changes a section's height. The panels are sized by the
 *     flex layout and the contents cross-fade inside them, so choosing an
 *     answer or a segment moves nothing on screen. This is why none of them
 *     is an accordion.
 *   · Auto-advance only runs while the section is on screen, and stops for
 *     good the moment the reader touches it. A carousel that keeps moving
 *     under someone who has started reading is worse than no carousel.
 */

import { onInView, reducedMotion } from '../lib/motion.js'
import { setImage } from './edition.js'

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
 * Shared auto-advance. Ticks every `every` ms while the element is in view,
 * drives a 0→1 progress for the hairline, and gives up permanently as soon as
 * the reader interacts.
 */
function autoCycle(el, count, onStep, every = 6000) {
  if (!el || count < 2) return { stop() {}, touch() {} }

  let i = 0
  let live = false
  let stopped = reducedMotion()
  let t0 = performance.now()
  let raf = 0

  const tick = (now) => {
    if (stopped || !live) {
      raf = 0
      return
    }
    const p = (now - t0) / every
    el.style.setProperty('--t', Math.min(1, p).toFixed(3))
    if (p >= 1) {
      t0 = now
      i = (i + 1) % count
      onStep(i, true)
    }
    raf = requestAnimationFrame(tick)
  }

  const start = () => {
    if (raf || stopped) return
    t0 = performance.now()
    raf = requestAnimationFrame(tick)
  }

  onInView(el, (v) => {
    live = v
    if (v) start()
  }, '0%')

  return {
    stop() {
      stopped = true
      el.style.setProperty('--t', '0')
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
  const bar = monitor.querySelector('[data-monitor-time]')
  const scenes = qq('.monitor__scene', stage)

  const select = (i, fromTimer) => {
    buttons.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)))
    scenes.forEach((s, k) => s.classList.toggle('is-on', k === i))
    swap(cap, () => {
      if (cap) cap.textContent = buttons[i].dataset.cap || ''
    })
    if (!fromTimer) cycle.sync(i)
  }

  const cycle = autoCycle(bar || monitor, buttons.length, (i) => select(i, true))

  buttons.forEach((b, i) =>
    b.addEventListener('click', () => {
      cycle.stop()
      select(i)
    })
  )
  // pointing at the monitor is also "I am reading this"
  monitor.addEventListener('pointerenter', () => cycle.stop())

  select(0)
}

/* ── 07 · the segment tabs ────────────────────────────────────── */
export function initBeats() {
  const tabs = document.querySelector('[data-beats]')
  if (!tabs) return

  const buttons = qq('[data-beat]', tabs)
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
      if (name) name.textContent = b.dataset.name || ''
      metrics.replaceChildren(
        ...(data.length
          ? data.map(([fig, label]) => {
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
          : /*
             * Two of the five segments have no published numbers. They get a
             * visible marker rather than a plausible-looking figure — this
             * page does not invent metrics.
             */
            [
              (() => {
                const em = document.createElement('em')
                em.className = 'todo'
                em.style.gridColumn = '1 / -1'
                em.textContent = '[METRICS FROM CLIENT]'
                return em
              })(),
            ])
      )
      // the floating chips repeat the first two metrics
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
      swap(shotWrap, () => setImage(shot, b.dataset.shot))
    }

    if (!fromTimer) cycle.stop()
  }

  const cycle = autoCycle(tabs, buttons.length, (i) => select(i, true), 7000)
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
  const shot = document.querySelector('[data-quote-shot]')
  if (!panel) return

  const total = String(letters.length).padStart(2, '0')
  let i = 0

  const go = (step) => {
    i = (i + step + letters.length) % letters.length
    const L = letters[i]
    swap(panel, () => {
      if (text) text.textContent = L.text
      if (name) name.textContent = L.name
      if (role) role.textContent = L.role
      if (org) org.textContent = L.org
      if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`
      if (shot && L.shot) setImage(shot, L.shot)
    })
  }

  prev?.addEventListener('click', () => go(-1))
  next?.addEventListener('click', () => go(1))
}

/* ── 11 · the chat ────────────────────────────────────────────── */
/**
 * Picking a question shows the typing indicator, then the answer — the
 * indicator is the swap, not decoration on top of it, so the 300ms the panel
 * takes to change reads as the desk replying rather than as a transition.
 */
export function initChat() {
  const list = document.querySelector('[data-chat-list]')
  const chat = document.querySelector('[data-chat]')
  if (!list || !chat) return

  const buttons = qq('.qlist__q', list)
  const answer = chat.querySelector('[data-chat-answer]')

  const select = (i) => {
    buttons.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)))
    swap(chat, () => {
      if (answer) answer.textContent = buttons[i].dataset.a || ''
    })
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

  select(0)
}
