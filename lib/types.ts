export type Kind = 'game' | 'story' | 'quiz' | 'buddy' | 'deck'

export interface Artifact {
  id: string
  slug: string
  kind: Kind
  title: string
  prompt: string
  html: string
  buddy_persona: string | null
  ai_spend_cents: number
  ai_spend_cap_cents: number
  created_at: string
}

export interface JudgePair {
  id: string
  kind: string
  topic: string
  good_html: string
  slop_html: string
  good_label: string
  slop_flaw: string
  sort_order: number
}

export const KINDS: { id: Kind; label: string; emoji: string; color: string }[] = [
  { id: 'game', label: 'game', emoji: 'controller', color: 'sky' },
  { id: 'story', label: 'story', emoji: 'book', color: 'butter' },
  { id: 'quiz', label: 'quiz', emoji: 'star', color: 'mint' },
  { id: 'buddy', label: 'buddy', emoji: 'heart', color: 'rose' },
]
