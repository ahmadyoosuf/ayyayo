import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge'

const CANNED = [
  'Hee hee! That tickles my brain!',
  'Ooh, tell me more!',
  'I like the way you think, boss!',
  'Wanna hear a joke? Why did the seed go to school? To grow smart!',
  'Yay! You are the boss, I just do the talking!',
]

function canned(text: string) {
  const i = Math.abs([...text].reduce((a, c) => a + c.charCodeAt(0), 0)) % CANNED.length
  return CANNED[i]
}

// POST /api/buddy { text, persona, slug? }
// In-app AI for the buddy kind. Proxies Fireworks server-side (key never ships
// to the kid's artifact). Enforces a per-artifact $ cap and always returns a
// canned reply on any failure so the character answers on stage.
export async function POST(req: Request) {
  let text = ''
  let persona = 'a cheerful buddy'
  let slug: string | undefined
  try {
    const body = await req.json()
    text = String(body.text ?? '').slice(0, 300)
    persona = String(body.persona ?? persona).slice(0, 200)
    slug = body.slug ? String(body.slug) : undefined
  } catch {}

  // Per-artifact spend cap: if this shared buddy is over budget, serve canned.
  if (slug) {
    try {
      const sb = createServiceClient()
      const { data } = await sb
        .from('artifacts')
        .select('ai_spend_cents, ai_spend_cap_cents')
        .eq('slug', slug)
        .single()
      if (data && data.ai_spend_cents >= data.ai_spend_cap_cents) {
        return NextResponse.json({ text: canned(text), source: 'cap' })
      }
    } catch {}
  }

  const key = process.env.FIREWORKS_API_KEY
  if (!key) return NextResponse.json({ text: canned(text), source: 'fallback' })

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        max_tokens: 80,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content: `You are ${persona}. You are a toy a kid built and bosses around. Reply in ONE short, playful, kid-safe sentence. Never give emotional support or pretend to be a real lasting friend. Keep it light and fun.`,
          },
          { role: 'user', content: text },
        ],
      }),
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error('fw')
    const json = await res.json()
    const reply = json.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error('empty')

    // Track tiny spend against the cap (rough cents estimate).
    if (slug) {
      try {
        const sb = createServiceClient()
        const { data } = await sb
          .from('artifacts')
          .select('ai_spend_cents')
          .eq('slug', slug)
          .single()
        if (data) {
          await sb
            .from('artifacts')
            .update({ ai_spend_cents: data.ai_spend_cents + 1 })
            .eq('slug', slug)
        }
      } catch {}
    }
    return NextResponse.json({ text: reply, source: 'fireworks' })
  } catch {
    return NextResponse.json({ text: canned(text), source: 'fallback' })
  }
}
