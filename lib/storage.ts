import { createServiceClient } from "@/lib/supabase/server"

const BUCKET = "artifacts"

// Durable archive of every published creation. Supabase DB stays the live
// serving path; Storage is a write-through backup. Best-effort — a failed
// upload must never block or fail a publish.
export async function archiveCreation(args: {
  slug: string
  kind: string
  title: string
  html: string
  persona?: string | null
}): Promise<boolean> {
  try {
    const sb = createServiceClient()
    const at = new Date().toISOString()
    const prefix = `${args.slug}`

    const [htmlRes, metaRes] = await Promise.all([
      sb.storage.from(BUCKET).upload(`${prefix}/index.html`, args.html, {
        contentType: "text/html; charset=utf-8",
        upsert: true,
      }),
      sb.storage
        .from(BUCKET)
        .upload(
          `${prefix}/meta.json`,
          JSON.stringify({
            slug: args.slug,
            kind: args.kind,
            title: args.title,
            persona: args.persona ?? null,
            archived_at: at,
          }),
          { contentType: "application/json", upsert: true },
        ),
    ])

    if (htmlRes.error || metaRes.error) {
      console.error(
        "[ayyayo] storage archive failed:",
        htmlRes.error?.message ?? metaRes.error?.message,
      )
      return false
    }
    return true
  } catch (err) {
    console.error("[ayyayo] storage archive failed:", (err as Error).message)
    return false
  }
}
