'use client'

import { Mic } from 'lucide-react'

// Big plush mic. Pulses while listening. Always paired with a tap fallback
// elsewhere in the UI so voice is never the only path.
export function MicButton({
  listening,
  onClick,
  size = 84,
  label = 'talk',
}: {
  listening: boolean
  onClick: () => void
  size?: number
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={listening ? 'listening, tap to stop' : label}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        border: '4px solid var(--line)',
        background: listening ? 'var(--rose)' : 'var(--peach)',
        boxShadow: '0 5px 0 var(--line), 0 10px 18px rgba(43,30,22,0.2)',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        transition: 'transform 120ms cubic-bezier(.5,1.6,.4,1)',
      }}
      className="tap"
    >
      {listening && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '4px solid var(--rose-deep)',
            animation: 'pulse-ring 1s ease-out infinite',
          }}
        />
      )}
      <Mic size={size * 0.42} strokeWidth={2.6} color="var(--ink)" />
    </button>
  )
}
