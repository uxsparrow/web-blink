/**
 * 04 · THE FLOW — the node diagram.
 *
 * One story packet runs source → 01 → 02 → 03 → every output, on a six-second
 * loop while the section is in view, and the panel under the diagram follows
 * whichever stage is lit. Clicking or tabbing to a node takes the loop over.
 *
 * The geometry lives entirely in the SVG's viewBox, so there is nothing to
 * measure here and nothing to re-measure on resize. The previous version
 * positioned HTML chips beside an SVG and drew curves to where it thought
 * they were; at any width it had not been tuned for, the curves started in
 * empty space. Coordinates below are viewBox units and match the markup.
 */

import { onInView, reducedMotion, clamp, onScrub } from '../lib/motion.js'

/* the three stages. The copy is shared; the coordinates are read off
   whichever diagram is in the DOM. */
const STAGES = [
  { name: '01 — GATHER', copy: 'Trends, agency feeds, reporters and stringers in one queue.' },
  { name: '02 — CREATE', copy: 'Write, AI-assist, tag and approve in one editor.' },
  { name: '03 — PUBLISH & GROW', copy: 'Publish everywhere, monetize, then measure it.' },
]
const LOOP_MS = 6000

export function mountFlow(root) {
  const read = root.querySelector('[data-flow-read]')
  const name = root.querySelector('[data-flow-name]')
  const copy = root.querySelector('[data-flow-copy]')

  /*
   * There are two diagrams — a wide one and a stood-up one for phones — and
   * CSS shows whichever fits. They are not two states of one SVG because an
   * SVG cannot reflow; scaling the wide one into a 390px column put its
   * labels at 4.7px. One driver runs both: the hidden one costs nothing to
   * keep in step, and there is no "which is visible" to get wrong on resize.
   */
  const views = [...root.querySelectorAll('[data-flow-svg]')]
    .map((svg) => {
      const packet = svg.querySelector('[data-flow-packet]')
      const lit = svg.querySelector('[data-flow-lit]')
      const nodes = [...svg.querySelectorAll('[data-flow-node]')]
      if (!packet || !lit || nodes.length !== 3) return null

      // the track runs along x in the wide diagram and along y in the tall one
      const vertical = svg.classList.contains('flow__svg--v')
      const from = Number(nodes[0].querySelector('circle').getAttribute(vertical ? 'cy' : 'cx'))
      const to = Number(nodes[2].querySelector('circle').getAttribute(vertical ? 'cy' : 'cx'))
      lit.style.strokeDasharray = String(Math.abs(to - from))

      return {
        packet,
        lit,
        nodes,
        vertical,
        from,
        to,
        len: Math.abs(to - from),
        ins: [...svg.querySelectorAll('[data-flow-in]')],
        outs: [...svg.querySelectorAll('[data-flow-out]')],
      }
    })
    .filter(Boolean)

  if (!views.length) return null
  const nodes = views.flatMap((v) => v.nodes)

  let active = -1
  let taken = false

  const show = (i) => {
    if (i === active) return
    active = i
    // the same stage index in every view
    views.forEach((v) => v.nodes.forEach((n, k) => n.classList.toggle('is-on', k === i)))
    if (!read) return
    if (reducedMotion()) {
      if (name) name.textContent = STAGES[i].name
      if (copy) copy.textContent = STAGES[i].copy
      return
    }
    read.classList.add('is-swapping')
    clearTimeout(read._t)
    read._t = setTimeout(() => {
      if (name) name.textContent = STAGES[i].name
      if (copy) copy.textContent = STAGES[i].copy
      read.classList.remove('is-swapping')
    }, 160)
  }

  /**
   * One pass of the loop, p from 0 to 1:
   *   0.00–0.18  the sources light and the packet waits at 01
   *   0.18–0.68  it crosses the track, lighting 02 then 03 as it passes
   *   0.68–1.00  the outputs light in turn
   */
  const draw = (p) => {
    const run = clamp((p - 0.18) / 0.5)

    views.forEach((v) => {
      const at = v.from + (v.to - v.from) * run
      v.packet.setAttribute(v.vertical ? 'cy' : 'cx', String(at))
      v.lit.style.strokeDashoffset = String(v.len * (1 - run))
      v.packet.setAttribute('r', String(8 + 2.5 * Math.sin(run * Math.PI)))
      v.ins.forEach((el, i) => el.classList.toggle('is-on', p > 0.02 + i * 0.03))
      v.outs.forEach((el, i) => el.classList.toggle('is-on', p > 0.7 + i * 0.05))
    })

    if (!taken) {
      // the node the packet has reached
      show(run >= 1 ? 2 : run >= 0.5 ? 1 : 0)
    }
  }

  /* ── the loop, only while on screen ────────────────────────── */
  if (reducedMotion()) {
    draw(1)
    show(0)
  } else {
    let live = false
    let raf = 0
    let t0 = performance.now()

    const tick = (now) => {
      if (!live) {
        raf = 0
        return
      }
      draw(((now - t0) % LOOP_MS) / LOOP_MS)
      raf = requestAnimationFrame(tick)
    }

    onInView(
      root,
      (v) => {
        live = v
        if (v && !raf) {
          t0 = performance.now()
          raf = requestAnimationFrame(tick)
        }
      },
      '10%'
    )
    show(0)
  }

  /* ── taking it over ────────────────────────────────────────── */
  nodes.forEach((n) => {
    // the same stage appears once per view, so the index is within its own
    const i = [...n.parentNode.querySelectorAll("[data-flow-node]")].indexOf(n)
    const pick = () => {
      taken = true
      show(i)
    }
    n.addEventListener('click', pick)
    n.addEventListener('focus', pick)
    n.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        pick()
      }
    })
  })

  return { draw }
}

/**
 * 09 · THE RATE CARD — the back layer.
 *
 * Traffic climbs across the section while the price line stays flat. Both are
 * drawn by the scroll, which is the only reason the point lands: the reader
 * watches one rise while the other does not. The layer is masked and sits
 * behind the headline, never across the cards.
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

  onScrub(svg.closest('.ed') || svg, draw, {
    start: 'top bottom',
    end: 'center center',
    scrub: 0.6,
  })
  return { draw }
}
