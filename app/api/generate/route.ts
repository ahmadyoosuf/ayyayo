import { buildPrompt, streamCerebras } from "@/lib/cerebras"
import { templateFor } from "@/lib/templates"
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
    const html = isRefine ? (baseHtml as string) : tmpl.html
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

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(first.value))
        try {
          for await (const chunk of gen) controller.enqueue(encoder.encode(chunk))
        } catch (err) {
          console.error("[ayyayo] generate mid-stream error:", (err as Error).message)
        }
        controller.close()
      },
    })

    return new Response(stream, { headers: headers("cerebras") })
  } catch (err) {
    console.error("[ayyayo] generate error:", (err as Error).message)
    return fallback()
  }
}
