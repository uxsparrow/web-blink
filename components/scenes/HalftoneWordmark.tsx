'use client'

import { useEffect, useRef } from 'react'
import { displayFamily } from '@/lib/fonts'

/**
 * A real halftone: the wordmark is rendered to an offscreen canvas, sampled on a
 * grid, and redrawn as dots whose radius tracks the ink coverage of each cell —
 * so the letterforms emerge from dot size, the way newsprint prints them.
 */
export default function HalftoneWordmark({
  text = 'BLINKCMS',
  className = '',
}: {
  text?: string
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (!w || !h) return
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // 1 · render the wordmark offscreen
      const off = document.createElement('canvas')
      off.width = Math.max(1, Math.round(w))
      off.height = Math.max(1, Math.round(h))
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return

      octx.fillStyle = '#fff'
      octx.fillRect(0, 0, off.width, off.height)
      octx.fillStyle = '#000'
      octx.textBaseline = 'middle'
      octx.textAlign = 'center'

      // fit the type to the box
      let size = Math.round(h * 0.94)
      octx.font = `700 ${size}px ${displayFamily()}`
      const target = w * 0.98
      const measured = octx.measureText(text).width
      if (measured > 0) {
        size = Math.max(10, Math.floor(size * (target / measured)))
        octx.font = `700 ${size}px ${displayFamily()}`
      }
      octx.fillText(text, off.width / 2, off.height * 0.54)

      const px = octx.getImageData(0, 0, off.width, off.height).data

      // 2 · sample on a grid and draw dots sized by coverage
      const cell = Math.max(3.4, w / 260)
      const maxR = cell * 0.62

      for (let y = 0; y < h; y += cell) {
        const row = Math.round(y / cell)
        const xOffset = row % 2 ? cell / 2 : 0
        for (let x = xOffset; x < w; x += cell) {
          // average the cell's ink
          let ink = 0
          let n = 0
          const x0 = Math.floor(x)
          const y0 = Math.floor(y)
          for (let sy = 0; sy < cell; sy += 2) {
            for (let sx = 0; sx < cell; sx += 2) {
              const ix = x0 + sx
              const iy = y0 + sy
              if (ix >= off.width || iy >= off.height) continue
              ink += 255 - px[(iy * off.width + ix) * 4]
              n++
            }
          }
          if (!n) continue
          const coverage = ink / n / 255
          if (coverage < 0.04) continue

          const r = Math.sqrt(coverage) * maxR
          // ink at the left, brand violet by the end of the word
          const t = x / w
          const cr = Math.round(17 + t * (97 - 17))
          const cg = Math.round(17 + t * (24 - 17))
          const cb = Math.round(17 + t * (234 - 17))
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`
          ctx.beginPath()
          ctx.arc(x + cell / 2, y + cell / 2, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    render()
    // the display face loads async — re-halftone once it is in
    if (document.fonts?.ready) document.fonts.ready.then(render).catch(() => {})
    window.addEventListener('resize', render)
    return () => window.removeEventListener('resize', render)
  }, [text])

  return (
    <canvas
      ref={canvasRef}
      className={`h-100 w-100 ${className}`}
      role="img"
      aria-label={text}
    />
  )
}
