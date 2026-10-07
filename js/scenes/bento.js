/**
 * 03 · THE PLATFORM — the bento tiles.
 *
 * Two jobs, and the second is the important one.
 *
 * The tilt: each tile leans up to 4° toward the cursor with a sheen that
 * follows it. Pointer-fine only, because a tilt that fires on a tap is just a
 * flicker.
 *
 * The gating: the tiles' micro-UIs are CSS loops that stay paused until
 * `.is-live` is added, and that only happens while the grid is on screen.
 * Nothing on this page animates where it cannot be seen — six looping SVGs
 * behind eleven sections is how a phone loses 60fps.
 *
 * Two of the six need a value rather than a shape, so they get a timer here
 * instead of a keyframe: the Edition's web/app/AMP label and the Subscriber's
 * counter. Both are stopped with the rest when the section leaves.
 */

import { onInView, reducedMotion } from '../lib/motion.js'

const MODES = ['WEB', 'APP', 'AMP']

export function mountBento(root) {
  const tiles = [...root.querySelectorAll('.tile')]
  if (!tiles.length) return null

  /* ── the tilt ──────────────────────────────────────────────── */
  if (!reducedMotion() && window.matchMedia('(pointer: fine)').matches) {
    tiles.forEach((tile) => {
      tile.addEventListener('pointermove', (e) => {
        const r = tile.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        tile.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
        tile.style.setProperty('--my', (py * 100).toFixed(1) + '%')
        // 4° each way, which is the brief's cap and about the point where a
        // tilt stops reading as depth and starts reading as a wobble
        tile.style.transform =
          `perspective(900px) rotateY(${((px - 0.5) * 8).toFixed(2)}deg)` +
          ` rotateX(${((0.5 - py) * 8).toFixed(2)}deg)`
      })
      tile.addEventListener('pointerleave', () => {
        tile.style.transform = ''
      })
    })
  }

  /* ── the gate, and the two timed labels ────────────────────── */
  const mode = root.querySelector('[data-tile-mode]')
  const subs = root.querySelector('[data-tile-subs]')
  let timer = 0
  let n = 0
  let step = 0

  const tick = () => {
    step++
    if (mode) mode.textContent = MODES[step % MODES.length]
    if (subs) {
      n = (n + 1 + Math.floor(Math.random() * 3)) % 1000
      subs.textContent = n.toLocaleString('en-IN')
    }
  }

  if (reducedMotion()) {
    tiles.forEach((t) => t.classList.add('is-live'))
    if (subs) subs.textContent = '248'
    return null
  }

  onInView(
    root,
    (inView) => {
      tiles.forEach((t) => t.classList.toggle('is-live', inView))
      clearInterval(timer)
      if (inView) timer = setInterval(tick, 1400)
    },
    '10%'
  )

  return null
}
