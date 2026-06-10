"use client"

import { useCallback, useRef, useState } from "react"
import {
  GoogleGenAI,
  Modality,
  type FunctionDeclaration,
  type LiveServerMessage,
  type Session,
} from "@google/genai"
import {
  PcmPlayer,
  downsampleTo16k,
  floatTo16BitPCM,
  arrayBufferToBase64,
  base64ToInt16,
} from "@/lib/audio"

// Native, voice-to-voice connection to the Gemini Live model.
// The model hears raw mic audio and speaks back in its own voice — no STT/TTS
// bridge. It drives the app by calling the tools we declare. The browser
// connects directly over a WebSocket using a short-lived ephemeral token.

const LIVE_MODEL = "gemini-3.1-flash-live-preview"

export type LiveStatus = "idle" | "connecting" | "live" | "error" | "unsupported"

export type ToolHandler = (name: string, args: Record<string, unknown>) => unknown | Promise<unknown>

export function useGeminiLive() {
  const [status, setStatus] = useState<LiveStatus>("idle")
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [muted, setMuted] = useState(false)
  const [captions, setCaptions] = useState("")

  const sessionRef = useRef<Session | null>(null)
  const playerRef = useRef<PcmPlayer | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const handlerRef = useRef<ToolHandler | null>(null)
  const outCaptionRef = useRef("")
  // Guards against starting two overlapping sessions (a prime cause of the
  // "two voices at once" bug). Once true, start() no-ops until stop().
  const startingRef = useRef(false)
  // True while the model is mid-turn (between first audio and turnComplete).
  // Injecting text during this window triggers Gemini Live's documented
  // duplicate-response bug, so we queue text and flush it on turnComplete.
  const modelTurnRef = useRef(false)
  const pendingTextRef = useRef<string[]>([])
  // When muted, drop incoming audio instead of playing it — Sprout goes quiet
  // but the mic keeps streaming (so the kid can use a nested app in peace).
  const mutedRef = useRef(false)

  const flushPendingText = () => {
    const s = sessionRef.current
    if (!s) return
    const queued = pendingTextRef.current
    pendingTextRef.current = []
    for (const t of queued) {
      try {
        s.sendRealtimeInput({ text: t })
      } catch {}
    }
  }

  // Send text to the model, but only when it isn't mid-turn — otherwise queue
  // it. Prevents overlapping double-speech.
  const sendTextSafely = (text: string) => {
    if (modelTurnRef.current) {
      pendingTextRef.current.push(text)
      return
    }
    try {
      sessionRef.current?.sendRealtimeInput({ text })
    } catch {}
  }

  // Hush/unhush Sprout without dropping the session. Hushing flushes any
  // queued audio immediately so it stops talking the instant it's tapped.
  const setHushed = useCallback((hush: boolean) => {
    mutedRef.current = hush
    setMuted(hush)
    if (hush) {
      playerRef.current?.flush()
      setSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    try {
      processorRef.current?.disconnect()
    } catch {}
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    try {
      audioCtxRef.current?.close()
    } catch {}
    try {
      sessionRef.current?.close()
    } catch {}
    playerRef.current?.close()
    processorRef.current = null
    streamRef.current = null
    audioCtxRef.current = null
    sessionRef.current = null
    playerRef.current = null
    startingRef.current = false
    modelTurnRef.current = false
    pendingTextRef.current = []
    mutedRef.current = false
    setMuted(false)
    setListening(false)
    setSpeaking(false)
    setStatus("idle")
  }, [])

  const start = useCallback(
    async (opts: {
      systemInstruction: string
      tools: FunctionDeclaration[]
      onTool: ToolHandler
      greeting?: string
    }) => {
      if (typeof window === "undefined") return
      // Never allow two concurrent sessions — overlapping sessions are the
      // main source of "two voices talking at once".
      if (startingRef.current || sessionRef.current) return
      startingRef.current = true
      if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || (window as any).webkitAudioContext)) {
        startingRef.current = false
        setStatus("unsupported")
        return
      }

      handlerRef.current = opts.onTool
      setStatus("connecting")
      setCaptions("")

      // 1) Mint an ephemeral token from our server (long-lived key stays server-side).
      let token: string
      try {
        const res = await fetch("/api/live-token", { method: "POST" })
        if (!res.ok) throw new Error("token")
        const data = await res.json()
        token = data.token
      } catch {
        startingRef.current = false
        setStatus("error")
        return
      }

      // 2) Open the player + mic.
      try {
        const player = new PcmPlayer(24000)
        await player.resume()
        playerRef.current = player

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        })
        streamRef.current = stream
      } catch {
        // stop() resets status to idle, so set the error state after it.
        stop()
        setStatus("error")
        return
      }

      // 3) Connect directly to the Live API with the ephemeral token.
      try {
        const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } })

        const session = await ai.live.connect({
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: opts.systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
            },
            tools: [{ functionDeclarations: opts.tools }],
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              setStatus("live")
              setListening(true)
              startMicPump()
            },
            onmessage: (msg: LiveServerMessage) => handleMessage(msg),
            onerror: () => {
              setStatus("error")
            },
            onclose: () => {
              setListening(false)
              setSpeaking(false)
            },
          },
        })
        sessionRef.current = session
      } catch (err) {
        console.log("[ayyayo] live connect error:", (err as Error).message)
        stop()
        setStatus("error")
        return
      }

      // ---- mic capture → 16kHz PCM upstream ----
      function startMicPump() {
        const stream = streamRef.current
        if (!stream) return
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new Ctx()
        audioCtxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const processor = ctx.createScriptProcessor(4096, 1, 1)
        processorRef.current = processor
        source.connect(processor)
        processor.connect(ctx.destination)
        processor.onaudioprocess = (e) => {
          const session = sessionRef.current
          if (!session) return
          const input = e.inputBuffer.getChannelData(0)
          const down = downsampleTo16k(input, ctx.sampleRate)
          const pcm = floatTo16BitPCM(down)
          try {
            session.sendRealtimeInput({
              audio: { data: arrayBufferToBase64(pcm), mimeType: "audio/pcm;rate=16000" },
            })
          } catch {}
        }
      }

      // ---- handle server messages: audio playback, barge-in, tool calls ----
      async function handleMessage(msg: LiveServerMessage) {
        const player = playerRef.current

        // The model is only ready to receive turns after setup completes.
        // Send the greeting here (not in onopen) so it isn't dropped. The
        // session ref may not be assigned yet, so retry briefly until it is.
        if (msg.setupComplete) {
          startingRef.current = false
          if (opts.greeting) {
            const sendGreeting = (tries: number) => {
              const s = sessionRef.current
              if (s) {
                sendTextSafely(opts.greeting!)
              } else if (tries > 0) {
                setTimeout(() => sendGreeting(tries - 1), 50)
              }
            }
            sendGreeting(20)
          }
          return
        }

        // Barge-in: model was interrupted, drop queued audio.
        if (msg.serverContent?.interrupted) {
          player?.flush()
          setSpeaking(false)
          modelTurnRef.current = false
        }

        // Native voice audio chunks (24kHz PCM, base64). While hushed, drop
        // them — the session stays alive and listening, just silent.
        const parts = msg.serverContent?.modelTurn?.parts ?? []
        for (const part of parts) {
          const data = part.inlineData?.data
          if (data && player) {
            modelTurnRef.current = true
            if (!mutedRef.current) {
              player.enqueue(base64ToInt16(data))
              setSpeaking(true)
            }
          }
        }

        // Live caption of what Sprout is saying.
        const outText = msg.serverContent?.outputTranscription?.text
        if (outText) {
          outCaptionRef.current += outText
          setCaptions(outCaptionRef.current)
        }
        if (msg.serverContent?.turnComplete) {
          outCaptionRef.current = ""
          setTimeout(() => setSpeaking(false), 150)
          // Turn finished — now it's safe to deliver any text we queued
          // mid-turn (queuing avoids Gemini Live's duplicate-response bug).
          modelTurnRef.current = false
          flushPendingText()
        }

        // Function calls: the model drives the app.
        const calls = msg.toolCall?.functionCalls
        if (calls && calls.length) {
          const responses = []
          for (const call of calls) {
            let result: unknown = { ok: true }
            try {
              result = (await handlerRef.current?.(call.name ?? "", (call.args as any) ?? {})) ?? { ok: true }
            } catch (err) {
              result = { ok: false, error: (err as Error).message }
            }
            responses.push({ id: call.id, name: call.name, response: { result } })
          }
          try {
            sessionRef.current?.sendToolResponse({ functionResponses: responses })
          } catch {}
        }
      }
    },
    [stop],
  )

  // Let a loop tell the model what just happened (e.g. "the creation now
  // shows X"). Queued while the model is mid-turn — injecting text during a
  // turn makes Gemini Live answer twice, with the two replies overlapping.
  const tellModel = useCallback((text: string) => {
    sendTextSafely(text)
  }, [])

  return { status, speaking, listening, muted, setHushed, captions, start, stop, tellModel }
}
