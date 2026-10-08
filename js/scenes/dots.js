/**
 * The dot-matrix toolkit. Every canvas scene on the page draws through this,
 * which is most of why they look like one family: same dot size, same
 * spacing, same lavender, all read from the CSS custom properties so the
 * tokens stay the single source of truth.
 *
 * Canvas 2D, not WebGL. The hero globe owns the one WebGL context — it needs
 * 3D — and everything else here is flat. A second renderer would cost a
 * context, a shader compile and a chunk of memory on exactly the phones this
 * traffic is on, to draw dots a 2D canvas draws for nothing.
 */

import { onInView, reducedMotion } from '../lib/motion.js'

/** Reads a token off :root so the scenes cannot drift from the stylesheet. */
export function token(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/**
 * Sizes a canvas to its box in device pixels and keeps it sized. Returns a
 * handle whose `w`/`h` are CSS pixels, because every scene thinks in those.
 */
export function fitCanvas(canvas, onResize) {
  const ctx = canvas.getContext('2d')
  const api = { ctx, w: 0, h: 0, dpr: 1 }

  const fit = () => {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    api.w = r.width
    api.h = r.height
    api.dpr = dpr
    canvas.width = Math.round(r.width * dpr)
    canvas.height = Math.round(r.height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    onResize?.(api)
  }

  fit()
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
  } else {
    window.addEventListener('resize', fit)
  }
  return api
}

/**
 * A rAF loop that only runs while its element is on screen, and that never
 * starts at all under reduced motion — it draws one frame instead, so the
 * scene is present and still rather than absent.
 */
export function loop(el, draw) {
  if (reducedMotion()) {
    requestAnimationFrame(() => draw(0))
    return { stop() { } }
  }

  let live = false
  let raf = 0
  const t0 = performance.now()

  const tick = (now) => {
    if (!live) {
      raf = 0
      return
    }
    draw((now - t0) / 1000)
    raf = requestAnimationFrame(tick)
  }

  onInView(el, (v) => {
    live = v
    if (v && !raf) raf = requestAnimationFrame(tick)
  }, '10%')

  return {
    stop() {
      live = false
    },
  }
}

/* ── the two ambient dot fields ───────────────────────────────── */

/**
 * 03's back layer: an isometric dot grid drifting slowly. Deliberately faint —
 * it is there to stop the bento grid floating on flat black, not to be looked
 * at.
 */
export function mountIsoGrid(canvas) {
  const c = fitCanvas(canvas)
  const colour = token('--dot', 'rgba(185,166,255,.45)')

  return loop(canvas, (t) => {
    const { ctx, w, h } = c
    if (!w) return
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = colour
    ctx.globalAlpha = 0.16

    const step = 34
    const skew = 0.5
    const drift = (t * 6) % step
    for (let y = -step; y < h + step; y += step) {
      for (let x = -h * skew - step; x < w + step; x += step) {
        const px = x + y * skew + drift
        if (px < -step || px > w + step) continue
        ctx.beginPath()
        ctx.arc(px, y + drift * 0.3, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  })
}

/**
 * 11's back layer: a slow dot-matrix wave. Same dots, one sine — the cheapest
 * possible thing that still reads as the same world as the globe.
 */
export function mountWave(canvas) {
  const c = fitCanvas(canvas)
  const colour = token('--lilac', 'rgba(185,166,255,0.25)')

  return loop(canvas, (t) => {
    const { ctx, w, h } = c
    if (!w) return
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = colour

    const gap = 24
    for (let x = gap / 2; x < w; x += gap) {
      for (let y = gap / 2; y < h; y += gap) {
        const d = Math.sin(x / 140 + t * 0.7) * Math.cos(y / 170 - t * 0.4)
        const norm = d * 0.5 + 0.5
        const a = 0.10 + 0.45 * Math.pow(norm, 1.3)
        const r = 1.3 + 1.2 * norm
        ctx.globalAlpha = a
        ctx.beginPath()
        ctx.arc(x, y + d * 18, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  })
}
