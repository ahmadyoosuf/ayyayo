// Hand-crafted plush icons. Same visual language as the Mascot: thick warm
// outlines, pastel fills, rounded everything, a slight hand-drawn tilt.
// Deliberately replaces stock icon packs and emoji across the app chrome.

interface IconProps {
  size?: number
  className?: string
}

const stroke = {
  stroke: 'var(--line)',
  strokeWidth: 2.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconMic({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(-4 16 16)">
        <rect x="11.5" y="4" width="9" height="14" rx="4.5" fill="var(--cream)" {...stroke} />
        <path d="M7.5 14.5a8.5 8.5 0 0 0 17 .2" {...stroke} fill="none" />
        <path d="M16 23.4v3.8" {...stroke} />
        <path d="M11 27.6q5 1.2 10-.1" {...stroke} fill="none" />
      </g>
    </svg>
  )
}

export function IconBack({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M26 16.4Q17 15.6 9.5 16.1" {...stroke} strokeWidth={3.2} fill="none" />
      <path d="M15.5 9.5Q11 13 8 16.1q3.2 3.3 7.3 6.4" {...stroke} strokeWidth={3.2} fill="none" />
    </svg>
  )
}

export function IconShare({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(3 16 16)">
        <path d="M27 5.5Q15 9.5 5.5 14.8q3.8 2.4 7.4 3.3L15 25.8q2.1-3.3 3.6-6.4Q23.5 13 27 5.5Z" fill="var(--sky)" {...stroke} />
        <path d="M27 5.5 12.9 18.1" {...stroke} fill="none" />
      </g>
    </svg>
  )
}

export function IconSpark({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(-6 16 16)">
        <path
          d="M16 3.5q1.4 7 2.6 8.6Q20.2 13.5 27 15.5q-6.8 2-8.4 3.4Q17.4 20.5 16 27.5q-1.4-7-2.6-8.6Q11.8 17.5 5 15.5q6.8-2 8.4-3.4Q14.6 10.5 16 3.5Z"
          fill="var(--butter)"
          {...stroke}
        />
        <circle cx="25.5" cy="6.5" r="1.6" fill="var(--peach-deep)" />
      </g>
    </svg>
  )
}

export function IconHammer({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M14 13Q20 18.5 25.8 26.2" {...stroke} strokeWidth={3.6} fill="none" />
      <g transform="rotate(-16 12 9.5)">
        <rect x="2.5" y="4.5" width="19" height="10.5" rx="4" fill="var(--butter)" {...stroke} />
      </g>
    </svg>
  )
}

export function IconScale({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M16 6.5v18.5" {...stroke} strokeWidth={3.2} fill="none" />
      <path d="M10 26.8q6-1.4 12 0" {...stroke} strokeWidth={3.2} fill="none" />
      <path d="M5 9.2Q16 6.2 27 9.2" {...stroke} strokeWidth={3.2} fill="none" />
      <path d="M6.2 9.7v4" {...stroke} />
      <path d="M25.8 9.7v4" {...stroke} />
      <path d="M1.5 14.7a4.8 4.8 0 0 0 9.6 0Z" fill="var(--butter)" {...stroke} />
      <path d="M20.9 14.7a4.8 4.8 0 0 0 9.6 0Z" fill="var(--cream)" {...stroke} />
    </svg>
  )
}

export function IconCheck({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M6 17.5q4.5 4.5 7 7Q18.5 14.5 26.5 7.5" {...stroke} strokeWidth={3.6} fill="none" />
    </svg>
  )
}

export function IconX({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M9 9.5Q16 16 23 23" {...stroke} strokeWidth={3.4} fill="none" />
      <path d="M23 9.5Q16.5 16 9.5 23" {...stroke} strokeWidth={3.4} fill="none" />
    </svg>
  )
}

export function IconCopy({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="10.5" y="4" width="14" height="16" rx="4" fill="var(--paper)" {...stroke} />
      <rect x="6" y="10.5" width="14.5" height="17" rx="4" fill="var(--butter)" {...stroke} />
    </svg>
  )
}

export function IconParty({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M5.5 27.5q2-7.5 7-15.5 2.6-.6 5.6 2.4t2.4 5.6q-8 5-15 7.5Z" fill="var(--peach)" {...stroke} />
      <path d="M9.6 17.5q3.6 1.5 5.6 4.6" {...stroke} fill="none" />
      <path d="M21.5 9.5q1.3-2 3.4-3.3" {...stroke} fill="none" />
      <circle cx="27" cy="11.5" r="1.7" fill="var(--butter)" stroke="var(--line)" strokeWidth="2" />
      <circle cx="22" cy="4.5" r="1.5" fill="var(--mint)" stroke="var(--line)" strokeWidth="2" />
      <circle cx="28.5" cy="19" r="1.5" fill="var(--rose)" stroke="var(--line)" strokeWidth="2" />
    </svg>
  )
}

export function IconHome({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="13.5" width="16" height="13.5" rx="3.5" fill="var(--butter)" {...stroke} />
      <path d="M4.5 15.5Q16 4 27.5 15.5" {...stroke} fill="none" />
      <rect x="13.5" y="19" width="5" height="8" rx="2.5" fill="var(--paper)" stroke="var(--line)" strokeWidth="2.4" />
    </svg>
  )
}

export function IconHush({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 13q-1.5 0-1.5 1.5v3Q3.5 19 5 19h4l6.5 6q1.5 1 1.5-1V8q0-2-1.5-1L9 13Z"
        fill="var(--butter)"
        {...stroke}
      />
      <path d="M22 12.5Q25.5 16 29 19.5" {...stroke} fill="none" />
      <path d="M29 12.5Q25.5 16 22 19.5" {...stroke} fill="none" />
    </svg>
  )
}

export function IconSound({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 13q-1.5 0-1.5 1.5v3Q3.5 19 5 19h4l6.5 6q1.5 1 1.5-1V8q0-2-1.5-1L9 13Z"
        fill="var(--mint)"
        {...stroke}
      />
      <path d="M21.5 11.5q3 4.5 0 9" {...stroke} fill="none" />
      <path d="M25.5 8.5q5 7.5 0 15" {...stroke} fill="none" />
    </svg>
  )
}

export function IconOpenTab({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 7H8.5Q5 7 5 10.5v13Q5 27 8.5 27h13q3.5 0 3.5-3.5V18"
        {...stroke}
        fill="var(--paper)"
      />
      <path d="M19 5.5q4.5-.5 8 0 .5 3.5 0 8" {...stroke} fill="none" />
      <path d="M26.5 6Q20 12.5 14.5 18.5" {...stroke} strokeWidth={3.2} fill="none" />
    </svg>
  )
}

export function IconBolt({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M18.5 3.5 7.5 18.2q3.4.6 6.2.4-1.2 5-1.6 9.9 6.5-7.7 12.4-16-3.3-.7-6.3-.4 1-4.4.3-8.6Z"
        fill="var(--butter)"
        {...stroke}
      />
    </svg>
  )
}
