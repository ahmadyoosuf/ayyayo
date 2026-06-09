'use client'

// A stable anonymous session id for the taste meter (no accounts in this build).
const KEY = 'ayyayo_session'

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = window.localStorage.getItem(KEY)
  if (!id) {
    id = 'kid_' + Math.random().toString(36).slice(2, 10)
    window.localStorage.setItem(KEY, id)
  }
  return id
}
