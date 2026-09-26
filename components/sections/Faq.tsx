'use client'

import { useState } from 'react'
import { faq } from '@/lib/content'
import { RegMark } from '@/components/ui/Marks'

/** 10 · F.A.Q — three columns, numbered accordion in the middle. */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      id="faq"
      data-nav="light"
      data-label="CLASSIFIEDS"
      className="tex-halftone position-relative"
      style={{ background: '#fff' }}
    >
      <div className="shell row gx-8 gy-10 sec-pad-lg">
        <div className="col-12 col-lg-3">
          <h2 className="display t-lg">F.A.Q</h2>
          <p className="body-copy mt-5" style={{ color: 'rgba(17,17,17,.55)' }}>
            {faq.intro}
          </p>
        </div>

        <div className="col-12 col-lg-6">
          {faq.items.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="hair-t">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="d-flex w-100 align-items-start gap-5 py-5 text-start"
                  aria-expanded={isOpen}
                >
                  <span className="mono-xs faq-num" style={{ color: 'rgba(17,17,17,.34)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="flex-grow-1"
                    style={{
                      fontSize: 'clamp(1rem,1.5vw,1.35rem)',
                      lineHeight: 1.25,
                      color: isOpen ? 'var(--blink)' : 'var(--ink)',
                      transition: 'color .3s',
                    }}
                  >
                    {item.q}
                  </span>
                  <span
                    className="pt-1 faq-plus"
                    style={{
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      transition: 'transform .4s cubic-bezier(.22,1,.36,1)',
                      color: 'rgba(17,17,17,.5)',
                    }}
                  >
                    +
                  </span>
                </button>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows .5s cubic-bezier(.22,1,.36,1)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <p
                      className="body-copy pb-6"
                      style={{
                        color: item.a.startsWith('[') ? 'var(--breaking)' : 'rgba(17,17,17,.6)',
                        fontFamily: item.a.startsWith('[') ? 'var(--font-mono)' : undefined,
                        fontSize: item.a.startsWith('[') ? 11 : undefined,
                        letterSpacing: item.a.startsWith('[') ? '.12em' : undefined,
                        maxWidth: '52ch',
                      }}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="hair-t" />
        </div>

        <div className="col-12 col-lg-3 front-aside">
          <div className="sticky-col sticky-col--low">
            <RegMark size={14} color="rgba(17,17,17,.3)" />
            <h3 className="display t-sm mt-4">{faq.asideTitle}</h3>
            <a href="#on-air" className="pill pill-outline pill-mono mt-5">
              {faq.asideCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
