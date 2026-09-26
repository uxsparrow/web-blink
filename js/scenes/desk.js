/**
 * 03 · THE DESK — write once, publish to every screen.
 *
 * The headline types itself into the Blink editor on the laptop, a send dart
 * carries it across the desk, and the same article lights up a second laptop,
 * a tablet and a phone. No paper anywhere: Blink is a digital platform, so the
 * desk carries screens.
 */

import { clamp, easeInOut, easeOut, lerp, seg } from '../lib/motion.js'
import { displayFamily, monoFamily } from '../lib/fonts.js'
import { mountScene } from '../lib/canvas-scene.js'

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

const HEADLINE = ['EVERY STAGE', 'OF THE', 'STORY']
const TOTAL_CHARS = HEADLINE.join('').length

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

/**
 * The story itself, drawn at whatever size the surface needs — the editor,
 * the second laptop, the tablet and the phone all render this.
 */
function drawArticle(ctx, x, y, w, h, { chars = TOTAL_CHARS, caret = false }) {
  const pad = w * 0.08
  const dim = 'rgba(255,255,255,.34)'

  // kicker
  ctx.fillStyle = RED
  ctx.fillRect(x + pad, y + pad, w * 0.2, Math.max(2, h * 0.016))

  // dateline
  ctx.fillStyle = dim
  ctx.font = `400 ${Math.max(6, w * 0.035)}px ${monoFamily()}`
  ctx.fillText('NOIDA — 14:32 IST', x + pad + w * 0.24, y + pad + Math.max(2, h * 0.016))

  // headline, typed in
  const fs = w * 0.105
  ctx.font = `700 ${fs}px ${displayFamily()}`
  ctx.fillStyle = '#ffffff'
  let seen = 0
  let caretX = x + pad
  let caretY = y + pad + fs * 1.6
  for (let i = 0; i < HEADLINE.length; i++) {
    const line = HEADLINE[i]
    const take = clamp(chars - seen, 0, line.length)
    const shown = line.slice(0, Math.floor(take))
    const ly = y + pad + fs * 1.6 + i * fs * 1.04
    if (shown) ctx.fillText(shown, x + pad, ly)
    if (take > 0) {
      caretX = x + pad + ctx.measureText(shown).width
      caretY = ly
    }
    seen += line.length
  }

  if (caret) {
    ctx.fillStyle = RED
    ctx.fillRect(caretX + fs * 0.06, caretY - fs * 0.76, Math.max(2, fs * 0.05), fs * 0.84)
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
  ctx.save()
  ctx.translate((w - L.sw * scale) / 2, (h - SH * scale) / 2)
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
