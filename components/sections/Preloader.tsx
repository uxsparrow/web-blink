'use client'

import { useEffect, useRef, useState } from 'react'
import { bureaus, languages, wireFeed } from '@/lib/content'
import { landDots, loadWorld, projectLon, rasterize, type MapDot } from '@/lib/world'
import { clamp, easeOut, seg } from '@/lib/motion'

const LON_CENTER = 80 // centre the map on India

interface Flyer extends MapDot {
  seed: number
}

export default function Preloader({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dotsRef = useRef<Flyer[]>([])
  const countRef = useRef(0)
  const exitRef = useRef(0)

  const [count, setCount] = useState(0)
  const [onAir, setOnAir] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const [gone, setGone] = useState(false)

  /* ── land dots from real geometry ───────────────────────────── */
  useEffect(() => {
    let alive = true
    loadWorld().then((world) => {
      if (!alive) return
      const mask = rasterize(world.land, 360, 180, LON_CENTER)
      dotsRef.current = landDots(mask, 2).map((d) => ({ ...d, seed: Math.random() }))
    })
    return () => {
      alive = false
    }
  }, [])

  /* ── countdown 0 → 100 ──────────────────────────────────────────
     Timer-driven, not rAF-driven: rAF is suspended outright when the
     renderer isn't painting (backgrounded or occluded window), and the
     loader must never be the thing that keeps the page locked. */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = reduced ? 900 : 3000
    const start = performance.now()

    const id = window.setInterval(() => {
      const t = clamp((performance.now() - start) / total)
      const n = Math.round(easeOut(t) * 100)
      countRef.current = n
      setCount(n)
      if (t >= 1) {
        window.clearInterval(id)
        setOnAir(true)
      }
    }, 32)

    return () => window.clearInterval(id)
  }, [])

  /* ── wire feed types in, one line at a time ─────────────────── */
  useEffect(() => {
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setLines(wireFeed.slice(0, i).map((w) => `${w.time} ${w.bureau} — ${w.text}`))
      if (i >= wireFeed.length) window.clearInterval(id)
    }, 340)
    return () => window.clearInterval(id)
  }, [])

  /* ── ON AIR → dots fly into the hero globe → exit ───────────── */
  useEffect(() => {
    if (!onAir) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduced ? 160 : 520
    const flight = reduced ? 240 : 1000
    let raf = 0
    const t0 = performance.now() + hold

    const step = () => {
      const p = clamp((performance.now() - t0) / flight)
      exitRef.current = p
      if (p < 1) raf = requestAnimationFrame(step)
      else {
        setGone(true)
        onDone()
      }
    }
    raf = requestAnimationFrame(step)

    // safety net: rAF is throttled in background tabs, and the loader must never
    // be what keeps the page locked
    const bail = window.setTimeout(() => {
      exitRef.current = 1
      setGone(true)
      onDone()
    }, hold + flight + 2500)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(bail)
    }
  }, [onAir, onDone])

  /* ── canvas ─────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const t0 = performance.now()

    const loop = () => {
      const t = (performance.now() - t0) / 1000
      const load = countRef.current / 100
      const exit = exitRef.current
      ctx.clearRect(0, 0, w, h)

      // map box: 2:1, centred
      const mw = Math.min(w * 0.72, 980)
      const mh = mw / 2
      const mx = (w - mw) / 2
      const my = (h - mh) / 2

      // globe target sits where the hero globe will be (right of centre)
      const tx = w * 0.72
      const ty = h * 0.5

      const dots = dotsRef.current
      const reveal = load // dots appear as the counter climbs

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        if (d.seed > reveal * 1.12) continue

        let x = mx + d.x * mw
        let y = my + d.y * mh

        // fly into the globe
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

      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  if (gone) return null

  return (
    <div
      className="position-fixed inset-0 z-loader overflow-hidden"
      style={{
        background: '#000',
        opacity: onAir && exitRef.current > 0.75 ? 0 : 1,
        transition: 'opacity .5s ease-out',
        animation: onAir ? 'loader-out 1.5s .55s forwards' : undefined,
      }}
      data-nav="dark"
    >
      <canvas ref={canvasRef} className="position-absolute inset-0 h-100 w-100" />

      {/* left column — wordmark + wire feed */}
      <div className="loader-col loader-col--left">
        <div className="display mb-5" style={{ fontSize: 'clamp(1.6rem,3.2vw,2.6rem)', color: '#fff' }}>
          BLINK<span style={{ color: 'var(--blink-lift)' }}>CMS</span>
        </div>
        <div className="mono-xs mb-2 d-flex align-items-center gap-2" style={{ color: 'rgba(255,255,255,.34)' }}>
          <span style={{ width: 12, height: 1, background: 'currentColor' }} /> WIRE · SAMPLE FEED
        </div>
        <ul className="d-flex flex-column gap-1">
          {lines.map((l, i) => (
            <li
              key={l}
              className="mono-xs"
              style={{
                color: i === lines.length - 1 ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.38)',
                animation: 'wire-in .45s cubic-bezier(.22,1,.36,1)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {l}
            </li>
          ))}
        </ul>
      </div>

      {/* right column — languages */}
      <div className="loader-col loader-col--right d-none d-md-block">
        <div className="mono-xs mb-2" style={{ color: 'rgba(255,255,255,.34)' }}>
          LANGUAGES
        </div>
        {languages.map((l, i) => (
          <div
            key={l}
            className="mono-xs"
            style={{
              color: 'rgba(255,255,255,.55)',
              opacity: count > 12 + i * 12 ? 1 : 0,
              transform: count > 12 + i * 12 ? 'none' : 'translateY(6px)',
              transition: 'opacity .5s, transform .5s',
            }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* top-right broadcast clock */}
      <div className="loader-clock">
        <div className="mono-xs mb-1" style={{ color: 'rgba(255,255,255,.3)' }}>
          {onAir ? 'ON AIR' : 'STANDBY'}
        </div>
        <div
          className="display d-flex align-items-baseline justify-content-end gap-2"
          style={{ fontSize: 'clamp(2.6rem,6vw,5rem)', color: '#fff', fontVariantNumeric: 'tabular-nums' }}
        >
          {onAir && <span className="live-dot" style={{ marginBottom: '0.9em' }} />}
          {String(count).padStart(3, '0')}
        </div>
        <div className="mono-xs" style={{ color: 'rgba(255,255,255,.3)' }}>
          {count < 100 ? 'LOADING BUREAUS' : 'FEED LIVE'}
        </div>
      </div>

      <style>{`
        @keyframes wire-in { from { opacity:0; transform: translateX(-8px) } to { opacity:1; transform:none } }
        @keyframes loader-out { to { opacity: 0 } }
      `}</style>
    </div>
  )
}
