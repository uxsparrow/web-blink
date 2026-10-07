/**
 * 05 · LIVE — the desk monitor.
 *
 * Four things on one panel, all driven by the same scroll progress so they
 * cannot drift apart: the counter climbing to 43,000, an area chart of
 * readers over time, a dashed capacity line that steps up under it as the
 * load rises, and twelve servers lighting in turn.
 *
 * Reading the section IS the load coming in. That is why these are scrubbed
 * rather than looped — the reader scrolls and the desk fills up; they scroll
 * back and it empties.
 */

import { onScrub, clamp } from '../lib/motion.js'

const PEAK = 43000
const W = 420
const H = 150
const N = 48
const RACKS = 12

/** The load curve: a slow start, a steep results-night climb, then a plateau. */
const load = (t) => {
  if (t < 0.45) return 0.16 + 0.5 * t
  if (t < 0.78) return 0.385 + 1.55 * (t - 0.45)
  return 0.9 + 0.08 * (t - 0.78)
}

export function mountLive(root) {
  const countEl = root.querySelector('[data-live-count]')
  const area = root.querySelector('[data-live-area]')
  const line = root.querySelector('[data-live-line]')
  const cap = root.querySelector('[data-live-cap]')
  const rack = root.querySelector('[data-live-rack]')

  /* twelve server blocks, built here so the markup stays a single element */
  const blocks = []
  if (rack) {
    for (let i = 0; i < RACKS; i++) {
      const b = document.createElement('i')
      rack.appendChild(b)
      blocks.push(b)
    }
  }

  const px = (i) => (i / (N - 1)) * W
  const py = (v) => H - 6 - v * (H - 22)

  const draw = (p) => {
    // how much of the series has arrived
    const shown = clamp(p * 1.25)
    const peak = load(shown)

    if (countEl) countEl.textContent = Math.round(PEAK * peak).toLocaleString('en-IN')

    /* the readers curve, drawn only as far as the scroll has brought it */
    const pts = []
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      if (t > shown) break
      // a little jitter so it reads as measured rather than plotted
      const v = load(t) * (0.97 + 0.03 * Math.sin(i * 1.7))
      pts.push([px(i), py(v)])
    }
    if (pts.length > 1) {
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
      line?.setAttribute('d', d)
      area?.setAttribute('d', `${d} L${pts[pts.length - 1][0].toFixed(1)} ${H} L0 ${H} Z`)
    } else {
      line?.setAttribute('d', '')
      area?.setAttribute('d', '')
    }

    /*
     * Capacity, as a staircase above the load. This is the auto-scaling: it
     * does not rise smoothly with demand, it jumps a step ahead of it and
     * waits there, which is what the section is claiming.
     */
    if (cap) {
      const steps = []
      let last = -1
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1)
        const want = Math.min(1, Math.ceil((load(Math.min(t, shown)) + 0.1) * 4) / 4)
        if (want !== last) {
          if (last >= 0) steps.push(`L${px(i).toFixed(1)} ${py(last).toFixed(1)}`)
          steps.push(`${steps.length ? 'L' : 'M'}${px(i).toFixed(1)} ${py(want).toFixed(1)}`)
          last = want
        }
      }
      steps.push(`L${W} ${py(last).toFixed(1)}`)
      cap.setAttribute('d', steps.join(' '))
    }

    // one server per 1/12 of the load
    blocks.forEach((b, i) => b.classList.toggle('is-on', peak > (i + 0.5) / RACKS))
  }

  draw(1)
  onScrub(root.closest('.ed') || root, draw, {
    start: 'top 90%',
    end: 'center center',
    scrub: 0.4,
  })

  return { draw }
}
