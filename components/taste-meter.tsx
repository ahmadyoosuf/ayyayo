'use client'

import { IconSpark } from '@/components/icons'

// Competence mirror, not a score to farm. Shows how many sharp calls the kid
// has made (choice + why + visible improvement). Levels reflect discernment.
const LEVELS = ['new eyes', 'noticing', 'sharp', 'eagle eye', 'taste boss']

export function TasteMeter({
  count,
  pop = false,
  compact = false,
}: {
  count: number
  pop?: boolean
  compact?: boolean
}) {
  const level = Math.min(LEVELS.length - 1, Math.floor(count / 3))
  const inLevel = count % 3
  const pct = (inLevel / 3) * 100

  return (
    <div
      className="plush"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 10 : 12,
        padding: compact ? '6px 12px' : '8px 14px',
        background: 'var(--paper)',
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex' }} className={pop ? 'popin' : 'breathe'}>
        <IconSpark size={24} />
      </span>
      <div style={{ minWidth: compact ? 96 : 120 }}>
        <div style={{ fontWeight: 900, fontSize: 14, lineHeight: 1.1 }}>
          {LEVELS[level]}
        </div>
        <div
          style={{
            marginTop: 5,
            height: 10,
            borderRadius: 999,
            border: '2.5px solid var(--line)',
            background: '#fff',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${level === LEVELS.length - 1 ? 100 : pct}%`,
              background: 'var(--mint-deep)',
              transition: 'width 600ms cubic-bezier(.5,1.6,.4,1)',
            }}
          />
        </div>
      </div>
      <div
        aria-label={`${count} sharp calls`}
        style={{
          fontWeight: 900,
          fontSize: 18,
          minWidth: 28,
          textAlign: 'center',
        }}
        className={pop ? 'popin' : undefined}
      >
        {count}
      </div>
    </div>
  )
}
