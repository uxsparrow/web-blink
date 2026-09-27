import { clamp, easeInOut } from '../lib/motion.js'
import { mountScene } from '../lib/canvas-scene.js'

/**
 * 07 · LETTERS — the signal coming back.
 *
 * What used to fly across this section was a giant paper plane folded from a
 * front page, masthead still printed on the wing. The section is the letters
 * page — what readers send back — and the results pinned up on it are traffic,
 * load time and search discovery. So the thing crossing it is now the return
 * signal: a trace that rises as the section scrolls, with the response marks
 * lighting as it passes them.
 *
 * It stays deliberately faint and carries **no axis, scale or number**. The
 * numbers in this section are the supplied case-study results in the DOM; this
 * is texture behind them, and it must never read as a chart of its own.
 */

const VIOLET = '#6118EA'
const LILAC = '#b9a4ff'

/** The shape of the rise, in fractions of the canvas. */
const SHAPE = [
  [0.02, 0.86],
  [0.2, 0.78],
  [0.36, 0.6],
  [0.52, 0.64],
  [0.68, 0.4],
  [0.84, 0.3],
  [0.99, 0.16],
]

/** Catmull-rom through the shape, so the rise is a curve and not a zig-zag. */
function pointAt(u, w, h) {
  const n = SHAPE.length - 1
  const f = clamp(u) * n
  const i = Math.min(n - 1, Math.floor(f))
  const t = f - i
  const p0 = SHAPE[Math.max(0, i - 1)]
  const p1 = SHAPE[i]
  const p2 = SHAPE[i + 1]
  const p3 = SHAPE[Math.min(n, i + 2)]
  const t2 = t * t
  const t3 = t2 * t
  const x =
    0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
  const y =
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
  return [x * w, y * h]
}

function trace(ctx, w, h, from, to) {
  ctx.beginPath()
  const steps = 90
  for (let s = 0; s <= steps; s++) {
    const u = from + ((to - from) * s) / steps
    const [x, y] = pointAt(u, w, h)
    if (s === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

function drawSignal(ctx, w, h, p, time) {
  const t = easeInOut(clamp(p))
  const [hx, hy] = pointAt(t, w, h)

  /*
   * The wash goes down first so its trailing edge can be feathered away with
   * `destination-out` before anything else is on the canvas. Closing the fill
   * straight down to the baseline left a hard vertical edge under the head,
   * which read as a chart's cursor rather than as a signal still arriving.
   */
  if (t > 0.004) {
    ctx.save()
    trace(ctx, w, h, 0, t)
    ctx.lineTo(hx, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    const fill = ctx.createLinearGradient(0, h * 0.14, 0, h)
    fill.addColorStop(0, 'rgba(97,24,234,.07)')
    fill.addColorStop(1, 'rgba(97,24,234,0)')
    ctx.fillStyle = fill
    ctx.fill()

    const feather = ctx.createLinearGradient(Math.max(0, hx - 120), 0, hx, 0)
    feather.addColorStop(0, 'rgba(0,0,0,0)')
    feather.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = feather
    ctx.fillRect(Math.max(0, hx - 120), 0, Math.min(hx, 120) + 2, h)
    ctx.restore()
  }

  /* the whole run of it, barely there */
  ctx.strokeStyle = 'rgba(17,17,17,.07)'
  ctx.lineWidth = 1.5
  trace(ctx, w, h, 0, 1)
  ctx.stroke()

  if (t <= 0.004) return

  /* what has come in so far */
  const grad = ctx.createLinearGradient(0, h, w, 0)
  grad.addColorStop(0, 'rgba(97,24,234,.16)')
  grad.addColorStop(0.6, 'rgba(97,24,234,.4)')
  grad.addColorStop(1, 'rgba(185,164,255,.6)')

  ctx.strokeStyle = grad
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  trace(ctx, w, h, 0, t)
  ctx.stroke()

  /* the responses it has passed */
  for (let i = 1; i < SHAPE.length - 1; i++) {
    const u = i / (SHAPE.length - 1)
    const [mx, my] = pointAt(u, w, h)
    const lit = clamp((t - u) * 6)
    if (lit <= 0) continue
    ctx.fillStyle = `rgba(97,24,234,${0.1 * lit})`
    ctx.beginPath()
    ctx.arc(mx, my, 13 * lit, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(97,24,234,${0.55 * lit})`
    ctx.beginPath()
    ctx.arc(mx, my, 3.4, 0, Math.PI * 2)
    ctx.fill()
  }

  /* the head, where the signal is now */
  const pulse = 0.75 + 0.25 * Math.abs(Math.sin(time * 2))
  ctx.fillStyle = `rgba(97,24,234,${0.13 * pulse})`
  ctx.beginPath()
  ctx.arc(hx, hy, 26 * pulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = LILAC
  ctx.beginPath()
  ctx.arc(hx, hy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = VIOLET
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(hx, hy, 10, 0, Math.PI * 2)
  ctx.stroke()
}

/** 07 · LETTERS — the return signal rising behind the results. */
export function mountReaderSignal(canvas) {
  return mountScene(canvas, drawSignal)
}
