"use client"

import { useCallback, useRef, useState } from "react"
import {
  PcmPlayer,
  arrayBufferToBase64,
  base64ToInt16,
  downsampleTo16k,
  floatTo16BitPCM,
} from "@/lib/audio"

// Native speech-to-speech via Gemini Live on Vertex AI. The model hears the
// mic, speaks in its own voice, and drives the app through tool calls. The
// browser connects to our /api/live relay, which holds the key and sets the
// prompt and tools.

export type LiveStatus = "idle" | "connecting" | "live" | "error" | "unsupported"
export type VoiceMode = "build" | "judge"
export type ToolHandler = (name: string, args: Record<string, unknown>) => unknown | Promise<unknown>

type StartOpts = {
  mode: VoiceMode
  kind?: string
  onTool: ToolHandler
  greeting?: string
}

type FunctionCall = { id?: string; name?: string; args?: Record<string, unknown> }

type ServerMessage = {
  setupComplete?: Record<string, never>
  serverContent?: {
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string } }> }
    outputTranscription?: { text?: string }
    interrupted?: boolean
    turnComplete?: boolean
  }
  toolCall?: { functionCalls?: FunctionCall[] }
  sessionResumptionUpdate?: { newHandle?: string; resumable?: boolean }
  goAway?: { timeLeft?: string }
}

// Consecutive reconnects that fail before setup completes.
const MAX_RESUMES = 3

export function useVoice() {
  const [status, setStatus] = useState<LiveStatus>("idle")
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [muted, setMuted] = useState(false)
  const [captions, setCaptions] = useState("")

  const wsRef = useRef<WebSocket | null>(null)
  const readyRef = useRef(false)
  const activeRef = useRef(false)
  const optsRef = useRef<StartOpts | null>(null)
  const handleRef = useRef<string | null>(null)
  const resumesRef = useRef(0)
  const goAwayRef = useRef(false)
  const playerRef = useRef<PcmPlayer | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Text injected mid-turn makes the model answer twice over itself, so app
  // notices wait until the current turn completes.
  const modelTurnRef = useRef(false)
  const pendingTextRef = useRef<string[]>([])
  const mutedRef = useRef(false)
  const outCaptionRef = useRef("")

  const send = (msg: Record<string, unknown>) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !readyRef.current) return
    ws.send(JSON.stringify(msg))
  }

  const sendTextSafely = (text: string) => {
    if (modelTurnRef.current || !readyRef.current) {
      pendingTextRef.current.push(text)
      return
    }
    send({ realtimeInput: { text } })
  }

  const flushPendingText = () => {
    const queued = pendingTextRef.current
    pendingTextRef.current = []
    for (const text of queued) send({ realtimeInput: { text } })
  }

  const setHushed = useCallback((hush: boolean) => {
    mutedRef.current = hush
    setMuted(hush)
    if (hush) {
      playerRef.current?.flush()
      setSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    activeRef.current = false
    const ws = wsRef.current
    wsRef.current = null
    readyRef.current = false
    try {
      ws?.close(1000)
    } catch {}
    try {
      processorRef.current?.disconnect()
    } catch {}
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    try {
      micCtxRef.current?.close()
    } catch {}
    playerRef.current?.close()
    processorRef.current = null
    streamRef.current = null
    micCtxRef.current = null
    playerRef.current = null
    optsRef.current = null
    handleRef.current = null
    resumesRef.current = 0
    goAwayRef.current = false
    modelTurnRef.current = false
    pendingTextRef.current = []
    mutedRef.current = false
    outCaptionRef.current = ""
    setMuted(false)
    setListening(false)
    setSpeaking(false)
    setStatus("idle")
  }, [])

  const fail = useCallback(
    (reason: string) => {
      console.error("[ayyayo] voice error:", reason)
      stop()
      setStatus("error")
    },
    [stop],
  )

  const runTools = async (calls: FunctionCall[]) => {
    const functionResponses = []
    for (const call of calls) {
      let result: unknown = { ok: true }
      try {
        result = (await optsRef.current?.onTool(call.name ?? "", call.args ?? {})) ?? { ok: true }
      } catch (err) {
        result = { ok: false, error: (err as Error).message }
      }
      functionResponses.push({ id: call.id, name: call.name, response: { result } })
    }
    send({ toolResponse: { functionResponses } })
  }

  const onMessage = (ws: WebSocket, msg: ServerMessage) => {
    if (ws !== wsRef.current) return

    if (msg.setupComplete) {
      const resumed = handleRef.current !== null
      readyRef.current = true
      resumesRef.current = 0
      setStatus("live")
      setListening(true)
      if (!resumed && optsRef.current?.greeting) sendTextSafely(optsRef.current.greeting)
      if (!modelTurnRef.current) flushPendingText()
      return
    }

    if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
      handleRef.current = msg.sessionResumptionUpdate.newHandle
    }

    if (msg.goAway) {
      if (modelTurnRef.current) goAwayRef.current = true
      else resume()
      return
    }

    const content = msg.serverContent
    if (content?.interrupted) {
      playerRef.current?.flush()
      modelTurnRef.current = false
      setSpeaking(false)
    }
    for (const part of content?.modelTurn?.parts ?? []) {
      const data = part.inlineData?.data
      if (!data) continue
      modelTurnRef.current = true
      if (!mutedRef.current) {
        playerRef.current?.enqueue(base64ToInt16(data))
        setSpeaking(true)
      }
    }
    const said = content?.outputTranscription?.text
    if (said) {
      outCaptionRef.current += said
      setCaptions(outCaptionRef.current)
    }
    if (content?.turnComplete) {
      outCaptionRef.current = ""
      modelTurnRef.current = false
      if (goAwayRef.current) {
        resume()
        return
      }
      flushPendingText()
    }

    const calls = msg.toolCall?.functionCalls
    if (calls?.length) void runTools(calls)
  }

  const onClose = (ws: WebSocket, ev: CloseEvent) => {
    if (ws !== wsRef.current) return
    wsRef.current = null
    readyRef.current = false
    if (!activeRef.current) return
    if (handleRef.current && resumesRef.current < MAX_RESUMES) {
      resume()
      return
    }
    fail(`closed ${ev.code} ${ev.reason}`)
  }

  const connect = async () => {
    const opts = optsRef.current
    if (!opts || !activeRef.current) return
    const params = new URLSearchParams({ mode: opts.mode })
    if (opts.kind) params.set("kind", opts.kind)
    if (handleRef.current) params.set("handle", handleRef.current)
    const scheme = window.location.protocol === "https:" ? "wss" : "ws"

    const ws = new WebSocket(`${scheme}://${window.location.host}/api/live?${params}`)
    ws.binaryType = "arraybuffer"
    wsRef.current = ws
    readyRef.current = false
    const decoder = new TextDecoder()
    ws.onmessage = (ev) => {
      const raw = typeof ev.data === "string" ? ev.data : decoder.decode(ev.data as ArrayBuffer)
      try {
        onMessage(ws, JSON.parse(raw) as ServerMessage)
      } catch {}
    }
    ws.onclose = (ev) => onClose(ws, ev)
  }

  // Reconnect onto the same conversation using the latest resumption handle.
  const resume = () => {
    goAwayRef.current = false
    resumesRef.current += 1
    modelTurnRef.current = false
    const old = wsRef.current
    wsRef.current = null
    readyRef.current = false
    try {
      old?.close(1000)
    } catch {}
    connect().catch((err) => fail((err as Error).message))
  }

  const start = useCallback(
    async (opts: StartOpts) => {
      if (typeof window === "undefined") return
      if (activeRef.current) return
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!navigator.mediaDevices?.getUserMedia || !Ctx || typeof WebSocket === "undefined") {
        setStatus("unsupported")
        return
      }

      activeRef.current = true
      optsRef.current = opts
      handleRef.current = null
      resumesRef.current = 0
      setStatus("connecting")
      setCaptions("")

      // Both audio contexts are created inside the tap so autoplay rules allow them.
      const player = new PcmPlayer(24000)
      player.onidle = () => setSpeaking(false)
      playerRef.current = player
      const micCtx = new Ctx()
      micCtxRef.current = micCtx

      try {
        await Promise.all([player.resume(), micCtx.resume()])
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
        if (!activeRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const source = micCtx.createMediaStreamSource(stream)
        const processor = micCtx.createScriptProcessor(2048, 1, 1)
        processorRef.current = processor
        source.connect(processor)
        processor.connect(micCtx.destination)
        processor.onaudioprocess = (e) => {
          if (!readyRef.current) return
          const pcm = floatTo16BitPCM(downsampleTo16k(e.inputBuffer.getChannelData(0), micCtx.sampleRate))
          send({ realtimeInput: { audio: { data: arrayBufferToBase64(pcm), mimeType: "audio/pcm;rate=16000" } } })
        }

        await connect()
      } catch (err) {
        fail((err as Error).message)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fail],
  )

  const tellModel = useCallback((text: string) => {
    sendTextSafely(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { status, speaking, listening, muted, setHushed, captions, start, stop, tellModel }
}
