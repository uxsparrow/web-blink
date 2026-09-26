/** 12 · the back-page map: dotted world, India picked out in violet. */

import { bureaus } from '../lib/content.js'
import { landDots, loadWorld, projectLon, rasterize } from '../lib/world.js'

const LON_CENTER = 80

export function mountBackPageMap(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  let data = null

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
    if (!data) return

    // fit a 2:1 map inside the box
    const mw = Math.min(w, h * 2)
    const mh = mw / 2
    const mx = (w - mw) / 2
    const my = (h - mh) / 2

    ctx.fillStyle = 'rgba(17,17,17,.24)'
    for (const dot of data.land) {
      ctx.beginPath()
      ctx.arc(mx + dot.x * mw, my + dot.y * mh, 0.85, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = '#6118EA'
    for (const dot of data.india) {
      ctx.beginPath()
      ctx.arc(mx + dot.x * mw, my + dot.y * mh, 1.25, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const b of bureaus) {
      const x = mx + ((projectLon(b.lon, LON_CENTER) + 180) / 360) * mw
      const y = my + ((90 - b.lat) / 180) * mh
      ctx.fillStyle = b.hq ? '#E10600' : 'rgba(97,24,234,.9)'
      ctx.beginPath()
      ctx.arc(x, y, b.hq ? 3 : 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  loadWorld().then((world) => {
    const landMask = rasterize(world.land, 420, 210, LON_CENTER)
    const indiaMask = rasterize(world.india, 420, 210, LON_CENTER)
    data = { land: landDots(landMask, 3), india: landDots(indiaMask, 3) }
    paint()
  })

  paint()
  window.addEventListener('resize', paint)
}
