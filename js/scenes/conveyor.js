import { clamp, easeOut, seg } from '../lib/motion.js'
import { mountScene } from '../lib/canvas-scene.js'

/**
 * 04 · OUR PLATFORM — the delivery line.
 *
 * One line runs the width of the section. Stories ride it left → right as
 * payloads of different sizes, and at a junction two thirds along, four taps
 * branch off and carry them away to the right, where the section's own label
 * names them: WEB · AMP · PWA · APP. That is the whole claim of the section —
 * everything the newsroom publishes goes down one line and comes out on every
 * channel.
 *
 * This replaced a belt carrying a parade of identical devices. Screens riding a
 * conveyor is a factory metaphor in digital dress: it said nothing about a
 * platform, and the row of pulsing dots under it answered to nothing at all.
 *
 * At the end the line tilts to top-down and widens into the ink strip that
 * carries into 05 · LIVE — that hand-off is why the tilt exists, so keep it.
 */

const INK = '#111111'
const VIOLET = '#6118EA'
const LILAC = '#b9a4ff'
const RED = '#E10600'

/** Where the four channels branch off, as a fraction of the width. */
const JUNCTION = 0.6

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The stories on the line. Deliberately uneven — a newsroom's output is a
 * mixed feed, and the old scene's identical repeats were most of why it read
 * as a factory belt.
 */
function buildPayloads(count) {
  const rnd = mulberry32(51224)
  let x = 0
  return Array.from({ length: count }, () => {
    const w = 54 + Math.round(rnd() * 86)
    const spec = {
      x,
      w,
      h: 30 + Math.round(rnd() * 16),
      lines: 1 + Math.floor(rnd() * 3),
      breaking: rnd() > 0.76,
      thumb: rnd() > 0.45,
    }
    x += w + 60 + Math.round(rnd() * 120) // uneven gaps
    return spec
  })
}

/** One story riding the line. */
function drawPayload(ctx, x, baseY, spec, k) {
  const w = spec.w * k
  const h = spec.h * k
  const y = baseY - h
  const pad = 5 * k

  ctx.fillStyle = 'rgba(17,17,17,.9)'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = 'rgba(185,164,255,.45)'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)

  let tx = x + pad
  let tw = w - pad * 2
  if (spec.thumb) {
    const tW = w * 0.28
    ctx.fillStyle = spec.breaking ? RED : VIOLET
    ctx.fillRect(x + pad, y + pad, tW, h - pad * 2)
    tx += tW + pad
    tw -= tW + pad
  }

  // kicker, headline, a line or two of body
  ctx.fillStyle = spec.breaking ? RED : LILAC
  ctx.fillRect(tx, y + pad, tw * 0.44, Math.max(1.5, 2 * k))
  ctx.fillStyle = 'rgba(255,255,255,.92)'
  ctx.fillRect(tx, y + pad + 5 * k, tw, Math.max(2, 3.5 * k))
  ctx.fillStyle = 'rgba(185,164,255,.4)'
  for (let i = 0; i < spec.lines; i++) {
    ctx.fillRect(tx, y + pad + 12 * k + i * 5 * k, tw * (i % 2 ? 0.55 : 0.85), Math.max(1, 1.8 * k))
  }
}

/** A tap: the curve a channel takes away from the junction. */
function tapPoint(u, jx, jy, ex, ey) {
  const cx = jx + (ex - jx) * 0.42
  const cy = jy
  const v = 1 - u
  return [v * v * jx + 2 * v * u * cx + u * u * ex, v * v * jy + 2 * v * u * cy + u * u * ey]
}

function drawDeliveryLine(ctx, w, h, p, time, payloads) {
  const tilt = seg(p, 0.82, 1) // camera tilts to top-down at the end

  /*
   * The line has to clear the card grid, which is DOM sitting over this canvas
   * and is opaque. One-up at desktop widths the cards end around 0.63h and the
   * line has the lower third to itself; two-up on a phone they run to about
   * 0.89h, and at 0.78 the whole scene was drawn behind them — invisible, as
   * the old belt also was. Narrow screens get the line lower and lose the
   * channel fan, which has no room to read there.
   */
  const narrow = w < 700
  const laneY = h * ((narrow ? 0.925 : 0.78) - tilt * 0.06)
  const laneH = 46 + tilt * (Math.min(w * 0.12, 180) - 46)
  const fade = 1 - tilt
  const k = clamp(w / 1500, 0.62, 1)

  // the line keeps running while the section is still, or it reads as a
  // diagram rather than something live
  const travel = p * w * 2.2 + time * 16

  /* the floor under the line */
  ctx.fillStyle = 'rgba(17,17,17,.05)'
  ctx.fillRect(0, laneY + laneH, w, 26 * fade)

  /* ── the four taps, and what they are carrying ───────────────── */
  const jx = w * JUNCTION
  const jy = laneY + laneH
  if (fade > 0.01 && !narrow) {
    ctx.save()
    ctx.globalAlpha = fade
    for (let i = 0; i < 4; i++) {
      const ey = jy + (30 + i * 38) * k
      const ex = w + 20

      ctx.strokeStyle = 'rgba(97,24,234,.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(jx, jy)
      for (let u = 0.05; u <= 1.0001; u += 0.05) {
        const [px, py] = tapPoint(u, jx, jy, ex, ey)
        ctx.lineTo(px, py)
      }
      ctx.stroke()

      // deliveries running down the tap, staggered per channel
      for (let d = 0; d < 3; d++) {
        const u = (time * 0.26 + i * 0.17 + d * 0.33) % 1
        const [px, py] = tapPoint(u, jx, jy, ex, ey)
        if (px > w) continue
        const r = 4.5 * k
        ctx.fillStyle = `rgba(97,24,234,.22)`
        ctx.beginPath()
        ctx.arc(px, py, r * 2.1, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(214,201,255,${0.95 - u * 0.35})`
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  /* ── the line itself — becomes the ink strip as the camera tilts ── */
  ctx.fillStyle = INK
  ctx.fillRect(0, laneY, w, laneH)

  /* the run of it */
  const gap = 46
  const offset = travel % gap
  ctx.fillStyle = 'rgba(255,255,255,.22)'
  for (let x = -gap; x < w + gap; x += gap) {
    const tx = x - offset
    if (tilt < 0.5) ctx.fillRect(tx, laneY + laneH / 2 - 1, 18, 2)
    else ctx.fillRect(tx, laneY + laneH * 0.5 - 1.5, 26, 3)
  }

  /* the junction the channels branch from */
  if (fade > 0.01 && !narrow) {
    ctx.save()
    ctx.globalAlpha = fade
    ctx.fillStyle = 'rgba(97,24,234,.16)'
    ctx.beginPath()
    ctx.arc(jx, jy, 22 * k, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = VIOLET
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(jx, jy, 11 * k, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = `rgba(97,24,234,${0.6 + 0.4 * Math.abs(Math.sin(time * 1.6))})`
    ctx.beginPath()
    ctx.arc(jx, jy, 5.5 * k, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  /* ── the stories riding it ───────────────────────────────────── */
  if (fade > 0.01) {
    const period = payloads[payloads.length - 1].x + payloads[payloads.length - 1].w + 120
    const span = period * k
    const rise = easeOut(clamp((p - 0.06) * 3)) * 6
    ctx.save()
    ctx.globalAlpha = fade
    for (const spec of payloads) {
      // two copies, so the run is continuous across the seam
      const base = spec.x * k - (travel % span)
      for (const x of [base, base + span]) {
        if (x > w + 40 || x + spec.w * k < -40) continue
        drawPayload(ctx, x, laneY - rise, spec, k)
      }
    }
    ctx.restore()
  }
}

/** 04 · OUR PLATFORM — one line in, every channel out. */
export function mountConveyor(canvas) {
  const payloads = buildPayloads(9)
  return mountScene(canvas, (ctx, w, h, p, t) => drawDeliveryLine(ctx, w, h, p, t, payloads))
}
