import { GoogleGenAI } from "@google/genai"

export const runtime = "nodejs"

// Mints a short-lived ephemeral token so the browser can open a direct
// client-to-server WebSocket to the Gemini Live API. The long-lived key
// never leaves the server. The token is locked to a single model + config.
export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "no_key" }, { status: 503 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } })
    const now = Date.now()

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        httpOptions: { apiVersion: "v1alpha" },
      },
    })

    return Response.json({ token: token.name })
  } catch (err) {
    console.log("[v0] live-token error:", (err as Error).message)
    return Response.json({ error: "mint_failed" }, { status: 502 })
  }
}
