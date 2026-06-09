import Link from "next/link"
import { Mascot } from "@/components/mascot"

export default function NotFound() {
  return (
    <main
      className="paper"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 24,
        textAlign: "center",
      }}
    >
      <Mascot size={100} mood="sad" />
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0 }}>hmm, not here</h1>
      <p style={{ fontWeight: 700, color: "var(--ink-soft)", maxWidth: 320, margin: 0 }}>
        this creation went on an adventure. let&apos;s make a new one!
      </p>
      <Link href="/" className="btn-plush primary" style={{ textDecoration: "none" }}>
        go home
      </Link>
    </main>
  )
}
