import { buildPrompt, streamCerebras } from "@/lib/cerebras"
import { injectDeckExporter } from "@/lib/deck-export"
import { templateFor } from "@/lib/templates"
import { getSessionUser } from "@/lib/supabase/server"
import type { Kind } from "@/lib/types"

// Node runtime, NOT edge: Vercel Edge Functions run on Cloudflare Workers,
// and Cerebras' Cloudflare bot protection 403s Workers-originated fetches
// regardless of headers. Node functions egress from AWS IPs and pass.
export const runtime = "nodejs"

// POST /api/generate { kind, instruction, baseHtml }
// Streams the artifact HTML as plain text so the client can render the
// creation WHILE it is being written (the wow moment). Metadata rides in
// headers. If Cerebras fails before the first byte, the fallback (template
// for a fresh make / current HTML for a refine) streams instead, and the
// x-ayyayo-source header says so — the client must never reward a fallback.
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return new Response(JSON.stringify({ error: "sign in first" }), { status: 401 })

  let kind: Kind = "game"
  let instruction = ""
  let baseHtml: string | undefined

  try {
    const body = (await req.json()) as {
      kind?: Kind
      instruction?: string
      baseHtml?: string
    }
    if (body.kind) kind = body.kind
    instruction = (body.instruction ?? "").trim()
    baseHtml = body.baseHtml
  } catch {
    /* use defaults */
  }

  const tmpl = templateFor(kind)
  const isRefine = Boolean(baseHtml && instruction)
  const encoder = new TextEncoder()

  const headers = (source: "cerebras" | "fallback") =>
    new Headers({
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-ayyayo-source": source,
      "x-ayyayo-title": encodeURIComponent(tmpl.title),
      "x-ayyayo-persona": encodeURIComponent(tmpl.persona ?? ""),
    })

  const fallback = () => {
    let html = isRefine ? (baseHtml as string) : tmpl.html
    if (kind === "deck") html = injectDeckExporter(html)
    return new Response(html, { headers: headers("fallback") })
  }

  try {
    const prompt = buildPrompt({
      kind,
      idea: isRefine ? undefined : instruction || undefined,
      current: isRefine ? baseHtml : undefined,
      refine: isRefine ? instruction : undefined,
    })

    const gen = streamCerebras(prompt)

    // Commit to Cerebras only once the first chunk actually arrives.
    const first = await gen.next()
    if (first.done) throw new Error("empty_stream")

    // For decks, splice the app-owned PPTX exporter in right after <head> —
    // buffered until the tag arrives (usually the first chunk), streaming
    // passthrough after. The model never writes export code.
    const needsExporter = kind === "deck"
    let injected = !needsExporter
    let carry = ""
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const push = (chunk: string) => {
          if (injected) {
            controller.enqueue(encoder.encode(chunk))
            return
          }
          carry += chunk
          if (/<head[^>]*>/i.test(carry) || /<html[^>]*>/i.test(carry) && carry.length > 6000) {
            controller.enqueue(encoder.encode(injectDeckExporter(carry)))
            injected = true
            carry = ""
          }
        }
        push(first.value)
        try {
          for await (const chunk of gen) push(chunk)
        } catch (err) {
          console.error("[ayyayo] generate mid-stream error:", (err as Error).message)
        }
        if (!injected && carry) controller.enqueue(encoder.encode(injectDeckExporter(carry)))
        controller.close()
      },
    })

    return new Response(stream, { headers: headers("cerebras") })
  } catch (err) {
    console.error("[ayyayo] generate error:", (err as Error).message)
    return fallback()
  }
}
