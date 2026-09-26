/**
 * Breaking ticker: red tab + scrolling mono strip.
 * Used under the header on dark sections and again on the footer back page.
 */
export default function Ticker({
  tab = 'BREAKING',
  items,
  tone = 'dark',
  duration = 32,
  className = '',
}: {
  tab?: string
  items: string[]
  tone?: 'dark' | 'light'
  duration?: number
  className?: string
}) {
  const onDark = tone === 'dark'
  const loop = [...items, ...items, ...items, ...items]

  return (
    <div
      className={`d-flex w-100 align-items-stretch overflow-hidden ${className}`}
      style={{
        background: onDark ? '#111111' : 'transparent',
        borderTop: `1px solid ${onDark ? 'rgba(255,255,255,.14)' : 'var(--hairline)'}`,
        borderBottom: `1px solid ${onDark ? 'rgba(255,255,255,.14)' : 'var(--hairline)'}`,
      }}
    >
      <div
        className="mono-xs d-flex flex-shrink-0 align-items-center gap-2 px-3 ticker-pad fw-bold text-white"
        style={{ background: 'var(--breaking)' }}
      >
        <span className="live-dot" style={{ background: '#fff' }} />
        {tab}
      </div>

      <div className="marquee flex-grow-1" style={{ ['--marquee-dur' as string]: `${duration}s` }}>
        {[0, 1].map((k) => (
          <div key={k} className="marquee-track align-items-center ticker-pad">
            {loop.map((item, i) => (
              <span
                key={`${k}-${i}`}
                className="mono-xs d-flex align-items-center gap-4"
                style={{ color: onDark ? 'rgba(255,255,255,.72)' : 'rgba(17,17,17,.62)' }}
              >
                {item}
                <span style={{ color: 'var(--breaking)' }}>·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
