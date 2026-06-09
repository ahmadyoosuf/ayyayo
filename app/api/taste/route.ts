import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/taste?session=xxx  -> meter snapshot
export async function GET(req: Request) {
  const session = new URL(req.url).searchParams.get('session')
  if (!session) return NextResponse.json({ count: 0, recent: [] })
  try {
    const sb = createServiceClient()
    const { data, error } = await sb
      .from('taste_events')
      .select('reason, delta, mode, created_at')
      .eq('session_id', session)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    const count = (data ?? []).reduce((s, e) => s + (e.delta ?? 1), 0)
    return NextResponse.json({ count, recent: data ?? [] })
  } catch {
    return NextResponse.json({ count: 0, recent: [] })
  }
}

// POST /api/taste  -> record a rewarded event (choice + why + visible improvement)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { session, mode, reason } = body as {
      session: string
      mode: 'build' | 'judge'
      reason: string
    }
    // Judgment is load-bearing: never reward a bare tap. Require a stated why.
    if (!session || !reason || reason.trim().length < 2) {
      return NextResponse.json({ ok: false, rewarded: false }, { status: 200 })
    }
    const sb = createServiceClient()
    const { error } = await sb
      .from('taste_events')
      .insert({ session_id: session, mode: mode ?? 'build', reason: reason.trim(), delta: 1 })
    if (error) throw error
    return NextResponse.json({ ok: true, rewarded: true })
  } catch {
    return NextResponse.json({ ok: false, rewarded: false }, { status: 200 })
  }
}
