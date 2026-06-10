'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Mascot } from '@/components/mascot'
import { TasteMeter } from '@/components/taste-meter'
import { IconHammer, IconScale, IconOpenTab } from '@/components/icons'
import { useTaste } from '@/hooks/use-taste'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { Kind } from '@/lib/types'

const fetcher = (u: string) => fetch(u).then((r) => r.json())

interface Creation {
  slug: string
  kind: Kind
  title: string
  created_at: string
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export function HomeScreen() {
  const router = useRouter()
  const { count } = useTaste()
  const { data } = useSWR<{ creations: Creation[] }>('/api/mine', fetcher, {
    revalidateOnFocus: false,
  })
  const creations = data?.creations ?? []

  async function signOut() {
    await supabaseBrowser().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <main className="paper" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
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
          <Mascot size={110} mood="happy" />
        </div>
        <h1 className="display" style={{ fontSize: 40, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
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
            <BigButton color="var(--peach)" icon={<IconHammer size={58} />} label="build" />
          </Link>
          <Link href="/judge" className="tap" style={{ textDecoration: 'none', flex: '1 1 150px' }}>
            <BigButton color="var(--sky)" icon={<IconScale size={58} />} label="judge" />
          </Link>
        </div>

        {creations.length > 0 ? (
          <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink-soft)', paddingLeft: 4 }}>
              your creations
            </span>
            {creations.slice(0, 6).map((c) => (
              <a
                key={c.slug}
                href={`/a/${c.slug}`}
                target="_blank"
                rel="noreferrer"
                className="plush tap"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                <span className="chip butter" style={{ fontSize: 11, padding: '3px 9px', cursor: 'inherit' }}>
                  {c.kind}
                </span>
                <span style={{ fontWeight: 800, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title || c.slug.replace(/-/g, ' ')}
                </span>
                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-soft)' }}>{timeAgo(c.created_at)}</span>
                <IconOpenTab size={16} />
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <footer style={{ display: 'flex', justifyContent: 'center', padding: '0 16px 18px' }}>
        <button
          onClick={signOut}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--ink-soft)',
          }}
        >
          sign out
        </button>
      </footer>
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
