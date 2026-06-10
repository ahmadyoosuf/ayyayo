"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mascot } from "@/components/mascot"
import { IconBack } from "@/components/icons"
import { supabaseBrowser } from "@/lib/supabase/client"

// Login only. No signup — it's invite-only while ayyayo is a hackathon
// build; credentials ship with the supporting material.
export function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(false)
    const { error: err } = await supabaseBrowser().auth.signInWithPassword({ email, password })
    if (err) {
      setError(true)
      setBusy(false)
      return
    }
    router.push("/home")
    router.refresh()
  }

  return (
    <main className="paper" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "14px 16px" }}>
        <button className="btn-plush ghost btn-slim" onClick={() => router.push("/")} aria-label="back">
          <IconBack size={20} />
        </button>
      </header>
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "0 24px 80px",
        }}
      >
        <Mascot size={84} mood={error ? "think" : "happy"} />
        <h1 className="display" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          who goes there?
        </h1>
        <form onSubmit={signIn} style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 330 }}>
          <input
            className="login-field"
            type="email"
            placeholder="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="login-field"
            type="password"
            placeholder="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn-plush primary" type="submit" disabled={busy}>
            {busy ? "checking..." : "come in"}
          </button>
          {error ? (
            <p style={{ margin: 0, textAlign: "center", fontWeight: 800, fontSize: 14, color: "var(--rose-deep)" }}>
              hmm, that&apos;s not it
            </p>
          ) : null}
        </form>
      </section>
    </main>
  )
}
