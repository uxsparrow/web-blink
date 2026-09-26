/**
 * Shared plumbing for the 2D canvas scenes: device-pixel sizing, a rAF loop
 * that can be paused when the scene scrolls out of view, and a scroll-driven
 * `progress` value the draw function reads.
 *
 * draw(ctx, width, height, progress, seconds)
 */
export function mountScene(canvas, draw, { maxDpr = 2 } = {}) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { setProgress() {}, setActive() {}, destroy() {} }

  let w = 0
  let h = 0
  let raf = 0
  let running = false
  let progress = 0
  const t0 = performance.now()

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
    const r = canvas.getBoundingClientRect()
    w = r.width
    h = r.height
    canvas.width = Math.max(1, Math.round(w * dpr))
    canvas.height = Math.max(1, Math.round(h * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const paint = () => {
    ctx.clearRect(0, 0, w, h)
    draw(ctx, w, h, progress, (performance.now() - t0) / 1000)
  }

  const frame = () => {
    paint()
    raf = requestAnimationFrame(frame)
  }

  const start = () => {
    if (running) return
    running = true
    raf = requestAnimationFrame(frame)
  }

  const stop = () => {
    running = false
    cancelAnimationFrame(raf)
  }

  const onResize = () => {
    resize()
    if (!running) paint()
  }

  resize()
  paint()
  window.addEventListener('resize', onResize)

  return {
    setProgress(p) {
      progress = p
      if (!running) paint()
    },
    setActive(on) {
      if (on) start()
      else {
        stop()
        paint() // leave a correct still frame behind
      }
    },
    destroy() {
      stop()
      window.removeEventListener('resize', onResize)
    },
  }
}
