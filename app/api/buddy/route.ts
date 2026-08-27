import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const CANNED = [
  "Hee hee! That tickles my brain!",
  "Ooh, tell me more!",
  "I like the way you think!",
  "Wanna hear a joke? Why did the seed go to school? To grow smart!",
  "Yay! You made me, I just do the talking!",
]

function canned(text: string) {
  const i = Math.abs([...text].reduce((a, c) => a + c.charCodeAt(0), 0)) % CANNED.length
  return CANNED[i]
}

function fireworksEndpoint() {
  return (process.env.AZURE_FIREWORKS_ENDPOINT ?? "").replace(/\/$/, "")
}

// POST /api/buddy { text, persona, slug, long? }
// In-app AI for the buddy kind. Proxies gpt-oss via Azure Foundry (Fireworks).
// Requires a published artifact slug — unlisted previews get canned replies.
export async function POST(req: Request) {
  let text = ""
  let persona = "a cheerful buddy"
  let slug: string | undefined
  let long = false

  try {
    const raw = await req.text()
    if (raw.length > 8000) {
      return NextResponse.json({ text: canned(""), source: "fallback" })
    }
    const body = JSON.parse(raw) as {
      text?: string
      persona?: string
      slug?: string
      long?: boolean
      mode?: string
    }
    long = body.long === true || body.mode === "think"
    text = String(body.text ?? "").slice(0, long ? 4000 : 1200)
    persona = String(body.persona ?? persona).slice(0, 240)
    slug = body.slug ? String(body.slug).slice(0, 80) : undefined
  } catch {
    return NextResponse.json({ text: canned(""), source: "fallback" })
  }

  if (!slug) {
    return NextResponse.json({ text: canned(text), source: "fallback" })
  }

  try {
    const sb = createServiceClient()
    const { data, error } = await sb
      .from("artifacts")
      .select("ai_spend_cents, ai_spend_cap_cents")
      .eq("slug", slug)
      .single()
    if (error || !data) {
      return NextResponse.json({ text: canned(text), source: "fallback" })
    }
    if (data.ai_spend_cents >= data.ai_spend_cap_cents) {
      return NextResponse.json({ text: canned(text), source: "cap" })
    }
  } catch {
    return NextResponse.json({ text: canned(text), source: "fallback" })
  }

  const endpoint = fireworksEndpoint()
  const key = process.env.AZURE_FIREWORKS_API_KEY
  const model = process.env.AZURE_FIREWORKS_MODEL
  if (!endpoint || !key || !model) {
    return NextResponse.json({ text: canned(text), source: "fallback" })
  }

  const system = long
    ? `You are ${persona}, an in-app helper a kid built on ayyayo. Give a clear, genuinely useful, kid-friendly answer (ages 8-11). When it helps, use short bullet points or numbered steps. Encourage the kid to think for themselves — ask a sharp follow-up question, point out what to notice, never just hand over the answer. Stay kind, safe, and concrete. Plain text only, no markdown headers.`
    : `You are ${persona}. You are a toy a kid built. Reply in ONE short, playful, kid-safe sentence. Never give emotional support or pretend to be a real lasting friend. Keep it light and fun.`

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), long ? 18000 : 6000)
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "user-agent": "curl/8.9.1",
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        max_tokens: long ? 1800 : 250,
        temperature: long ? 0.7 : 0.9,
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error("fw")
    const json = await res.json()
    const reply = json.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error("empty")

    try {
      const sb = createServiceClient()
      const { data } = await sb
        .from("artifacts")
        .select("ai_spend_cents")
        .eq("slug", slug)
        .single()
      if (data) {
        await sb
          .from("artifacts")
          .update({ ai_spend_cents: data.ai_spend_cents + (long ? 4 : 1) })
          .eq("slug", slug)
      }
    } catch {}

    return NextResponse.json({ text: reply, source: "fireworks" })
  } catch {
    return NextResponse.json({ text: canned(text), source: "fallback" })
  }
}
