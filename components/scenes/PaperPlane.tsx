'use client'

import { useEffect, useRef } from 'react'
import { easeInOut } from '@/lib/motion'

/**
 * 07 · a giant paper plane folded from a front page — masthead and print still
 * visible on the wing — glides in from the right and loops out with scroll.
 */

function bezier(t: number, p0: number[], p1: number[], p2: number[], p3: number[]) {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ]
}

function drawPlane(ctx: CanvasRenderingContext2D, scale: number) {
  const S = scale

  // far wing (in shadow)
  ctx.beginPath()
  ctx.moveTo(78 * S, 0)
  ctx.lineTo(-44 * S, 4 * S)
  ctx.lineTo(-62 * S, 36 * S)
  ctx.closePath()
  ctx.fillStyle = '#e4e0d6'
  ctx.fill()
  ctx.strokeStyle = 'rgba(17,17,17,.22)'
  ctx.lineWidth = 1
  ctx.stroke()

  // near wing (lit) — this is the printed face
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(78 * S, 0)
  ctx.lineTo(-62 * S, -40 * S)
  ctx.lineTo(-44 * S, 4 * S)
  ctx.closePath()
  const g = ctx.createLinearGradient(-62 * S, -40 * S, 78 * S, 4 * S)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(1, '#f6f4ee')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(17,17,17,.26)'
  ctx.lineWidth = 1
  ctx.stroke()

  // the front page still printed on the wing
  ctx.clip()
  ctx.fillStyle = 'rgba(17,17,17,.82)'
  ctx.fillRect(-52 * S, -32 * S, 62 * S, 6 * S)
  ctx.fillStyle = 'rgba(225,6,0,.85)'
  ctx.fillRect(-52 * S, -22 * S, 14 * S, 4 * S)
  ctx.fillStyle = 'rgba(17,17,17,.34)'
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(-52 * S + i * 3 * S, -14 * S + i * 7 * S, (58 - i * 6) * S, 2.4 * S)
  }
  ctx.restore()

  // centre crease
  ctx.beginPath()
  ctx.moveTo(78 * S, 0)
  ctx.lineTo(-44 * S, 4 * S)
  ctx.strokeStyle = 'rgba(17,17,17,.3)'
  ctx.lineWidth = 1.2
  ctx.stroke()
}

export default function PaperPlane({
  progress,
  active = true,
}: {
  progress: React.MutableRefObject<number>
  active?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const render = (time: number) => {
      ctx.clearRect(0, 0, w, h)
      const t = easeInOut(Math.min(1, Math.max(0, progress.current)))

      // glides in from the right, loops through the copy, exits low left
      const p0 = [w * 1.22, h * 0.1]
      const p1 = [w * 0.42, h * 0.02]
      const p2 = [w * 0.16, h * 0.72]
      const p3 = [-w * 0.3, h * 0.42]

      const [x, y] = bezier(t, p0, p1, p2, p3)
      const [nx, ny] = bezier(Math.min(1, t + 0.012), p0, p1, p2, p3)
      const angle = Math.atan2(ny - y, nx - x)

      const bob = Math.sin(time * 1.6) * 6
      const scale = (Math.min(w, 1400) / 1400) * (1.5 - 0.55 * t)
      const fade = Math.min(1, t * 7) * Math.min(1, (1 - t) * 6)
      if (fade <= 0.01) return

      ctx.save()
      ctx.translate(x, y + bob)
      ctx.rotate(angle + Math.sin(time * 1.2) * 0.05)
      ctx.globalAlpha = fade

      // soft shadow so it reads as flying over the page
      ctx.save()
      ctx.translate(10, 22)
      ctx.globalAlpha = fade * 0.12
      ctx.filter = 'blur(6px)'
      drawPlane(ctx, scale)
      ctx.restore()

      drawPlane(ctx, scale)
      ctx.restore()
    }

    const loop = () => {
      render((performance.now() - t0) / 1000)
      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)

    if (!active) {
      render(0)
      return () => window.removeEventListener('resize', resize)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [progress, active])

  return <canvas ref={canvasRef} className="pe-none position-absolute inset-0 h-100 w-100" />
}
