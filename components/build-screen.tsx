"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"
import { ArtifactFrame } from "@/components/artifact-frame"
import { MicButton } from "@/components/mic-button"
import { Mascot } from "@/components/mascot"
import { TasteMeter } from "@/components/taste-meter"
import {
  IconBack,
  IconShare,
  IconSpark,
  IconCheck,
  IconCopy,
  IconParty,
  IconX,
  IconHush,
  IconSound,
  IconOpenTab,
} from "@/components/icons"
import { useTaste } from "@/hooks/use-taste"
import { useGeminiLive } from "@/hooks/use-gemini-live"
import { getSessionId } from "@/lib/session"
import { templateFor } from "@/lib/templates"
import { extractHtml, looksLikeHtml } from "@/lib/html"
import { sanitizeSlug } from "@/lib/slug"
import { BUILD_TOOLS, buildSystemInstruction } from "@/lib/live-tools"
import type { Kind } from "@/lib/types"

// Where a published creation lives. On the real domains every kid site gets
// its own subdomain (*.ayyayo.app); anywhere else fall back to the /a/ path.
function shareUrlFor(slug: string): string {
  if (typeof window === "undefined") return `/a/${slug}`
  const h = window.location.hostname
  if (h.endsWith("ayyayo.ai") || h.endsWith("ayyayo.app")) return `https://${slug}.ayyayo.app`
  return `${window.location.origin}/a/${slug}`
}

interface ShareCard {
  name: string
  saving: boolean
  slug: string | null
}

// One flow, no category gate: the kid talks (or taps a starter) and the
// creation assembles live on the stage. Kinds still exist underneath as
// scaffolds/templates, but they are Sprout's business, not a menu.

// Starter chips are TELEPROMPTERS, not buttons: ayyayo is voice-to-code, so
// the voice is the only executor. Tapping a chip coaches the kid on what to
// SAY (and wakes the mic). They only execute directly when the device has no
// mic at all — otherwise the app would be a dead end there.
const STARTERS: { label: string; kind: Kind; idea: string; say: string }[] = [
  { label: "a space game", kind: "game", idea: "a game where I dodge asteroids in space", say: "make me a space game" },
  { label: "a silly story", kind: "story", idea: "a silly story about a pancake that wants to fly", say: "tell me a silly story about a pancake" },
  { label: "an animal quiz", kind: "quiz", idea: "a quiz about wild animals", say: "make an animal quiz" },
  { label: "a joke buddy", kind: "buddy", idea: "a buddy who tells me jokes", say: "make me a buddy who tells jokes" },
  { label: "a dragon game", kind: "game", idea: "a game with a dragon that eats tacos", say: "make a game with a dragon that eats tacos" },
  { label: "a slide deck", kind: "deck", idea: "a presentation about why I am awesome", say: "make a presentation about me" },
]

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
  const [html, setHtml] = useState("")
  const [building, setBuilding] = useState(false)
  const [title, setTitle] = useState("")
  const [changes, setChanges] = useState(0)
  const [card, setCard] = useState<ShareCard | null>(null)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  // Hard lifecycle rule: leaving this screen kills the live session — mic,
  // audio player, WebSocket, everything. Without this, navigating home left
  // the old session talking, and returning spawned a second one over it.
  const stopRef = useRef(live.stop)
  stopRef.current = live.stop
  useEffect(() => {
    return () => stopRef.current()
  }, [])

  // Live refs so the voice tool handler always reads the freshest state.
  const kindRef = useRef<Kind>("game")
  const htmlRef = useRef("")
  const titleRef = useRef("")
  const personaRef = useRef<string | undefined>(undefined)
  const buildingRef = useRef(false)

  const setHtmlNow = (h: string) => {
    htmlRef.current = h
    setHtml(h)
  }

  // Stream a generation into the stage. Renders progressively (~2 paints/s)
  // so the kid watches the creation assemble. Returns the honest outcome.
  const runGenerate = useCallback(
    async (kind: Kind, instruction: string, base?: string) => {
      if (buildingRef.current) return { ok: false, busy: true }
      buildingRef.current = true
      setBuilding(true)
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, instruction, baseHtml: base }),
        })
        const source = res.headers.get("x-ayyayo-source") ?? "fallback"
        const persona = decodeURIComponent(res.headers.get("x-ayyayo-persona") ?? "")
        if (persona) personaRef.current = persona

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
            if (looksLikeHtml(partial) && partial.length > 500) {
              lastPaint = now
              setHtmlNow(partial)
            }
          }
        }
        const final = extractHtml(acc)
        const changed = looksLikeHtml(final) && final !== (base ?? "")
        if (looksLikeHtml(final)) setHtmlNow(final)
        return { ok: true, changed, source }
      } catch {
        return { ok: false, changed: false, source: "error" }
      } finally {
        buildingRef.current = false
        setBuilding(false)
      }
    },
    [],
  )

  const make = useCallback(
    async (kind: Kind, idea: string) => {
      kindRef.current = kind
      const t = templateFor(kind)
      personaRef.current = t.persona
      const nextTitle = idea || t.title
      titleRef.current = nextTitle
      setTitle(nextTitle)
      // Instant scaffold from the local template, then the real build streams in.
      setHtmlNow(t.html)
      setChanges(0)
      const out = await runGenerate(kind, idea)
      if (out.ok && out.source === "cerebras") {
        live.tellModel(
          `The creation is on the screen now: "${nextTitle}". Tell the child to try it, in one short cheerful sentence.`,
        )
      } else if (!("busy" in out)) {
        live.tellModel(
          "The builder hiccuped, so a simpler starter version is on screen. Tell the child we can still change it together.",
        )
      }
      return out
    },
    [live, runGenerate],
  )

  const refine = useCallback(
    async (instruction: string) => {
      if (!htmlRef.current) return { ok: false, changed: false }
      const base = htmlRef.current
      const out = await runGenerate(kindRef.current, instruction, base)
      // Judgment is load-bearing: reward only a real, visible improvement.
      if (out.ok && out.changed && out.source === "cerebras") {
        setChanges((c) => c + 1)
        reward("build", instruction)
        live.tellModel(
          `Done — the change "${instruction}" is now visible on screen. React in one short sentence and ask what's next.`,
        )
      } else if ("busy" in out && out.busy) {
        // caller reports busy to the model
      } else {
        live.tellModel(
          `The change "${instruction}" did not go through — the screen still shows the old version. Tell the child honestly and suggest trying again.`,
        )
      }
      return out
    },
    [live, reward, runGenerate],
  )

  // ── publish card: opened, named, confirmed and closed by voice OR hand ──
  const cardRef = useRef<ShareCard | null>(null)
  cardRef.current = card

  const openShare = useCallback(() => {
    if (!htmlRef.current) return false
    const suggested = sanitizeSlug(titleRef.current) || ""
    setCard({ name: suggested, saving: false, slug: null })
    return true
  }, [])

  const nameShare = useCallback((name: string) => {
    setCard((c) => ({ saving: false, slug: null, ...(c ?? {}), name }))
  }, [])

  const confirmShare = useCallback(async () => {
    const c = cardRef.current
    if (!c || c.saving || c.slug || !htmlRef.current) return { ok: false }
    setCard({ ...c, saving: true })
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: kindRef.current,
          html: htmlRef.current,
          title: titleRef.current,
          persona: personaRef.current,
          slug: c.name,
        }),
      })
      const data = await res.json()
      if (data.slug) {
        setCard({ name: c.name, saving: false, slug: data.slug })
        live.tellModel(
          `Published! The site "${String(data.slug).replace(/-/g, " ")}" is live on the internet now. Celebrate in one short sentence — say the site name, never the full address. The site is about to open in a new tab.`,
        )
        // The magic beat: show the QR/URL card, then auto-open the live site
        // in a new tab a few seconds later so the kid (or a judge's phone)
        // lands on the running creation without lifting a finger.
        const liveSlug = String(data.slug)
        setTimeout(() => {
          if (cardRef.current?.slug === liveSlug) {
            window.open(shareUrlFor(liveSlug), "_blank", "noopener")
          }
        }, 3500)
        return { ok: true, slug: data.slug }
      }
      throw new Error("no slug")
    } catch {
      setCard({ ...c, saving: false })
      live.tellModel("Publishing hiccuped. Tell the child to try once more.")
      return { ok: false }
    }
  }, [live])

  const cancelShare = useCallback(() => setCard(null), [])

  // Open the creation in a fresh tab: the published site if it exists, else
  // the current work-in-progress as a blob document. A separate tab means
  // the kid plays it in peace — and we hush Sprout so the voice doesn't keep
  // talking over a creation the kid is now using (e.g. a nested buddy app).
  const openInTab = useCallback(() => {
    const c = cardRef.current
    let url: string | null = null
    if (c?.slug) {
      url = shareUrlFor(c.slug)
    } else if (htmlRef.current) {
      url = URL.createObjectURL(new Blob([htmlRef.current], { type: "text/html" }))
    }
    if (!url) return false
    // Hush before leaving so Sprout goes quiet the moment the kid is "inside"
    // the creation. The mic stays live; they un-hush when they come back.
    if (live.status === "live") live.setHushed(true)
    window.open(url, "_blank", "noopener")
    return true
  }, [live])

  // The mic IS the Gemini Live session: Sprout hears raw audio and drives the
  // app with tool calls. Tap chips remain a full path so voice is never a cage.
  const toggleLive = useCallback(() => {
    if (live.status === "live" || live.status === "connecting") {
      live.stop()
      return
    }
    const hasCreation = Boolean(htmlRef.current)
    live.start({
      systemInstruction: buildSystemInstruction(hasCreation ? kindRef.current : undefined),
      tools: BUILD_TOOLS,
      greeting: hasCreation
        ? `The child is working on "${titleRef.current}". Say a one-sentence hello and ask what to change.`
        : "The child just opened the maker. Say a one-sentence cheerful hello and ask what they want to make.",
      onTool: async (name, args) => {
        if (name === "make_creation") {
          const k = String(args.kind || "game") as Kind
          const idea = String(args.idea || "something fun")
          make(k, idea) // streams in; we report honestly via tellModel when done
          return { started: true, nowShows: "a starter version, the real one is building" }
        }
        if (name === "change_creation") {
          if (!htmlRef.current) return { ok: false, error: "nothing made yet — call make_creation first" }
          if (buildingRef.current) return { ok: false, busy: true, note: "still building the last change" }
          refine(String(args.instruction || ""))
          return { started: true, note: "the change is building, the app will confirm when it is visible" }
        }
        if (name === "share_creation") {
          const opened = openShare()
          return opened
            ? { ok: true, note: "publish card is open — ask the child what name their site should have" }
            : { ok: false, error: "nothing to share yet" }
        }
        if (name === "name_creation") {
          const raw = String(args.name || "")
          const clean = sanitizeSlug(raw)
          if (!cardRef.current) openShare()
          nameShare(clean || raw)
          return clean
            ? { ok: true, siteName: clean, note: "name is on the card — ask the child to confirm" }
            : { ok: false, error: "that name cannot be used, ask for a different one" }
        }
        if (name === "confirm_share") {
          const out = await confirmShare()
          return out.ok
            ? { published: true, siteName: out.slug }
            : { published: false, note: "publishing did not finish — the card is still open" }
        }
        if (name === "cancel_share") {
          cancelShare()
          return { ok: true, note: "card closed, back to making" }
        }
        if (name === "open_creation") {
          const opened = openInTab()
          return opened
            ? { ok: true, note: "opened in a new tab — Sprout is hushed while they play" }
            : { ok: false, error: "nothing to open yet" }
        }
        return { ok: true }
      },
    })
  }, [live, make, refine, openShare, nameShare, confirmShare, cancelShare, openInTab])

  // Speech coach: chips don't execute — they hand the kid the words and wake
  // the mic. The voice model is the only executor (voice-to-code, for real).
  const [coach, setCoach] = useState<string | null>(null)
  const coachTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coachSay = useCallback(
    (phrase: string) => {
      setCoach(phrase)
      if (coachTimer.current) clearTimeout(coachTimer.current)
      coachTimer.current = setTimeout(() => setCoach(null), 8000)
      if (live.status === "idle") toggleLive()
      if (live.muted) live.setHushed(false)
    },
    [live, toggleLive],
  )
  // No working voice (no mic API, or mic failed/denied): chips execute
  // directly so the app is never a dead end — matches the "tap a bubble
  // instead" hint. Everywhere else, voice is the only executor.
  const voiceless = live.status === "unsupported" || live.status === "error"

  // Paint the QR code once the creation is live.
  useEffect(() => {
    if (card?.slug && qrRef.current) {
      QRCode.toCanvas(qrRef.current, shareUrlFor(card.slug), {
        width: 150,
        margin: 1,
        color: { dark: "#2b1e16", light: "#ffffff" },
      }).catch(() => {})
    }
  }, [card?.slug])

  // Buddy proxy: the artifact iframe asks the parent to talk to Fireworks.
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
            persona: d.persona || personaRef.current,
            long: d.long === true,
            sessionId: getSessionId(),
          }),
        })
        const data = await res.json()
        const frame = document.querySelector<HTMLIFrameElement>(".artifact-iframe")
        frame?.contentWindow?.postMessage({ type: "buddy_reply", id: d.id, text: data.text }, "*")
      } catch {
        // iframe has its own canned fallback after a timeout
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])

  const started = Boolean(html)

  const micHint =
    live.status === "connecting"
      ? "waking up Sprout..."
      : live.status === "live"
        ? live.speaking
          ? "Sprout is talking..."
          : started
            ? "listening... say what to change"
            : "listening... say what to make"
        : live.status === "error"
          ? "voice napped — tap a bubble instead"
          : live.status === "unsupported"
            ? "use the bubbles below"
            : "tap to talk with Sprout"

  return (
    <main className="paper build-shell">
      {/* ── the stage: the creation is the hero ── */}
      <section className="build-stage">
        <header className="build-top">
          <button className="btn-plush ghost btn-slim" onClick={() => router.push("/")} aria-label="go home">
            <IconBack size={20} />
            <span className="hide-sm">home</span>
          </button>
          <TasteMeter count={count} compact />
        </header>

        <div className="build-canvas">
          {started ? (
            <ArtifactFrame html={html} building={building} title={title} />
          ) : (
            <div className="build-welcome plush-lg">
              <div className="floaty">
                <Mascot size={110} mood="happy" />
              </div>
              <h1>what should we make?</h1>
              <p>tap the mic and just say it — i&apos;ll build it while you watch</p>
              <div className="starter-row">
                {STARTERS.map((s) => (
                  <button
                    key={s.label}
                    className="chip butter"
                    onClick={() => (voiceless ? make(s.kind, s.idea) : coachSay(s.say))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Sprout dock: bottom bar on mobile, right rail on desktop ── */}
      <aside className="build-dock">
        <div className="dock-sprout hide-mobile">
          <Mascot size={84} mood={building ? "think" : live.speaking ? "wow" : "happy"} />
        </div>

        {coach ? (
          <div className="dock-coach popin" aria-live="polite">
            say: <b>&ldquo;{coach}&rdquo;</b>
          </div>
        ) : live.captions ? (
          <p className="dock-caption">{live.captions}</p>
        ) : null}

        <div className="dock-mic">
          <div className="dock-mic-row">
            <MicButton
              listening={live.status === "live"}
              onClick={toggleLive}
              size={72}
              label="talk with Sprout"
            />
            {live.status === "live" ? (
              <button
                className="dock-hush"
                onClick={() => live.setHushed(!live.muted)}
                aria-label={live.muted ? "let Sprout talk" : "hush Sprout"}
                title={live.muted ? "let Sprout talk" : "hush Sprout"}
              >
                {live.muted ? <IconSound size={26} /> : <IconHush size={26} />}
              </button>
            ) : null}
          </div>
          <span className="dock-hint">{live.muted && live.status === "live" ? "Sprout is hushed — still listening" : micHint}</span>
        </div>

        {started ? (
          <div className="dock-chips">
            {REFINE_CHIPS.map((c) => (
              <button
                key={c}
                className="chip sky"
                disabled={building}
                onClick={() => (voiceless ? refine(c) : coachSay(c))}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}

        {started ? (
          <div className="dock-actions">
            <button
              className="btn-plush primary"
              onClick={() => {
                if (openShare()) {
                  live.tellModel(
                    "The child tapped share — the publish card is open. Ask them what name their site should have.",
                  )
                }
              }}
              disabled={building || !html}
            >
              <IconShare size={22} />
              share it
            </button>
            <button className="btn-plush sky dock-play" onClick={openInTab} disabled={building || !html}>
              <IconOpenTab size={20} />
              play it big
            </button>
            {changes > 0 ? (
              <span className="dock-changes">
                <IconSpark size={18} /> {changes} change{changes > 1 ? "s" : ""} made it better
              </span>
            ) : null}
          </div>
        ) : null}
      </aside>

      {/* ── publish card: voice or hand, the live session stays on ── */}
      {card ? (
        <div className="publish-veil" role="dialog" aria-label="publish your creation">
          <div className="publish-card plush-lg popin">
            {!card.slug ? (
              <>
                <button className="publish-close" onClick={cancelShare} aria-label="close">
                  <IconX size={20} />
                </button>
                <Mascot size={72} mood="wow" />
                <h2>name your site!</h2>
                <p className="publish-hint">say a name to Sprout or type it</p>
                <div className="publish-name">
                  <input
                    value={card.name}
                    placeholder="taco dragon"
                    maxLength={40}
                    onChange={(e) => nameShare(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmShare()
                    }}
                  />
                  <span className="publish-domain">.ayyayo.app</span>
                </div>
                <button
                  className="btn-plush mint"
                  style={{ width: "100%" }}
                  disabled={card.saving || !sanitizeSlug(card.name)}
                  onClick={confirmShare}
                >
                  <IconCheck size={22} />
                  {card.saving ? "publishing..." : "OK — make it live"}
                </button>
              </>
            ) : (
              <>
                <div className="popin">
                  <Mascot size={80} mood="proud" />
                </div>
                <h2 className="publish-live">
                  <IconParty size={26} /> it&apos;s live!
                </h2>
                <canvas ref={qrRef} className="publish-qr" aria-label="QR code to open this creation" />
                <code className="publish-url">{shareUrlFor(card.slug)}</code>
                <div className="publish-actions">
                  <button
                    className="btn-plush sky"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrlFor(card.slug!))
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1800)
                      } catch {}
                    }}
                  >
                    {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                    {copied ? "copied!" : "copy link"}
                  </button>
                  <button className="btn-plush ghost" onClick={openInTab}>
                    <IconOpenTab size={20} />
                    open it
                  </button>
                </div>
                <p className="publish-autoopen">opening it for you...</p>
                <button className="btn-plush" onClick={cancelShare}>
                  keep making
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}
