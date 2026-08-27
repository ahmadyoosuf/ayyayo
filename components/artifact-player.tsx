"use client"

import { useEffect, useRef } from "react"
import type { Kind } from "@/lib/types"

// Full-screen live player for a shared creation. Bridges the buddy iframe to
// the server-side LLM proxy, passing the slug so the per-artifact spend cap applies.
export function ArtifactPlayer({
  html,
  slug,
  kind,
  persona,
}: {
  html: string
  slug: string
  kind: Kind
  persona?: string | null
}) {
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = ref.current
    if (frame) frame.srcdoc = html
  }, [html])

  useEffect(() => {
    if (kind !== "buddy") return
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
            long: d.long === true,
            slug,
          }),
        })
        const data = await res.json()
        ref.current?.contentWindow?.postMessage(
          { type: "buddy_reply", id: d.id, text: data.text },
          "*",
        )
      } catch {
        /* iframe falls back to a canned reply on timeout */
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [kind, persona, slug])

  return (
    <iframe
      ref={ref}
      title="A creation made on ayyayo"
      sandbox="allow-scripts allow-pointer-lock allow-popups allow-downloads"
      style={{ border: 0, width: "100%", height: "100dvh", background: "var(--cream)" }}
    />
  )
}
