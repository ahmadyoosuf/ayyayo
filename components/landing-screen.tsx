"use client"

import Link from "next/link"
import { Mascot } from "@/components/mascot"

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
        gap: 28,
        padding: "32px 24px",
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div className="floaty">
        <Mascot size={120} mood="happy" />
      </div>
      <h1 className="display" style={{ fontSize: 46, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
        ayyayo
      </h1>
      <p style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.55, margin: 0, color: "var(--ink)" }}>
        Kids describe what they want out loud. Software builds on screen as they talk, they refine it by
        judgment, and publish it to a URL they keep.
      </p>
      <Link href="/login" className="btn-plush primary" style={{ textDecoration: "none", fontSize: 19, padding: "15px 34px" }}>
        sign in
      </Link>
      <p style={{ fontWeight: 600, fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>
        invite only
      </p>
    </main>
  )
}
