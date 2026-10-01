import WebSocket, { type RawData } from "ws"
import {
  BUILD_TOOLS,
  JUDGE_TOOLS,
  JUDGE_SYSTEM_INSTRUCTION,
  buildSystemInstruction,
  type VoiceTool,
} from "@/lib/live-tools"

// Gemini Live native speech-to-speech on Vertex AI, billed to Google Cloud.
// Vertex has no browser-safe ephemeral tokens, so the browser talks to our
// relay and the relay talks to Vertex with the server-side key.

export const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.8-live"
const LOCATION = process.env.VERTEX_LOCATION || "us-central1"

// Vercel caps a function (and its socket) at maxDuration; the relay asks the
// browser to resume just before that, mirroring Gemini's own goAway.
export const RELAY_SECONDS = 300
const GOAWAY_AT_MS = (RELAY_SECONDS - 30) * 1000
const HARD_CLOSE_AT_MS = (RELAY_SECONDS - 5) * 1000

const CLIENT_KINDS = new Set(["realtimeInput", "toolResponse", "clientContent"])

export type VoiceMode = "build" | "judge"

function toDeclarations(tools: VoiceTool[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    behavior: "BLOCKING",
    parametersJsonSchema: t.parameters,
  }))
}

export function liveSetup(project: string, mode: VoiceMode, kind?: string, handle?: string) {
  const instruction = mode === "build" ? buildSystemInstruction(kind) : JUDGE_SYSTEM_INSTRUCTION
  return {
    model: `projects/${project}/locations/${LOCATION}/publishers/google/models/${LIVE_MODEL}`,
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } },
    },
    systemInstruction: { parts: [{ text: instruction }] },
    tools: [{ functionDeclarations: toDeclarations(mode === "build" ? BUILD_TOOLS : JUDGE_TOOLS) }],
    outputAudioTranscription: {},
    sessionResumption: handle ? { handle } : {},
    contextWindowCompression: { slidingWindow: {} },
  }
}

// ws only accepts these codes in close(); 1005/1006 are reserved.
function closeCode(code: number) {
  return code === 1000 || (code >= 1001 && code <= 1003) || (code >= 1007 && code <= 1014) || (code >= 3000 && code <= 4999)
    ? code
    : 1011
}

function closeReason(reason: Buffer | string) {
  return Buffer.from(String(reason)).subarray(0, 120).toString()
}

export function bridgeLive(client: WebSocket, setup: ReturnType<typeof liveSetup>, apiKey: string) {
  const upstream = new WebSocket(
    `wss://${LOCATION}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent?key=${encodeURIComponent(apiKey)}`,
  )

  const goAway = setTimeout(() => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ goAway: {} }))
  }, GOAWAY_AT_MS)
  const hardClose = setTimeout(() => shutdown(1012, "relay restarting"), HARD_CLOSE_AT_MS)

  let closed = false
  function shutdown(code: number, reason: string) {
    if (closed) return
    closed = true
    clearTimeout(goAway)
    clearTimeout(hardClose)
    try {
      if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) client.close(closeCode(code), reason)
    } catch {}
    try {
      if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) upstream.close(1000)
    } catch {}
  }

  // Listeners go on synchronously so no early browser frame is dropped.
  client.on("message", (data: RawData) => {
    if (upstream.readyState !== WebSocket.OPEN) return
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(data.toString()) as Record<string, unknown>
    } catch {
      return
    }
    const keys = Object.keys(msg)
    if (keys.length !== 1 || !CLIENT_KINDS.has(keys[0])) return
    upstream.send(JSON.stringify(msg))
  })
  client.on("close", () => shutdown(1000, ""))
  client.on("error", () => shutdown(1011, "client error"))

  upstream.on("open", () => upstream.send(JSON.stringify({ setup })))
  upstream.on("message", (data: RawData) => {
    if (client.readyState === WebSocket.OPEN) client.send(data.toString())
  })
  upstream.on("close", (code, reason) => shutdown(code, closeReason(reason)))
  upstream.on("error", (err) => {
    console.error("[ayyayo] vertex live error:", err.message)
    shutdown(1011, "upstream error")
  })
}
