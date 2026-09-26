/**
 * The story itself, drawn at whatever size the surface needs.
 *
 * 03 · THE DESK writes it and 04 · OUR PLATFORM carries it downstream, so both
 * scenes render it through here: the editor, the second laptop, the tablet, the
 * phone and the e-paper reader are all literally the same article, which is the
 * whole claim those two sections make.
 *
 * Every measurement is a fraction of the surface, so one call covers a 480px
 * editor pane and a 79px phone screen without a second layout.
 */

import { clamp } from './motion.js'
import { displayFamily, monoFamily } from './fonts.js'
import { articleDateline, articleHeadline } from './content.js'

const RED = '#E10600'

/**
 * Under this the dateline renders at its 6px floor and runs into the edge of
 * the surface — a smudge rather than a line of type — so it is left off. The
 * kicker and the headline carry the small screens on their own.
 */
const DATELINE_MIN_W = 150

/** Characters in the whole headline — what a typing progress runs against. */
export const TOTAL_CHARS = articleHeadline.join('').length

/**
 * `chars` types the headline in a character at a time; `caret` draws the red
 * insertion bar after the last one. A reading surface passes neither and gets
 * the finished article.
 */
export function drawArticle(ctx, x, y, w, h, { chars = TOTAL_CHARS, caret = false } = {}) {
  const pad = w * 0.08

  // kicker
  ctx.fillStyle = RED
  ctx.fillRect(x + pad, y + pad, w * 0.2, Math.max(2, h * 0.016))

  // dateline, only where there is room for it to read
  if (w >= DATELINE_MIN_W) {
    ctx.fillStyle = 'rgba(255,255,255,.34)'
    ctx.font = `400 ${Math.max(6, w * 0.035)}px ${monoFamily()}`
    ctx.fillText(articleDateline, x + pad + w * 0.24, y + pad + Math.max(2, h * 0.016))
  }

  // headline, typed in
  const fs = w * 0.105
  ctx.font = `700 ${fs}px ${displayFamily()}`
  ctx.fillStyle = '#ffffff'
  let seen = 0
  let caretX = x + pad
  let caretY = y + pad + fs * 1.6
  for (let i = 0; i < articleHeadline.length; i++) {
    const line = articleHeadline[i]
    const take = clamp(chars - seen, 0, line.length)
    const shown = line.slice(0, Math.floor(take))
    const ly = y + pad + fs * 1.6 + i * fs * 1.04
    if (shown) ctx.fillText(shown, x + pad, ly)
    if (take > 0) {
      caretX = x + pad + ctx.measureText(shown).width
      caretY = ly
    }
    seen += line.length
  }

  if (caret) {
    ctx.fillStyle = RED
    ctx.fillRect(caretX + fs * 0.06, caretY - fs * 0.76, Math.max(2, fs * 0.05), fs * 0.84)
  }

  // body rules under the headline
  ctx.fillStyle = 'rgba(255,255,255,.2)'
  const bodyTop = y + pad + fs * 1.6 + articleHeadline.length * fs * 1.04 + h * 0.04
  const rule = Math.max(1.5, h * 0.012)
  for (let i = 0; i < 6; i++) {
    const ry = bodyTop + i * rule * 2.6
    if (ry > y + h - pad) break
    ctx.fillRect(x + pad, ry, (w - pad * 2) * (i % 3 === 2 ? 0.58 : 0.92), rule)
  }
}
