"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Share2, Sparkles } from "lucide-react"
import { ArtifactFrame } from "@/components/artifact-frame"
import { MicButton } from "@/components/mic-button"
import { Mascot } from "@/components/mascot"
import { TasteMeter } from "@/components/taste-meter"
import { useTaste } from "@/hooks/use-taste"
import { useVoice } from "@/hooks/use-voice"
import { getSessionId } from "@/lib/session"
import type { Kind } from "@/lib/types"

type Phase = "pick" | "make"

const KINDS: { kind: Kind; label: string; emoji: string; color: string }[] = [
  { kind: "game", label: "a game", emoji: "🎮", color: "var(--peach)" },
  { kind: "story", label: "a story", emoji: "📖", color: "var(--butter)" },
  { kind: "quiz", label: "a quiz", emoji: "❓", color: "var(--mint)" },
  { kind: "buddy", label: "a buddy", emoji: "🤖", color: "var(--rose)" },
]

// Tap-equivalents for every voice action (spec: voice-first, tap fallback for everything)
const REFINE_CHIPS = [
  "make it funnier",
  "more colorful",
  "add a sound",
  "make it harder",
  "shorter",
  "a different ending",
]

export function BuildScreen() {
  const router = useRouter()
  const { count, reward } = useTaste()
  const { listening, listen, speak } = useVoice()
  const [phase, setPhase] = useState<Phase>("pick")
  const [kind, setKind] = useState<Kind | null>(null)
  const [html, setHtml] = useState("")
  const [title, setTitle] = useState("")
  const [persona, setPersona] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const frameWrapRef = useRef<HTMLDivElement>(null)

  const generate = useCallback(
    async (k: Kind, instruction: string, base?: string) => {
      setLoading(true)
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: k, instruction, baseHtml: base }),
        })
        const data = await res.json()
        if (data.html) {
          setHtml(data.html)
          if (data.title) setTitle(data.title)
          if (data.persona) setPersona(data.persona)
        }
      } catch {
        // network blip — keep whatever we have on screen
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  function pick(k: Kind) {
    setKind(k)
    setPhase("make")
    // Instant strong default, then the model improves on first refine.
    generate(k, "create a fun first version")
  }

  function refine(instruction: string) {
    if (!kind) return
    setHistory((h) => [...h, instruction])
    // A refine = a taste act: the kid said what they wanted and saw it change.
    reward("build", instruction)
    speak("ok! making it " + instruction)
    generate(kind, instruction, html)
  }

  // Buddy proxy: artifact iframe asks the parent to talk to Fireworks.
  useEffect(() => {
    async function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || d.type !== "buddy_say") return
      try {
        const res = await fetch("/api/buddy", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: d.text,
            persona: d.persona || persona,
            sessionId: getSessionId(),
          }),
        })
        const data = await res.json()
        const frame = frameWrapRef.current?.querySelector("iframe")
        frame?.contentWindow?.postMessage(
          { type: "buddy_reply", id: d.id, text: data.reply },
          "*",
        )
      } catch {
        // iframe has its own canned fallback after a timeout
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [persona])

  function share() {
    sessionStorage.setItem(
      "ayyayo_pending",
      JSON.stringify({ kind, html, title, persona }),
    )
    router.push("/share")
  }

  return (
    <main className="paper" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          gap: 12,
        }}
      >
        <button
          className="btn-plush ghost"
          style={{ padding: "10px 16px", fontSize: 16 }}
          onClick={() => router.push("/")}
        >
          <ArrowLeft size={20} strokeWidth={2.6} />
          home
        </button>
        <TasteMeter count={count} compact />
      </header>

      {phase === "pick" ? (
        <section
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: 24,
          }}
        >
          <Mascot size={92} mood="happy" />
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0, textAlign: "center" }}>
            what should we make?
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              width: "100%",
              maxWidth: 420,
            }}
          >
            {KINDS.map((k) => (
              <button
                key={k.kind}
                className="plush-lg tap"
                style={{
                  background: k.color,
                  border: "4px solid var(--line)",
                  padding: "26px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
                onClick={() => pick(k.kind)}
              >
                <span style={{ fontSize: 46 }} aria-hidden="true">
                  {k.emoji}
                </span>
                <span style={{ fontWeight: 900, fontSize: 22 }}>{k.label}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "4px 16px 20px",
            maxWidth: 460,
            width: "100%",
            margin: "0 auto",
          }}
        >
          <div ref={frameWrapRef} style={{ flex: 1, minHeight: 320, display: "flex" }}>
            <div style={{ width: "100%", display: "flex" }}>
              <ArtifactFrame html={html} loading={loading} title={title} />
            </div>
          </div>

          {/* Voice-first refine, with a tap chip for every action */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <MicButton
              listening={listening}
              onClick={() => listen((t) => refine(t))}
              size={72}
              label="tell it what to change"
            />
            <span style={{ fontWeight: 800, color: "var(--ink-soft)", fontSize: 14 }}>
              {listening ? "listening..." : "tap & say what to change"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {REFINE_CHIPS.map((c) => (
              <button key={c} className="chip butter" disabled={loading} onClick={() => refine(c)}>
                {c}
              </button>
            ))}
          </div>

          <button className="btn-plush primary" onClick={share} disabled={loading || !html}>
            <Share2 size={20} strokeWidth={2.6} />
            it&apos;s ready — share it
          </button>
          {history.length > 0 ? (
            <p style={{ textAlign: "center", color: "var(--ink-soft)", fontWeight: 700, margin: 0 }}>
              <Sparkles size={16} style={{ verticalAlign: "-3px" }} /> {history.length} change
              {history.length > 1 ? "s" : ""} you made it better
            </p>
          ) : null}
        </section>
      )}
    </main>
  )
}
