import { ARTIFACT_BASE_CSS } from './templates'

// ── De-Slop: the Judge gym ─────────────────────────────────────────────
// The AI produces a piece of REAL slop live, with one planted tell. The kid
// catches it, names it, and bosses the bot to repair it — judgment with a
// visible before/after, not a quiz.
//
// The tells are not invented by us: they're the consensus signs people cite
// for AI slop (Merriam-Webster 2025 WotY coverage, Wikipedia "Signs of AI
// writing", slop-spotting guides), translated into kid words.

export interface SlopTell {
  id: string
  label: string // kid-facing chip text
  grownUp: string // the real-world name of the tell
  plant: string // instruction for generating slop WITH this tell
  fix: string // what a good repair looks like
}

export const TELLS: SlopTell[] = [
  {
    id: 'says-nothing',
    label: 'says nothing',
    grownUp: 'fluent but empty — platitudes with zero content',
    plant:
      'Fill it with smooth, confident sentences that say absolutely nothing concrete: "an amazing experience that brings joy", "fun for everyone, every time". No specifics anywhere. It must READ fine but mean nothing.',
    fix: 'Replace every empty phrase with one concrete, specific, surprising detail. Fewer words, real meaning.',
  },
  {
    id: 'no-real-example',
    label: 'no real example',
    grownUp: 'vague claims with no specifics or sources',
    plant:
      'Make big vague claims with no specifics: "studies show", "experts agree", "everyone loves it" — never an actual example, name, number with a source, or detail.',
    fix: 'Swap each vague claim for one real, checkable, concrete example or detail a kid could verify.',
  },
  {
    id: 'fake-facts',
    label: 'fake facts',
    grownUp: 'confident made-up numbers and sources',
    plant:
      'Include 2-3 confidently stated but obviously made-up facts and oddly precise numbers ("scientists at the Moon Institute proved 87.3% of cats dream in French"). State them with total confidence.',
    fix: 'Remove or correct the made-up facts; keep only things that are actually true, said plainly.',
  },
  {
    id: 'robot-voice',
    label: 'robot voice',
    grownUp: 'stiff, formal, personality-free committee prose',
    plant:
      'Write everything in stiff, formal, lifeless corporate language: no contractions, no jokes, no opinions, every sentence the same shape and length. Perfect grammar, zero personality.',
    fix: 'Rewrite with a real, warm, playful human voice: contractions, rhythm, one little joke, sentences of different lengths.',
  },
  {
    id: 'too-samey',
    label: 'too samey',
    grownUp: 'the template look every AI page has',
    plant:
      'Use the exact generic AI-website template: blue-to-purple gradient hero, centered headline, three identical feature cards with icons, and filler copy like "delivering exceptional experiences". Visually competent, completely interchangeable.',
    fix: 'Throw away the template: one distinctive layout choice, a specific color voice, content that could only belong to THIS page.',
  },
]

export const TOPICS = [
  'a poster inviting kids to a birthday party',
  'a page about why dogs are great pets',
  'a mini page about the school science fair',
  'a page recommending a video game',
  'a poster for a lemonade stand',
  'a page about dinosaurs for kids',
  'a club page for a comic-drawing club',
]

export function tellById(id: string): SlopTell | undefined {
  return TELLS.find((t) => t.id === id)
}

export function buildSlopPrompt(topic: string, tell: SlopTell): string {
  return `Make ${topic} as a small single-file HTML page — but make it deliberate AI SLOP with exactly ONE planted flaw:
${tell.plant}
Everything else (layout, colors, working code) should be decent so the flaw is the thing a sharp kid can catch. Keep it small: a heading and 2-4 short blocks. No interactivity needed.
Return the full single-file HTML document now.`
}

export function buildFixPrompt(tell: SlopTell, kidCommand: string): string {
  return `The kid (the boss) caught the slop: this page is "${tell.grownUp}". Their order: "${kidCommand}".
Repair it: ${tell.fix}
Keep the same topic and general layout so the before/after is easy to see. Return the FULL updated single-file HTML document.`
}

// ── Canned fallback rounds (offline-safe, one per demo-critical tell) ──
function cannedDoc(body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${ARTIFACT_BASE_CSS}</style></head><body><div class="stage">${body}</div></body></html>`
}

export const CANNED_SLOP: Record<string, { topic: string; html: string }> = {
  'says-nothing': {
    topic: 'a poster inviting kids to a birthday party',
    html: cannedDoc(`<div class="card"><h1>A Special Celebration!</h1>
      <p style="font-weight:700">Join us for an amazing experience full of joy and wonderful moments.</p>
      <p style="font-weight:700">There will be fun activities for everyone, and memories that last a lifetime.</p>
      <p style="font-weight:700">It is going to be truly special. Do not miss this incredible event!</p></div>`),
  },
  'fake-facts': {
    topic: 'a page about dinosaurs for kids',
    html: cannedDoc(`<div class="card"><h1>Dinosaur Facts!</h1>
      <p style="font-weight:700">Scientists at the Dino Institute proved that 87.3% of T-Rexes could whistle.</p>
      <p style="font-weight:700">Studies show stegosauruses invented the high-five 66 million years ago.</p>
      <p style="font-weight:700">Experts agree raptors were excellent at chess.</p></div>`),
  },
  'robot-voice': {
    topic: 'a club page for a comic-drawing club',
    html: cannedDoc(`<div class="card"><h1>Comic Drawing Club</h1>
      <p style="font-weight:700">It is recommended that interested individuals attend the sessions. The sessions are conducted weekly.</p>
      <p style="font-weight:700">Participants will be provided with materials. The materials are of acceptable quality.</p>
      <p style="font-weight:700">Attendance is encouraged. The club is considered enjoyable.</p></div>`),
  },
}
