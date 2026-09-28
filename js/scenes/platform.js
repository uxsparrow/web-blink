import { clamp, easeOut, lerp, seg, reducedMotion } from '../lib/motion.js'
import { mountScene } from '../lib/canvas-scene.js'

/**
 * 05 · OUR PLATFORM — the swell, and the deck that holds level above it.
 *
 * A field of dots runs away to a horizon in perspective and moves like a slow
 * sea. Along that horizon sits a hard ink rule, and the six module cards stand
 * on it. **The sea moves; the deck does not.** That contrast is the section's
 * argument, and it is one the page already makes in words a few sections down:
 * traffic spikes scale automatically, 43K concurrent readers, zero downtime.
 *
 * Each column's accent falls on the water beneath it as its cards land, so the
 * six modules are visibly the things the deck is carrying.
 *
 * ── the versions before this one ──────────────────────────────────
 *
 * | # | drew | failed because |
 * |---|---|---|
 * | 1 | a print conveyor, newspapers on a belt | print; the product is digital-only |
 * | 2 | the same belt carrying phones and tablets | screens do not ride conveyors — a factory in digital dress |
 * | 3 | a delivery line, a junction, four channel taps | read as a **road**: black band, dashed ticks, curves to nowhere |
 * | 4 | a lit slab in perspective with colour washes | right idea, wrong surface — gridlines and three big gradient triangles read as a lit stage floor |
 *
 * > **What versions 1–3 got wrong** was subject: they drew *throughput* while
 * > the section is about *breadth*, and the six cards beside them said
 * > "six things, side by side" louder, because they carry the words. Version 4
 * > fixed the subject — a platform is a foundation, so draw a foundation — and
 * > got the material wrong instead. Ruled floors and gradient washes are not
 * > this site's language. **Dots are.** The globe, the preloader map, the
 * > desk's wall map and the wordmark are all dot fields, so the platform is one
 * > too.
 *
 * The rule from version 4 still stands and is sharpened here: the structure is
 * still and only the surface moves. Earlier it was light crossing a static
 * floor; now the sea moves under a deck that does not, which is the same
 * principle doing visible work rather than just decorating.
 *
 * At the end the deck rule thickens into the ink strip that carries into
 * 06 · HOW IT WORKS and on to 07 · LIVE, and the sea fades under it.
 */

const INK = '#111111'
const VIOLET = '#6118EA'
const RED = '#E10600'

/**
 * The accent each grid column carries, left to right.
 *
 * The six cards cycle ink / violet / red in `index.html`, and at three-up that
 * puts one accent per column — 01 and 04 ink, 02 and 05 violet, 03 and 06 red.
 * Re-ordering the cards breaks it.
 */
const COLUMN_ACCENTS = [INK, VIOLET, RED]

const ROWS = 54
const COLS = 84
/** How much wider the near edge of the water is than the horizon. */
const SPREAD = 2.3

/**
 * How many columns the card grid is in. `.platform-cards` is
 * `row-cols-2 row-cols-lg-3`, and lg is 1024px in this project's Tailwind
 * breakpoints — so this has to move if that class does.
 */
const gridCols = (w) => (w >= 1024 ? 3 : 2)

/**
 * Bootstrap's grid, recomputed in canvas space, because the accents have to
 * fall under the real columns. `.shell` is `max-width: 1560px` with
 * `clamp(16px, 3.4vw, 54px)` of inline padding. **If that changes, this does.**
 * Reading it off the DOM is not an option from inside a canvas loop, and
 * measuring the cards would couple this to layout GSAP is mid-animating.
 */
function columnEdges(w, i, cols) {
  const pad = clamp(w * 0.034, 16, 54)
  const shellW = Math.min(w, 1560)
  const x0 = (w - shellW) / 2 + pad
  const colW = (shellW - pad * 2) / cols
  return [x0 + i * colW, x0 + (i + 1) * colW]
}

/**
 * How lit a column is. Its cards unfold at `0.06 + i * 0.125` over 0.6 of the
 * pinned timeline (see `setupPins` in main.js), and column j holds every card
 * from j on in steps of `cols`.
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
 * The accent a column's water takes. At three-up the card cycle lines up with
 * the columns so each has one colour. At two-up it does not — column 0 holds
 * ink, red *and* violet — so the water stays ink rather than letting one
 * card's colour stand for three.
 */
const columnAccent = (j, cols) => (cols === 3 ? COLUMN_ACCENTS[j] : INK)

/** #rrggbb + alpha, since the accents are shared with the DOM as hex. */
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/**
 * Ink → accent by `t`, so a column's water only takes colour as its cards
 * land. Fading alpha alone is not enough: it leaves an unlit column already
 * fully coloured, just fainter, and the six cards then look lit before they
 * have arrived.
 */
function mixInk(hex, t, a) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(lerp(17, (n >> 16) & 255, t))
  const g = Math.round(lerp(17, (n >> 8) & 255, t))
  const b = Math.round(lerp(17, n & 255, t))
  return `rgba(${r},${g},${b},${a})`
}

/**
 * The water.
 *
 * Dots are bucketed by the column they fall under and filled one path per
 * bucket — four fills for ~3,300 dots, the same batching `desk.js` uses for
 * its wall map. Per-dot alpha would mean per-dot fills, so the fade toward the
 * horizon is carried by dot *size* instead, which is what a halftone does
 * anyway and is why this reads as part of the same family.
 */
function drawWater(ctx, w, h, horizonY, nearY, time, p, cols, fade) {
  const buckets = [[], [], [], []] // 0 = open water, 1..3 = under a column
  const edges = []
  for (let j = 0; j < cols; j++) edges.push(columnEdges(w, j, cols))

  const amp = (nearY - horizonY) * 0.115
  const unit = clamp(w / 1440, 0.72, 1.35)

  for (let r = 0; r <= ROWS; r++) {
    /*
     * v has to cover 0 to 1, or the field never reaches the foreground and the
     * near water comes out empty. The power is what bunches rows toward the
     * horizon — spacing them evenly reads as a chequerboard standing on edge.
     */
    const v = 1 - Math.pow(1 - r / ROWS, 2.6)
    const rowY = lerp(nearY, horizonY, v)
    const spread = lerp(SPREAD, 1, v)
    // the swell flattens with distance, as a real one does
    const near = 1 - v
    // the field dissolves at the very front instead of ending on a line, which
    // also keeps the biggest dots off the foot labels
    const hem = clamp(v / 0.14)

    for (let c = 0; c <= COLS; c++) {
      const u = (c / COLS) * 2 - 1
      const x = w / 2 + u * (w / 2) * spread
      if (x < -20 || x > w + 20) continue

      const swell =
        Math.sin(u * 3.1 + v * 5.4 - time * 0.55) + 0.62 * Math.sin(u * 1.7 - v * 3.1 + time * 0.37)
      const y = rowY - swell * amp * near

      /*
       * Crests carry bigger dots. Size is the only channel available for the
       * swell and the distance fade both, because a per-dot alpha would mean a
       * per-dot fill — the whole field is four paths, not 3,000.
       *
       * The floor matters: at a lower one the troughs fall under the cull
       * below and drop out entirely, and the swell then reads as patchy
       * density rather than as water moving.
       */
      const crest = 0.7 + 0.3 * swell * 0.5
      const s = lerp(5.2, 0.62, v) * crest * hem * unit
      if (s < 0.22 || y > h + 4 || y < horizonY - 2) continue

      let b = 0
      for (let j = 0; j < cols; j++) {
        if (x >= edges[j][0] && x <= edges[j][1]) {
          b = j + 1
          break
        }
      }
      buckets[b].push(x, y, s)
    }
  }

  const paint = (arr, style) => {
    if (!arr.length) return
    ctx.fillStyle = style
    ctx.beginPath()
    for (let i = 0; i < arr.length; i += 3) ctx.rect(arr[i], arr[i + 1], arr[i + 2], arr[i + 2])
    ctx.fill()
  }

  paint(buckets[0], hexA(INK, 0.42 * fade))
  for (let j = 0; j < cols; j++) {
    const lit = columnLit(p, j, cols)
    // an unlit column's water is the same ink as the open sea around it
    paint(buckets[j + 1], mixInk(columnAccent(j, cols), lit, (0.42 + 0.34 * lit) * fade))
  }
}

/**
 * The deck: a hard ink rule the cards stand on, and at the end the strip that
 * hands off to 06. It never moves with the water — that is the whole point —
 * and it carries no dashes, which is what made version 3 read as a road.
 */
function drawDeck(ctx, w, top, height, fade) {
  if (fade > 0.01) {
    // the water darkens where it meets the hull
    const g = ctx.createLinearGradient(0, top + height, 0, top + height + 34)
    g.addColorStop(0, `rgba(17,17,17,${0.16 * fade})`)
    g.addColorStop(1, 'rgba(17,17,17,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, top + height, w, 34)
  }
  ctx.fillStyle = INK
  ctx.fillRect(0, top, w, height)
}

function drawPlatform(ctx, w, h, p, time) {
  const still = reducedMotion()
  const t = still ? 0 : time
  const tilt = seg(p, 0.82, 1)
  const cols = gridCols(w)

  /*
   * Narrow screens have no water to show. Two-up the six cards run to 0.89h and
   * the foot labels sit at 0.94h — 44px of clear canvas at 390×820. The deck is
   * drawn alone there, which is honest: it is still holding everything up,
   * there is just no room to see what it is holding it above.
   */
  if (w < 700) {
    const top = h * 0.893
    drawDeck(ctx, w, top, lerp(14, 30, tilt), 0)
    for (let j = 0; j < cols; j++) {
      const [a, b] = columnEdges(w, j, cols)
      ctx.globalAlpha = columnLit(p, j, cols) * (1 - tilt)
      ctx.fillStyle = columnAccent(j, cols)
      ctx.fillRect(a + 6, top - 3, b - a - 12, 3)
    }
    ctx.globalAlpha = 1
    return
  }

  /*
   * The horizon sits where the card grid's feet are — 0.615h against a measured
   * 556px of 900 — so the block stands on the deck rather than hovering over
   * it. As the scene ends the deck slides down and thickens into the strip,
   * and the water goes with it.
   */
  const horizonY = lerp(h * 0.615, h * 0.72, tilt)
  const deckH = lerp(5, Math.min(w * 0.12, 180), tilt)
  const water = 1 - seg(p, 0.82, 0.95)

  if (water > 0.01) drawWater(ctx, w, h, horizonY + deckH, h * 0.985, t, p, cols, water)
  drawDeck(ctx, w, horizonY, deckH, water)
}

/** 05 · OUR PLATFORM — a deck that holds level over a moving sea. */
export function mountPlatform(canvas) {
  return mountScene(canvas, (ctx, w, h, p, t) => drawPlatform(ctx, w, h, p, t))
}
