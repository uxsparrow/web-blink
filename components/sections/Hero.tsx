'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { gsap, ScrollTrigger, useInView, useIsMobile, useReducedMotion } from '@/lib/motion'
import { dateline, hero, pings } from '@/lib/content'
import Reveal from '@/components/ui/Reveal'
import VideoModal from '@/components/ui/VideoModal'
import { ColourBar } from '@/components/ui/Marks'

const Globe = dynamic(() => import('@/components/scenes/Globe'), { ssr: false })

export default function Hero({ ready }: { ready: boolean }) {
  const section = useRef<HTMLElement | null>(null)
  const sky = useRef<HTMLDivElement | null>(null)
  const content = useRef<HTMLDivElement | null>(null)
  const globeWrap = useRef<HTMLDivElement | null>(null)
  const tagEls = useRef<(HTMLElement | null)[]>([])
  const [film, setFilm] = useState(false)
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const [viewRef, inView] = useInView('15%')

  useEffect(() => {
    if (!ready || reduced) return
    const el = section.current
    if (!el) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })
      // the violet sky rises from the bottom and takes the page to white
      tl.fromTo(sky.current, { yPercent: 104 }, { yPercent: 0, ease: 'none' }, 0)
      tl.to(content.current, { yPercent: -18, opacity: 0, ease: 'none' }, 0.12)
      tl.to(globeWrap.current, { yPercent: -10, scale: 0.94, opacity: 0.25, ease: 'none' }, 0.1)
    }, el)

    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [ready, reduced])

  return (
    <section
      ref={section}
      id="hero"
      data-nav="dark"
      data-label="FRONT PAGE"
      className="position-relative"
      style={{ height: reduced ? '100svh' : '240svh', background: '#000' }}
    >
      <div ref={viewRef} className="position-sticky top-0 h-svh overflow-hidden">
        {/* globe */}
        <div
          ref={globeWrap}
          className="position-absolute inset-y-0 hero-globe z-1"
          style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.2s ease-out' }}
        >
          {ready && <Globe tagEls={tagEls} dense={!mobile} active={inView} />}

          {/* headline tags, projected from the globe */}
          <div className="pe-none position-absolute inset-0">
            {pings.map((p, i) => (
              <span
                key={p.city}
                ref={(el) => {
                  tagEls.current[i] = el
                }}
                className="mono-xs position-absolute start-0 top-0 d-flex align-items-center gap-2 text-nowrap"
                style={{
                  background: '#111',
                  color: '#fff',
                  padding: '6px 9px',
                  border: '1px solid rgba(255,255,255,.14)',
                  opacity: 0,
                  transition: 'opacity .45s',
                  marginLeft: 12,
                }}
              >
                <span className="live-dot" />
                {p.kind} {p.city}
              </span>
            ))}
          </div>
        </div>

        {/* copy */}
        <div ref={content} className="shell position-relative z-3 d-flex h-100 flex-column justify-content-center">
          <div className="hero-copy">
            <div className="mb-5 d-flex align-items-center gap-4">
              <ColourBar width={44} height={4} />
              <span className="mono" style={{ color: 'rgba(255,255,255,.62)' }}>
                {hero.eyebrow}
              </span>
            </div>

            <Reveal
              as="h1"
              lines={hero.h1}
              className="display t-hero head-lilac"
              start="top 96%"
              stagger={0.1}
            />

            <p
              className="body-copy mt-7"
              style={{ color: 'rgba(255,255,255,.66)', maxWidth: '44ch' }}
            >
              {hero.sub}
            </p>

            <div className="mt-9 d-flex flex-wrap align-items-center gap-3">
              <a href="#on-air" className="pill pill-white">
                {hero.primary}
              </a>
              <button onClick={() => setFilm(true)} className="pill pill-outline-inv">
                <span
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid currentColor',
                    borderTop: '4.5px solid transparent',
                    borderBottom: '4.5px solid transparent',
                  }}
                />
                {hero.secondary}
              </button>
            </div>

            <div className="mono-xs mt-10" style={{ color: 'rgba(255,255,255,.3)' }}>
              {dateline}
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="mono-xs position-absolute bottom-6 start-50 z-3 translate-middle-x text-center" style={{ color: 'rgba(255,255,255,.35)' }}>
          <div style={{ animation: 'cue 2.2s ease-in-out infinite' }}>SCROLL</div>
          <div style={{ width: 1, height: 26, background: 'currentColor', margin: '8px auto 0', opacity: 0.5 }} />
        </div>

        {/* violet sky that carries the page to white */}
        <div
          ref={sky}
          className="pe-none position-absolute inset-0 z-2"
          style={{ background: 'var(--blink-sky)', transform: 'translateY(104%)' }}
        />
      </div>

      <VideoModal open={film} onClose={() => setFilm(false)} />

      <style>{`@keyframes cue { 0%,100% { transform: translateY(0); opacity:.5 } 50% { transform: translateY(4px); opacity:1 } }`}</style>
    </section>
  )
}
