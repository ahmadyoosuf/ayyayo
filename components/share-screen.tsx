"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import QRCode from "qrcode"
import { ArrowLeft, Check, Copy, PartyPopper } from "lucide-react"
import { ArtifactFrame } from "@/components/artifact-frame"
import { Mascot } from "@/components/mascot"
import type { Kind } from "@/lib/types"

interface Pending {
  kind: Kind
  html: string
  title: string
  persona?: string
}

export function ShareScreen() {
  const router = useRouter()
  const [pending, setPending] = useState<Pending | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("ayyayo_pending")
    if (!raw) {
      router.replace("/build")
      return
    }
    try {
      setPending(JSON.parse(raw) as Pending)
    } catch {
      router.replace("/build")
    }
  }, [router])

  async function confirm() {
    if (!pending) return
    setSaving(true)
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(pending),
      })
      const data = await res.json()
      if (data.slug) {
        setSlug(data.slug)
        sessionStorage.removeItem("ayyayo_pending")
      }
    } finally {
      setSaving(false)
    }
  }

  const shareUrl =
    slug && typeof window !== "undefined" ? `${window.location.origin}/a/${slug}` : ""

  useEffect(() => {
    if (shareUrl && qrRef.current) {
      QRCode.toCanvas(qrRef.current, shareUrl, {
        width: 168,
        margin: 1,
        color: { dark: "#2b1e16", light: "#ffffff" },
      }).catch(() => {})
    }
  }, [shareUrl])

  async function copy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  if (!pending) return null

  return (
    <main
      className="paper"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <header style={{ padding: "14px 16px" }}>
        <button
          className="btn-plush ghost"
          style={{ padding: "10px 16px", fontSize: 16 }}
          onClick={() => router.push("/build")}
        >
          <ArrowLeft size={20} strokeWidth={2.6} />
          back
        </button>
      </header>

      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "0 16px 24px",
          width: "100%",
          maxWidth: 460,
          margin: "0 auto",
        }}
      >
        {!slug ? (
          <>
            <Mascot size={84} mood="proud" />
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, textAlign: "center" }}>
              ready to share?
            </h1>
            <div style={{ width: "100%", height: 320, display: "flex" }}>
              <ArtifactFrame html={pending.html} title={pending.title} />
            </div>
            <button
              className="btn-plush primary"
              style={{ fontSize: 20, padding: "16px 28px" }}
              onClick={confirm}
              disabled={saving}
            >
              {saving ? "saving..." : "yes! make it live"}
            </button>
            <button
              className="btn-plush ghost"
              onClick={() => router.push("/build")}
              disabled={saving}
            >
              keep editing
            </button>
          </>
        ) : (
          <>
            <div className="popin">
              <Mascot size={96} mood="proud" />
            </div>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 900,
                margin: 0,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <PartyPopper size={28} strokeWidth={2.6} /> it&apos;s live!
            </h1>
            <p style={{ fontWeight: 700, color: "var(--ink-soft)", textAlign: "center", margin: 0 }}>
              anyone with the link can play it. it runs for real.
            </p>

            <div
              className="plush-lg"
              style={{
                background: "white",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                width: "100%",
              }}
            >
              <canvas
                ref={qrRef}
                aria-label="QR code to open this creation"
                style={{
                  borderRadius: 14,
                  border: "3px solid var(--line)",
                }}
              />
              <code
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  wordBreak: "break-all",
                  textAlign: "center",
                }}
              >
                {shareUrl}
              </code>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <button className="btn-plush mint" onClick={copy}>
                  {copied ? <Check size={20} strokeWidth={2.6} /> : <Copy size={20} strokeWidth={2.6} />}
                  {copied ? "copied!" : "copy link"}
                </button>
                <Link href={`/a/${slug}`} className="btn-plush sky" style={{ textDecoration: "none" }}>
                  open it
                </Link>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-plush" onClick={() => router.push("/build")}>
                make another
              </button>
              <button className="btn-plush ghost" onClick={() => router.push("/")}>
                home
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
