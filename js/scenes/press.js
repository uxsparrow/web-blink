import { clamp, easeInOut, easeOut, lerp, seg } from '../lib/motion.js'
import { mountScene } from '../lib/canvas-scene.js'

/**
 * 06 · THE PRESS — the edition going out, top-down.
 *
 * The section is named for the press in the journalism sense, the way the rest
 * of the labels are newspaper sections. The machine is gone: what races up the
 * middle is the published feed, not a paper web, and what it bursts into is
 * readers' screens, not fluttering pages.
 *
 * Each print element was replaced rather than dropped, so the scene keeps the
 * shape the scroll timeline expects:
 *
 *   paper web racing up   → the feed, payload after payload
 *   rollers across the bed → dropped: the relay bars that replaced them ran the
 *                            full width and cut straight through the headline
 *                            and the feature copy sitting over this canvas
 *   ink-lit machine bed   → the same violet light, now the network's
 *   burst of flying pages → the story arriving on hundreds of screens
 *
 * p 0.00–0.50  the feed runs, headline centred over it
 * p 0.50–0.84  the camera pulls back and the fan-out to the edges appears
 * p 0.82–1.00  the story lands on every screen and the frame clears to white
 */

const NIGHT = '#0a0810'
const VIOLET = '#6118EA'
const LILAC = '#b9a4ff'
const RED = '#E10600'

/*
 * Image payloads riding the feed. Weighted towards the violet end: the press
 * printed full-bleed CMYK blocks, but a feed of stories on a dark network
 * should sit in the page's own palette, with red and cyan as the occasional
 * accent rather than a wall of colour.
 */
const THUMB_COLOURS = ['#6118EA', '#2A0B8F', '#B9A4FF', '#6118EA', '#00AEEF', '#E10600']

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
 * One story per row. The press ran rows of full-bleed colour cells because it
 * was printing photographs; a feed carries articles, so each row is a card —
 * a thumbnail, a headline, a few lines of body — and the colour is the
 * thumbnail alone.
 */
function buildPayloads(count) {
  const rnd = mulberry32(20260926)
  return Array.from({ length: count }, () => ({
    colour: THUMB_COLOURS[Math.floor(rnd() * THUMB_COLOURS.length)],
    hasThumb: rnd() > 0.24,
    thumbLeft: rnd() > 0.5,
    thumbW: 0.3 + rnd() * 0.14,
    headLines: rnd() > 0.55 ? 2 : 1,
    bodyLines: 2 + Math.floor(rnd() * 3),
    breaking: rnd() > 0.78,
  }))
}

/** The screens the story lands on. */
function buildScreens(count) {
  const rnd = mulberry32(777)
  return Array.from({ length: count }, () => ({
    a: rnd() * Math.PI * 2,
    d: 0.22 + rnd() * 1.5,
    spin: (rnd() - 0.5) * 2.2, // screens tumble far less than paper did
    scale: 0.45 + rnd() * 1.5,
    portrait: rnd() > 0.45,
    flutter: rnd() * Math.PI * 2,
  }))
}

/** The endpoints the feed fans out to once the camera pulls back. */
function buildEndpoints(count) {
  const rnd = mulberry32(4242)
  return Array.from({ length: count }, (_, i) => ({
    a: (i / count) * Math.PI * 2 + rnd() * 0.16,
    r: 0.78 + rnd() * 0.42,
    delay: rnd() * 0.5,
    size: 7 + rnd() * 7,
  }))
}

/** A screen with the story on it, drawn at whatever size the burst needs. */
function drawScreen(ctx, portrait, alpha) {
  const w = portrait ? 38 : 60
  const h = portrait ? 60 : 38
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#16121f'
  ctx.fillRect(-w / 2, -h / 2, w, h)
  ctx.strokeStyle = `rgba(185,164,255,${0.5 * alpha})`
  ctx.lineWidth = 1.5
  ctx.strokeRect(-w / 2, -h / 2, w, h)
  // the article on it: kicker, headline, a couple of lines
  const pad = w * 0.14
  ctx.fillStyle = RED
  ctx.fillRect(-w / 2 + pad, -h / 2 + pad, w * 0.3, 3)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-w / 2 + pad, -h / 2 + pad + 8, w - pad * 2, 5)
  ctx.fillStyle = 'rgba(255,255,255,.42)'
  for (let k = 0; k < (portrait ? 3 : 2); k++) {
    ctx.fillRect(-w / 2 + pad, -h / 2 + pad + 18 + k * 7, (w - pad * 2) * (k % 2 ? 0.6 : 0.92), 2.5)
  }
}

function drawBroadcast(ctx, w, h, p, time, rows, screens, endpoints) {
  const pull = easeInOut(seg(p, 0.5, 0.84)) // camera pulls back
  const burst = seg(p, 0.82, 1)
  const fan = seg(p, 0.48, 0.9) // the fan-out to the endpoints

  ctx.fillStyle = NIGHT
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  const s = lerp(1, 0.62, pull)
  ctx.translate(w / 2, h / 2)
  ctx.scale(s, s)
  ctx.translate(-w / 2, -h / 2)
  ctx.globalAlpha = Math.max(0, 1 - burst * 1.1)

  /* the network's own light, pooling down the middle */
  for (let i = 0; i < 3; i++) {
    const gy = (h / 3) * i + h * 0.16
    const g = ctx.createRadialGradient(w / 2, gy, 0, w / 2, gy, w * 0.52)
    g.addColorStop(0, 'rgba(97,24,234,.34)')
    g.addColorStop(1, 'rgba(97,24,234,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, gy - w * 0.52, w, w * 1.04)
  }

  /* ── the feed, racing up ─────────────────────────────────────── */
  const busW = Math.min(w * 0.46, 620)
  const busX = (w - busW) / 2
  const rowH = 168
  const travel = p * 5200 + time * 190
  const offset = travel % rowH

  ctx.save()
  ctx.beginPath()
  ctx.rect(busX, -40, busW, h + 80)
  ctx.clip()

  // the bus itself is dark glass, not newsprint
  const bus = ctx.createLinearGradient(busX, 0, busX + busW, 0)
  bus.addColorStop(0, 'rgba(22,18,31,.96)')
  bus.addColorStop(0.5, 'rgba(30,24,44,.96)')
  bus.addColorStop(1, 'rgba(22,18,31,.96)')
  ctx.fillStyle = bus
  ctx.fillRect(busX, -40, busW, h + 80)

  const rowCount = Math.ceil(h / rowH) + 3
  const live = Math.max(0, 1 - burst)
  for (let r = -2; r < rowCount; r++) {
    const y = h - (r * rowH - offset) + rowH
    const card = rows[((r % rows.length) + rows.length) % rows.length]
    const pad = 20
    const top = y - rowH + 22
    const cardW = busW - pad * 2
    const thumbW = card.hasThumb ? cardW * card.thumbW : 0
    const textW = cardW - thumbW - (card.hasThumb ? 16 : 0)
    const textX = busX + pad + (card.hasThumb && card.thumbLeft ? thumbW + 16 : 0)
    const thumbX = busX + pad + (card.thumbLeft ? 0 : textW + 16)

    if (card.hasThumb) {
      // smeared along the run, because it is moving fast
      for (let b = 3; b >= 0; b--) {
        ctx.globalAlpha = live * (b === 0 ? 0.88 : 0.12)
        ctx.fillStyle = card.colour
        ctx.fillRect(thumbX, top + b * 11, thumbW, 84)
      }
    }

    ctx.globalAlpha = live
    let ty = top + 4

    // kicker — red only when the story is breaking
    ctx.fillStyle = card.breaking ? RED : 'rgba(185,164,255,.75)'
    ctx.fillRect(textX, ty, textW * 0.26, 4)
    ty += 14

    // headline
    ctx.fillStyle = 'rgba(255,255,255,.94)'
    for (let k = 0; k < card.headLines; k++) {
      ctx.fillRect(textX, ty, textW * (k === card.headLines - 1 ? 0.7 : 1), 11)
      ty += 16
    }
    ty += 6

    // body
    ctx.fillStyle = 'rgba(185,164,255,.34)'
    for (let k = 0; k < card.bodyLines; k++) {
      ctx.fillRect(textX, ty, textW * (k % 3 === 2 ? 0.52 : 0.9), 3.5)
      ty += 9
    }

    // the seam between one story and the next
    ctx.fillStyle = 'rgba(185,164,255,.12)'
    ctx.fillRect(busX, y + 6, busW, 1)
  }
  ctx.restore()

  ctx.globalAlpha = Math.max(0, 1 - burst * 1.1)

  /* the bus edges */
  ctx.strokeStyle = 'rgba(185,164,255,.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(busX, 0)
  ctx.lineTo(busX, h)
  ctx.moveTo(busX + busW, 0)
  ctx.lineTo(busX + busW, h)
  ctx.stroke()

  ctx.restore()

  /* ── the fan-out, once there is room to see it ───────────────── */
  if (fan > 0 && burst < 1) {
    const reach = Math.min(w, h) * 0.42
    ctx.save()
    ctx.globalAlpha = (1 - burst) * clamp(fan * 1.4)
    for (const e of endpoints) {
      const t = clamp((fan - e.delay * 0.4) / 0.6)
      if (t <= 0) continue
      const ex = w / 2 + Math.cos(e.a) * reach * e.r * t
      const ey = h / 2 + Math.sin(e.a) * reach * e.r * t * 0.82

      // the hop out to it
      ctx.strokeStyle = `rgba(185,164,255,${0.42 * t})`
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(w / 2, h / 2)
      ctx.lineTo(ex, ey)
      ctx.stroke()

      // the payload still travelling down the hop
      const dot = clamp(t * 1.4)
      if (dot < 1) {
        ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - dot)})`
        ctx.beginPath()
        ctx.arc(w / 2 + (ex - w / 2) * dot, h / 2 + (ey - h / 2) * dot, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      // the screen at the far end, lighting up as the story lands
      const lit = clamp((t - 0.5) / 0.5)
      const sw = e.size * 1.7
      const sh = sw * 0.72
      ctx.fillStyle = '#16121f'
      ctx.fillRect(ex - sw / 2, ey - sh / 2, sw, sh)
      ctx.strokeStyle = `rgba(185,164,255,${0.4 + lit * 0.6})`
      ctx.lineWidth = 1.2
      ctx.strokeRect(ex - sw / 2, ey - sh / 2, sw, sh)
      if (lit > 0.05) {
        ctx.fillStyle = `rgba(225,6,0,${lit})`
        ctx.fillRect(ex - sw / 2 + 2.5, ey - sh / 2 + 2.5, sw * 0.3, 2)
        ctx.fillStyle = `rgba(255,255,255,${0.9 * lit})`
        ctx.fillRect(ex - sw / 2 + 2.5, ey - sh / 2 + 7, sw - 5, 2.5)
        ctx.fillStyle = `rgba(185,164,255,${0.5 * lit})`
        ctx.fillRect(ex - sw / 2 + 2.5, ey - sh / 2 + 12, (sw - 5) * 0.62, 2)
      }
    }
    ctx.restore()
  }

  /* ── it lands on every screen ────────────────────────────────── */
  if (burst > 0) {
    const b = easeOut(burst)
    for (let i = 0; i < screens.length; i++) {
      const sc = screens[i]
      const travelOut = b * sc.d * Math.max(w, h) * 1.15
      const x = w / 2 + Math.cos(sc.a) * travelOut
      const y = h / 2 + Math.sin(sc.a) * travelOut * 0.78
      const size = sc.scale * (0.35 + b * 2.4)
      const rot = sc.spin * b + Math.sin(time * 2.4 + sc.flutter) * 0.12
      const alpha = clamp(b * 2.6) * (1 - clamp((b - 0.62) / 0.38))
      if (alpha <= 0.01) continue
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      ctx.scale(size, size)
      drawScreen(ctx, sc.portrait, alpha)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }

  /* vignette */
  const vig = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.28,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.78
  )
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, `rgba(0,0,0,${0.62 * (1 - burst)})`)
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

/** 06 · THE PRESS — the feed runs, fans out, and lands on every screen. */
export function mountPress(canvas, { mobile = false } = {}) {
  const rows = buildPayloads(14)
  const screens = buildScreens(mobile ? 110 : 320)
  const endpoints = buildEndpoints(mobile ? 14 : 26)
  return mountScene(
    canvas,
    (ctx, w, h, p, t) => drawBroadcast(ctx, w, h, p, t, rows, screens, endpoints),
    { maxDpr: mobile ? 1.5 : 2 }
  )
}
