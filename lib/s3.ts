import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// Durable archive of every published creation. Supabase stays the live
// serving path; S3 is a write-through backup so nothing a kid makes is ever
// lost. Best-effort by design — a slow or failed S3 write must never block
// or fail a publish.

const BUCKET = process.env.AYYAYO_S3_BUCKET || "ayyayo-creations"

let _client: S3Client | null = null
function client(): S3Client | null {
  if (!process.env.AWS_ACCESS_KEY_ID) return null
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_DEFAULT_REGION || "us-west-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    })
  }
  return _client
}

// Archive a creation's HTML + metadata under creations/<slug>/. Returns true
// on success. Swallows all errors (logs once) so callers can fire-and-forget.
export async function archiveCreation(args: {
  slug: string
  kind: string
  title: string
  html: string
  persona?: string | null
}): Promise<boolean> {
  const s3 = client()
  if (!s3) return false
  try {
    const at = new Date().toISOString()
    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: `creations/${args.slug}/index.html`,
          Body: args.html,
          ContentType: "text/html; charset=utf-8",
        }),
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: `creations/${args.slug}/meta.json`,
          Body: JSON.stringify({
            slug: args.slug,
            kind: args.kind,
            title: args.title,
            persona: args.persona ?? null,
            archived_at: at,
          }),
          ContentType: "application/json",
        }),
      ),
    ])
    return true
  } catch (err) {
    console.error("[ayyayo] s3 archive failed:", (err as Error).message)
    return false
  }
}
