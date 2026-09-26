'use client'

import { useCallback, useEffect, useState } from 'react'
import Ticker from './Ticker'
import { nav as navItems, tickerItems } from '@/lib/content'

/** Which `[data-nav]` block currently sits under the header line. */
function useNavTheme(line = 34) {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    let raf = 0
    const read = () => {
      const zones = document.querySelectorAll<HTMLElement>('[data-nav]')
      let found: 'dark' | 'light' = 'light'
      zones.forEach((z) => {
        const r = z.getBoundingClientRect()
        if (r.top <= line && r.bottom > line) found = z.dataset.nav === 'dark' ? 'dark' : 'light'
      })
      setDark((prev) => (prev === (found === 'dark') ? prev : found === 'dark'))
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
  }, [line])
  return dark
}

export default function Header() {
  const dark = useNavTheme()
  const [shown, setShown] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = useCallback(() => setMenu(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const fg = dark ? '#ffffff' : '#111111'

  return (
    <>
      <header
        className="position-fixed start-0 top-0 z-header w-100"
        style={{
          transform: shown ? 'translateY(0)' : 'translateY(-102%)',
          transition: 'transform .65s cubic-bezier(.22,1,.36,1)',
          pointerEvents: shown ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            background: dark ? 'rgba(17,17,17,.82)' : 'rgba(255,255,255,.86)',
            backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,.12)' : 'var(--hairline)'}`,
            transition: 'background .4s, border-color .4s',
          }}
        >
          <div className="shell d-flex header-bar align-items-center justify-content-between">
            {/* B. monogram */}
            <a href="#top" className="d-flex align-items-baseline gap-1" aria-label="Blink CMS — home">
              <span
                className="display"
                style={{ fontSize: 22, color: fg, letterSpacing: '-0.02em', transition: 'color .4s' }}
              >
                B
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'var(--blink)',
                  display: 'block',
                  marginBottom: 2,
                }}
              />
            </a>

            {/* centre menu */}
            <button
              onClick={() => setMenu((m) => !m)}
              className="mono position-absolute start-50 d-none translate-middle-x align-items-center gap-2 d-md-flex"
              style={{ color: fg, transition: 'color .4s' }}
              aria-expanded={menu}
            >
              <span style={{ letterSpacing: '0.2em' }}>•••</span>
              {menu ? 'CLOSE' : 'MENU'}
            </button>

            {/* right cluster */}
            <div className="d-flex align-items-center gap-4">
              <span className="mono d-none align-items-center gap-2 d-sm-flex" style={{ color: fg, transition: 'color .4s' }}>
                <span className="live-dot" />
                LIVE
              </span>
              <a href="#on-air" className={`pill pill-mono ${dark ? 'pill-white' : 'pill-ink'}`}>
                BOOK A DEMO
              </a>
              <button
                onClick={() => setMenu((m) => !m)}
                className="mono d-md-none"
                style={{ color: fg }}
                aria-expanded={menu}
              >
                {menu ? 'CLOSE' : 'MENU'}
              </button>
            </div>
          </div>
        </div>

        {/* breaking ticker — dark sections only */}
        <div
          style={{
            maxHeight: dark ? 34 : 0,
            overflow: 'hidden',
            transition: 'max-height .5s cubic-bezier(.22,1,.36,1)',
          }}
        >
          <Ticker items={tickerItems} tone="dark" duration={30} />
        </div>
      </header>

      {/* menu overlay */}
      <div
        className="position-fixed inset-0 z-menu d-flex flex-column justify-content-center"
        style={{
          background: '#111111',
          clipPath: menu ? 'inset(0% 0 0% 0)' : 'inset(0% 0 100% 0)',
          transition: 'clip-path .8s cubic-bezier(.76,0,.24,1)',
          pointerEvents: menu ? 'auto' : 'none',
        }}
        aria-hidden={!menu}
      >
        <nav className="shell">
          {navItems.map((item, i) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              onClick={close}
              className="display t-lg d-flex align-items-baseline gap-5 menu-link"
              style={{
                borderColor: 'rgba(255,255,255,.1)',
                color: '#fff',
                opacity: menu ? 1 : 0,
                transform: menu ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity .6s ${0.15 + i * 0.05}s, transform .7s cubic-bezier(.22,1,.36,1) ${
                  0.15 + i * 0.05
                }s, color .3s`,
              }}
            >
              <span className="mono-xs" style={{ color: 'var(--blink-lift)' }}>
                0{i + 1}
              </span>
              {item}
            </a>
          ))}
        </nav>
      </div>
    </>
  )
}
