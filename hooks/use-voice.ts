'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Voice via the browser Web Speech API. Every voice action has a tap fallback,
// so a STT miss never blocks the demo (spec sec 7). Gemini Live can swap in
// behind this same interface later.
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export function useVoice() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const onResultRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      setSupported(true)
      const rec: SpeechRecognitionLike = new SR()
      rec.lang = 'en-US'
      rec.continuous = false
      rec.interimResults = false
      rec.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript ?? ''
        if (text && onResultRef.current) onResultRef.current(text)
      }
      rec.onerror = () => setListening(false)
      rec.onend = () => setListening(false)
      recRef.current = rec
    }
  }, [])

  const listen = useCallback((onText: (text: string) => void) => {
    const rec = recRef.current
    if (!rec) return
    onResultRef.current = onText
    try {
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [])

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {}
    setListening(false)
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.02
      u.pitch = 1.15
      window.speechSynthesis.speak(u)
    } catch {}
  }, [])

  return { supported, listening, listen, stop, speak }
}
