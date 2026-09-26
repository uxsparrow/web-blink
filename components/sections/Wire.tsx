'use client'

import { useRef, useState } from 'react'
import { wire } from '@/lib/content'
import Reveal from '@/components/ui/Reveal'

const THUMB_TINTS = [
  'linear-gradient(135deg,#2A0B8F,#6118EA)',
  'linear-gradient(135deg,#1d1d22,#E10600)',
  'linear-gradient(135deg,#14212b,#00AEEF)',
  'linear-gradient(135deg,#2b2438,#B9A4FF)',
  'linear-gradient(135deg,#1a1a1f,#6118EA)',
  'linear-gradient(135deg,#1a1a1f,#EC008C)',
]

/** 09 · THE WIRE — insights, set as a news wire. */
export default function Wire() {
  const [hover, setHover] = useState<number | null>(null)
  const thumb = useRef<HTMLDivElement | null>(null)

  const onMove = (e: React.MouseEvent) => {
    if (!thumb.current) return
    thumb.current.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 70}px, 0)`
  }

  return (
    <section
      id="the-wire"
      data-nav="dark"
      data-label="THE WIRE"
      className="position-relative"
      style={{ background: '#111111' }}
    >
      {/* white fades through the violet sky into ink */}
      <div
        aria-hidden
        className="wire-sky"
      />

      <div className="shell pb-vh-12">
        <div className="mb-10 d-flex flex-wrap align-items-end justify-content-between gap-6">
          <Reveal
            as="h2"
            lines={wire.headline}
            className="display t-lg head-gradient"
          />
          <a href="#the-wire" className="pill pill-outline-inv pill-mono">
            {wire.cta}
          </a>
        </div>

        <div onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {wire.rows.map((row, i) => (
            <a
              key={row.title}
              href="#the-wire"
              className="row g-4 align-items-center py-6 wire-row"
              style={{ borderTop: '1px solid rgba(255,255,255,.12)' }}
              onMouseEnter={() => setHover(i)}
            >
              <span
                className="mono-xs col-4 col-sm-2 d-flex align-items-center gap-2"
                style={{ color: 'rgba(255,255,255,.4)' }}
              >
                {row.isNew && <span className="live-dot" />}
                {row.date}
              </span>

              <span
                className="col-12 col-sm-7 wire-title"
                style={{
                  color: hover === i ? '#B9A4FF' : '#ffffff',
                  transition: 'color .3s, transform .4s cubic-bezier(.22,1,.36,1)',
                  transform: hover === i ? 'translateX(10px)' : 'none',
                  display: 'block',
                  fontSize: 'clamp(1.05rem,1.9vw,1.75rem)',
                  lineHeight: 1.16,
                }}
              >
                {row.title}
              </span>

              <span
                className="mono-xs col-8 col-sm-3 text-end"
                style={{ color: row.isNew ? 'var(--breaking)' : 'rgba(255,255,255,.4)' }}
              >
                {row.isNew ? '● NEW · ' : ''}
                {row.tag}
              </span>
            </a>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.12)' }} />
        </div>

        <p className="mono-xs mt-6" style={{ color: 'rgba(255,255,255,.3)' }}>
          ARTICLE SLOTS — HEADLINES SUPPLIED, BODIES NOT YET WRITTEN
        </p>
      </div>

      {/* thumbnail that follows the cursor */}
      <div
        ref={thumb}
        aria-hidden
        className="pe-none position-fixed start-0 top-0 z-thumb"
        style={{
          opacity: hover === null ? 0 : 1,
          transition: 'opacity .35s',
        }}
      >
        <div
          className="halftone-media"
          style={{
            width: 210,
            height: 132,
            border: '1px solid rgba(255,255,255,.2)',
            transform: hover === null ? 'scale(.9)' : 'scale(1)',
            transition: 'transform .45s cubic-bezier(.22,1,.36,1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: THUMB_TINTS[(hover ?? 0) % THUMB_TINTS.length],
            }}
          />
          <span
            className="mono-xs"
            style={{ position: 'absolute', left: 10, bottom: 8, color: '#fff', zIndex: 2 }}
          >
            {hover === null ? '' : wire.rows[hover].kind}
          </span>
        </div>
      </div>
    </section>
  )
}
