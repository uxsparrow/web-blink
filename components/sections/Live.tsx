'use client'

import { useEffect, useRef } from 'react'
import { gsap, useReducedMotion } from '@/lib/motion'
import { live } from '@/lib/content'
import Reveal from '@/components/ui/Reveal'
import PixelIcon from '@/components/ui/PixelIcon'
import { RegMark } from '@/components/ui/Marks'

/** 05 · LIVE — reliability, told on a live-blog timeline. */
export default function Live() {
  const section = useRef<HTMLElement | null>(null)
  const strip = useRef<HTMLDivElement | null>(null)
  const card = useRef<HTMLDivElement | null>(null)
  const stamp = useRef<HTMLSpanElement | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = strip.current
    if (!el || reduced) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        card.current,
        { top: '2%' },
        {
          top: '86%',
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 72%',
            end: 'bottom 88%',
            scrub: 0.5,
            onUpdate: (self) => {
              const i = Math.min(
                live.ticks.length - 1,
                Math.floor(self.progress * live.ticks.length)
              )
              if (stamp.current) stamp.current.textContent = live.ticks[i]
            },
          },
        }
      )
    }, el)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={section}
      id="live"
      data-nav="light"
      data-label="LIVE"
      className="tex-halftone position-relative"
      style={{ background: '#fff' }}
    >
      <div className="shell row gx-8 gy-12 sec-pad">
        {/* left — sticky headline */}
        <div className="col-12 col-lg-4">
          <div className="sticky-col">
            <div className="mono-xs mb-5 d-flex align-items-center gap-2" style={{ color: 'rgba(17,17,17,.45)' }}>
              <span className="live-dot" /> THE DESK IS LIVE
            </div>
            <Reveal
              as="h2"
              lines={[
                { text: live.headline.grey, className: 'head-grey' },
                { text: live.headline.ink, className: 'head-ink' },
              ]}
              className="display t-lg"
            />
            <p className="body-copy mt-8" style={{ color: 'rgba(17,17,17,.6)' }}>
              {live.body}
            </p>
          </div>
        </div>

        {/* centre — the live-blog strip */}
        <div ref={strip} className="col-12 col-lg-3 position-relative">
          <div className="live-strip">
            <div className="live-rail" />

            {/* timestamp ticks */}
            {live.ticks.map((t, i) => (
              <div
                key={t}
                className="live-tick"
                style={{ top: `${4 + (i * 92) / live.ticks.length}%` }}
              >
                <i />
                <span className="mono-xs" style={{ color: 'rgba(255,255,255,.45)' }}>
                  {t}
                </span>
              </div>
            ))}

            {/* the story travelling down the desk */}
            <div ref={card} className="live-card p-3" style={{ top: '2%' }}>
              <div className="mb-2 d-flex align-items-center justify-content-between">
                <span className="mono-xs d-flex align-items-center gap-2" style={{ color: 'var(--breaking)' }}>
                  <span className="live-dot" /> LIVE
                </span>
                <span ref={stamp} className="mono-xs" style={{ color: 'rgba(17,17,17,.42)' }}>
                  {live.ticks[0]}
                </span>
              </div>
              <p className="display" style={{ fontSize: 17, lineHeight: 1.04, color: 'var(--ink)' }}>
                {live.storyCard}
              </p>
              <div className="hair-t mt-2 pt-2">
                <span className="mono-xs" style={{ color: 'rgba(17,17,17,.38)' }}>
                  BY THE BLINK DESK · NOIDA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* right — features */}
        <div className="col-12 col-lg-5">
          {live.features.map((f, i) => (
            <div key={f.title} className="hair-t py-7">
              <div className="mb-3 d-flex align-items-center justify-content-between">
                <PixelIcon name={f.icon} size={24} color="var(--ink)" />
                <span className="mono-xs" style={{ color: 'rgba(17,17,17,.3)' }}>
                  0{i + 1} / 03
                </span>
              </div>
              <h3 className="display t-md mb-2">{f.title}</h3>
              <p className="body-copy" style={{ color: 'rgba(17,17,17,.58)', maxWidth: '40ch' }}>
                {f.line}
              </p>
            </div>
          ))}
          <div className="hair-t d-flex align-items-center gap-2 pt-5">
            <RegMark size={13} color="rgba(17,17,17,.3)" />
            <span className="mono-xs" style={{ color: 'rgba(17,17,17,.34)' }}>
              MONITORED ROUND THE CLOCK
            </span>
          </div>
        </div>
      </div>

      {/* the strip widens into a sheet feeding the press */}
      <div className="live-feed">
        <div className="live-feed__sheet" />
        <div className="live-feed__fade" />
        <span
          className="mono-xs position-absolute bottom-4 start-50 translate-middle-x"
          style={{ color: 'rgba(255,255,255,.5)' }}
        >
          FEEDING THE PRESS
        </span>
      </div>
    </section>
  )
}
