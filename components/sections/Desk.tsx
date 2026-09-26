'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ScrollTrigger, useInView, useIsMobile, useReducedMotion } from '@/lib/motion'
import { desk } from '@/lib/content'
import { ColourBar, RegMark } from '@/components/ui/Marks'

const DeskScene = dynamic(() => import('@/components/scenes/DeskScene'), { ssr: false })

/** 03 · THE DESK — pinned, scroll-scrubbed: typewriter → laptop → folded paper. */
export default function Desk() {
  const wrap = useRef<HTMLDivElement | null>(null)
  const progress = useRef(0)
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const [viewRef, inView] = useInView('12%')

  useEffect(() => {
    if (reduced) {
      progress.current = 0.74 // reduced motion: one key frame, the folded page mid-flight
      return
    }
    const el = wrap.current
    if (!el) return

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: `+=${mobile ? 250 : 500}%`,
      pin: true,
      pinSpacing: true,
      scrub: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        progress.current = self.progress
      },
    })
    return () => st.kill()
  }, [mobile, reduced])

  return (
    <section
      id="desk"
      data-nav="light"
      data-label="THE DESK"
      style={{ background: '#fff' }}
      className="tex-halftone position-relative"
    >
      <div ref={wrap} className="pin-stage">
        <div ref={viewRef} className="pe-none position-absolute inset-0" />
        <DeskScene progress={progress} mobile={mobile} active={inView} />

        {/* mono label */}
        <div className="shell pe-none position-absolute inset-x-0 bottom-7 d-flex align-items-end justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <ColourBar width={40} height={4} />
            <span className="mono" style={{ color: 'rgba(17,17,17,.62)' }}>
              {desk.label}
            </span>
          </div>
          <div className="mono-xs d-none align-items-center gap-2 d-sm-flex" style={{ color: 'rgba(17,17,17,.34)' }}>
            PRINT HERITAGE → DIGITAL
            <RegMark size={13} color="rgba(17,17,17,.3)" />
          </div>
        </div>
      </div>
    </section>
  )
}
