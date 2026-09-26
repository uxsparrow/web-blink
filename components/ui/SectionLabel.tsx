'use client'

import { useEffect, useState } from 'react'

/**
 * Tiny mono label fixed at top-left, named like a newspaper section.
 * Reads `data-label` / `data-nav` off whichever block crosses the reading line.
 */
export default function SectionLabel() {
  const [label, setLabel] = useState('FRONT PAGE')
  const [dark, setDark] = useState(true)

  useEffect(() => {
    let raf = 0
    const read = () => {
      const line = window.innerHeight * 0.42
      const zones = document.querySelectorAll<HTMLElement>('[data-label]')
      let nextLabel = ''
      let nextDark = false
      zones.forEach((z) => {
        const r = z.getBoundingClientRect()
        if (r.top <= line && r.bottom > line) {
          nextLabel = z.dataset.label || ''
          nextDark = (z.closest('[data-nav]') as HTMLElement | null)?.dataset.nav === 'dark'
        }
      })
      if (nextLabel) {
        setLabel((p) => (p === nextLabel ? p : nextLabel))
        setDark((p) => (p === nextDark ? p : nextDark))
      }
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pe-none position-fixed z-label d-none align-items-center gap-2 d-lg-flex"
      style={{
        left: 'clamp(16px, 3.4vw, 54px)',
        top: 108,
        color: dark ? 'rgba(255,255,255,.6)' : 'rgba(17,17,17,.42)',
        transition: 'color .4s',
      }}
    >
      <span
        style={{
          width: 14,
          height: 1,
          background: 'currentColor',
          display: 'block',
          opacity: 0.6,
        }}
      />
      <span key={label} className="mono-xs" style={{ animation: 'label-in .5s cubic-bezier(.22,1,.36,1)' }}>
        {label}
      </span>
      <style>{`@keyframes label-in { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}
