"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Share2, Sparkles } from "lucide-react"
import { ArtifactFrame } from "@/components/artifact-frame"
import { MicButton } from "@/components/mic-button"
import { Mascot } from "@/components/mascot"
import { TasteMeter } from "@/components/taste-meter"
import { useTaste } from "@/hooks/use-taste"
import { useGeminiLive } from "@/hooks/use-gemini-live"
import { getSessionId } from "@/lib/session"
import { templateFor } from "@/lib/templates"
import { BUILD_TOOLS, buildSystemInstruction } from "@/lib/live-tools"
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
  const live = useGeminiLive()
  const [phase, setPhase] = useState<Phase>("pick")
  const [kind, setKind] = useState<Kind | null>(null)
  const [html, setHtml] = useState("")
  const [title, setTitle] = useState("")
  const [persona, setPersona] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const frameWrapRef = useRef<HTMLDivElement>(null)

  // Live refs so the model's tool handler always reads the freshest state.
  const kindRef = useRef<Kind | null>(null)
  const htmlRef = useRef("")
  kindRef.current = kind
  htmlRef.current = html

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
          htmlRef.current = data.html
          if (data.title) setTitle(data.title)
          if (data.persona) setPersona(data.persona)
        }
        return data
      } catch {
        // network blip — keep whatever we have on screen
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const pick = useCallback((k: Kind, idea?: string) => {
    setKind(k)
    kindRef.current = k
    setPhase("make")
    // Instant strong default from the local template — zero latency, always works.
    // The model then improves it through change_creation tool calls.
    const t = templateFor(k)
    setHtml(t.html)
    htmlRef.current = t.html
    setTitle(idea ? idea : t.title)
    setPersona(t.persona)
  }, [])

  const refine = useCallback(
    (instruction: string) => {
      const k = kindRef.current
      if (!k) return
      setHistory((h) => [...h, instruction])
      // A refine = a taste act: the kid said what they wanted and saw it change.
      reward("build", instruction)
      generate(k, instruction, htmlRef.current)
    },
    [generate, reward],
  )

  const share = useCallback(() => {
    sessionStorage.setItem(
      "ayyayo_pending",
      JSON.stringify({
        kind: kindRef.current,
        html: htmlRef.current,
        title,
        persona,
      }),
    )
    live.stop()
    router.push("/share")
  }, [live, router, title, persona])

  // The mic IS the Gemini Live session. Sprout hears raw audio and drives the
  // app with tool calls — no STT/TTS bridge. Tap chips remain as a fallback.
  const toggleLive = useCallback(() => {
    if (live.status === "live" || live.status === "connecting") {
      live.stop()
      return
    }
    live.start({
      systemInstruction: buildSystemInstruction(kindRef.current ?? undefined),
      tools: BUILD_TOOLS,
      greeting:
        "The child just opened the maker. Say a one-sentence cheerful hello and ask what they want to make.",
      onTool: async (name, args) => {
        if (name === "make_creation") {
          const k = String(args.kind || "game") as Kind
          pick(k, args.idea ? String(args.idea) : undefined)
          if (args.idea) {
            const data = await generate(k, String(args.idea), templateFor(k).html)
            return { made: k, nowShows: data?.title ?? k }
          }
          return { made: k }
        }
        if (name === "change_creation") {
          const instruction = String(args.instruction || "")
          refine(instruction)
          return { changed: true, instruction }
        }
        if (name === "share_creation") {
          share()
          return { shared: true }
        }
        return { ok: true }
      },
    })
  }, [live, pick, refine, share, generate])

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

          {/* Voice-first: the mic opens a live talk with Sprout. Tap chips below
              are the fallback so voice is never the only path. */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <MicButton
              listening={live.status === "live"}
              onClick={toggleLive}
              size={72}
              label="talk with Sprout"
            />
            <span style={{ fontWeight: 800, color: "var(--ink-soft)", fontSize: 14, textAlign: "center" }}>
              {live.status === "connecting"
                ? "waking up Sprout..."
                : live.status === "live"
                  ? live.speaking
                    ? "Sprout is talking..."
                    : "listening... say what to change"
                  : live.status === "error"
                    ? "tap a button below to keep going"
                    : live.status === "unsupported"
                      ? "use the buttons below to change it"
                      : "tap to talk with Sprout"}
            </span>
            {live.captions ? (
              <p
                style={{
                  margin: 0,
                  maxWidth: 360,
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--ink-soft)",
                }}
              >
                {live.captions}
              </p>
            ) : null}
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
