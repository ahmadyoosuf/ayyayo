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
