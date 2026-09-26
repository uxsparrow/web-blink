'use client'

import { useEffect } from 'react'
import { RegCorners } from './Marks'

/**
 * "Watch the film" modal. The film itself isn't supplied by the brief, so the
 * frame is a clearly marked slot rather than a stand-in that reads as finished.
 * Drop a <video> in place of the slot when the cut exists.
 */
export default function VideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="film-modal position-fixed inset-0 z-modal d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(0,0,0,.92)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .5s',
      }}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className="film-frame position-relative"
        style={{
          aspectRatio: '16 / 9',
          background: '#0b0b0b',
          border: '1px solid rgba(255,255,255,.16)',
          transform: open ? 'scale(1)' : 'scale(.96)',
          transition: 'transform .6s cubic-bezier(.22,1,.36,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <RegCorners color="rgba(255,255,255,.3)" inset={12} size={14} />

        <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center gap-4">
          <span className="mono-xs d-flex align-items-center gap-2" style={{ color: 'var(--breaking)' }}>
            <span className="live-dot" /> FILM SLOT
          </span>
          <p className="mono-sm text-center" style={{ color: 'rgba(255,255,255,.5)', maxWidth: '46ch' }}>
            [BRAND FILM — NOT SUPPLIED]
            <br />
            <span className="mono-xs">Replace this frame with the cut · 16:9 · captions on by default</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="mono-xs film-close d-flex align-items-center gap-2"
          style={{ color: 'rgba(255,255,255,.65)' }}
        >
          CLOSE ✕
        </button>
      </div>
    </div>
  )
}
