/**
 * 01 · THE NETWORK — the dot-matrix map of India.
 *
 * Real Natural Earth geometry, same source and same dot treatment as the hero
 * globe, so the first thing after the hero says "same world" before a word is
 * read. Publisher cities pulse on it and thin arcs run back to the Noida desk.
 *
 * The dots assemble as the section scrolls in: every dot starts somewhere
 * random and eases to its place, driven by the scrub, so it reverses when the
 * reader scrolls back up. With reduced motion or no GSAP they are simply
 * already home.
 */

import { onScrub, easeOut, clamp } from '../lib/motion.js'
import { fitCanvas, loop, token } from './dots.js'

/* The cities the brief names, plus the Noida desk every arc runs back to. */
const CITIES = [
  { name: 'NOIDA', lat: 28.5355, lon: 77.391, hq: true },
  { name: 'DELHI', lat: 28.6139, lon: 77.209 },
  { name: 'MUMBAI', lat: 19.076, lon: 72.8777 },
  { name: 'KOLKATA', lat: 22.5726, lon: 88.3639 },
  { name: 'CHENNAI', lat: 13.0827, lon: 80.2707 },
  { name: 'BENGALURU', lat: 12.9716, lon: 77.5946 },
  { name: 'HYDERABAD', lat: 17.385, lon: 78.4867 },
  { name: 'KOCHI', lat: 9.9312, lon: 76.2673 },
  { name: 'KOZHIKODE', lat: 11.2588, lon: 75.7804 },
]

/*
 * The frame. These are only a sensible default for the first paint — the real
 * values are read from the boundary file's own bbox as soon as it lands, so
 * the whole country always fits whatever box the layout gave us.
 */
const BOX = { lon0: 67.0, lon1: 98.5, lat0: 5.5, lat1: 37.5 }

export function mountNetwork(root) {
  const canvas = root.querySelector('[data-net-canvas]')
  const tagWrap = root.querySelector('[data-net-tags]')
  if (!canvas) return null

  let dots = []
  let progress = 1
  const colour = token('--dot', 'rgba(185,166,255,.45)')
  const live = token('--live', '#e5243b')

  /* The projection. Equirectangular, letterboxed into whatever box the flex
     layout gave us, so the map never stretches when the window does. */
  let proj = { s: 1, ox: 0, oy: 0 }
  const fitProjection = ({ w, h }) => {
    const bw = BOX.lon1 - BOX.lon0
    const bh = BOX.lat1 - BOX.lat0
    // 0.86, not 1: the graphic dissolves into the page at its top and bottom
    // 9%, and the whole country has to sit inside the solid middle. A map of
    // India with Ladakh faded out is the bug this section exists to fix.
    const s = Math.min(w / bw, h / bh) * 0.86
    proj = { s, ox: (w - bw * s) / 2, oy: (h - bh * s) / 2 }
  }

  const toXY = (lon, lat) => ({
    x: proj.ox + (lon - BOX.lon0) * proj.s,
    y: proj.oy + (BOX.lat1 - lat) * proj.s,
  })

  /* ── the city labels, in the DOM so they stay crisp ────────── */
  /*
   * Built before `fitCanvas`, which calls its resize callback once
   * immediately — `placeTags` runs from inside that first call, so the array
   * has to exist by then.
   */
  const tags = CITIES.filter(
    (city) => city.hq || ['CHENNAI', 'HYDERABAD', 'KOCHI', 'KOLKATA'].includes(city.name)
  ).map((city) => {
    const el = document.createElement('span')
    el.className = 'meta net__tag'
    el.textContent = city.hq ? 'NOIDA · HQ' : city.name
    if (city.hq) el.style.color = 'var(--txt)'
    tagWrap?.appendChild(el)
    return { el, city }
  })

  function placeTags() {
    tags.forEach(({ el, city }) => {
      const p = toXY(city.lon, city.lat)
      el.style.left = p.x + 'px'
      el.style.top = p.y - 14 + 'px'
    })
  }

  const c = fitCanvas(canvas, (api) => {
    fitProjection(api)
    placeTags()
  })

  /* ── the dots ──────────────────────────────────────────────── */
  /*
   * NOT from data/countries-110m.json, which the globe uses. Natural Earth
   * draws India without Jammu & Kashmir and Ladakh, and a map published in
   * India has to show the official boundary. This file is the Survey of India
   * boundary — see tools/build-india-map.js for the source and what was done
   * to it — and its own bbox drives the projection, so the whole country
   * fits the frame and nothing is cropped.
   */
  fetch('data/india-boundary.json')
    .then((r) => r.json())
    .then((world) => {
    const polys = world.polygons
    const b = world.bbox
    // a little air so the coast is never flush against the edge
    const padX = (b[2] - b[0]) * 0.03
    const padY = (b[3] - b[1]) * 0.03
    BOX.lon0 = b[0] - padX
    BOX.lon1 = b[2] + padX
    BOX.lat0 = b[1] - padY
    BOX.lat1 = b[3] + padY
    fitProjection(c)
    placeTags()

    // rasterise at a fixed resolution and read the mask back as a dot grid
    const RW = 420
    const RH = Math.round((RW * (BOX.lat1 - BOX.lat0)) / (BOX.lon1 - BOX.lon0))
    const mask = rasterizeBox(polys, RW, RH)

    const step = 5
    for (let y = 0; y < RH; y += step) {
      const odd = (y / step) % 2
      for (let x = odd ? step / 2 : 0; x < RW; x += step) {
        if (mask[Math.floor(y) * RW + Math.floor(x)] !== 1) continue
        const lon = BOX.lon0 + (x / RW) * (BOX.lon1 - BOX.lon0)
        const lat = BOX.lat1 - (y / RH) * (BOX.lat1 - BOX.lat0)
        dots.push({
          lon,
          lat,
          // where it starts before it assembles
          jx: (Math.random() - 0.5) * 2,
          jy: (Math.random() - 0.5) * 2,
          d: Math.random(),
        })
      }
    }
  })

  /** Rasterises polygons into India's own box rather than the whole world. */
  function rasterizeBox(polys, w, h) {
    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const ctx = off.getContext('2d', { willReadFrequently: true })
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#fff'
    for (const poly of polys) {
      ctx.beginPath()
      for (const ring of poly) {
        ring.forEach(([lon, lat], i) => {
          const x = ((lon - BOX.lon0) / (BOX.lon1 - BOX.lon0)) * w
          const y = ((BOX.lat1 - lat) / (BOX.lat1 - BOX.lat0)) * h
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
      }
      ctx.fill('nonzero')
    }
    const px = ctx.getImageData(0, 0, w, h).data
    const out = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) out[i] = px[i * 4] > 110 ? 1 : 0
    return out
  }

  /* ── the frame ─────────────────────────────────────────────── */
  const hq = CITIES[0]

  const draw = (t) => {
    const { ctx, w, h } = c
    if (!w) return
    ctx.clearRect(0, 0, w, h)

    // the land
    ctx.fillStyle = colour
    const size = 1.7
    for (const d of dots) {
      // each dot arrives over its own slice of the scrub
      const a = easeOut(clamp((progress - d.d * 0.45) / 0.55))
      if (a <= 0) continue
      const p = toXY(d.lon, d.lat)
      const x = p.x + d.jx * (1 - a) * w * 0.4
      const y = p.y + d.jy * (1 - a) * h * 0.4
      ctx.globalAlpha = 0.18 + 0.42 * a
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    if (progress < 0.5) return
    const settle = clamp((progress - 0.5) / 0.5)
    const hqp = toXY(hq.lon, hq.lat)

    // the arcs back to the desk, each with a light running along it
    ctx.lineWidth = 1
    CITIES.forEach((city, i) => {
      if (city.hq) return
      const p = toXY(city.lon, city.lat)
      const mx = (p.x + hqp.x) / 2
      const my = (p.y + hqp.y) / 2 - Math.hypot(p.x - hqp.x, p.y - hqp.y) * 0.22
      ctx.strokeStyle = `rgba(185,166,255,${0.2 * settle})`
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.quadraticCurveTo(mx, my, hqp.x, hqp.y)
      ctx.stroke()

      // the travelling light
      const k = ((t * 0.22 + i * 0.17) % 1)
      const q = quadAt(p, { x: mx, y: my }, hqp, k)
      ctx.fillStyle = `rgba(245,243,255,${0.75 * settle})`
      ctx.beginPath()
      ctx.arc(q.x, q.y, 1.8, 0, Math.PI * 2)
      ctx.fill()
    })

    // the pulses. Red is a signal, so only the HQ and the two breaking
    // datelines get it; the rest of the network pulses lavender.
    CITIES.forEach((city, i) => {
      const p = toXY(city.lon, city.lat)
      const red = city.hq || city.name === 'CHENNAI' || city.name === 'KOCHI'
      const base = red ? live : '#b9a6ff'
      const phase = (t * 0.55 + i * 0.3) % 1
      const r = 4 + phase * 22

      ctx.strokeStyle = hexA(base, (1 - phase) * 0.55 * settle)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = hexA(base, 0.95 * settle)
      ctx.beginPath()
      ctx.arc(p.x, p.y, city.hq ? 3.6 : 2.4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const quadAt = (a, b, cpt, t) => ({
    x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * b.x + t * t * cpt.x,
    y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * b.y + t * t * cpt.y,
  })

  const hexA = (hex, a) => {
    if (hex.startsWith('rgb')) return hex.replace(/[\d.]+\)$/, a + ')')
    const n = parseInt(hex.slice(1), 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
  }

  fitProjection(c)
  placeTags()
  loop(canvas, draw)

  // the assembly is scrubbed, so it runs backwards on the way up
  onScrub(
    root.closest('.ed') || root,
    (p) => {
      progress = clamp(p * 2.2)
      tags.forEach(({ el }) => (el.style.opacity = String(clamp((progress - 0.55) / 0.3))))
    },
    { start: 'top bottom', end: 'center center', scrub: 0.6 }
  )

  return { draw }
}
