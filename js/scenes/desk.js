/**
 * 03 · THE DESK — write once, publish to every screen.
 *
 * The headline types itself into the Blink editor on the laptop, a send dart
 * carries it across the desk, and the same article lights up a second laptop,
 * a tablet and a phone. No paper anywhere: Blink is a digital platform, so the
 * desk carries screens.
 */

import { clamp, easeInOut, easeOut, lerp, reducedMotion, seg } from '../lib/motion.js'
import { displayFamily } from '../lib/fonts.js'
import { mountScene } from '../lib/canvas-scene.js'
import { TOTAL_CHARS, drawArticle } from '../lib/article.js'
import { landDots, loadWorld, rasterize } from '../lib/world.js'

/*
 * Virtual stage, sized to the content band rather than to a screen, so the
 * contain-fit below never crops an edge device or leaves dead space on top.
 * Narrow screens get their own, tighter arrangement — a wide desk of four
 * devices shrinks to nothing on a phone.
 */
const SH = 640
const DESK_Y = 560

const WIDE = {
  sw: 1600,
  editorX: 430,
  editorW: 480,
  laptopX: 1000,
  laptopW: 300,
  tabletX: 1300,
  phoneX: 1490,
  deviceScale: 1,
}

const NARROW = {
  sw: 820,
  editorX: 265,
  editorW: 400,
  phoneX: 650,
  deviceScale: 1.35,
}

const INK = '#111111'
const VIOLET = '#6118EA'
const LILAC = '#b9a4ff'
const RED = '#E10600'
const SHELL = '#16121f'
const SCREEN = '#0a0812'

/* ── the newsroom wall map ────────────────────────────────────── */

/*
 * The stage is a band of devices across the middle, which left the top of the
 * section empty. A dotted world drifts behind it — real Natural Earth land,
 * the same geometry the preloader map and the hero globe use, centred on the
 * same longitude, so the page keeps one world rather than a decorative shape.
 *
 * It shrinks to nothing before the desk line, so the screens are never read
 * against a busy background, and it is drawn in canvas space rather than on
 * the fitted stage so it fills the section's full width at any size.
 */
/*
 * Framed on 30°W rather than on the globe's `START_LON`: that puts the Atlantic
 * mid-canvas and stands Europe, Africa and Siberia up the right-hand side,
 * where the section is otherwise empty. The globe's opening angle is about
 * where its camera starts and is not this scene's to borrow.
 */
const MAP_LON = -30

let mapDots = null
loadWorld().then((world) => {
  mapDots = landDots(rasterize(world.land, 360, 180, MAP_LON), 2)
})

/*
 * The map sways rather than cycling. A one-way drift is the obvious thing, but
 * it walks the whole world past over a few minutes, so whatever you frame comes
 * apart — the Pacific eventually fills the right-hand side and the section
 * looks empty again. Swaying keeps the framing and still reads as alive; at
 * these numbers the fastest the dots ever move is about 4.7px a second.
 */
const MAP_SWAY = 90
const MAP_SWAY_RATE = 0.052

function drawWallMap(ctx, w, h, time, deskLineY) {
  if (!mapDots) return

  const still = reducedMotion()
  const mapW = Math.max(w * 1.05, 900)
  const mapH = mapW / 2
  const fadeEnd = deskLineY - 28
  const top = fadeEnd * 0.46 - mapH / 2
  const unit = Math.max(1, mapW / 900)
  const shift = still ? 0 : Math.sin(time * MAP_SWAY_RATE) * MAP_SWAY

  ctx.save()
  ctx.fillStyle = 'rgba(17,17,17,.28)'
  ctx.beginPath()
  for (let i = 0; i < mapDots.length; i++) {
    const d = mapDots[i]
    const y = top + d.y * mapH
    if (y < 0 || y > fadeEnd) continue

    // in from the top edge, out well before the desk line
    const fade = Math.min(1, y / (h * 0.08)) * Math.min(1, (fadeEnd - y) / (h * 0.16))
    if (fade <= 0.02) continue

    // a swell travelling through the field, so the map reads as alive
    const swell = still ? 1 : 1 + 0.38 * Math.sin(d.x * 9 - time * 1.1 + d.y * 4)
    const s = unit * fade * swell
    if (s < 0.25) continue

    // the map wraps, so the copy behind the seam keeps the drift continuous
    const x = d.x * mapW + shift
    if (x - mapW > -s) ctx.rect(x - mapW, y, s, s)
    if (x < w + s) ctx.rect(x, y, s, s)
  }
  ctx.fill()
  ctx.restore()
}

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

/** Soft contact shadow so a device reads as standing on the desk. */
function shadow(ctx, cx, y, w) {
  ctx.save()
  ctx.fillStyle = 'rgba(17,17,17,.12)'
  ctx.beginPath()
  ctx.ellipse(cx, y + 5, w * 0.5, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** The screen waking up — a lilac rim while it comes on. */
function wakeRim(ctx, x, y, w, h, r, lit) {
  if (lit <= 0.01 || lit >= 1) return
  ctx.strokeStyle = `rgba(185,164,255,${(1 - lit) * 0.8})`
  ctx.lineWidth = 2
  roundRect(ctx, x, y, w, h, r)
  ctx.stroke()
}

/* ── laptops ──────────────────────────────────────────────────── */

/**
 * `editor: true` draws the Blink editor with its AI sidebar — the machine the
 * story is written on. Otherwise it is a reading screen like the others.
 */
function drawLaptop(ctx, cx, baseY, { w, editor = false, chars, caret, lit = 1 }) {
  const screenH = w * 0.63
  const baseH = Math.max(10, w * 0.033)
  const lid = Math.max(8, w * 0.028)
  const bottom = baseY - baseH
  const top = bottom - screenH

  shadow(ctx, cx, baseY, w * 1.12)

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
  ctx.fillRect(cx - w * 0.16, bottom + baseH * 0.35, w * 0.32, Math.max(2, baseH * 0.2))

  // lid
  ctx.fillStyle = SHELL
  roundRect(ctx, cx - w / 2, top, w, screenH, w * 0.02)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.08)'
  ctx.lineWidth = 1
  ctx.stroke()

  const sx = cx - w / 2 + lid
  const sy = top + lid
  const sw = w - lid * 2
  const sh = screenH - lid * 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(sx, sy, sw, sh)
  ctx.clip()
  ctx.fillStyle = SCREEN
  ctx.fillRect(sx, sy, sw, sh)

  if (editor) {
    // violet AI sidebar, glowing
    const sbW = sw * 0.21
    const glow = ctx.createLinearGradient(sx, 0, sx + sbW * 1.8, 0)
    glow.addColorStop(0, 'rgba(97,24,234,.9)')
    glow.addColorStop(0.65, 'rgba(97,24,234,.18)')
    glow.addColorStop(1, 'rgba(97,24,234,0)')
    ctx.fillStyle = glow
    ctx.fillRect(sx, sy, sbW * 1.8, sh)

    // the product's own name, at the head of the sidebar
    const ws = Math.max(9, sbW * 0.21)
    ctx.font = `700 ${ws}px ${displayFamily()}`
    ctx.fillStyle = '#ffffff'
    ctx.fillText('BLINK', sx + 12, sy + 22 + ws * 0.35)
    ctx.fillStyle = LILAC
    ctx.fillText('CMS', sx + 12 + ctx.measureText('BLINK').width, sy + 22 + ws * 0.35)

    // sidebar nav
    ctx.fillStyle = 'rgba(185,164,255,.85)'
    for (let i = 0; i < 5; i++) ctx.fillRect(sx + 12, sy + 44 + i * 18, sbW - 24, 3)
    ctx.fillStyle = 'rgba(185,164,255,.45)'
    ctx.fillRect(sx + 12, sy + sh - 30, sbW - 24, 3)

    // editor chrome
    ctx.fillStyle = 'rgba(255,255,255,.1)'
    ctx.fillRect(sx + sbW + 14, sy + 14, sw - sbW - 28, 8)
    ctx.fillStyle = RED
    ctx.beginPath()
    ctx.arc(sx + sbW + 20, sy + 18, 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.1)'
    ctx.beginPath()
    ctx.moveTo(sx + sbW + 6, sy)
    ctx.lineTo(sx + sbW + 6, sy + sh)
    ctx.stroke()

    drawArticle(ctx, sx + sbW + 14, sy + 30, sw - sbW - 28, sh - 44, { chars, caret })
  } else if (lit > 0.01) {
    ctx.globalAlpha = lit
    drawArticle(ctx, sx, sy, sw, sh, {})
    ctx.globalAlpha = 1
  }
  ctx.restore()

  if (!editor) wakeRim(ctx, cx - w / 2, top, w, screenH, w * 0.02, lit)
}

/* ── the other screens it publishes to ────────────────────────── */

function drawTablet(ctx, cx, baseY, lit, k = 1) {
  const w = 185 * k
  const h = 245 * k
  const x = cx - w / 2
  const y = baseY - h
  const bezel = 9

  shadow(ctx, cx, baseY, w * 0.9)

  ctx.fillStyle = SHELL
  roundRect(ctx, x, y, w, h, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.08)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.save()
  roundRect(ctx, x + bezel, y + bezel, w - bezel * 2, h - bezel * 2, 6)
  ctx.clip()
  ctx.fillStyle = SCREEN
  ctx.fillRect(x + bezel, y + bezel, w - bezel * 2, h - bezel * 2)
  if (lit > 0.01) {
    ctx.globalAlpha = lit
    drawArticle(ctx, x + bezel, y + bezel, w - bezel * 2, h - bezel * 2, {})
    ctx.globalAlpha = 1
  }
  ctx.restore()

  wakeRim(ctx, x, y, w, h, 14, lit)
}

function drawPhone(ctx, cx, baseY, lit, k = 1) {
  const w = 104 * k
  const h = 200 * k
  const x = cx - w / 2
  const y = baseY - h
  const bezel = 7

  shadow(ctx, cx, baseY, w * 0.95)

  ctx.fillStyle = SHELL
  roundRect(ctx, x, y, w, h, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.08)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.save()
  roundRect(ctx, x + bezel, y + bezel, w - bezel * 2, h - bezel * 2, 9)
  ctx.clip()
  ctx.fillStyle = SCREEN
  ctx.fillRect(x + bezel, y + bezel, w - bezel * 2, h - bezel * 2)
  if (lit > 0.01) {
    ctx.globalAlpha = lit
    drawArticle(ctx, x + bezel, y + bezel, w - bezel * 2, h - bezel * 2, {})
    ctx.globalAlpha = 1
  }
  ctx.restore()

  // speaker slot
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  roundRect(ctx, cx - 13 * k, y + 4, 26 * k, 3, 2)
  ctx.fill()

  wakeRim(ctx, x, y, w, h, 14, lit)
}

/* ── the send dart ────────────────────────────────────────────── */

/**
 * The publish action itself — the send glyph every messaging UI uses, not a
 * document and not a sheet of paper. It carries the story to the other screens.
 */
function drawSendDart(ctx, cx, cy, size, angle, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha

  // motion trail
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  for (let i = 1; i <= 4; i++) {
    ctx.fillStyle = `rgba(185,164,255,${0.24 / i})`
    const t = size * (0.9 + i * 0.75)
    ctx.fillRect(-t, -size * 0.05, size * 0.55, size * 0.1)
  }
  ctx.restore()

  ctx.translate(cx, cy)
  ctx.rotate(angle)

  ctx.shadowColor = 'rgba(97,24,234,.75)'
  ctx.shadowBlur = size * 1.1

  // upper wing
  const g = ctx.createLinearGradient(-size, -size, size, size)
  g.addColorStop(0, LILAC)
  g.addColorStop(1, VIOLET)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(size, 0)
  ctx.lineTo(-size * 0.78, -size * 0.64)
  ctx.lineTo(-size * 0.4, 0)
  ctx.closePath()
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  // lower wing, in shade
  ctx.fillStyle = VIOLET
  ctx.beginPath()
  ctx.moveTo(size, 0)
  ctx.lineTo(-size * 0.4, 0)
  ctx.lineTo(-size * 0.78, size * 0.64)
  ctx.closePath()
  ctx.fill()

  // centre crease
  ctx.strokeStyle = 'rgba(255,255,255,.55)'
  ctx.lineWidth = Math.max(1, size * 0.035)
  ctx.beginPath()
  ctx.moveTo(size, 0)
  ctx.lineTo(-size * 0.4, 0)
  ctx.stroke()

  ctx.restore()
}

/* ── the whole scene ──────────────────────────────────────────── */

export function drawDesk(ctx, w, h, p, time, mobile) {
  const L = mobile ? NARROW : WIDE

  // plain contain-fit: nothing is cropped at the edges, and the stage is only
  // as tall as the scene, so there is no dead band above it
  const scale = Math.min(w / L.sw, h / SH)
  const stageTop = (h - SH * scale) / 2

  // behind everything, and told where the desk line lands so it can clear it
  drawWallMap(ctx, w, h, time, stageTop + DESK_Y * scale)

  ctx.save()
  ctx.translate((w - L.sw * scale) / 2, stageTop)
  ctx.scale(scale, scale)

  // The scene is fully composed at p = 0: this stage scrolls into view before
  // the pin engages, so anything that faded in from zero left a screen of
  // blank white behind it.
  const typing = seg(p, 0.02, 0.44)
  const fly = seg(p, 0.48, 0.8)
  const litLaptop = seg(p, 0.66, 0.82)
  const litTablet = seg(p, 0.75, 0.9)
  const litPhone = seg(p, 0.84, 1)

  /* desk line */
  ctx.strokeStyle = 'rgba(17,17,17,.9)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(-40, DESK_Y)
  ctx.lineTo(L.sw + 40, DESK_Y)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(17,17,17,.12)'
  ctx.beginPath()
  ctx.moveTo(-40, DESK_Y + 6)
  ctx.lineTo(L.sw + 40, DESK_Y + 6)
  ctx.stroke()

  /* the publish route, drawn before the devices so it runs behind them */
  if (fly > 0.02) {
    const a = clamp((fly - 0.02) * 3) * (1 - clamp((fly - 0.75) / 0.25))
    ctx.strokeStyle = `rgba(97,24,234,${a * 0.4})`
    ctx.lineWidth = 2
    ctx.setLineDash([10, 14])
    ctx.lineDashOffset = -time * 40
    ctx.beginPath()
    ctx.moveTo(L.editorX + L.editorW * 0.55, DESK_Y - 24)
    ctx.lineTo(L.phoneX + 60, DESK_Y - 24)
    ctx.stroke()
    ctx.setLineDash([])
  }

  /* the reading screens, lighting up in turn */
  if (L.laptopX) drawLaptop(ctx, L.laptopX, DESK_Y, { w: L.laptopW, lit: easeOut(litLaptop) })
  if (L.tabletX) drawTablet(ctx, L.tabletX, DESK_Y, easeOut(litTablet), L.deviceScale)
  drawPhone(ctx, L.phoneX, DESK_Y, easeOut(mobile ? litTablet : litPhone), L.deviceScale)

  /* the editor — the story is written here and stays here */
  drawLaptop(ctx, L.editorX, DESK_Y, {
    w: L.editorW,
    editor: true,
    chars: Math.floor(typing * TOTAL_CHARS + 0.001),
    caret: typing > 0.01 && typing < 1 && Math.sin(time * 6) > 0,
  })

  /* the send dart carrying it across */
  if (fly > 0 && fly < 1) {
    const t = easeInOut(fly)
    const p0 = [L.editorX + L.editorW * 0.44, DESK_Y - 250]
    const p1 = [(L.editorX + L.phoneX) / 2, DESK_Y - 430]
    const p2 = [L.phoneX - 40, DESK_Y - 210]

    // quadratic bezier, plus its tangent for the heading
    const at = (u) => [
      (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0],
      (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1],
    ]
    const [x, y] = at(t)
    const [nx, ny] = at(Math.min(1, t + 0.02))
    const angle = Math.atan2(ny - y, nx - x)
    const fade = Math.min(1, t * 8) * Math.min(1, (1 - t) * 5)

    drawSendDart(ctx, x, y, 34, angle, fade)
  }

  ctx.restore()
}

/** 03 · THE DESK — the editor writes, three screens publish. */
export function mountDesk(canvas, { mobile = false } = {}) {
  return mountScene(canvas, (ctx, w, h, p, t) => drawDesk(ctx, w, h, p, t, mobile))
}
