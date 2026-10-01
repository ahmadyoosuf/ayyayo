import { NextResponse } from "next/server"
import { experimental_upgradeWebSocket } from "@vercel/functions"
import { getSessionUser } from "@/lib/supabase/server"
import { bridgeLive, liveSetup, type VoiceMode } from "@/lib/gemini-live"

export const runtime = "nodejs"
// Must equal RELAY_SECONDS in lib/gemini-live.ts (Next requires a literal here).
export const maxDuration = 300
export const dynamic = "force-dynamic"

// GET /api/live?mode=build|judge&kind=&handle=  (WebSocket upgrade)
// Relays the browser's voice session to Gemini Live on Vertex AI. The prompt,
// tools, and key are set here; the browser can only stream audio, text, and
// tool results. `handle` resumes the previous conversation after a reconnect.
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "sign in first" }, { status: 401 })

  const apiKey = process.env.VERTEX_API_KEY
  const project = process.env.VERTEX_PROJECT
  if (!apiKey || !project) return NextResponse.json({ error: "no_key" }, { status: 503 })

  const params = new URL(req.url).searchParams
  const mode: VoiceMode = params.get("mode") === "judge" ? "judge" : "build"
  const kind = params.get("kind")?.slice(0, 20) || undefined
  const handle = params.get("handle") || undefined

  const setup = liveSetup(project, mode, kind, handle)
  return experimental_upgradeWebSocket((ws) => bridgeLive(ws, setup, apiKey), { maxPayload: 1024 * 1024 })
}
