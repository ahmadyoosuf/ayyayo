import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Node runtime, NOT edge — same Cloudflare-blocks-Workers issue as Cerebras.
export const runtime = 'nodejs'

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
  // `long` lets an in-app AI ask for a substantive answer (a critical-thinking
  // prompt, a story, an explanation). Default stays small + snappy.
  let long = false
  try {
    const body = await req.json()
    text = String(body.text ?? '').slice(0, long ? 4000 : 1200)
    persona = String(body.persona ?? persona).slice(0, 240)
    slug = body.slug ? String(body.slug) : undefined
    long = body.long === true || body.mode === 'think'
    text = String(body.text ?? '').slice(0, long ? 4000 : 600)
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

  // System prompt + budget scale with the mode. Short = a toy that quips.
  // Long = a thinking partner the kid built (e.g. a critical-thinking app):
  // still kid-safe, but allowed to actually be substantive and well-structured.
  const system = long
    ? `You are ${persona}, an in-app helper a kid built on ayyayo. Give a clear, genuinely useful, kid-friendly answer (ages 8-11). When it helps, use short bullet points or numbered steps. Encourage the kid to think for themselves — ask a sharp follow-up question, point out what to notice, never just hand over the answer. Stay kind, safe, and concrete. Plain text only, no markdown headers.`
    : `You are ${persona}. You are a toy a kid built and bosses around. Reply in ONE short, playful, kid-safe sentence. Never give emotional support or pretend to be a real lasting friend. Keep it light and fun.`

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), long ? 18000 : 6000)
    const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
        // Same Cloudflare bot-wall issue as Cerebras: UA-less datacenter
        // fetches get 403'd. Explicit UA passes.
        'user-agent': 'curl/8.9.1',
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        // gpt-oss-120b: fastest open model on Fireworks serverless (MoE).
        // llama-v3p1-8b was retired (404s).
        model: 'accounts/fireworks/models/gpt-oss-120b',
        max_tokens: long ? 1800 : 250,
        reasoning_effort: long ? 'medium' : 'low',
        temperature: long ? 0.7 : 0.9,
        messages: [
          { role: 'system', content: system },
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
            .update({ ai_spend_cents: data.ai_spend_cents + (long ? 4 : 1) })
            .eq('slug', slug)
        }
      } catch {}
    }
    return NextResponse.json({ text: reply, source: 'fireworks' })
  } catch {
    return NextResponse.json({ text: canned(text), source: 'fallback' })
  }
}
