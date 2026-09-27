import { clamp, easeOut, lerp, seg } from '../lib/motion.js'
import { mountScene } from '../lib/canvas-scene.js'

/**
 * 05 · OUR PLATFORM — the surface the modules stand on.
 *
 * The section says "Everything your newsroom needs. Under one platform," and
 * shows six module cards. So the canvas draws the platform itself: a single
 * slab in perspective, running the full width, with the card grid standing on
 * its far edge. Each column of cards casts a reflection down the surface in
 * its own accent, and a plinth lights under it as its cards land.
 *
 * **This is the fourth version, and the first that is not about travel.** The
 * first was a print conveyor. The second translated it element by element —
 * screens riding a belt — which was a factory in digital dress. The third made
 * it a delivery line with four channel taps, and it still read as a road: a
 * black band with dashes, cards floating above it, and four curves peeling off
 * to nowhere.
 *
 * > The diagnosis worth keeping: all three drew **throughput** while the
 * > section is about **breadth**. The canvas said "one thing moving along"
 * > while the six cards beside it said "six things, side by side", and the
 * > cards won, because they carry the words. Worse, 06 · HOW IT WORKS now owns
 * > the flow — so a flow here says the same thing twice. A platform is a
 * > foundation, so draw a foundation.
 *
 * The structure is deliberately still. Only the light moves across it: a
 * foundation that slides is not a foundation, and movement here is what
 * dragged the three earlier versions back toward a conveyor.
 *
 * At the end the slab rotates edge-on and becomes the ink strip that carries
 * into 06 · HOW IT WORKS and on to 07 · LIVE. That hand-off is why the tilt
 * exists — and a plane turning away from the viewer is finally a reason for it,
 * rather than a camera move with nothing behind it.
 */

const INK = '#111111'
const VIOLET = '#6118EA'
const RED = '#E10600'

/**
 * The accent each grid column carries, left to right.
 *
 * The six cards cycle ink / violet / red in `index.html`, and at three-up that
 * happens to put one accent per column — 01 and 04 are both ink, 02 and 05 both
 * violet, 03 and 06 both red. That is what lets a column have a single colour
 * to reflect. Re-ordering the cards breaks it.
 */
const COLUMN_ACCENTS = [INK, VIOLET, RED]

/** How much wider the near edge is than the far edge. */
const SPREAD = 1.85

/**
 * Bootstrap's grid, recomputed in canvas space, because the reflections and
 * plinths have to land under the real columns. `.shell` is `max-width: 1560px`
 * with `clamp(16px, 3.4vw, 54px)` of inline padding, and `.platform-cards` is
 * `row-cols-lg-3`. **If either changes, this changes with it** — there is no
 * way to read it off the DOM from inside a canvas scene, and measuring the
 * cards would couple the loop to layout that GSAP is mid-animating.
 */
function columnCentre(w, i, cols) {
  const pad = clamp(w * 0.034, 16, 54)
  const shellW = Math.min(w, 1560)
  return (w - shellW) / 2 + pad + (i + 0.5) * ((shellW - pad * 2) / cols)
}

/**
 * World depth → screen depth.
 *
 * A floor's transverse lines bunch toward the horizon. Spacing them evenly
 * reads as a flat chequerboard standing on its edge, not as a plane going away
 * from you.
 */
const depthToV = (z) => z / (z + 1)

/** A point on the slab's surface: u across (−1…1), v depth (0 near, 1 far). */
function surf(u, v, w, nearY, farY) {
  const k = lerp(SPREAD, 1, v)
  return [w / 2 + u * (w / 2) * k, lerp(nearY, farY, v)]
}

/** The slab's outline, near edge first, for clipping the light to it. */
function slabPath(ctx, w, nearY, farY) {
  const [lNear, yNear] = surf(-1, 0, w, nearY, farY)
  const [rNear] = surf(1, 0, w, nearY, farY)
  const [lFar, yFar] = surf(-1, 1, w, nearY, farY)
  const [rFar] = surf(1, 1, w, nearY, farY)
  ctx.beginPath()
  ctx.moveTo(lNear, yNear)
  ctx.lineTo(rNear, yNear)
  ctx.lineTo(rFar, yFar)
  ctx.lineTo(lFar, yFar)
  ctx.closePath()
}

/**
 * How many columns the card grid is in. `.platform-cards` is
 * `row-cols-2 row-cols-lg-3`, and lg is 1024px in this project's Tailwind
 * breakpoints — so this has to move if that class does.
 */
const gridCols = (w) => (w >= 1024 ? 3 : 2)

/**
 * How lit a column is. Its cards unfold at `0.06 + i * 0.125` over 0.6 of the
 * pinned timeline (see `setupPins` in main.js), and column j holds every card
 * from j on in steps of `cols`. Each contributes equally, so a column reaches
 * full only once all of its cards have landed — which is the point of drawing
 * it at all.
 */
function columnLit(p, j, cols) {
  let sum = 0
  let n = 0
  for (let i = j; i < 6; i += cols) {
    sum += easeOut(seg(p, 0.06 + i * 0.125, 0.66 + i * 0.125))
    n++
  }
  return n ? sum / n : 0
}

/**
 * The accent a column reflects.
 *
 * At three-up the cards' ink / violet / red cycle lines up with the columns —
 * 01 and 04 are both ink, 02 and 05 violet, 03 and 06 red — so a column has a
 * single colour and can reflect it. At two-up the cycle and the columns fall
 * out of step (column 0 holds ink, red *and* violet), so the reflections go
 * neutral rather than letting one card's colour stand for three.
 */
const columnAccent = (j, cols) => (cols === 3 ? COLUMN_ACCENTS[j] : INK)

function drawPlatform(ctx, w, h, p, time) {
  const tilt = seg(p, 0.82, 1) // the slab rotates edge-on at the end

  /*
   * Narrow screens have no surface to show. Two-up, the six cards run to about
   * 0.89h and the foot labels sit at 0.94h — 44px of clear canvas at 390×820.
   * The slab is drawn edge-on there for the whole scene, which is honest: the
   * platform is still under everything, there is just no room to look across
   * it. It still widens for the hand-off.
   */
  const narrow = w < 700
  const cols = gridCols(w)

  if (narrow) {
    const top = h * 0.893
    const faceH = lerp(14, 30, tilt)
    drawFace(ctx, w, top, faceH)
    // each column still registers, as a mark on the edge rather than a
    // reflection — there is no surface for one to fall on
    for (let j = 0; j < cols; j++) {
      const cx = columnCentre(w, j, cols)
      ctx.globalAlpha = columnLit(p, j, cols) * (1 - tilt)
      ctx.fillStyle = columnAccent(j, cols)
      ctx.fillRect(cx - 16, top - 3, 32, 3)
    }
    ctx.globalAlpha = 1
    return
  }

  /*
   * The far edge sits where the card grid's feet are — 0.615h against a
   * measured 556px of 900 — so the block meets the slab rather than hovering
   * over it. The near edge bleeds toward the viewer, and both collapse onto
   * the strip as the slab turns.
   */
  const farY = lerp(h * 0.615, h * 0.72, tilt)
  const nearY = lerp(h * 0.895, h * 0.72, tilt)
  const faceTop = nearY
  const faceH = lerp(26, Math.min(w * 0.12, 180), tilt)
  const open = 1 - tilt

  if (open > 0.01) {
    ctx.save()
    slabPath(ctx, w, nearY, farY)
    ctx.clip()
    ctx.globalAlpha = open

    /* the surface: lighter as it goes away, so it reads as lying down */
    const g = ctx.createLinearGradient(0, nearY, 0, farY)
    g.addColorStop(0, 'rgba(17,17,17,.055)')
    g.addColorStop(1, 'rgba(17,17,17,.012)')
    ctx.fillStyle = g
    ctx.fillRect(0, farY, w, nearY - farY)

    drawGrid(ctx, w, nearY, farY)
    drawSweep(ctx, w, nearY, farY, time)
    drawReflections(ctx, w, nearY, farY, p, cols)

    ctx.restore()
    ctx.globalAlpha = 1

    drawSeating(ctx, w, farY, nearY, p, open, cols)
  }

  drawFace(ctx, w, faceTop, faceH)
}

/** The slab's own structure: rules running away, and rules across it. */
function drawGrid(ctx, w, nearY, farY) {
  ctx.strokeStyle = 'rgba(17,17,17,.10)'
  ctx.lineWidth = 1

  for (let i = -6; i <= 6; i++) {
    const u = i / 6
    const [x0, y0] = surf(u, 0, w, nearY, farY)
    const [x1, y1] = surf(u, 1, w, nearY, farY)
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }

  // transverse, at perspective depths rather than even ones
  for (let z = 0.12; z < 14; z *= 1.62) {
    const v = depthToV(z)
    const [xl, y] = surf(-1, v, w, nearY, farY)
    const [xr] = surf(1, v, w, nearY, farY)
    ctx.beginPath()
    ctx.moveTo(xl, y)
    ctx.lineTo(xr, y)
    ctx.stroke()
  }
}

/**
 * The only thing that moves. A foundation that slides is not a foundation, so
 * the structure stays put and the light crosses it — which is also what keeps
 * a stationary section from reading as a diagram.
 */
function drawSweep(ctx, w, nearY, farY, time) {
  const cx = w * (0.5 + 0.62 * Math.sin(time * 0.22))
  const r = w * 0.4
  const g = ctx.createRadialGradient(cx, (nearY + farY) / 2, 0, cx, (nearY + farY) / 2, r)
  g.addColorStop(0, 'rgba(97,24,234,.13)')
  g.addColorStop(0.55, 'rgba(97,24,234,.05)')
  g.addColorStop(1, 'rgba(97,24,234,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, farY, w, nearY - farY)
}

/** One reflection per column, falling from the cards' feet toward the viewer. */
function drawReflections(ctx, w, nearY, farY, p, cols) {
  for (let j = 0; j < cols; j++) {
    const lit = columnLit(p, j, cols)
    if (lit < 0.01) continue

    const cx = columnCentre(w, j, cols)
    const u = (cx - w / 2) / (w / 2)
    const halfU = ((w / cols) * 0.34) / (w / 2)

    const [xlF, yF] = surf(u - halfU, 1, w, nearY, farY)
    const [xrF] = surf(u + halfU, 1, w, nearY, farY)
    const [xlN, yN] = surf(u - halfU * 1.5, 0, w, nearY, farY)
    const [xrN] = surf(u + halfU * 1.5, 0, w, nearY, farY)

    const g = ctx.createLinearGradient(0, yF, 0, yN)
    const c = columnAccent(j, cols)
    g.addColorStop(0, hexA(c, 0.3 * lit))
    g.addColorStop(0.45, hexA(c, 0.1 * lit))
    g.addColorStop(1, hexA(c, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(xlF, yF)
    ctx.lineTo(xrF, yF)
    ctx.lineTo(xrN, yN)
    ctx.lineTo(xlN, yN)
    ctx.closePath()
    ctx.fill()
  }
}

/** Where the grid meets the slab: a contact shadow, and a plinth per column. */
function drawSeating(ctx, w, farY, nearY, p, open, cols) {
  ctx.save()
  ctx.globalAlpha = open

  // the shadow the whole block casts, softening away from its feet
  const g = ctx.createLinearGradient(0, farY, 0, farY + (nearY - farY) * 0.22)
  g.addColorStop(0, 'rgba(17,17,17,.19)')
  g.addColorStop(1, 'rgba(17,17,17,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, farY, w, (nearY - farY) * 0.22)

  ctx.fillStyle = 'rgba(17,17,17,.22)'
  ctx.fillRect(0, farY - 1, w, 1.5)

  for (let j = 0; j < cols; j++) {
    const lit = columnLit(p, j, cols)
    const cx = columnCentre(w, j, cols)
    const half = Math.min(w / cols, 470) * 0.5 - 6

    ctx.fillStyle = 'rgba(17,17,17,.3)'
    ctx.fillRect(cx - half, farY - 2, half * 2, 2.5)

    if (lit > 0.01) {
      ctx.fillStyle = hexA(columnAccent(j, cols), 0.9 * lit)
      ctx.fillRect(cx - half * lit, farY - 2, half * 2 * lit, 2.5)
    }
  }
  ctx.restore()
}

/**
 * The slab's front face — its thickness, seen edge-on. At rest it is a 26px
 * lip under the surface; by the end it has grown into the ink strip 06 opens
 * on.
 *
 * It carries **no dashes**. The old delivery line ran ticks along here and
 * they were most of why the whole thing read as a road — a black band with a
 * broken white centre line is a carriageway before it is anything else. 06
 * opens on a continuous ink line, so a clean band is also the truer hand-off.
 */
function drawFace(ctx, w, top, faceH) {
  ctx.fillStyle = INK
  ctx.fillRect(0, top, w, faceH)
}

/** #rrggbb + alpha, since the accents are shared with the DOM as hex. */
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/** 05 · OUR PLATFORM — one slab, six modules standing on it. */
export function mountPlatform(canvas) {
  return mountScene(canvas, (ctx, w, h, p, t) => drawPlatform(ctx, w, h, p, t))
}
