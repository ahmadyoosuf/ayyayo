const ADJ = ['happy', 'zoomy', 'fuzzy', 'sparkly', 'mega', 'tiny', 'brave', 'silly', 'cosmic', 'jelly']
const NOUN = ['dragon', 'taco', 'robot', 'kitten', 'rocket', 'pickle', 'wizard', 'noodle', 'panda', 'comet']

export function makeSlug(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)]
  const n = NOUN[Math.floor(Math.random() * NOUN.length)]
  const num = Math.floor(Math.random() * 900 + 100)
  return `${a}-${n}-${num}`
}

// Subdomain labels the platform itself uses — a kid site can't take these.
const RESERVED = new Set(['www', 'api', 'app', 'ayyayo', 'admin', 'judge', 'build', 'share', 'a'])

// Turn whatever the kid said ("Taco Dragon!!") into a safe subdomain label.
// Returns '' if nothing usable remains so callers can fall back to makeSlug().
export function sanitizeSlug(name: string): string {
  const s = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/^-|-$/g, '')
  if (!s || s.length < 2 || RESERVED.has(s)) return ''
  return s
}
