import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { makeSlug } from "@/lib/slug"
import type { Kind } from "@/lib/types"

// POST /api/save { kind, title, html, persona, prompt }
// Persists the kid's creation and returns a short slug it is served live at.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      kind?: Kind
      title?: string
      html?: string
      persona?: string
      prompt?: string
    }
    if (!body.html || !body.kind) {
      return NextResponse.json({ error: "missing html" }, { status: 400 })
    }

    const sb = createServiceClient()

    // Retry slug collisions a few times (slugs are short + friendly).
    let slug = makeSlug()
    for (let i = 0; i < 5; i++) {
      const { error } = await sb.from("artifacts").insert({
        slug,
        kind: body.kind,
        title: (body.title ?? "").slice(0, 120),
        prompt: (body.prompt ?? "").slice(0, 500),
        html: body.html,
        buddy_persona: body.persona ?? null,
      })
      if (!error) return NextResponse.json({ slug })
      if (error.code === "23505") {
        slug = makeSlug() // unique violation -> new slug
        continue
      }
      throw error
    }
    return NextResponse.json({ error: "slug collision" }, { status: 500 })
  } catch (e) {
    return NextResponse.json({ error: "save failed" }, { status: 500 })
  }
}
