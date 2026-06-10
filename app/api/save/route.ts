import { NextResponse, after } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { makeSlug, sanitizeSlug } from "@/lib/slug"
import { archiveCreation } from "@/lib/s3"
import type { Kind } from "@/lib/types"

// Node runtime: the AWS SDK isn't edge-compatible, and (like Cerebras) we
// want AWS-IP egress.
export const runtime = "nodejs"

// POST /api/save { kind, title, html, persona, prompt, slug? }
// Persists the kid's creation and returns the slug it is served live at.
// The kid can name their site (voice or typed); the name becomes the
// subdomain. Collisions get a numeric suffix, garbage falls back to a
// friendly random slug.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      kind?: Kind
      title?: string
      html?: string
      persona?: string
      prompt?: string
      slug?: string
    }
    if (!body.html || !body.kind) {
      return NextResponse.json({ error: "missing html" }, { status: 400 })
    }

    const sb = createServiceClient()

    const wanted = sanitizeSlug(body.slug ?? "")
    let slug = wanted || makeSlug()
    for (let i = 0; i < 5; i++) {
      const { error } = await sb.from("artifacts").insert({
        slug,
        kind: body.kind,
        title: (body.title ?? "").slice(0, 120),
        prompt: (body.prompt ?? "").slice(0, 500),
        html: body.html,
        buddy_persona: body.persona ?? null,
      })
      if (!error) {
        // Durable S3 archive. after() runs it once the response is sent, so
        // it never blocks the publish AND survives the serverless freeze
        // that drops bare fire-and-forget promises.
        const archiveSlug = slug
        after(
          archiveCreation({
            slug: archiveSlug,
            kind: body.kind!,
            title: body.title ?? "",
            html: body.html!,
            persona: body.persona,
          }),
        )
        return NextResponse.json({ slug })
      }
      if (error.code === "23505") {
        // unique violation: keep the kid's name with a suffix, else re-roll
        slug = wanted ? `${wanted}-${i + 2}` : makeSlug()
        continue
      }
      throw error
    }
    return NextResponse.json({ error: "slug collision" }, { status: 500 })
  } catch (e) {
    return NextResponse.json({ error: "save failed" }, { status: 500 })
  }
}
