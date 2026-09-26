/**
 * 04 · OUR PLATFORM — the delivery rail, side view.
 *
 * The line still runs left → right with scroll, but screens ride it instead of
 * newspapers: a phone, a laptop, a tablet and an e-paper reader, each waking
 * with the same story the Desk wrote as it travels. At the end the camera tilts
 * to top-down and the rail becomes the ink strip that carries into LIVE.
 *
 * Blink is a digital platform, so there is no paper on the line. The palette,
 * the article renderer and the violet publish route are the Desk's (03), so the
 * two scenes read as one system.
 */

import { clamp, easeOut, seg } from '../lib/motion.js'
import { displayFamily, monoFamily } from '../lib/fonts.js'
import { mountScene } from '../lib/canvas-scene.js'

const INK = '#111111'
const VIOLET = '#6118EA'
const RED = '#E10600'
const SHELL = '#16121f'
const SCREEN = '#0a0812'

/** The Desk's headline — the same story, still running downstream. */
const HEADLINE = ['EVERY STAGE', 'OF THE', 'STORY']

/** The channels THE EDITION card names; these stand where the CMYK marks did. */
const CHANNELS = ['WEB', 'AMP', 'PWA', 'APP']

/*
 * What rides the rail, in repeat order. `w` is the shell width; nothing ends up
 * taller than the 168px the folded papers occupied, so the platform cards above
 * keep the clearance they were laid out with.
 */
const RIDERS = [
  { kind: 'phone', w: 90 },
  { kind: 'laptop', w: 208 },
  { kind: 'tablet', w: 126 },
  { kind: 'reader', w: 196 },
]

const SPACING = 320

/* ── helpers ──────────────────────────────────────────────────── */

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  ctx.lineTo(x + rr, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
  ctx.lineTo(x, y + rr)
  ctx.quadraticCurveTo(x, y, x + rr, y)
  ctx.closePath()
}

/**
 * The screen's own light pooling on the rail under it. A dark contact shadow
 * would be invisible here — the rail it stands on is already ink.
 */
function contact(ctx, cx, y, w, lit) {
  ctx.save()
  ctx.fillStyle = `rgba(185,164,255,${0.06 + lit * 0.12})`
  ctx.beginPath()
  ctx.ellipse(cx, y + 3, w * 0.5, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * The story itself, drawn at whatever size the surface needs — every screen on
 * the rail renders this, so it is literally the same article at every size.
 */
function drawArticle(ctx, x, y, w, h) {
  const pad = w * 0.08

  // kicker
  ctx.fillStyle = RED
  ctx.fillRect(x + pad, y + pad, w * 0.2, Math.max(2, h * 0.016))

  // dateline, only where there is room for it to read
  if (w >= 150) {
    ctx.fillStyle = 'rgba(255,255,255,.34)'
    ctx.font = `400 ${Math.max(6, w * 0.032)}px ${monoFamily()}`
    ctx.fillText('NOIDA — 14:32 IST', x + pad + w * 0.24, y + pad + Math.max(2, h * 0.016))
  }

  // headline
  const fs = w * 0.105
  ctx.font = `700 ${fs}px ${displayFamily()}`
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < HEADLINE.length; i++) {
    ctx.fillText(HEADLINE[i], x + pad, y + pad + fs * 1.6 + i * fs * 1.04)
  }

  // body rules under the headline
  ctx.fillStyle = 'rgba(255,255,255,.2)'
  const bodyTop = y + pad + fs * 1.6 + HEADLINE.length * fs * 1.04 + h * 0.04
  const rule = Math.max(1.5, h * 0.012)
  for (let i = 0; i < 6; i++) {
    const ry = bodyTop + i * rule * 2.6
    if (ry > y + h - pad) break
    ctx.fillRect(x + pad, ry, (w - pad * 2) * (i % 3 === 2 ? 0.58 : 0.92), rule)
  }
}

/**
 * A screen: shell, bezel, the article inside, and a lilac rim while it is still
 * coming on. Every rider is drawn with this.
 */
function drawScreen(ctx, x, y, w, h, { radius = 12, bezel = 8, lit = 1 }) {
  ctx.fillStyle = SHELL
  roundRect(ctx, x, y, w, h, radius)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.08)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.save()
  roundRect(ctx, x + bezel, y + bezel, w - bezel * 2, h - bezel * 2, radius * 0.5)
  ctx.clip()
  ctx.fillStyle = SCREEN
  ctx.fillRect(x + bezel, y + bezel, w - bezel * 2, h - bezel * 2)
  if (lit > 0.01) {
    ctx.globalAlpha *= lit
    drawArticle(ctx, x + bezel, y + bezel, w - bezel * 2, h - bezel * 2)
  }
  ctx.restore()

  // the rim while the screen wakes
  if (lit > 0.01 && lit < 1) {
    ctx.strokeStyle = `rgba(185,164,255,${(1 - lit) * 0.8})`
    ctx.lineWidth = 2
    roundRect(ctx, x, y, w, h, radius)
    ctx.stroke()
  }
}

/** One rider on the rail, standing on `baseY`. */
function drawRider(ctx, kind, cx, baseY, w, lit) {
  if (kind === 'laptop') {
    const screenH = w * 0.63
    const baseH = Math.max(7, w * 0.033)
    const bottom = baseY - baseH
    contact(ctx, cx, baseY, w * 1.15, lit)
    // base wedge
    ctx.fillStyle = '#1b1723'
    ctx.beginPath()
    ctx.moveTo(cx - w * 0.62, baseY)
    ctx.lineTo(cx + w * 0.62, baseY)
    ctx.lineTo(cx + w * 0.52, bottom)
    ctx.lineTo(cx - w * 0.52, bottom)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.08)'
    ctx.fillRect(cx - w * 0.16, bottom + baseH * 0.35, w * 0.32, Math.max(1.5, baseH * 0.2))
    drawScreen(ctx, cx - w / 2, bottom - screenH, w, screenH, {
      radius: Math.max(3, w * 0.03),
      bezel: Math.max(5, w * 0.028),
      lit,
    })
    return
  }

  if (kind === 'reader') {
    // the e-paper reader, landscape on a short stand
    const h = w * 0.72
    const standH = Math.max(6, w * 0.035)
    const bottom = baseY - standH
    contact(ctx, cx, baseY, w * 0.95, lit)
    ctx.fillStyle = '#1b1723'
    roundRect(ctx, cx - w * 0.2, bottom - 2, w * 0.4, standH + 2, 2)
    ctx.fill()
    drawScreen(ctx, cx - w / 2, bottom - h, w, h, {
      radius: Math.max(4, w * 0.035),
      bezel: Math.max(6, w * 0.042),
      lit,
    })
    return
  }

  const form = kind === 'phone' ? { ratio: 1.85, bezel: 0.06 } : { ratio: 1.33, bezel: 0.062 }
  const h = w * form.ratio
  contact(ctx, cx, baseY, w * 1.05, lit)
  drawScreen(ctx, cx - w / 2, baseY - h, w, h, {
    radius: Math.max(5, w * 0.13),
    bezel: Math.max(4, w * form.bezel),
    lit,
  })
  // speaker slot / camera, so the two portrait forms read apart
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  if (kind === 'phone') {
    roundRect(ctx, cx - w * 0.14, baseY - h + Math.max(2, w * 0.03), w * 0.28, Math.max(1.5, w * 0.03), 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(cx, baseY - h + Math.max(4, w * 0.04), Math.max(1.2, w * 0.016), 0, Math.PI * 2)
    ctx.fill()
  }
}

/* ── the whole scene ──────────────────────────────────────────── */

function drawConveyor(ctx, w, h, p, time) {
  const tilt = seg(p, 0.82, 1) // camera tilts to top-down at the end
  const railY = h * (0.78 - tilt * 0.06)
  const railH = 46 + tilt * (Math.min(w * 0.12, 180) - 46)
  const travel = p * w * 2.6

  // the rail is full-bleed, so the riders scale off the canvas width rather
  // than off a fitted virtual stage, which would letterbox the line's ends
  const k = clamp(w / 1500, 0.58, 1)
  const spacing = SPACING * k

  /* rail shadow on the floor */
  ctx.fillStyle = 'rgba(17,17,17,.05)'
  ctx.fillRect(0, railY + railH, w, 26 * (1 - tilt))

  /*
   * Where each rider is, so the nodes below can answer to them. The wrap has to
   * land on a whole number of slots — and on a whole number of rider cycles —
   * or a screen coming back round the left lands between two slots and sits on
   * top of its neighbour.
   */
  const slots = Math.ceil(Math.ceil((w + spacing * 2) / spacing) / RIDERS.length) * RIDERS.length
  const period = slots * spacing
  const wrap = (v) => ((v % period) + period) % period
  const riders = []
  for (let i = 0; i < slots; i++) {
    const x = wrap(i * spacing + travel) - spacing
    if (x < -spacing || x > w + spacing) continue
    riders.push({ x, i, spec: RIDERS[i % RIDERS.length] })
  }

  /* delivery nodes under the rail, pulsing as a screen passes over */
  const nodeCount = Math.ceil(w / 150) + 2
  ctx.globalAlpha = 1 - tilt
  for (let i = 0; i < nodeCount; i++) {
    const nx = i * 150 + 60
    const ny = railY + railH + 20
    let near = Infinity
    for (const r of riders) near = Math.min(near, Math.abs(r.x - nx))
    const pulse = clamp(1 - near / 110)

    // the feed down from the rail
    ctx.strokeStyle = `rgba(97,24,234,${0.12 + pulse * 0.45})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(nx, railY + railH)
    ctx.lineTo(nx, ny - 13)
    ctx.stroke()

    // the node itself
    ctx.strokeStyle = pulse > 0.02 ? `rgba(97,24,234,${0.3 + pulse * 0.6})` : 'rgba(17,17,17,.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(nx, ny, 13, 0, Math.PI * 2)
    ctx.stroke()
    if (pulse > 0.02) {
      ctx.fillStyle = `rgba(97,24,234,${pulse * 0.8})`
      ctx.beginPath()
      ctx.arc(nx, ny, 4 + pulse * 3, 0, Math.PI * 2)
      ctx.fill()
      // the delivery ring leaving the node
      ctx.strokeStyle = `rgba(185,164,255,${pulse * 0.4})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(nx, ny, 13 + (1 - pulse) * 18, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1

  /* the rail itself — becomes the ink strip as the camera tilts */
  ctx.fillStyle = INK
  ctx.fillRect(0, railY, w, railH)

  /* packets running along it */
  const gap = 46
  const offset = travel % gap
  ctx.fillStyle = 'rgba(255,255,255,.22)'
  for (let x = -gap; x < w + gap; x += gap) {
    const tx = x - offset
    if (tilt < 0.5) ctx.fillRect(tx, railY + railH / 2 - 1, 18, 2)
    else ctx.fillRect(tx, railY + railH * 0.5 - 1.5, 26, 3)
  }

  /* the publish route, drawn before the screens so it runs behind them */
  if (tilt < 1) {
    ctx.save()
    ctx.globalAlpha = 1 - tilt
    ctx.strokeStyle = 'rgba(97,24,234,.4)'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 14])
    ctx.lineDashOffset = -time * 40
    ctx.beginPath()
    ctx.moveTo(0, railY - 16)
    ctx.lineTo(w, railY - 16)
    ctx.stroke()
    ctx.restore()
  }

  /*
   * The channels the edition lands on, once we are top-down. They come in after
   * the delivery nodes have faded, and sit clear of them, so the two never
   * crowd the same band.
   */
  if (tilt > 0.45) {
    const chipW = 68 * k
    const chipH = 22 * k
    const step = chipW + 18 * k
    const fs = Math.max(8, 11 * k)
    ctx.save()
    ctx.globalAlpha = (tilt - 0.45) / 0.55
    ctx.textAlign = 'center'
    ctx.font = `500 ${fs}px ${monoFamily()}`
    CHANNELS.forEach((label, i) => {
      const cx = w * 0.5 + (i - (CHANNELS.length - 1) / 2) * step
      const cy = railY + railH + 52 * k
      roundRect(ctx, cx - chipW / 2, cy - chipH / 2, chipW, chipH, chipH / 2)
      ctx.fillStyle = 'rgba(97,24,234,.08)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(97,24,234,.55)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = 'rgba(17,17,17,.62)'
      ctx.fillText(label, cx + chipW * 0.08, cy + fs * 0.36)
      // live dot
      ctx.fillStyle = VIOLET
      ctx.beginPath()
      ctx.arc(cx - chipW * 0.3, cy, Math.max(1.6, 2.4 * k), 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()
  }

  /* the screens riding the rail, waking as the edition reaches them */
  const fade = 1 - tilt
  const rise = easeOut(clamp((p - 0.06) * 3)) * 6
  for (const { x, i, spec } of riders) {
    const bob = Math.sin(travel * 0.02 + i) * 2
    const lit = easeOut(clamp((x / w - 0.06) * 2.6))
    ctx.save()
    ctx.globalAlpha = fade
    drawRider(ctx, spec.kind, x, railY + bob - rise, spec.w * k, lit)
    ctx.restore()
  }

  /* signal bloom drifting under the rail */
  ctx.globalAlpha = 0.05 * (1 - tilt)
  ctx.fillStyle = VIOLET
  for (let i = 0; i < 5; i++) {
    const mx = ((time * 26 + i * 260) % (w + 300)) - 150
    ctx.beginPath()
    ctx.ellipse(mx, railY + railH + 40 * k, 120 * k, 18 * k, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** 04 · OUR PLATFORM — screens ride the delivery rail, side view. */
export function mountConveyor(canvas) {
  return mountScene(canvas, drawConveyor)
}
