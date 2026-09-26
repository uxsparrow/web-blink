'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ScrollTrigger, useInView, useReducedMotion } from '@/lib/motion'
import { letters } from '@/lib/content'
import Reveal from '@/components/ui/Reveal'
import { ColourBar } from '@/components/ui/Marks'

const PaperPlane = dynamic(() => import('@/components/scenes/PaperPlane'), { ssr: false })

/** A torn newsprint edge, cut into the top of each clipping. */
function TornEdge() {
  return (
    <svg
      className="clipping__tear"
      viewBox="0 0 600 9"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 0h600v3.2l-18 1.4-16-2.1-21 3-14-1.6-25 2.4-17-2.9-19 2-22-1.2-16 2.6-20-2.2-18 1.5-24-2.6-15 3.1-21-1.8-17 1.2-23-2.4-16 2.8-19-1.9-21 1.4-15-2.2-20 2.6-18-1.5-22 2.1-16-2.7-19 1.8-21-1.4-16 2.3-18-2.1-14 1.6-11-1.2z"
        fill="#fff"
      />
    </svg>
  )
}

/** 07 · LETTERS — results from newsrooms, set as torn clippings. */
export default function Letters() {
  const section = useRef<HTMLElement | null>(null)
  const progress = useRef(0)
  const reduced = useReducedMotion()
  const [viewRef, inView] = useInView('10%')

  useEffect(() => {
    const el = section.current
    if (!el) return
    if (reduced) {
      progress.current = 0.42
      return
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress
      },
    })
    return () => st.kill()
  }, [reduced])

  return (
    <section
      ref={section}
      id="letters"
      data-nav="light"
      data-label="LETTERS"
      className="tex-halftone position-relative overflow-hidden"
      style={{ background: '#fff' }}
    >
      <div ref={viewRef} className="pe-none position-absolute inset-0" />

      {/* the plane flies across the viewport, not across the whole section */}
      <div className="pe-none position-absolute inset-0 z-1">
        <div className="position-sticky top-0 h-svh w-100">
          <PaperPlane progress={progress} active={inView} />
        </div>
      </div>

      <div className="shell position-relative z-2 sec-pad">
        <div className="row g-8 align-items-end">
          <div className="col-12 col-lg-7">
            <div className="mb-6 d-flex align-items-center gap-3">
              <ColourBar width={40} height={4} />
              <span className="mono" style={{ color: 'rgba(17,17,17,.5)' }}>
                {letters.byline}
              </span>
            </div>
            <Reveal
              as="h2"
              lines={letters.headline.map((l) => ({
                text: l.text,
                className: l.tone === 'grey' ? 'head-grey' : 'head-ink',
              }))}
              className="display t-xl"
            />
          </div>
          <div className="col-12 col-lg-5 front-aside">
            <p className="body-copy" style={{ color: 'rgba(17,17,17,.6)' }}>
              {letters.intro}
            </p>
          </div>
        </div>

        {/* clippings */}
        <div className="mt-vh-7">
          {letters.clippings.map((c, i) => (
            <article
              key={c.publication}
              className="clipping row g-5 align-items-center mt-4 p-5"
              style={{ background: 'var(--newsprint)' }}
            >
              <TornEdge />

              {/* square photo slot */}
              <div className="col-12 col-sm-2">
                <div
                  className="halftone-media position-relative d-flex align-items-center justify-content-center"
                  style={{ aspectRatio: '1 / 1', maxWidth: 108, border: '1px solid rgba(17,17,17,.16)' }}
                  data-cursor="media"
                >
                  <div
                    className="position-absolute inset-0"
                    style={{
                      background:
                        i % 3 === 0
                          ? 'linear-gradient(135deg,#2b2438,#6118EA)'
                          : i % 3 === 1
                            ? 'linear-gradient(135deg,#1d1d22,#E10600)'
                            : 'linear-gradient(135deg,#232a33,#00AEEF)',
                    }}
                  />
                  <span className="display position-relative" style={{ color: '#fff', fontSize: 22 }}>
                    {c.publication.replace(/^THE /, '').slice(0, 2)}
                  </span>
                </div>
              </div>

              <div className="col-12 col-sm-4">
                <h3 className="display t-md">{c.publication}</h3>
                <span className="mono-xs" style={{ color: 'rgba(17,17,17,.45)' }}>
                  {c.segment} · CASE STUDY 0{i + 1}
                </span>
              </div>

              <div className="col-12 col-sm-6 d-flex flex-wrap align-items-baseline column-gap-8 row-gap-3 justify-content-sm-end">
                {c.results.map((r) => (
                  <div key={r.metric} className="text-start text-sm-end">
                    <div className="display" style={{ fontSize: 'clamp(1.7rem,3vw,2.9rem)', lineHeight: 0.9 }}>
                      {r.metric}
                    </div>
                    <div className="mono-xs" style={{ color: 'rgba(17,17,17,.45)' }}>
                      {r.label}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mono-xs mt-6" style={{ color: 'rgba(17,17,17,.34)' }}>
          RESULTS AS SUPPLIED BY BLINK CMS · NO QUOTES ATTRIBUTED
        </p>
      </div>
    </section>
  )
}
