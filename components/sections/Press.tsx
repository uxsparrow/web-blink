'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { gsap, useInView, useIsMobile, useReducedMotion } from '@/lib/motion'
import { press } from '@/lib/content'
import PixelIcon from '@/components/ui/PixelIcon'

const PressScene = dynamic(() => import('@/components/scenes/PressScene'), { ssr: false })

/* where each feature sits around the press once the camera pulls back */
const SPOTS: Record<number, string> = {
  0: 'press-feature--l1',
  1: 'press-feature--l2',
  2: 'press-feature--r1',
  3: 'press-feature--r2',
  4: 'press-feature--b',
}

/** 06 · THE PRESS — full-bleed, then it bursts into flying pages. */
export default function Press() {
  const wrap = useRef<HTMLDivElement | null>(null)
  const head = useRef<HTMLDivElement | null>(null)
  const feats = useRef<(HTMLDivElement | null)[]>([])
  const flash = useRef<HTMLDivElement | null>(null)
  const progress = useRef(0)
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const [viewRef, inView] = useInView('12%')

  useEffect(() => {
    const el = wrap.current
    if (!el) return

    if (reduced) {
      progress.current = 0.45
      gsap.set(feats.current, { opacity: 1, y: 0 })
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

      tl.fromTo(head.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5 }, 0.02)
      tl.to(head.current, { scale: 0.82, opacity: 0.9, duration: 0.5 }, 0.5)
      tl.to(head.current, { opacity: 0, duration: 0.22 }, 0.84)

      feats.current.forEach((f, i) => {
        if (!f) return
        tl.fromTo(
          f,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, ease: 'power2.out', duration: 0.34 },
          0.5 + i * 0.06
        )
        tl.to(f, { opacity: 0, duration: 0.18 }, 0.86)
      })

      // the pages flutter away and the page goes white
      tl.fromTo(flash.current, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.12 }, 0.93)
    }, el)

    return () => ctx.revert()
  }, [mobile, reduced])

  return (
    <section
      id="press"
      data-nav="dark"
      data-label="THE PRESS"
      className="position-relative"
      style={{ background: '#0a0810' }}
    >
      <div ref={wrap} className="pin-stage">
        <div ref={viewRef} className="pe-none position-absolute inset-0" />
        <PressScene progress={progress} active={inView} mobile={mobile} />

        {/* headline over the web */}
        <div
          ref={head}
          className="pe-none position-absolute inset-0 z-2 d-flex flex-column align-items-center justify-content-center px-4 text-center"
        >
          <h2 className="display t-xl" style={{ color: '#fff', textShadow: '0 18px 60px rgba(0,0,0,.6)' }}>
            {press.headline.map((l) => (
              <span key={l} className="line-mask">
                <span className="line-inner">{l}</span>
              </span>
            ))}
          </h2>
        </div>

        {/* features around the press */}
        {press.features.map((f, i) => (
          <div
            key={f.title}
            ref={(el) => {
              feats.current[i] = el
            }}
            className={`press-feature z-3 d-none d-md-block ${SPOTS[i]}`}
          >
            <div
              className={`mb-2 d-flex align-items-center gap-2 ${i === 4 ? 'justify-content-center' : ''}`}
            >
              <PixelIcon name={f.icon} size={20} color="#B9A4FF" />
              <span className="mono-xs" style={{ color: 'rgba(255,255,255,.4)' }}>
                0{i + 1}
              </span>
            </div>
            <h3 className="display t-sm mb-1" style={{ color: '#fff' }}>
              {f.title}
            </h3>
            <p className="mono-xs" style={{ color: 'rgba(255,255,255,.55)', lineHeight: 1.6 }}>
              {f.line}
            </p>
          </div>
        ))}

        {/* stacked list on small screens */}
        <div className="press-stack z-3 d-md-none">
          {press.features.map((f) => (
            <div key={f.title} className="d-flex align-items-center gap-2 py-1">
              <PixelIcon name={f.icon} size={14} color="#B9A4FF" />
              <span className="mono-xs" style={{ color: 'rgba(255,255,255,.7)' }}>
                {f.title}
              </span>
            </div>
          ))}
        </div>

        {/* white reveal as the pages flutter off */}
        <div
          ref={flash}
          className="pe-none position-absolute inset-0 z-4"
          style={{ background: '#fff', opacity: 0 }}
        />
      </div>
    </section>
  )
}
