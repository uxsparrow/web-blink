/**
 * 05 · LIVE — the desk monitor.
 *
 * Three things on one panel: the concurrent-reader counter racing to 43,000,
 * auto-scaling nodes spawning as dots, and a latency sparkline. The first two
 * follow the scroll — scrub them and the reader is the one making the desk
 * scale, which is the point of the section — and the sparkline loops on its
 * own because latency does not care where anybody has scrolled to.
 */

import { onScrub, clamp, reducedMotion } from '../lib/motion.js'
import { fitCanvas, loop, token } from './dots.js'

const PEAK = 43000

export function mountLive(root) {
  const countEl = root.querySelector('[data-live-count]')
  const canvas = root.querySelector('[data-live-nodes]')
  const spark = root.querySelector('[data-live-spark]')

  /* ── the counter ───────────────────────────────────────────── */
  /*
   * This deliberately overrides the shared `[data-count-to]` plumbing for
   * this one figure: everywhere else a count-up fires once on entry, but here
   * the number IS the scroll position — the desk fills up as you arrive and
   * empties as you leave.
   */
  if (countEl) {
    const write = (n) => {
      countEl.textContent = Math.round(n).toLocaleString('en-IN')
    }
    write(PEAK)
    onScrub(
      root.closest('.ed') || root,
      (p) => write(PEAK * clamp(p * 1.6)),
      { start: 'top 85%', end: 'center center', scrub: 0.4 }
    )
  }

  /* ── the auto-scaling nodes ────────────────────────────────── */
  if (canvas) {
    const colour = token('--dot', 'rgba(185,166,255,.45)')
    const c = fitCanvas(canvas)
    let fill = 1

    // a fixed lattice, so nodes appear in a readable order rather than at random
    const nodes = []
    for (let i = 0; i < 72; i++) {
      nodes.push({
        gx: i % 12,
        gy: Math.floor(i / 12),
        // the order they spawn in: left to right, with a little scatter
        at: (i % 12) / 12 + Math.random() * 0.18,
        ph: Math.random() * Math.PI * 2,
      })
    }

    loop(canvas, (t) => {
      const { ctx, w, h } = c
      if (!w) return
      ctx.clearRect(0, 0, w, h)
      const cw = w / 12
      const ch = h / 6

      for (const n of nodes) {
        const on = fill > n.at
        const x = cw * (n.gx + 0.5)
        const y = ch * (n.gy + 0.5)
        if (!on) {
          ctx.fillStyle = 'rgba(255,255,255,.07)'
          ctx.beginPath()
          ctx.arc(x, y, 1.6, 0, Math.PI * 2)
          ctx.fill()
          continue
        }
        const pulse = 0.65 + 0.35 * Math.sin(t * 2 + n.ph)
        ctx.fillStyle = colour
        ctx.globalAlpha = 0.35 + 0.5 * pulse
        ctx.beginPath()
        ctx.arc(x, y, 2 + pulse * 1.1, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    })

    onScrub(
      root.closest('.ed') || root,
      (p) => {
        fill = clamp(p * 1.6)
      },
      { start: 'top 85%', end: 'center center', scrub: 0.4 }
    )
  }

  /* ── the latency sparkline ─────────────────────────────────── */
  if (spark) {
    const W = 400
    const H = 60
    const N = 56
    const series = Array.from({ length: N }, () => 0.5)

    const paint = () => {
      const d = series
        .map((v, i) => {
          const x = (i / (N - 1)) * W
          const y = H - 6 - v * (H - 14)
          return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
        })
        .join(' ')
      spark.setAttribute('d', d)
    }

    if (reducedMotion()) {
      series.forEach((_, i) => (series[i] = 0.42 + 0.08 * Math.sin(i / 4)))
      paint()
    } else {
      let last = 0
      loop(spark, (t) => {
        // one sample every ~90ms, not one per frame: a sparkline that
        // redraws at 60Hz reads as noise rather than as a trace
        if (t - last < 0.09) return
        last = t
        series.shift()
        series.push(0.38 + Math.random() * 0.2 + (Math.random() < 0.06 ? 0.22 : 0))
        paint()
      })
    }
  }

  return null
}
