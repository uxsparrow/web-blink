'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { gsap, ScrollTrigger, useInView, useIsMobile, useReducedMotion } from '@/lib/motion'
import { platform } from '@/lib/content'
import PixelIcon from '@/components/ui/PixelIcon'
import { ColourBar } from '@/components/ui/Marks'

const ConveyorScene = dynamic(() => import('@/components/scenes/ConveyorScene'), { ssr: false })

const ACCENTS = ['#111111', '#6118EA', '#E10600', '#111111', '#6118EA', '#E10600']

/** 04 · OUR PLATFORM — modules pop off the press conveyor as front pages. */
export default function Platform() {
  const wrap = useRef<HTMLDivElement | null>(null)
  const word = useRef<HTMLDivElement | null>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const progress = useRef(0)
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const [viewRef, inView] = useInView('12%')

  useEffect(() => {
    const el = wrap.current
    if (!el) return

    if (reduced) {
      progress.current = 0.5
      gsap.set(cards.current, { opacity: 1, rotateX: 0, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: `+=${mobile ? 320 : 650}%`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            progress.current = self.progress
          },
        },
      })

      // the giant word slides against the run of the belt
      tl.fromTo(word.current, { xPercent: 12 }, { xPercent: -46, ease: 'none' }, 0)

      // each front page unfolds off the belt in turn
      cards.current.forEach((card, i) => {
        if (!card) return
        tl.fromTo(
          card,
          { opacity: 0, y: 70, rotateX: -84 },
          { opacity: 1, y: 0, rotateX: 0, ease: 'power3.out', duration: 0.6 },
          0.06 + i * 0.125
        )
      })
    }, el)

    return () => ctx.revert()
  }, [mobile, reduced])

  return (
    <section
      id="platform"
      data-nav="light"
      data-label="THE DESK"
      className="position-relative"
      style={{ background: '#fff' }}
    >
      <div ref={wrap} className="pin-stage">
        <div ref={viewRef} className="pe-none position-absolute inset-0" />
        <ConveyorScene progress={progress} active={inView} />

        {/* giant newsprint word, behind everything */}
        <div
          ref={word}
          aria-hidden
          className="display t-giant platform-word pe-none"
          style={{ color: 'var(--newsprint)', zIndex: 0 }}
        >
          {platform.bigWord}
        </div>

        {/* header */}
        <div className="shell position-relative z-2 platform-head">
          <div className="d-flex align-items-end justify-content-between gap-6">
            <div className="d-flex align-items-center gap-3">
              <ColourBar width={40} height={4} />
              <span className="mono" style={{ color: 'rgba(17,17,17,.55)' }}>
                OUR PLATFORM
              </span>
            </div>
            <p className="mono-xs mw-30ch text-end" style={{ color: 'rgba(17,17,17,.45)' }}>
              {platform.strap}
            </p>
          </div>
        </div>

        {/* the six front pages */}
        <div className="shell platform-cards row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3 z-2">
          {platform.modules.map((m, i) => (
            // the card sits inside the column so Bootstrap's gutters and the
            // card's own padding don't fight each other
            <div className="col" key={m.title}>
              <div
                ref={(el) => {
                  cards.current[i] = el
                }}
                className="platform-card d-flex flex-column gap-2 p-4"
              >
              {/* masthead band */}
              <span aria-hidden className="platform-card__band" style={{ background: ACCENTS[i] }} />
              <div className="d-flex align-items-start justify-content-between gap-3">
                <h3 className="display t-sm" style={{ color: 'var(--ink)' }}>
                  {m.title}
                </h3>
                <PixelIcon name={m.icon} size={22} color="rgba(17,17,17,.55)" />
              </div>
              <div className="hair-t" />
              <div className="d-flex align-items-baseline justify-content-between gap-3">
                <p className="mono-xs" style={{ color: 'rgba(17,17,17,.62)', maxWidth: '30ch' }}>
                  {m.line}
                </p>
                <span className="mono-xs" style={{ color: 'rgba(17,17,17,.3)' }}>
                  0{i + 1}
                </span>
              </div>
              </div>
            </div>
          ))}
        </div>

        {/* belt label */}
        <div className="shell pe-none position-absolute inset-x-0 bottom-5 z-2 d-flex justify-content-between">
          <span className="mono-xs" style={{ color: 'rgba(17,17,17,.4)' }}>
            PRESS LINE · EDITION RUNNING
          </span>
          <span className="mono-xs" style={{ color: 'rgba(17,17,17,.4)' }}>
            CMYK · REG. OK
          </span>
        </div>
      </div>
    </section>
  )
}
