import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/supabase/server"
import { toRealtimeTools } from "@/lib/realtime-tools"
import type { VoiceTool } from "@/lib/realtime-tools"

export const runtime = "nodejs"

function azureEndpoint() {
  return (process.env.AZURE_OPENAI_ENDPOINT ?? "").replace(/\/$/, "")
}

// POST /api/realtime-token { systemInstruction, tools }
// Mints an ephemeral Azure Realtime token for browser WebRTC. Long-lived keys
// stay server-side; session config (instructions, tools, voice) is locked in here.
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "sign in first" }, { status: 401 })

  const endpoint = azureEndpoint()
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deployment = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT
  if (!endpoint || !apiKey || !deployment) {
    return NextResponse.json({ error: "no_key" }, { status: 503 })
  }

  let systemInstruction = ""
  let tools: VoiceTool[] = []
  try {
    const body = await req.json()
    systemInstruction = String(body.systemInstruction ?? "")
    if (Array.isArray(body.tools)) tools = body.tools as VoiceTool[]
  } catch {
    /* empty body ok for minimal sessions */
  }

  try {
    const res = await fetch(`${endpoint}/openai/v1/realtime/client_secrets`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: deployment,
          instructions: systemInstruction,
          tools: toRealtimeTools(tools),
          audio: {
            input: { turn_detection: { type: "server_vad" } },
            output: { voice: "marin" },
          },
        },
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error("[ayyayo] realtime-token error", res.status, detail.slice(0, 300))
      return NextResponse.json({ error: "mint_failed" }, { status: 502 })
    }

    const data = (await res.json()) as { value?: string }
    if (!data.value) {
      return NextResponse.json({ error: "mint_failed" }, { status: 502 })
    }

    return NextResponse.json({
      token: data.value,
      callsUrl: `${endpoint}/openai/v1/realtime/calls`,
    })
  } catch (err) {
    console.error("[ayyayo] realtime-token error:", (err as Error).message)
    return NextResponse.json({ error: "mint_failed" }, { status: 502 })
  }
}
