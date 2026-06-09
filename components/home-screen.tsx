'use client'

import Link from 'next/link'
import { Hammer, Scale } from 'lucide-react'
import { Mascot } from '@/components/mascot'
import { TasteMeter } from '@/components/taste-meter'
import { useTaste } from '@/hooks/use-taste'

export function HomeScreen() {
  const { count } = useTaste()

  return (
    <main className="paper" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Taste meter on top. Nothing else up here. */}
      <header style={{ display: 'flex', justifyContent: 'center', padding: '18px 16px 0' }}>
        <TasteMeter count={count} />
      </header>

      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: 24,
        }}
      >
        <div className="floaty">
          <Mascot size={120} mood="happy" />
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          ayyayo
        </h1>

        <div
          style={{
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 420,
          }}
        >
          <Link href="/build" className="tap" style={{ textDecoration: 'none', flex: '1 1 150px' }}>
            <BigButton color="var(--peach)" icon={<Hammer size={40} strokeWidth={2.6} />} label="build" />
          </Link>
          <Link href="/judge" className="tap" style={{ textDecoration: 'none', flex: '1 1 150px' }}>
            <BigButton color="var(--sky)" icon={<Scale size={40} strokeWidth={2.6} />} label="judge" />
          </Link>
        </div>
      </section>
    </main>
  )
}

function BigButton({ color, icon, label }: { color: string; icon: React.ReactNode; label: string }) {
  return (
    <div
      className="plush-lg"
      style={{
        background: color,
        padding: '32px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        color: 'var(--ink)',
      }}
    >
      {icon}
      <span style={{ fontWeight: 900, fontSize: 26 }}>{label}</span>
    </div>
  )
}
