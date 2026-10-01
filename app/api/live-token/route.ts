import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/supabase/server"
import { liveSetup, mintLiveToken, type VoiceMode } from "@/lib/gemini-live"

export const runtime = "nodejs"

// POST /api/live-token { mode, kind?, handle? }
// Mints a single-use Gemini Live token locked to this mode's prompt and tools.
// `handle` resumes a previous session after the server's ~10 minute reconnect.
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "sign in first" }, { status: 401 })

  let mode: VoiceMode = "build"
  let kind: string | undefined
  let handle: string | undefined
  try {
    const body = await req.json()
    if (body.mode === "judge") mode = "judge"
    if (typeof body.kind === "string") kind = body.kind.slice(0, 20)
    if (typeof body.handle === "string" && body.handle) handle = body.handle
  } catch {
    /* defaults */
  }

  try {
    return NextResponse.json(await mintLiveToken(liveSetup(mode, kind, handle)))
  } catch (err) {
    const message = (err as Error).message
    console.error("[ayyayo] live-token error:", message)
    return NextResponse.json(
      { error: message === "no_key" ? "no_key" : "mint_failed" },
      { status: message === "no_key" ? 503 : 502 },
    )
  }
}
