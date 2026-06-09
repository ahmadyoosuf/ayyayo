const ADJ = ['happy', 'zoomy', 'fuzzy', 'sparkly', 'mega', 'tiny', 'brave', 'silly', 'cosmic', 'jelly']
const NOUN = ['dragon', 'taco', 'robot', 'kitten', 'rocket', 'pickle', 'wizard', 'noodle', 'panda', 'comet']

export function makeSlug(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)]
  const n = NOUN[Math.floor(Math.random() * NOUN.length)]
  const num = Math.floor(Math.random() * 900 + 100)
  return `${a}-${n}-${num}`
}
