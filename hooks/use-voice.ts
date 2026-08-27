"use client"

import { useCallback, useRef, useState } from "react"
import type { VoiceTool } from "@/lib/realtime-tools"

// Speech-to-speech voice via Azure OpenAI Realtime (WebRTC).
// Server mints an ephemeral token; browser connects directly for low latency.

export type LiveStatus = "idle" | "connecting" | "live" | "error" | "unsupported"

export type ToolHandler = (name: string, args: Record<string, unknown>) => unknown | Promise<unknown>

export function useVoice() {
  const [status, setStatus] = useState<LiveStatus>("idle")
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [muted, setMuted] = useState(false)
  const [captions, setCaptions] = useState("")

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handlerRef = useRef<ToolHandler | null>(null)
  const startingRef = useRef(false)
  const modelTurnRef = useRef(false)
  const pendingTextRef = useRef<string[]>([])
  const mutedRef = useRef(false)
  const outCaptionRef = useRef("")

  const sendEvent = (event: Record<string, unknown>) => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== "open") return
    dc.send(JSON.stringify(event))
  }

  const flushPendingText = () => {
    const queued = pendingTextRef.current
    pendingTextRef.current = []
    for (const text of queued) {
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      })
      sendEvent({ type: "response.create" })
    }
  }

  const sendTextSafely = (text: string) => {
    if (modelTurnRef.current) {
      pendingTextRef.current.push(text)
      return
    }
    sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    })
    sendEvent({ type: "response.create" })
  }

  const setHushed = useCallback((hush: boolean) => {
    mutedRef.current = hush
    setMuted(hush)
    if (audioRef.current) {
      audioRef.current.muted = hush
    }
    if (hush) setSpeaking(false)
  }, [])

  const stop = useCallback(() => {
    try {
      dcRef.current?.close()
    } catch {}
    try {
      pcRef.current?.close()
    } catch {}
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    try {
      audioRef.current?.remove()
    } catch {}
    dcRef.current = null
    pcRef.current = null
    streamRef.current = null
    audioRef.current = null
    startingRef.current = false
    modelTurnRef.current = false
    pendingTextRef.current = []
    mutedRef.current = false
    setMuted(false)
    setListening(false)
    setSpeaking(false)
    setStatus("idle")
  }, [])

  const handleFunctionCall = async (callId: string, name: string, argsJson: string) => {
    let args: Record<string, unknown> = {}
    try {
      args = JSON.parse(argsJson || "{}") as Record<string, unknown>
    } catch {
      args = {}
    }
    let result: unknown = { ok: true }
    try {
      result = (await handlerRef.current?.(name, args)) ?? { ok: true }
    } catch (err) {
      result = { ok: false, error: (err as Error).message }
    }
    sendEvent({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(result),
      },
    })
    sendEvent({ type: "response.create" })
  }

  const start = useCallback(
    async (opts: {
      systemInstruction: string
      tools: VoiceTool[]
      onTool: ToolHandler
      greeting?: string
    }) => {
      if (typeof window === "undefined") return
      if (startingRef.current || pcRef.current) return
      startingRef.current = true

      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
        startingRef.current = false
        setStatus("unsupported")
        return
      }

      handlerRef.current = opts.onTool
      setStatus("connecting")
      setCaptions("")

      let token: string
      let callsUrl: string
      try {
        const res = await fetch("/api/realtime-token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: opts.systemInstruction,
            tools: opts.tools,
          }),
        })
        if (!res.ok) throw new Error("token")
        const data = await res.json()
        token = data.token
        callsUrl = data.callsUrl
      } catch {
        startingRef.current = false
        setStatus("error")
        return
      }

      try {
        const pc = new RTCPeerConnection()
        pcRef.current = pc

        const audio = document.createElement("audio")
        audio.autoplay = true
        audioRef.current = audio

        pc.ontrack = (event) => {
          if (event.streams[0]) audio.srcObject = event.streams[0]
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        streamRef.current = stream
        for (const track of stream.getAudioTracks()) pc.addTrack(track, stream)

        const dc = pc.createDataChannel("realtime-channel")
        dcRef.current = dc

        dc.addEventListener("open", () => {
          setStatus("live")
          setListening(true)
          startingRef.current = false
          if (opts.greeting) sendTextSafely(opts.greeting)
        })

        dc.addEventListener("message", (event) => {
          let msg: Record<string, unknown>
          try {
            msg = JSON.parse(String(event.data)) as Record<string, unknown>
          } catch {
            return
          }
          const type = String(msg.type ?? "")

          if (type === "output_audio_buffer.started") {
            modelTurnRef.current = true
            if (!mutedRef.current) setSpeaking(true)
          }
          if (type === "output_audio_buffer.stopped") {
            modelTurnRef.current = false
            setSpeaking(false)
            flushPendingText()
          }

          if (type === "response.output_audio_transcript.delta") {
            const delta = (msg as { delta?: string }).delta
            if (delta) {
              outCaptionRef.current += delta
              setCaptions(outCaptionRef.current)
            }
          }
          if (type === "response.output_audio_transcript.done") {
            outCaptionRef.current = ""
          }

          if (type === "response.function_call_arguments.done") {
            const m = msg as { call_id?: string; name?: string; arguments?: string }
            if (m.call_id && m.name) {
              void handleFunctionCall(m.call_id, m.name, m.arguments ?? "{}")
            }
          }

          if (type === "error") {
            setStatus("error")
          }
        })

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        const sdpRes = await fetch(callsUrl, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/sdp",
          },
        })
        if (!sdpRes.ok) throw new Error("sdp")
        const answerSdp = await sdpRes.text()
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp })
      } catch (err) {
        console.error("[ayyayo] voice connect error:", (err as Error).message)
        stop()
        setStatus("error")
      }
    },
    [stop],
  )

  const tellModel = useCallback((text: string) => {
    sendTextSafely(text)
  }, [])

  return { status, speaking, listening, muted, setHushed, captions, start, stop, tellModel }
}
