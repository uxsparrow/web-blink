'use client'

import { useEffect, useMemo, useRef } from 'react'
import { clamp, easeInOut, easeOut, lerp, seg } from '@/lib/motion'

/**
 * 06 · THE PRESS — top-down. A paper web races up through violet-lit rollers,
 * printed with rows of colour photos. At the end the press bursts into hundreds
 * of flying pages that flutter away and reveal white.
 */

const PHOTO_COLOURS = ['#6118EA', '#E10600', '#00AEEF', '#FFC400', '#B9A4FF', '#2A0B8F']

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Cell {
  colour: string
  isPhoto: boolean
  w: number
}

interface Page {
  a: number // angle out from centre
  d: number // distance factor
  spin: number
  scale: number
  tint: string
  flutter: number
}

function buildRows(count: number): Cell[][] {
  const rnd = mulberry32(20260926)
  const rows: Cell[][] = []
  for (let r = 0; r < count; r++) {
    const cells: Cell[] = []
    const n = 2 + Math.floor(rnd() * 2)
    for (let c = 0; c < n; c++) {
      cells.push({
        colour: PHOTO_COLOURS[Math.floor(rnd() * PHOTO_COLOURS.length)],
        isPhoto: rnd() > 0.32,
        w: 0.5 + rnd() * 0.8,
      })
    }
    rows.push(cells)
  }
  return rows
}

function buildPages(count: number): Page[] {
  const rnd = mulberry32(777)
  return Array.from({ length: count }, () => ({
    a: rnd() * Math.PI * 2,
    d: 0.22 + rnd() * 1.5,
    spin: (rnd() - 0.5) * 9,
    scale: 0.45 + rnd() * 1.5,
    tint: rnd() > 0.85 ? '#F3F0E8' : '#FFFFFF',
    flutter: rnd() * Math.PI * 2,
  }))
}

export function drawPress(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
  time: number,
  rows: Cell[][],
  pages: Page[]
) {
  const pull = easeInOut(seg(p, 0.5, 0.84)) // camera pulls back
  const burst = seg(p, 0.82, 1)

  /* machine bed */
  ctx.fillStyle = '#0a0810'
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  const s = lerp(1, 0.62, pull)
  ctx.translate(w / 2, h / 2)
  ctx.scale(s, s)
  ctx.translate(-w / 2, -h / 2)
  ctx.globalAlpha = Math.max(0, 1 - burst * 1.1)

  /* violet light pools along the machine */
  for (let i = 0; i < 3; i++) {
    const gy = (h / 3) * i + h * 0.16
    const g = ctx.createRadialGradient(w / 2, gy, 0, w / 2, gy, w * 0.52)
    g.addColorStop(0, 'rgba(97,24,234,.34)')
    g.addColorStop(1, 'rgba(97,24,234,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, gy - w * 0.52, w, w * 1.04)
  }

  /* the paper web, racing up */
  const webW = Math.min(w * 0.46, 620)
  const webX = (w - webW) / 2
  const rowH = 168
  const travel = p * 5200 + time * 190
  const offset = travel % rowH

  ctx.save()
  ctx.beginPath()
  ctx.rect(webX, -40, webW, h + 80)
  ctx.clip()

  ctx.fillStyle = '#f7f5ef'
  ctx.fillRect(webX, -40, webW, h + 80)

  const rowCount = Math.ceil(h / rowH) + 3
  for (let r = -2; r < rowCount; r++) {
    const y = h - (r * rowH - offset) + rowH
    const cells = rows[((r % rows.length) + rows.length) % rows.length]
    const pad = 18
    const totalW = cells.reduce((acc, c) => acc + c.w, 0)
    let cx = webX + pad

    for (const cell of cells) {
      const cw = ((webW - pad * 2 - (cells.length - 1) * 12) * cell.w) / totalW
      if (cell.isPhoto) {
        // motion blur: the same block smeared along the run direction
        for (let b = 0; b < 4; b++) {
          ctx.globalAlpha = Math.max(0, 1 - burst) * (b === 0 ? 0.95 : 0.16)
          ctx.fillStyle = cell.colour
          ctx.fillRect(cx, y - 96 + b * 13, cw, 92)
        }
        ctx.globalAlpha = Math.max(0, 1 - burst)
      } else {
        ctx.fillStyle = 'rgba(17,17,17,.88)'
        ctx.fillRect(cx, y - 92, cw, 13)
        ctx.fillStyle = 'rgba(17,17,17,.34)'
        for (let k = 0; k < 5; k++) {
          ctx.fillRect(cx, y - 68 + k * 13, cw * (k % 2 ? 0.58 : 0.9), 4)
        }
      }
      cx += cw + 12
    }

    // fold/crease rule between impressions
    ctx.fillStyle = 'rgba(17,17,17,.12)'
    ctx.fillRect(webX, y + 6, webW, 1)
  }
  ctx.restore()
  ctx.globalAlpha = Math.max(0, 1 - burst * 1.1)

  /* web edge guides */
  ctx.strokeStyle = 'rgba(185,164,255,.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(webX, 0)
  ctx.lineTo(webX, h)
  ctx.moveTo(webX + webW, 0)
  ctx.lineTo(webX + webW, h)
  ctx.stroke()

  /* rollers across the bed */
  const rollerGap = 300
  const rOffset = (travel * 0.22) % rollerGap
  for (let i = -1; i < Math.ceil(h / rollerGap) + 2; i++) {
    const y = h - (i * rollerGap - rOffset) + rollerGap
    if (y < -80 || y > h + 80) continue

    ctx.fillStyle = '#16121f'
    ctx.fillRect(-20, y - 27, w + 40, 54)

    const g = ctx.createLinearGradient(0, y - 27, 0, y + 27)
    g.addColorStop(0, 'rgba(185,164,255,.42)')
    g.addColorStop(0.5, 'rgba(97,24,234,.16)')
    g.addColorStop(1, 'rgba(0,0,0,.5)')
    ctx.fillStyle = g
    ctx.fillRect(-20, y - 27, w + 40, 54)

    // roller ends
    ctx.fillStyle = '#241c33'
    ctx.fillRect(-20, y - 34, 78, 68)
    ctx.fillRect(w - 58, y - 34, 78, 68)
    ctx.strokeStyle = 'rgba(185,164,255,.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(-20, y - 34, 78, 68)
    ctx.strokeRect(w - 58, y - 34, 78, 68)
  }

  ctx.restore()

  /* the press bursts into flying pages */
  if (burst > 0) {
    const b = easeOut(burst)
    for (let i = 0; i < pages.length; i++) {
      const pg = pages[i]
      const travelOut = b * pg.d * Math.max(w, h) * 1.15
      const x = w / 2 + Math.cos(pg.a) * travelOut
      const y = h / 2 + Math.sin(pg.a) * travelOut * 0.78
      const sc = pg.scale * (0.35 + b * 2.4)
      const rot = pg.spin * b + Math.sin(time * 2.4 + pg.flutter) * 0.32
      const alpha = clamp(b * 2.6) * (1 - clamp((b - 0.62) / 0.38))
      if (alpha <= 0.01) continue

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      // flutter squashes the page as it turns through the light
      ctx.scale(sc * (0.55 + 0.45 * Math.abs(Math.cos(time * 3 + pg.flutter))), sc)
      ctx.globalAlpha = alpha

      ctx.fillStyle = pg.tint
      ctx.fillRect(-26, -34, 52, 68)
      ctx.fillStyle = 'rgba(17,17,17,.75)'
      ctx.fillRect(-19, -27, 38, 6)
      ctx.fillStyle = 'rgba(17,17,17,.3)'
      for (let k = 0; k < 4; k++) ctx.fillRect(-19, -15 + k * 8, k % 2 ? 24 : 38, 2)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }

  /* vignette */
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.78)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, `rgba(0,0,0,${0.62 * (1 - burst)})`)
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

export default function PressScene({
  progress,
  active = true,
  mobile = false,
}: {
  progress: React.MutableRefObject<number>
  active?: boolean
  mobile?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rows = useMemo(() => buildRows(14), [])
  const pages = useMemo(() => buildPages(mobile ? 110 : 320), [mobile])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    const t0 = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const loop = () => {
      drawPress(ctx, w, h, progress.current, (performance.now() - t0) / 1000, rows, pages)
      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)

    if (!active) {
      drawPress(ctx, w, h, progress.current, 0, rows, pages)
      return () => window.removeEventListener('resize', resize)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [progress, active, rows, pages, mobile])

  return <canvas ref={canvasRef} className="position-absolute inset-0 h-100 w-100" />
}
