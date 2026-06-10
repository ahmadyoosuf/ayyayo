"use client"

import Link from "next/link"
import { Mascot } from "@/components/mascot"

// The landing speaks in its own voice: the thesis, once, and a door.
// Everything else lives behind the door.
export function LandingScreen() {
  return (
    <main
      className="paper"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div className="floaty">
        <Mascot size={120} mood="happy" />
      </div>
      <h1 className="display" style={{ fontSize: 46, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
        ayyayo
      </h1>
      <p style={{ fontWeight: 800, fontSize: 20, margin: 0, color: "var(--ink)" }}>boss the bot.</p>
      <Link href="/login" className="btn-plush primary" style={{ textDecoration: "none", fontSize: 19, padding: "15px 34px" }}>
        come in
      </Link>
      <p style={{ position: "fixed", bottom: 18, fontWeight: 700, fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>
        built at SuperAI NEXT 2026 &middot; access is invite-only
      </p>
    </main>
  )
}
