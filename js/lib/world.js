/**
 * Real Natural Earth land geometry (world-atlas 110m TopoJSON, in data/),
 * rasterised in the browser into a land mask. Used by:
 *   · the preloader halftone map (equirectangular, centred on India)
 *   · the hero globe (dots placed on land only)
 *   · the footer back-page map (India picked out in violet)
 * No hand-drawn continents anywhere.
 *
 * `topojson` is a global, loaded by vendor/topojson-client.min.js.
 */

import topoWorld from '../../data/countries-110m.json'

let worldCache = null
let worldPromise = null

function collectPolys(gj) {
  const out = []
  const walk = (geom) => {
    if (!geom) return
    if (geom.type === 'Polygon') out.push(geom.coordinates)
    else if (geom.type === 'MultiPolygon') geom.coordinates.forEach((p) => out.push(p))
    else if (geom.type === 'GeometryCollection') geom.geometries.forEach(walk)
  }
  if (gj?.type === 'FeatureCollection') gj.features.forEach((f) => walk(f.geometry))
  else if (gj?.type === 'Feature') walk(gj.geometry)
  else walk(gj)
  return out
}

export function loadWorld() {
  if (worldCache) return Promise.resolve(worldCache)
  if (worldPromise) return worldPromise
  const processTopo = (topo) => {
    const land = collectPolys(window.topojson.feature(topo, topo.objects.land))
    const countries = window.topojson.feature(topo, topo.objects.countries)
    const ind = countries.features.find(
      (f) => String(f.id) === '356' || f.properties?.name === 'India'
    )
    worldCache = { land, india: ind ? collectPolys(ind) : [] }
    return worldCache
  }
  worldPromise = Promise.resolve(processTopo(topoWorld))
  return worldPromise
}

/* ── projection ───────────────────────────────────────────────── */

/** Equirectangular, with longitudes rotated so `lonCenter` sits mid-canvas. */
export function projectLon(lon, lonCenter) {
  let l = lon - lonCenter
  while (l <= -180) l += 360
  while (l > 180) l -= 360
  return l
}

function traceRing(ctx, ring, w, h, lonCenter, dx) {
  let prev = 0
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i]
    let l = projectLon(lon, lonCenter)
    // keep the ring continuous across the seam instead of smearing it
    if (i > 0) {
      while (l - prev > 180) l -= 360
      while (prev - l > 180) l += 360
    }
    prev = l
    const x = ((l + 180) / 360) * w + dx
    const y = ((90 - lat) / 180) * h
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function fillPolys(ctx, polys, w, h, lonCenter = 0) {
  // draw three times so shapes straddling the seam land correctly
  for (const dx of [-w, 0, w]) {
    for (const poly of polys) {
      ctx.beginPath()
      for (const ring of poly) traceRing(ctx, ring, w, h, lonCenter, dx)
      ctx.fill('nonzero')
    }
  }
}

/* ── land mask ────────────────────────────────────────────────── */

export function rasterize(polys, w, h, lonCenter = 0) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#fff'
  fillPolys(ctx, polys, w, h, lonCenter)
  const px = ctx.getImageData(0, 0, w, h).data
  const data = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) data[i] = px[i * 4] > 110 ? 1 : 0
  return { w, h, data, lonCenter }
}

export function sampleMask(mask, lon, lat) {
  const l = projectLon(lon, mask.lonCenter)
  const x = Math.floor(((l + 180) / 360) * mask.w)
  const y = Math.floor(((90 - lat) / 180) * mask.h)
  if (x < 0 || y < 0 || x >= mask.w || y >= mask.h) return false
  return mask.data[y * mask.w + x] === 1
}

/* ── dot grids ────────────────────────────────────────────────── */

/** Staggered dot grid over land only — the halftone map. */
export function landDots(mask, step) {
  const dots = []
  let row = 0
  for (let y = 0; y < mask.h; y += step, row++) {
    const offset = row % 2 ? step / 2 : 0
    for (let x = offset; x < mask.w; x += step) {
      const ix = Math.floor(x)
      const iy = Math.floor(y)
      if (mask.data[iy * mask.w + ix] !== 1) continue
      dots.push({
        x: x / mask.w,
        y: y / mask.h,
        lon: (x / mask.w) * 360 - 180 + mask.lonCenter,
        lat: 90 - (y / mask.h) * 180,
      })
    }
  }
  return dots
}

/** Evenly spread points on a unit sphere (Fibonacci lattice). */
export function fibonacciSphere(count) {
  const out = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    out.push({
      lat: (Math.asin(y) * 180) / Math.PI,
      lon: (Math.atan2(Math.sin(theta) * radius, Math.cos(theta) * radius) * 180) / Math.PI,
    })
  }
  return out
}

/** lat/lon → cartesian on a sphere of radius r (y up, 0°/0° faces +z). */
export function latLonToVec3(lat, lon, r = 1) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}
