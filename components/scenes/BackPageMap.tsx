'use client'

import { useEffect, useRef } from 'react'
import { bureaus } from '@/lib/content'
import { landDots, loadWorld, projectLon, rasterize, type MapDot } from '@/lib/world'

const LON_CENTER = 80

/** 12 · the back-page map: dotted world, India picked out in violet. */
export default function BackPageMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const data = useRef<{ land: MapDot[]; india: MapDot[] } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (!w || !h) return
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const d = data.current
      if (!d) return

      // fit a 2:1 map inside the box
      const mw = Math.min(w, h * 2)
      const mh = mw / 2
      const mx = (w - mw) / 2
      const my = (h - mh) / 2

      ctx.fillStyle = 'rgba(17,17,17,.24)'
      for (const dot of d.land) {
        ctx.beginPath()
        ctx.arc(mx + dot.x * mw, my + dot.y * mh, 0.85, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#6118EA'
      for (const dot of d.india) {
        ctx.beginPath()
        ctx.arc(mx + dot.x * mw, my + dot.y * mh, 1.25, 0, Math.PI * 2)
        ctx.fill()
      }

      // bureaus
      for (const b of bureaus) {
        const x = mx + ((projectLon(b.lon, LON_CENTER) + 180) / 360) * mw
        const y = my + ((90 - b.lat) / 180) * mh
        ctx.fillStyle = b.hq ? '#E10600' : 'rgba(97,24,234,.9)'
        ctx.beginPath()
        ctx.arc(x, y, b.hq ? 3 : 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let alive = true
    loadWorld().then((world) => {
      if (!alive) return
      const landMask = rasterize(world.land, 420, 210, LON_CENTER)
      const indiaMask = rasterize(world.india, 420, 210, LON_CENTER)
      data.current = { land: landDots(landMask, 3), india: landDots(indiaMask, 3) }
      paint()
    })

    paint()
    window.addEventListener('resize', paint)
    return () => {
      alive = false
      window.removeEventListener('resize', paint)
    }
  }, [])

  return <canvas ref={canvasRef} className="h-100 w-100" role="img" aria-label="Bureau map" />
}
