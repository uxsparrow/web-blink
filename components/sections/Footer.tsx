'use client'

import dynamic from 'next/dynamic'
import { footer, footerTickerItems } from '@/lib/content'
import Ticker from '@/components/ui/Ticker'
import { ColourBar, RegMark } from '@/components/ui/Marks'

const HalftoneWordmark = dynamic(() => import('@/components/scenes/HalftoneWordmark'), { ssr: false })
const BackPageMap = dynamic(() => import('@/components/scenes/BackPageMap'), { ssr: false })

/** 12 · THE BACK PAGE. */
export default function Footer() {
  return (
    <footer
      id="contact"
      data-nav="light"
      data-label="BACK PAGE"
      className="tex-halftone position-relative"
      style={{ background: '#fff' }}
    >
      <div className="shell">
        {/* masthead strip */}
        <div className="hair-b d-flex flex-wrap align-items-center justify-content-between gap-4 py-5">
          <div className="d-flex align-items-baseline gap-1">
            <span className="display" style={{ fontSize: 30, letterSpacing: '-.02em' }}>
              B
            </span>
            <span
              style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--blink)', display: 'block' }}
            />
          </div>
          <p className="masthead-serif" style={{ fontSize: 'clamp(1.2rem,2.4vw,2.1rem)' }}>
            {footer.tagline}
          </p>
          <div className="d-flex align-items-center gap-2">
            {footer.socials.map((s) => (
              <a
                key={s}
                href="#contact"
                className="mono-xs d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 34,
                  height: 34,
                  border: '1px solid var(--hairline)',
                  transition: 'background .3s, color .3s, border-color .3s',
                }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* nav columns */}
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 gx-6 gy-9 py-10">
          {footer.nav.map((col) => (
            <nav key={col.heading}>
              <div className="hair-b mb-3 d-flex align-items-center gap-2 pb-2">
                <span className="mono-xs" style={{ color: 'rgba(17,17,17,.4)' }}>
                  {col.heading}
                </span>
              </div>
              <ul className="d-flex flex-column">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#contact"
                      style={{ fontSize: 14, color: 'rgba(17,17,17,.7)', transition: 'color .25s' }}
                      className="footer-link"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* segments ticker */}
      <Ticker tab="SEGMENTS | MODULES" items={footerTickerItems} tone="dark" duration={38} />

      {/* office / photo / map */}
      <div className="shell row g-6 py-10">
        <div className="col-12 col-lg-4">
          <div
            className="halftone-media position-relative"
            style={{ aspectRatio: '4 / 3', border: '1px solid var(--hairline)' }}
            data-cursor="media"
          >
            <div
              className="position-absolute inset-0"
              style={{ background: 'linear-gradient(140deg,#1b1b21,#3a3a44 55%,#101014)' }}
            />
            <span
              className="mono-xs"
              style={{ position: 'absolute', left: 10, bottom: 9, color: 'rgba(255,255,255,.6)', zIndex: 2 }}
            >
              [NEWSROOM PHOTO — B&amp;W — NOT SUPPLIED]
            </span>
          </div>
        </div>

        <div className="col-12 col-lg-4 hair-l ps-lg-6">
          <div className="mono-xs mb-3 d-flex align-items-center gap-2" style={{ color: 'rgba(17,17,17,.4)' }}>
            <RegMark size={12} color="rgba(17,17,17,.4)" />
            {footer.office.heading}
          </div>
          <p className="body-copy" style={{ maxWidth: '34ch', color: 'rgba(17,17,17,.75)' }}>
            {footer.office.address}
          </p>
          <div className="mt-5 d-flex flex-column gap-1">
            <span className="mono-sm" style={{ color: 'var(--breaking)' }}>
              {footer.office.email}
            </span>
            <span className="mono-sm" style={{ color: 'var(--breaking)' }}>
              {footer.office.phone}
            </span>
          </div>
          <ColourBar width={56} height={5} className="mt-6" />
        </div>

        <div className="col-12 col-lg-4 hair-l ps-lg-6">
          <div className="mono-xs mb-3" style={{ color: 'rgba(17,17,17,.4)' }}>
            BUREAUS
          </div>
          <div className="footer-map">
            <BackPageMap />
          </div>
        </div>
      </div>

      {/* legal bar */}
      <div className="shell">
        <div className="hair-t d-flex flex-wrap align-items-center justify-content-between gap-3 py-4">
          <span className="mono-xs" style={{ color: 'rgba(17,17,17,.45)' }}>
            {footer.legal}
          </span>
          <div className="d-flex gap-5">
            {footer.legalLinks.map((l) => (
              <a key={l} href="#contact" className="mono-xs" style={{ color: 'rgba(17,17,17,.45)' }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* the halftone wordmark */}
      <div className="footer-wordmark">
        <div style={{ height: 'clamp(70px, 15vw, 230px)' }}>
          <HalftoneWordmark text="BLINKCMS" />
        </div>
      </div>
    </footer>
  )
}
