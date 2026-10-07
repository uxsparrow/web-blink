/**
 * Builds data/india-boundary.json — the land mask behind section 01's dot map.
 *
 * THIS IS NOT A BUILD STEP. The site has no toolchain and does not need one;
 * this is a one-off generator, like the subsetted fonts in fonts/. Run it only
 * if the boundary source changes. The file it writes is committed.
 *
 *     node tools/build-india-map.js
 *
 * WHY A SEPARATE SOURCE AT ALL. The rest of the page draws land from
 * data/countries-110m.json (Natural Earth, via world.js), and Natural Earth
 * draws India without Jammu & Kashmir and Ladakh. A map published in India
 * has to show the official boundary, so section 01 uses this file instead.
 *
 * SOURCE. datameet/maps, Country/india-composite.geojson — "the land area of
 * India including disputed territories in accordance with the Official
 * boundary of India as per the Survey of India", released CC-0:
 *   https://github.com/datameet/maps/tree/master/Country
 * Compiled there from the US State Department LSIB, the Pakistan admin
 * boundaries dataset and Natural Earth's breakaway/disputed areas.
 *
 * WHAT THIS DOES TO IT. The source is 10.7 MB and 252,604 points, which is
 * absurd for a mask that gets rasterised to about 420px across. Ring areas
 * below the threshold are dropped, the rest are simplified with
 * Douglas-Peucker and rounded to three decimals (~110m, far finer than one
 * dot). The result is around 1% of the original and visually identical at
 * every size this page draws it.
 */

const fs = require('fs')
const path = require('path')

const SRC = process.argv[2] || 'india-composite.geojson'
const OUT = path.join(__dirname, '..', 'data', 'india-boundary.json')

/** Degrees. One dot is ~0.07° at the sizes this is drawn, so 0.008 is safe. */
const TOLERANCE = 0.008
/** Square degrees. Below this a ring is smaller than a single dot. */
const MIN_AREA = 0.004
const PRECISION = 3

/* ── Douglas-Peucker ───────────────────────────────────────────── */

function sqSegDist(p, a, b) {
  let x = a[0]
  let y = a[1]
  let dx = b[0] - x
  let dy = b[1] - y
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)
    if (t > 1) {
      x = b[0]
      y = b[1]
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }
  dx = p[0] - x
  dy = p[1] - y
  return dx * dx + dy * dy
}

function simplify(points, tolerance) {
  if (points.length <= 3) return points
  const sqTol = tolerance * tolerance
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1

  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [first, last] = stack.pop()
    let maxDist = 0
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const d = sqSegDist(points[i], points[first], points[last])
      if (d > maxDist) {
        maxDist = d
        index = i
      }
    }
    if (maxDist > sqTol && index > 0) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

/** Shoelace, in square degrees. Only used to decide what is too small to see. */
function ringArea(ring) {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return Math.abs(sum / 2)
}

const round = (v) => Number(v.toFixed(PRECISION))

/* ── run ───────────────────────────────────────────────────────── */

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'))
const polys = []
const collect = (geom) => {
  if (!geom) return
  if (geom.type === 'Polygon') polys.push(geom.coordinates)
  else if (geom.type === 'MultiPolygon') geom.coordinates.forEach((p) => polys.push(p))
  else if (geom.type === 'GeometryCollection') geom.geometries.forEach(collect)
}
;(raw.features || [raw]).forEach((f) => collect(f.geometry || f))

let before = 0
let after = 0
const out = []

for (const poly of polys) {
  const rings = []
  for (const ring of poly) {
    before += ring.length
    if (ringArea(ring) < MIN_AREA) continue
    const simplified = simplify(ring, TOLERANCE).map((p) => [round(p[0]), round(p[1])])
    // a ring needs four points to enclose anything once it is closed
    if (simplified.length < 4) continue
    after += simplified.length
    rings.push(simplified)
  }
  // the outer ring went, so its holes have nothing to punch through
  if (rings.length) out.push(rings)
}

let minx = Infinity
let miny = Infinity
let maxx = -Infinity
let maxy = -Infinity
for (const poly of out) {
  for (const ring of poly) {
    for (const [x, y] of ring) {
      if (x < minx) minx = x
      if (x > maxx) maxx = x
      if (y < miny) miny = y
      if (y > maxy) maxy = y
    }
  }
}

const doc = {
  note:
    'Official boundary of India per the Survey of India, including Jammu & Kashmir ' +
    'and Ladakh. Simplified from datameet/maps Country/india-composite.geojson (CC-0) ' +
    'by tools/build-india-map.js — do not hand-edit.',
  bbox: [minx, miny, maxx, maxy],
  polygons: out,
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(doc))

const kb = (fs.statSync(OUT).size / 1024).toFixed(1)
console.log(
  `${polys.length} polygons -> ${out.length}; ${before} points -> ${after}; ` +
    `${kb} kB; bbox ${doc.bbox.join(', ')}`
)
