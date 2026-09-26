/**
 * 00 · PRELOADER — dotted bureau map centred on India, a wire feed typing in,
 * and a broadcast countdown. At 100 the ON AIR light comes up and the map dots
 * fly into where the hero globe will be.
 */

import { bureaus, wireFeed } from '../lib/content.js'
import { landDots, loadWorld, projectLon, rasterize } from '../lib/world.js'
import { clamp, easeOut, reducedMotion, seg } from '../lib/motion.js'

const LON_CENTER = 80 // centre the map on India

export function mountPreloader(root, onDone) {
  const canvas = root.querySelector('[data-preloader-canvas]')
  const wireList = root.querySelector('[data-wire]')
  const countEl = root.querySelector('[data-count]')
  const stateEl = root.querySelector('[data-state]')
  const captionEl = root.querySelector('[data-count-caption]')
  const onAirDot = root.querySelector('[data-onair-dot]')
  const langEls = [...root.querySelectorAll('[data-lang]')]

  const reduced = reducedMotion()
  let dots = []
  let count = 0
  let exit = 0
  let onAir = false
  let finished = false

  /* ── land dots from real geometry ───────────────────────────── */
  loadWorld().then((world) => {
    const mask = rasterize(world.land, 360, 180, LON_CENTER)
    dots = landDots(mask, 2).map((d) => ({ ...d, seed: Math.random() }))
  })

  const finish = () => {
    if (finished) return
    finished = true
    root.remove()
    onDone()
  }

  /* ── ON AIR → dots fly into the hero globe → exit ───────────── */
  const beginExit = () => {
    onAir = true
    if (stateEl) stateEl.textContent = 'ON AIR'
    if (captionEl) captionEl.textContent = 'FEED LIVE'
    if (onAirDot) onAirDot.hidden = false
    root.classList.add('is-leaving')

    const hold = reduced ? 160 : 520
    const flight = reduced ? 240 : 1000
    const t0 = performance.now() + hold

    const step = () => {
      exit = clamp((performance.now() - t0) / flight)
      if (exit < 1) requestAnimationFrame(step)
      else finish()
    }
    requestAnimationFrame(step)

    // rAF is suspended outright when the renderer isn't painting (a
    // backgrounded tab), and the loader must never be what keeps the page
    // locked.
    setTimeout(finish, hold + flight + 2500)
  }

  /* ── countdown 0 → 100, timer-driven for the same reason ────── */
  const total = reduced ? 900 : 3000
  const start = performance.now()
  const tick = window.setInterval(() => {
    const t = clamp((performance.now() - start) / total)
    count = Math.round(easeOut(t) * 100)
    if (countEl) countEl.textContent = String(count).padStart(3, '0')
    langEls.forEach((el, i) => {
      el.style.opacity = count > 12 + i * 12 ? '1' : '0'
      el.style.transform = count > 12 + i * 12 ? 'none' : 'translateY(6px)'
    })
    if (t >= 1) {
      window.clearInterval(tick)
      beginExit()
    }
  }, 32)

  /* ── wire feed types in, one line at a time ─────────────────── */
  let line = 0
  const feed = window.setInterval(() => {
    if (!wireList || line >= wireFeed.length) {
      window.clearInterval(feed)
      return
    }
    const w = wireFeed[line]
    const li = document.createElement('li')
    li.className = 'mono-xs loader-wire'
    li.textContent = `${w.time} ${w.bureau} — ${w.text}`
    ;[...wireList.children].forEach((c) => c.classList.add('is-old'))
    wireList.appendChild(li)
    line += 1
  }, 340)

  /* ── canvas ─────────────────────────────────────────────────── */
  const ctx = canvas?.getContext('2d')
  let w = 0
  let h = 0

  const resize = () => {
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const r = canvas.getBoundingClientRect()
    w = r.width
    h = r.height
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const t0 = performance.now()

  const frame = () => {
    if (finished || !ctx) return
    const t = (performance.now() - t0) / 1000
    const load = count / 100
    ctx.clearRect(0, 0, w, h)

    // map box: 2:1, centred
    const mw = Math.min(w * 0.72, 980)
    const mh = mw / 2
    const mx = (w - mw) / 2
    const my = (h - mh) / 2

    // the globe target sits where the hero globe will be
    const tx = w * 0.72
    const ty = h * 0.5

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i]
      if (d.seed > load * 1.12) continue

      let x = mx + d.x * mw
      let y = my + d.y * mh

      if (exit > 0) {
        const e = easeOut(clamp(exit * 1.25 - d.seed * 0.2))
        const ang = Math.atan2(y - ty, x - tx)
        const dist = Math.hypot(x - tx, y - ty)
        const r = dist * (1 - e) + 150 * e
        x = tx + Math.cos(ang) * r
        y = ty + Math.sin(ang) * r
      }

      const twinkle = 0.26 + 0.14 * Math.sin(t * 1.6 + d.seed * 22)
      ctx.fillStyle = `rgba(255,255,255,${twinkle * (1 - exit * 0.35)})`
      ctx.beginPath()
      ctx.arc(x, y, 1.05, 0, Math.PI * 2)
      ctx.fill()
    }

    // bureau pulses — red and violet
    bureaus.forEach((b, i) => {
      const lx = ((projectLon(b.lon, LON_CENTER) + 180) / 360) * mw + mx
      const ly = ((90 - b.lat) / 180) * mh + my
      const appear = seg(load, 0.18 + i * 0.07, 0.42 + i * 0.07)
      if (appear <= 0) return
      const col = i % 2 === 0 ? '225,6,0' : '97,24,234'
      const beat = (t * 0.8 + i * 0.33) % 1
      const ease = easeOut(beat)

      let x = lx
      let y = ly
      if (exit > 0) {
        const e = easeOut(clamp(exit * 1.3))
        x = lx + (tx - lx) * e
        y = ly + (ty - ly) * e
      }

      ctx.strokeStyle = `rgba(${col},${(1 - ease) * 0.6 * appear})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, 3 + ease * 17, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = `rgba(${col},${appear})`
      ctx.beginPath()
      ctx.arc(x, y, b.hq ? 3.1 : 2.2, 0, Math.PI * 2)
      ctx.fill()
    })

    requestAnimationFrame(frame)
  }

  resize()
  window.addEventListener('resize', resize)
  requestAnimationFrame(frame)
}
