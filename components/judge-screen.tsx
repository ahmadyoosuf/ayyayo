"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArtifactFrame } from "@/components/artifact-frame"
import { Mascot } from "@/components/mascot"
import { TasteMeter } from "@/components/taste-meter"
import { MicButton } from "@/components/mic-button"
import { IconBack, IconCheck, IconEye, IconHush, IconSound } from "@/components/icons"
import { useTaste } from "@/hooks/use-taste"
import { useVoice } from "@/hooks/use-voice"
import { TELLS, tellById } from "@/lib/slop"
import { extractHtml, looksLikeHtml } from "@/lib/html"

// ── De-Slop: the AI makes real slop live, the kid catches it, names it, and
// bosses the bot to repair it. Judgment with a visible before/after. ──

type Stage = "loading" | "spot" | "fix" | "fixing" | "done"

const FIX_CHIPS = [
  "make it real",
  "say less, mean more",
  "give it a voice",
  "only true things",
  "make it yours",
]

export function JudgeScreen() {
  const router = useRouter()
  const { count, reward } = useTaste()
  const live = useVoice()

  const [stage, setStage] = useState<Stage>("loading")
  const [slopHtml, setSlopHtml] = useState("")
  const [fixedHtml, setFixedHtml] = useState("")
  const [view, setView] = useState<"after" | "before" | "both">("after")
  const [tellId, setTellId] = useState<string>("")
  const [topic, setTopic] = useState("")
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([])
  const [caught, setCaught] = useState(false)

  // Refs so voice tool handlers always read fresh state.
  const stageRef = useRef(stage)
  stageRef.current = stage
  const tellRef = useRef(tellId)
  tellRef.current = tellId
  const slopRef = useRef(slopHtml)
  slopRef.current = slopHtml

  // Leaving the screen kills the live session — no orphaned voices.
  const stopRef = useRef(live.stop)
  stopRef.current = live.stop
  useEffect(() => {
    return () => stopRef.current()
  }, [])

  // ── round lifecycle ──
  const loadRound = useCallback(async () => {
    setStage("loading")
    setSlopHtml("")
    setFixedHtml("")
    setView("after")
    setWrongGuesses([])
    setCaught(false)
    try {
      const res = await fetch("/api/slop", { method: "POST" })
      const tell = res.headers.get("x-ayyayo-tell") ?? "says-nothing"
      const topicText = decodeURIComponent(res.headers.get("x-ayyayo-topic") ?? "")
      setTellId(tell)
      tellRef.current = tell
      setTopic(topicText)

      let acc = ""
      let lastPaint = 0
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        const now = Date.now()
        if (now - lastPaint > 500) {
          const partial = extractHtml(acc)
          if (looksLikeHtml(partial) && partial.length > 400) {
            lastPaint = now
            setSlopHtml(partial)
            slopRef.current = partial
          }
        }
      }
      const final = extractHtml(acc)
      if (looksLikeHtml(final)) {
        setSlopHtml(final)
        slopRef.current = final
      }
      setStage("spot")
      live.tellModel(
        "A fresh AI-made page just appeared on screen. Ask the child: does it feel right, or is something off? Do not guess the flaw yourself.",
      )
    } catch {
      setStage("spot") // canned fallback already streamed or nothing — UI still works via chips
    }
  }, [live])

  useEffect(() => {
    void loadRound()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  // ── the catch ──
  const guess = useCallback(
    (id: string): boolean => {
      if (stageRef.current !== "spot") return false
      const correct = id === tellRef.current
      if (correct) {
        setCaught(true)
        setStage("fix")
      } else {
        setWrongGuesses((w) => (w.includes(id) ? w : [...w, id]))
      }
      return correct
    },
    [],
  )

  // ── the repair ──
  const fix = useCallback(
    async (instruction: string) => {
      const tell = tellById(tellRef.current)
      if (!tell || !slopRef.current || stageRef.current === "fixing") return { ok: false }
      setStage("fixing")
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind: "story",
            instruction: `This page is AI slop: ${tell.grownUp}. The kid's order: "${instruction}". Repair it: ${tell.fix} Keep the same topic and layout so the before/after is obvious.`,
            baseHtml: slopRef.current,
          }),
        })
        const source = res.headers.get("x-ayyayo-source") ?? "fallback"
        let acc = ""
        let lastPaint = 0
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          const now = Date.now()
          if (now - lastPaint > 500) {
            const partial = extractHtml(acc)
            if (looksLikeHtml(partial) && partial.length > 400) {
              lastPaint = now
              setFixedHtml(partial)
            }
          }
        }
        const final = extractHtml(acc)
        const changed = looksLikeHtml(final) && final !== slopRef.current
        if (changed) setFixedHtml(final)
        setStage("done")
        if (changed && source === "cerebras") {
          // The load-bearing reward: catch + why + visible repair.
          reward("judge", `caught ${tellRef.current} → ${instruction}`)
          live.tellModel(
            "The repaired page is on screen — visibly better because of the child's call. Celebrate their sharp eye in one sentence, then ask if they want another round.",
          )
        } else {
          live.tellModel(
            "The repair did not go through — the page is unchanged. Tell the child honestly and suggest trying the fix again.",
          )
        }
        return { ok: changed }
      } catch {
        setStage("fix")
        return { ok: false }
      }
    },
    [live, reward],
  )

  const next = useCallback(() => {
    void loadRound()
  }, [loadRound])

  // ── voice ──
  const toggleLive = useCallback(() => {
    if (live.status === "live" || live.status === "connecting") {
      live.stop()
      return
    }
    live.start({
      mode: "judge",
      greeting:
        "The child opened the De-Slop gym. A page made by an AI is on screen with one hidden flaw. Say a one-sentence hello and ask if the page feels right or if something is off.",
      onTool: async (name, args) => {
        if (name === "catch_slop") {
          const id = String(args.tell || "")
          const correct = guess(id)
          const actual = tellById(tellRef.current)
          return correct
            ? { caught: true, flawWas: actual?.grownUp, note: "they got it — ask how the bot should fix it" }
            : { caught: false, note: "not quite — encourage them to look again, do not reveal the answer" }
        }
        if (name === "fix_slop") {
          if (stageRef.current !== "fix") {
            return { ok: false, note: "they have to catch the flaw first" }
          }
          fix(String(args.instruction || "fix it"))
          return { started: true, note: "the repair is building — the app will confirm when visible" }
        }
        if (name === "show_view") {
          if (stageRef.current !== "done") {
            return { ok: false, note: "there is no before/after yet — they have to catch and fix the slop first" }
          }
          const v = String(args.view || "after")
          if (v === "before" || v === "after" || v === "both") {
            setView(v)
            return {
              ok: true,
              nowShowing:
                v === "both" ? "before and after, side by side" : `the ${v} version`,
            }
          }
          return { ok: false, error: "unknown view" }
        }
        if (name === "end_conversation") {
          live.setHushed(true)
          setTimeout(() => live.stop(), 80)
          return { ok: true }
        }
        if (name === "next_round") {
          next()
          return { ok: true, note: "a fresh page is being made" }
        }
        return { ok: true }
      },
    })
  }, [live, guess, fix, next])

  const tell = tellById(tellId)

  return (
    <main className="paper build-shell">
      <section className="build-stage">
        <header className="build-top">
          <button className="btn-plush ghost btn-slim" onClick={() => router.push("/home")} aria-label="go home">
            <IconBack size={20} />
            <span className="hide-sm">home</span>
          </button>
          <TasteMeter count={count} compact />
        </header>

        <div className="build-canvas">
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <span style={{ fontWeight: 900, fontSize: 15 }}>
                {stage === "loading"
                  ? "the bot is making something..."
                  : stage === "spot"
                    ? "is this good... or is it slop?"
                    : stage === "fix"
                      ? "you caught it! now boss the fix"
                      : stage === "fixing"
                        ? "repairing under your orders..."
                        : "look what YOUR call did"}
              </span>
              {stage === "done" ? (
                <div style={{ display: "flex", gap: 6 }}>
                  {(["before", "after", "both"] as const).map((v) => (
                    <button
                      key={v}
                      className={`chip ${view === v ? "butter" : ""}`}
                      onClick={() => setView(v)}
                    >
                      {v === "both" ? "side by side" : v}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {stage === "done" && view === "both" ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 300,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {(
                  [
                    { label: "before", html: slopHtml },
                    { label: "after", html: fixedHtml },
                  ] as const
                ).map((side) => (
                  <div key={side.label} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <span
                      style={{
                        alignSelf: "center",
                        fontWeight: 900,
                        fontSize: 12,
                        background: side.label === "after" ? "var(--mint)" : "white",
                        border: "2.5px solid var(--line)",
                        borderRadius: 999,
                        padding: "2px 12px",
                      }}
                    >
                      {side.label}
                    </span>
                    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                      <ArtifactFrame html={side.html} title={side.label} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 300, display: "flex" }}>
                <ArtifactFrame
                  html={stage === "done" && view === "after" ? fixedHtml : slopHtml}
                  building={stage === "loading" || stage === "fixing"}
                  title={topic || "judge this"}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="build-dock">
        <div className="dock-sprout hide-mobile">
          <Mascot size={84} mood={stage === "done" ? "proud" : stage === "fix" ? "wow" : "think"} />
        </div>

        {live.captions ? <p className="dock-caption">{live.captions}</p> : null}

        <div className="dock-mic">
          <div className="dock-mic-row">
            <MicButton listening={live.status === "live"} onClick={toggleLive} size={64} label="talk to Sprout" />
            {live.status === "live" ? (
              <button
                className="dock-hush"
                onClick={() => live.setHushed(!live.muted)}
                aria-label={live.muted ? "let Sprout talk" : "hush Sprout"}
              >
                {live.muted ? <IconSound size={24} /> : <IconHush size={24} />}
              </button>
            ) : null}
          </div>
          <span className="dock-hint">
            {live.status === "live"
              ? live.muted
                ? "Sprout is hushed. still listening"
                : stage === "spot"
                  ? "say what feels off"
                  : stage === "fix"
                    ? "say how to fix it"
                    : "talk to Sprout"
              : "tap to talk with Sprout"}
          </span>
        </div>

        {stage === "spot" ? (
          <div className="dock-chips" style={{ flexWrap: "wrap", justifyContent: "center", overflow: "visible" }}>
            {TELLS.map((t) => {
              const wrong = wrongGuesses.includes(t.id)
              return (
                <button
                  key={t.id}
                  className={`chip ${wrong ? "" : "rose"}`}
                  style={wrong ? { opacity: 0.4, textDecoration: "line-through" } : undefined}
                  disabled={wrong}
                  onClick={() => {
                    const correct = guess(t.id)
                    live.tellModel(
                      correct
                        ? `The child tapped "${t.label}" — correct! Celebrate in one sentence and ask how the bot should fix it.`
                        : `The child tapped "${t.label}" — not the planted flaw. Encourage one more look, do not reveal the answer.`,
                    )
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        ) : null}

        {stage === "fix" ? (
          <div className="dock-chips" style={{ flexWrap: "wrap", justifyContent: "center", overflow: "visible" }}>
            {FIX_CHIPS.map((c) => (
              <button key={c} className="chip mint" onClick={() => fix(c)}>
                {c}
              </button>
            ))}
          </div>
        ) : null}

        {stage === "done" ? (
          <div className="dock-actions">
            <div className="plush popin" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, background: "var(--mint)" }}>
              <IconCheck size={20} />
              <span style={{ fontWeight: 800, fontSize: 14 }}>
                you caught “{tell?.label}” and fixed it
              </span>
              <IconEye size={18} />
            </div>
            <button className="btn-plush primary" onClick={next}>
              next one
            </button>
          </div>
        ) : null}

        {caught && stage !== "done" && stage !== "fixing" ? (
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>
            it was: <b>{tell?.grownUp}</b>
          </p>
        ) : null}
      </aside>
    </main>
  )
}
