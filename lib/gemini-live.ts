import {
  BUILD_TOOLS,
  JUDGE_TOOLS,
  JUDGE_SYSTEM_INSTRUCTION,
  buildSystemInstruction,
  type VoiceTool,
} from "@/lib/live-tools"

// Server-side setup for Gemini Live native speech-to-speech. The full session
// config is baked into the ephemeral token, so the browser can't change the
// model, prompt, or tools.

export const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.8-live"
const API_VERSION = "v1alpha"

export type VoiceMode = "build" | "judge"

function toDeclarations(tools: VoiceTool[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    behavior: "BLOCKING",
    parametersJsonSchema: t.parameters,
  }))
}

export function liveSetup(mode: VoiceMode, kind?: string, handle?: string) {
  const instruction = mode === "build" ? buildSystemInstruction(kind) : JUDGE_SYSTEM_INSTRUCTION
  return {
    model: `models/${LIVE_MODEL}`,
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

export async function mintLiveToken(setup: ReturnType<typeof liveSetup>) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("no_key")
  const now = Date.now()
  const res = await fetch(`https://generativelanguage.googleapis.com/${API_VERSION}/auth_tokens`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      uses: 1,
      expireTime: new Date(now + 30 * 60_000).toISOString(),
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
      bidiGenerateContentSetup: setup,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`mint_${res.status}:${detail.slice(0, 200)}`)
  }
  const data = (await res.json()) as { name?: string }
  if (!data.name) throw new Error("mint_empty")
  return {
    token: data.name,
    model: setup.model,
    url: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${API_VERSION}.GenerativeService.BidiGenerateContentConstrained`,
  }
}
