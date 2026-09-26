'use client'

import { onAir } from '@/lib/content'
import Reveal from '@/components/ui/Reveal'

/** 11 · ON AIR — final CTA, broadcast rings pulsing from a red light. */
export default function OnAir() {
  return (
    <section
      id="on-air"
      data-nav="dark"
      data-label="CLASSIFIEDS"
      className="position-relative overflow-hidden"
      style={{ background: '#111111' }}
    >
      {/* broadcast signal rings */}
      <div className="pe-none position-absolute inset-0 d-flex align-items-center justify-content-center" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="position-absolute rounded-circle"
            style={{
              width: 180,
              height: 180,
              border: '1px solid rgba(225,6,0,.34)',
              animation: `signal 5.4s cubic-bezier(.22,1,.36,1) ${i * 1.08}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="shell position-relative z-2 d-flex flex-column align-items-center sec-pad-xl text-center">
        {/* the ON AIR light */}
        <div className="mb-10 d-flex align-items-center gap-3">
          <span
            style={{
              width: 13,
              height: 13,
              borderRadius: 999,
              background: 'var(--breaking)',
              boxShadow: '0 0 26px 6px rgba(225,6,0,.55)',
              animation: 'on-air-blink 2.4s ease-in-out infinite',
              display: 'block',
            }}
          />
          <span className="mono" style={{ color: 'rgba(255,255,255,.6)' }}>
            ON AIR
          </span>
        </div>

        <Reveal
          as="h2"
          lines={onAir.headline}
          className="display t-xl"
          lineClassName="text-white"
        />

        <p
          className="body-copy mt-8"
          style={{ color: 'rgba(255,255,255,.6)', maxWidth: '52ch', margin: '2rem auto 0' }}
        >
          {onAir.sub}
        </p>

        <a href="#on-air" className="pill pill-white mt-10">
          {onAir.cta}
        </a>
      </div>

      <style>{`
        @keyframes signal {
          0% { transform: scale(.4); opacity: 0 }
          12% { opacity: .8 }
          100% { transform: scale(5.6); opacity: 0 }
        }
        @keyframes on-air-blink {
          0%, 100% { opacity: 1 }
          50% { opacity: .45 }
        }
      `}</style>
    </section>
  )
}
