'use client'

import { useEffect, useRef, useState } from 'react'

type Mode = 'default' | 'hover' | 'media'

/**
 * Black dot inside a thin circle with a rotating arc.
 * Over media (`data-cursor="media"`) it becomes a camera viewfinder: four
 * corner brackets + REC ●.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const wrap = useRef<HTMLDivElement | null>(null)
  const mode = useRef<Mode>('default')
  const [modeState, setModeState] = useState<Mode>('default')
  const [inverted, setInverted] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    setEnabled(true)
    // The native cursor is only hidden once this component is actually up, so a
    // failure here leaves a normal pointer rather than no pointer at all.
    // An attribute, not a class: React owns <html>'s className (the font
    // variables) and wipes an imperatively added class on re-render.
    document.documentElement.setAttribute('data-custom-cursor', '')
    return () => document.documentElement.removeAttribute('data-custom-cursor')
  }, [])

  useEffect(() => {
    if (!enabled) return
    const el = wrap.current
    if (!el) return

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const pos = { ...target }
    let raf = 0

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX
      target.y = e.clientY

      const hit = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      let next: Mode = 'default'
      if (hit?.closest('[data-cursor="media"]')) next = 'media'
      else if (hit?.closest('a, button, [data-cursor="hover"]')) next = 'hover'
      if (next !== mode.current) {
        mode.current = next
        setModeState(next)
      }

      const darkHost = hit?.closest('[data-nav]') as HTMLElement | null
      const dark = darkHost?.dataset.nav === 'dark'
      setInverted((prev) => (prev === dark ? prev : dark))
    }

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.22
      pos.y += (target.y - pos.y) * 0.22
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  const stroke = inverted ? '#ffffff' : '#111111'
  const isMedia = modeState === 'media'

  return (
    <div
      ref={wrap}
      aria-hidden
      className="pe-none position-fixed start-0 top-0 z-cursor"
      style={{ mixBlendMode: 'normal' }}
    >
      <div
        className="position-relative"
        style={{
          transform: 'translate(-50%, -50%)',
          transition: 'opacity .3s',
        }}
      >
        {/* ring + rotating arc.
            The anchor above is zero-sized, so both SVGs are pinned to its origin
            with explicit pixel sizes and max-width: none — any percentage sizing
            resolves against a 0-wide box and collapses them to nothing. */}
        <svg
          width="46"
          height="46"
          viewBox="0 0 46 46"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 46,
            height: 46,
            maxWidth: 'none',
            transform: `translate(-50%,-50%) scale(${isMedia ? 0 : modeState === 'hover' ? 1.45 : 1})`,
            transition: 'transform .4s cubic-bezier(.22,1,.36,1), opacity .3s',
            opacity: isMedia ? 0 : 1,
          }}
        >
          <circle cx="23" cy="23" r="16" fill="none" stroke={stroke} strokeOpacity="0.28" strokeWidth="1" />
          <g style={{ transformOrigin: '23px 23px', animation: 'spin-arc 2.6s linear infinite' }}>
            <path
              d="M23 5.5 A17.5 17.5 0 0 1 40.5 23"
              fill="none"
              stroke={stroke}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </g>
          <circle cx="23" cy="23" r="2.6" fill={stroke} />
        </svg>

        {/* camera viewfinder */}
        <svg
          width="76"
          height="62"
          viewBox="0 0 76 62"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 76,
            height: 62,
            maxWidth: 'none',
            transform: `translate(-50%,-50%) scale(${isMedia ? 1 : 0.6})`,
            transition: 'transform .4s cubic-bezier(.22,1,.36,1), opacity .3s',
            opacity: isMedia ? 1 : 0,
          }}
        >
          {[
            'M2 16 L2 2 L16 2',
            'M60 2 L74 2 L74 16',
            'M74 46 L74 60 L60 60',
            'M16 60 L2 60 L2 46',
          ].map((d) => (
            <path key={d} d={d} fill="none" stroke="#fff" strokeWidth="1.6" />
          ))}
          <circle cx="38" cy="31" r="1.6" fill="#fff" />
          <circle cx="15" cy="31" r="2.4" fill="#E10600">
            <animate attributeName="opacity" values="1;0.15;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <text
            x="23"
            y="34.5"
            fill="#fff"
            fontSize="8"
            fontFamily="var(--font-spacemono), monospace"
            letterSpacing="1.2"
          >
            REC
          </text>
        </svg>
      </div>

      <style>{`@keyframes spin-arc { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
