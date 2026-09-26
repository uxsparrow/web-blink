'use client'

import { useState } from 'react'
import { integrations, publishers } from '@/lib/content'
import { RegMark } from '@/components/ui/Marks'

const TABS = ['PUBLISHERS', 'INTEGRATIONS'] as const
const INKS = ['#6118EA', '#E10600', '#00AEEF', '#EC008C', '#FFC400']

/** 08 · THE MASTHEAD WALL — names set as mastheads, inked in on hover. */
export default function Mastheads() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('PUBLISHERS')
  const items = tab === 'PUBLISHERS' ? publishers : integrations

  return (
    <section
      id="case-studies"
      data-nav="light"
      data-label="LETTERS"
      className="position-relative"
      style={{ background: '#fff' }}
    >
      <div className="shell pb-vh-10">
        <div className="hair-b d-flex flex-wrap align-items-end justify-content-between gap-4 pb-4">
          <span className="mono" style={{ color: 'rgba(17,17,17,.5)' }}>
            OUR PUBLISHERS
          </span>
          <div className="d-flex align-items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="mono-xs px-3 py-2"
                style={{
                  color: tab === t ? '#fff' : 'rgba(17,17,17,.5)',
                  background: tab === t ? 'var(--ink)' : 'transparent',
                  border: '1px solid var(--hairline)',
                  transition: 'background .3s, color .3s',
                }}
                aria-pressed={tab === t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div
          className="row row-cols-2 row-cols-sm-3 row-cols-lg-5 g-0 masthead-grid"
        >
          {items.map((name, i) => (
            <div
              key={name}
              className="masthead-cell position-relative d-flex align-items-center justify-content-center px-4 text-center"
            >
              {/* the ink roll */}
              <span
                aria-hidden
                className="masthead-ink"
                style={{ background: INKS[i % INKS.length] }}
              />
              <span
                className="display position-relative z-2"
                style={{
                  fontSize: 'clamp(.82rem, 1.05vw, 1.05rem)',
                  letterSpacing: '.01em',
                  transition: 'color .32s .06s',
                }}
              >
                {name}
              </span>
              <RegMark
                size={11}
                color="rgba(17,17,17,.22)"
                className="pe-none position-absolute z-3"
                style={{ left: -5.5, top: -5.5 }}
              />
            </div>
          ))}
        </div>

        <div className="mono-xs mt-4 d-flex align-items-center gap-2" style={{ color: 'rgba(17,17,17,.34)' }}>
          <span className="live-dot" />
          {tab === 'PUBLISHERS'
            ? `${publishers.length} MASTHEADS SHOWN · 150+ NEWSROOMS POWERED`
            : `${integrations.length} INTEGRATIONS · MORE ON REQUEST`}
        </div>
      </div>
    </section>
  )
}
