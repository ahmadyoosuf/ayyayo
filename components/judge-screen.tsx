"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, X } from "lucide-react"
import useSWR from "swr"
import { Mascot } from "@/components/mascot"
import { TasteMeter } from "@/components/taste-meter"
import { MicButton } from "@/components/mic-button"
import { useTaste } from "@/hooks/use-taste"
import { useGeminiLive } from "@/hooks/use-gemini-live"
import { JUDGE_TOOLS, JUDGE_SYSTEM_INSTRUCTION } from "@/lib/live-tools"
import type { JudgePair } from "@/lib/types"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

// Reasons a kid can tap instead of speaking (tap fallback for voice).
const REASONS = [
  "too much words",
  "too messy",
  "boring",
  "clean and clear",
  "more fun",
  "easy to read",
]

type Stage = "pick" | "why" | "result"

export function JudgeScreen() {
  const router = useRouter()
  const { count, reward } = useTaste()
  const live = useGeminiLive()
  const { data } = useSWR<{ pairs: JudgePair[] }>("/api/pairs", fetcher, {
    revalidateOnFocus: false,
  })

  const pairs = data?.pairs ?? []
  const [idx, setIdx] = useState(0)
  const [stage, setStage] = useState<Stage>("pick")
  const [picked, setPicked] = useState<"good" | "slop" | null>(null)
  const [correct, setCorrect] = useState(false)

  const pair = pairs.length ? pairs[idx % pairs.length] : null

  // Randomize which side shows the good one, fresh per pair.
  const goodLeft = useMemo(() => Math.random() > 0.5, [pair?.id])

  // Refs so the live tool handler always reads fresh values.
  const goodLeftRef = useRef(goodLeft)
  goodLeftRef.current = goodLeft
  const pairRef = useRef<JudgePair | null>(pair)
  pairRef.current = pair

  const choose = useCallback(
    (side: "left" | "right") => {
      const p = pairRef.current
      if (!p) return
      const isGood = (side === "left") === goodLeftRef.current
      setPicked(isGood ? "good" : "slop")
      setCorrect(isGood)
      setStage("why")
      return isGood
    },
    [],
  )

  const explain = useCallback(
    (reason: string) => {
      if (!pairRef.current) return
      // The reward requires choice + a stated why. Bare picks don't count.
      reward("judge", reason)
      setStage("result")
    },
    [reward],
  )

  const next = useCallback(() => {
    setIdx((i) => i + 1)
    setPicked(null)
    setStage("pick")
  }, [])

  // Tell Sprout (the live model) about the pair on screen so it can react by voice.
  function describePair(p: JudgePair, gl: boolean) {
    return (
      `A new pair is on screen for topic "${p.topic}". ` +
      `Option ${gl ? "A" : "B"} is the good one (it is ${p.good_label}). ` +
      `Option ${gl ? "B" : "A"} has a flaw (it is ${p.slop_flaw}). ` +
      `Ask the child which one is better and why. When they answer, call pick_better.`
    )
  }

  const toggleLive = useCallback(() => {
    if (live.status === "live" || live.status === "connecting") {
      live.stop()
      return
    }
    const p = pairRef.current
    live.start({
      systemInstruction: JUDGE_SYSTEM_INSTRUCTION,
      tools: JUDGE_TOOLS,
      greeting: p ? describePair(p, goodLeftRef.current) : "Greet the child and ask them to pick the better one.",
      onTool: async (name, args) => {
        if (name === "pick_better") {
          const choice = String(args.choice || "A").toUpperCase()
          const side = choice === "A" ? "left" : "right"
          const isGood = choose(side)
          const reason = args.reason ? String(args.reason) : ""
          if (reason) explain(reason)
          const p2 = pairRef.current
          return {
            correct: isGood,
            betterIs: p2?.good_label,
            flawWas: p2?.slop_flaw,
          }
        }
        if (name === "next_round") {
          next()
          const np = pairs.length ? pairs[(idx + 1) % pairs.length] : null
          if (np) {
            // brief delay so state settles, then brief the model on the new pair
            setTimeout(() => live.tellModel(describePair(np, Math.random() > 0.5)), 400)
          }
          return { ok: true }
        }
        return { ok: true }
      },
    })
  }, [live, choose, explain, next, idx, pairs])

  if (!pair) {
    return (
      <main
        className="paper"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 24,
        }}
      >
        <Mascot size={84} mood="think" />
        <p style={{ fontWeight: 800 }}>loading the gym...</p>
        <button className="btn-plush ghost" onClick={() => router.push("/")}>
          home
        </button>
      </main>
    )
  }

  const leftHtml = goodLeft ? pair.good_html : pair.slop_html
  const rightHtml = goodLeft ? pair.slop_html : pair.good_html

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

      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "0 16px 22px",
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, textAlign: "center" }}>
          {stage === "why" ? "why is it better?" : "which one is better?"}
        </h1>
        <p style={{ fontWeight: 700, color: "var(--ink-soft)", margin: 0 }}>
          topic: {pair.topic}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            width: "100%",
          }}
        >
          <JudgeCard
            html={leftHtml}
            label="A"
            disabled={stage !== "pick"}
            highlight={stage !== "pick" ? (goodLeft ? "good" : "slop") : undefined}
            onClick={() => choose("left")}
          />
          <JudgeCard
            html={rightHtml}
            label="B"
            disabled={stage !== "pick"}
            highlight={stage !== "pick" ? (goodLeft ? "slop" : "good") : undefined}
            onClick={() => choose("right")}
          />
        </div>

        {stage === "why" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              width: "100%",
            }}
          >
            <MicButton
              listening={live.status === "live"}
              onClick={toggleLive}
              size={64}
              label="say why"
            />
            <span style={{ fontWeight: 800, color: "var(--ink-soft)", fontSize: 13 }}>
              {live.status === "live"
                ? live.speaking
                  ? "Sprout is talking..."
                  : "say why it's better"
                : "tap to tell Sprout why"}
            </span>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {REASONS.map((r) => (
                <button key={r} className="chip sky" onClick={() => explain(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "result" && (
          <div
            className="plush-lg popin"
            style={{
              background: correct ? "var(--mint)" : "white",
              padding: "20px 22px",
              width: "100%",
              maxWidth: 460,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 900,
                fontSize: 22,
              }}
            >
              {correct ? <Check size={26} strokeWidth={3} /> : <X size={26} strokeWidth={3} />}
              {correct ? "sharp eye!" : "almost!"}
            </div>
            <p style={{ fontWeight: 700, margin: 0 }}>
              the better one is <b>{pair.good_label}</b>. the other one was{" "}
              <b>{pair.slop_flaw}</b>.
            </p>
            <button className="btn-plush primary" onClick={next}>
              next one
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

function JudgeCard({
  html,
  label,
  disabled,
  highlight,
  onClick,
}: {
  html: string
  label: string
  disabled: boolean
  highlight?: "good" | "slop"
  onClick: () => void
}) {
  const border =
    highlight === "good"
      ? "var(--mint-deep)"
      : highlight === "slop"
        ? "var(--rose-deep)"
        : "var(--line)"
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={disabled ? "" : "tap"}
      style={{
        position: "relative",
        padding: 0,
        border: `4px solid ${border}`,
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--plush)",
        overflow: "hidden",
        background: "white",
        cursor: disabled ? "default" : "pointer",
      }}
      aria-label={`option ${label}`}
    >
      <iframe
        title={`option ${label}`}
        srcDoc={html}
        sandbox=""
        scrolling="no"
        style={{
          border: 0,
          width: "100%",
          height: 240,
          pointerEvents: "none",
          background: "var(--cream)",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          fontWeight: 900,
          fontSize: 16,
          background: "white",
          border: "3px solid var(--line)",
          borderRadius: 999,
          width: 34,
          height: 34,
          display: "grid",
          placeItems: "center",
        }}
      >
        {label}
      </span>
    </button>
  )
}
