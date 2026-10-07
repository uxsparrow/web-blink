/**
 * 04 · THE FLOW — the fibre path.
 *
 * One story card travels the trunk as the section scrolls past. It is a
 * scrub, not a pin: the reader keeps the scroll, the card runs backwards when
 * they go back up, and nothing is held still underneath them.
 *
 * The three step cards and the five endpoints light from the same single
 * progress value, so they cannot drift out of sync with the card the way two
 * separate triggers would.
 */

import { onScrub, clamp, seg } from '../lib/motion.js'

export function mountFlow(root) {
  const svg = root.querySelector('[data-flow-svg]')
  const card = root.querySelector('[data-flow-card]')
  const lit = root.querySelector('[data-flow-lit]')
  const steps = [...root.querySelectorAll('[data-flow-step]')]
  const outs = [...root.querySelectorAll('[data-flow-out]')]
  if (!svg || !card || !lit) return null

  /*
   * The trunk runs x 400 → 800 in the viewBox. The card is positioned in
   * viewBox units rather than pixels, which is what keeps it on the line when
   * the SVG is stretched by `preserveAspectRatio: none` — a pixel position
   * would need re-measuring on every resize and would still lag a frame.
   */
  const X0 = 400
  const X1 = 800
  const LEN = X1 - X0

  lit.style.strokeDasharray = String(LEN)

  const draw = (p) => {
    // the card crosses the trunk over the middle 70% of the pass
    const t = seg(p, 0.15, 0.85)
    card.setAttribute('cx', String(X0 + LEN * t))
    lit.style.strokeDashoffset = String(LEN * (1 - t))

    // three steps, one per third of the journey
    const at = Math.min(2, Math.floor(t * 3 - 0.0001) < 0 ? 0 : Math.floor(t * 3))
    steps.forEach((s, i) => s.classList.toggle('is-on', i === at))

    // the endpoints light once the card has arrived, one after another
    outs.forEach((o, i) =>
      o.classList.toggle('is-on', t > 0.9 + i * 0.012 || (t >= 1 && true))
    )

    card.setAttribute('r', String(7 + 3 * Math.sin(t * Math.PI)))
    card.style.filter = `drop-shadow(0 0 ${6 + 10 * Math.sin(t * Math.PI)}px rgba(154,108,241,.9))`
  }

  onScrub(root.closest('.ed') || root, draw, {
    start: 'top 80%',
    end: 'bottom 60%',
    scrub: 0.5,
  })

  return { draw }
}

/**
 * 09 · THE RATE CARD — the back layer.
 *
 * Traffic climbs across the section while the price line stays flat. Both are
 * drawn by the scroll, which is the only reason the point lands: the reader
 * watches one rise while the other does not.
 */
export function mountRatesBg(svg) {
  const traffic = svg?.querySelector('[data-rates-traffic]')
  const flat = svg?.querySelector('[data-rates-flat]')
  if (!traffic || !flat) return null

  const setup = (path) => {
    const len = path.getTotalLength() || 1200
    path.style.strokeDasharray = String(len)
    return len
  }
  const lt = setup(traffic)
  const lf = setup(flat)

  const draw = (p) => {
    traffic.style.strokeDashoffset = String(lt * (1 - clamp(p * 1.3)))
    flat.style.strokeDashoffset = String(lf * (1 - clamp(p * 1.3)))
  }

  onScrub(svg.closest('.ed') || svg, draw, { start: 'top bottom', end: 'center center', scrub: 0.6 })
  return { draw }
}
