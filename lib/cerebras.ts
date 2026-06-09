import type { Kind } from './types'
import { ARTIFACT_BASE_CSS } from './templates'

const SYSTEM = `You build tiny, complete, single-file HTML toys for kids aged 8-11.
HARD RULES:
- Output ONE complete HTML document only. No markdown, no code fences, no commentary.
- Everything inline: one <style> and one <script>. No external links, no imports, no fetch.
- Big, friendly, plush cartoon look: thick dark outlines (#2b1e16), rounded corners, pastel colors, bold Nunito font.
- NEAR-ZERO TEXT. Labels are 1-3 words. No paragraphs, no instructions walls.
- Must work instantly on a phone, touch-friendly, no errors.
- It must DO something the moment it loads (a strong default), playable/usable right away.
Reuse this base style as a starting point inside <style>:
${ARTIFACT_BASE_CSS}`

function kindBrief(kind: Kind): string {
  switch (kind) {
    case 'game':
      return 'A simple one-tap arcade game with a visible score that goes up.'
    case 'story':
      return 'A 3-4 scene branching picture story with tappable choices.'
    case 'quiz':
      return 'A 3-question multiple-choice quiz with instant right/wrong feedback and a final score.'
    case 'buddy':
      return `A chat character the kid talks to. Include an input + send button and a chat log.
When the kid sends a message, call: parent.postMessage({type:'buddy_say',id,text,persona},'*')
and listen for {type:'buddy_reply',id,text} to render the reply. Always include a short canned fallback reply after 4s if none arrives.`
  }
}

export interface GenArgs {
  kind: Kind
  idea?: string
  current?: string // existing HTML when refining
  refine?: string // the kid's judgment, e.g. "too much text"
}

export function buildPrompt({ kind, idea, current, refine }: GenArgs): string {
  if (current && refine) {
    return `Here is the current toy:\n\n${current}\n\nThe kid (the boss) judged it and said: "${refine}".
Apply that change and return the FULL updated single-file HTML document. Keep what worked. Change only what the judgment calls for.`
  }
  return `Make a ${kind}. ${kindBrief(kind)} ${idea ? `The kid wants: "${idea}".` : 'Pick a fun, strong default.'}
Return the full single-file HTML document now.`
}

// Streams raw text chunks from Cerebras GLM-4.7. Throws on any failure so the
// caller can fall back to a cached template (spec sec 7).
export async function* streamCerebras(prompt: string): AsyncGenerator<string> {
  const key = process.env.CEREBRAS_API_KEY
  if (!key) throw new Error('no_cerebras_key')

  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'zai-glm-4.7',
      stream: true,
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok || !res.body) throw new Error(`cerebras_${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const payload = t.slice(5).trim()
      if (payload === '[DONE]') return
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // ignore keep-alive / partial lines
      }
    }
  }
}

// Pull just the HTML document out of whatever the model returned.
export function extractHtml(raw: string): string {
  let s = raw.trim()
  const fence = s.match(/```(?:html)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  const start = s.search(/<!doctype html|<html/i)
  if (start > 0) s = s.slice(start)
  return s
}
