import { buildPrompt, streamCerebras, extractHtml } from "@/lib/cerebras"
import { templateFor } from "@/lib/templates"
import type { Kind } from "@/lib/types"

export const runtime = "edge"

// POST /api/generate { kind, instruction, baseHtml }
// Returns one complete artifact HTML doc. Tries Cerebras GLM-4.7; on ANY
// failure (no key, network, model error) falls back to a cached template / the
// current HTML so the wow (runs live in-app) never depends on a live call.
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

  try {
    const prompt = buildPrompt({
      kind,
      idea: isRefine ? undefined : instruction || undefined,
      current: isRefine ? baseHtml : undefined,
      refine: isRefine ? instruction : undefined,
    })

    let acc = ""
    for await (const chunk of streamCerebras(prompt)) acc += chunk

    const html = extractHtml(acc)
    if (!/<html|<!doctype/i.test(html)) throw new Error("empty")

    return Response.json({
      html,
      title: tmpl.title,
      persona: tmpl.persona,
      source: "cerebras",
    })
  } catch {
    // For a refine, keep the current screen; for a fresh make, use the template.
    const html = isRefine ? (baseHtml as string) : tmpl.html
    return Response.json({
      html,
      title: tmpl.title,
      persona: tmpl.persona,
      source: "fallback",
    })
  }
}
