'use client'

import { dateline, frontPage } from '@/lib/content'
import Reveal from '@/components/ui/Reveal'
import Counter from '@/components/ui/Counter'
import { ColourBar, RegMark } from '@/components/ui/Marks'

/** 02 · FRONT PAGE — statement + stats, set like a newspaper front page. */
export default function FrontPage() {
  return (
    <section
      id="front-page"
      data-nav="light"
      data-label="FRONT PAGE"
      className="tex-halftone position-relative"
      style={{ background: '#fff' }}
    >
      {/* masthead strip */}
      <div className="shell">
        <div className="hair-b hair-t d-flex align-items-center justify-content-between gap-4 py-3">
          <ColourBar width={40} height={4} />
          <span className="mono-xs text-center" style={{ color: 'rgba(17,17,17,.55)' }}>
            {frontPage.masthead}
          </span>
          <span className="mono-xs d-none d-sm-block" style={{ color: 'rgba(17,17,17,.38)' }}>
            {dateline}
          </span>
        </div>
      </div>

      {/* two columns with a thin column rule */}
      <div className="shell row gx-0 gy-14 pb-vh-7 pt-vh-7">
        <div className="col-12 col-lg-7 front-main">
          <div className="sticky-col sticky-col--high">
            {/* landscape thumbnail — newsroom at night */}
            <figure
              className="halftone-media front-thumb position-relative mb-9"
              data-cursor="media"
            >
              <div
                className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center gap-3"
                style={{
                  background:
                    'linear-gradient(115deg, #1a1a22 0%, #2b2438 42%, #120f1c 100%)',
                }}
              >
                {/* a wall of live screens, stood in for with light boxes */}
                <div className="screen-wall">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'block',
                        height: 14,
                        background:
                          i % 7 === 0
                            ? 'var(--breaking)'
                            : i % 3 === 0
                              ? 'var(--blink)'
                              : 'rgba(255,255,255,.25)',
                        animation: `flick ${1.4 + (i % 5) * 0.4}s ease-in-out ${i * 0.09}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <span className="mono-xs" style={{ color: 'rgba(255,255,255,.5)' }}>
                  [NEWSROOM FOOTAGE — NOT SUPPLIED]
                </span>
              </div>
              <figcaption className="mono-xs front-caption" style={{ color: 'rgba(17,17,17,.4)' }}>
                FIG. 01 · THE DESK AT NIGHT
              </figcaption>
            </figure>

            <Reveal
              as="h2"
              lines={[
                { text: frontPage.headline.grey, className: 'head-grey' },
                { text: frontPage.headline.ink, className: 'head-ink' },
              ]}
              className="display t-xl mt-12"
            />
          </div>
        </div>

        <div className="col-12 col-lg-5 hair-l front-aside">
          <div className="mono-xs mb-5 d-flex align-items-center gap-2" style={{ color: 'rgba(17,17,17,.4)' }}>
            <RegMark size={12} color="rgba(17,17,17,.4)" />
            THE BRIEF
          </div>
          <p className="body-copy dropcap" style={{ maxWidth: '38ch' }}>
            {frontPage.body}
          </p>
          <a href="#platform" className="pill pill-outline pill-mono mt-8">
            {frontPage.cta}
          </a>
        </div>
      </div>

      {/* stats */}
      <div className="shell pb-vh-9">
        <div className="hair-t d-flex align-items-center gap-3 pt-5">
          <span className="live-dot" />
          <span className="mono-xs" style={{ color: 'rgba(17,17,17,.45)' }}>
            {frontPage.statsCaption}
          </span>
        </div>

        {frontPage.stats.map((s) => (
          <div
            key={s.label}
            className="hair-b d-flex flex-column align-items-baseline justify-content-between gap-1 py-2 flex-sm-row"
          >
            <Counter
              value={s.value}
              suffix={s.suffix}
              className="display t-stat"
              duration={2.1}
            />
            <span
              className="mono pb-3 pb-sm-6"
              style={{ color: 'rgba(17,17,17,.5)', textAlign: 'right' }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <style>{`@keyframes flick { 0%,100% { opacity:.35 } 50% { opacity:1 } }`}</style>
    </section>
  )
}
