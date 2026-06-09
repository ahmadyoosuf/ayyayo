'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import { getSessionId } from '@/lib/session'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface TasteEvent {
  reason: string
  delta: number
  mode: string
  created_at: string
}

export function useTaste() {
  const session = typeof window !== 'undefined' ? getSessionId() : 'server'
  const { data, mutate } = useSWR<{ count: number; recent: TasteEvent[] }>(
    session !== 'server' ? `/api/taste?session=${session}` : null,
    fetcher,
    { fallbackData: { count: 0, recent: [] }, revalidateOnFocus: false },
  )

  // A rewarded act = a real choice + a stated why. Bare taps return rewarded:false.
  const reward = useCallback(
    async (mode: 'build' | 'judge', reason: string) => {
      const res = await fetch('/api/taste', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session, mode, reason }),
      })
        .then((r) => r.json())
        .catch(() => ({ rewarded: false }))
      if (res.rewarded) await mutate()
      return res.rewarded as boolean
    },
    [session, mutate],
  )

  return { count: data?.count ?? 0, recent: data?.recent ?? [], reward, mutate }
}
