'use client'

// A plush blob mascot with blinking eyes. Pure SVG, no deps.
export function Mascot({
  size = 96,
  color = 'var(--butter)',
  mood = 'happy',
  className = '',
}: {
  size?: number
  color?: string
  mood?: 'happy' | 'think' | 'wow'
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      <g className="wobble" style={{ transformOrigin: '60px 108px' }}>
        <ellipse cx="60" cy="108" rx="34" ry="6" fill="rgba(43,30,22,0.12)" />
        <path
          d="M60 14c26 0 42 18 42 44 0 30-20 50-42 50S18 88 18 58C18 32 34 14 60 14Z"
          fill={color}
          stroke="var(--line)"
          strokeWidth="4"
        />
        {/* cheeks */}
        <circle className="cheek" cx="38" cy="66" r="7" />
        <circle className="cheek" cx="82" cy="66" r="7" />
        {/* eyes */}
        <g className="blink" style={{ transformOrigin: '60px 54px' }}>
          <circle className="eye" cx="46" cy="54" r="6" />
          <circle className="eye" cx="74" cy="54" r="6" />
          <circle cx="48" cy="52" r="2" fill="#fff" />
          <circle cx="76" cy="52" r="2" fill="#fff" />
        </g>
        {/* mouth */}
        {mood === 'happy' && (
          <path d="M48 74q12 12 24 0" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
        )}
        {mood === 'think' && (
          <path d="M50 78h20" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
        )}
        {mood === 'wow' && <ellipse cx="60" cy="78" rx="7" ry="9" fill="var(--line)" />}
      </g>
    </svg>
  )
}
