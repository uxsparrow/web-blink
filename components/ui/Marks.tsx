/**
 * Print-shop furniture: CMYK registration marks and colour bars.
 * These are the news equivalent of United Carriers' "+" grid marks.
 */

export function RegMark({
  size = 16,
  color = 'currentColor',
  className = '',
  style,
}: {
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}) {
  const c = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={style}
      aria-hidden
    >
      <circle cx={c} cy={c} r={size * 0.28} fill="none" stroke={color} strokeWidth="0.8" />
      <line x1={c} y1="0" x2={c} y2={size} stroke={color} strokeWidth="0.8" />
      <line x1="0" y1={c} x2={size} y2={c} stroke={color} strokeWidth="0.8" />
    </svg>
  )
}

/** Registration marks pinned to the four corners of a box. */
export function RegCorners({
  inset = 14,
  size = 14,
  color = 'rgba(17,17,17,0.28)',
}: {
  inset?: number
  size?: number
  color?: string
}) {
  const spots: React.CSSProperties[] = [
    { top: inset, left: inset },
    { top: inset, right: inset },
    { bottom: inset, left: inset },
    { bottom: inset, right: inset },
  ]
  return (
    <>
      {spots.map((s, i) => (
        <RegMark key={i} size={size} color={color} className="pe-none position-absolute" style={s} />
      ))}
    </>
  )
}

const CMYK = ['#00AEEF', '#EC008C', '#FFF200', '#111111']

export function ColourBar({
  width = 64,
  height = 5,
  className = '',
}: {
  width?: number
  height?: number
  className?: string
}) {
  return (
    <div className={`d-flex ${className}`} style={{ width, height }} aria-hidden>
      {CMYK.map((c) => (
        <span key={c} style={{ background: c, flex: 1 }} />
      ))}
    </div>
  )
}
