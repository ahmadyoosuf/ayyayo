import type { Kind } from './types'
import { ARTIFACT_BASE_CSS } from './templates'

const SYSTEM = `You build tiny, complete, single-file HTML apps for kids aged 8-11.
HARD RULES:
- Output ONE complete HTML document only. No markdown, no code fences, no commentary.
- Everything inline: one <style> and one <script>. No external links, no imports, no fetch (sole exception: the deck download button may lazy-load PptxGenJS as described below).
- Big, friendly, plush cartoon look: thick dark outlines (#2b1e16), rounded corners, pastel colors, bold Nunito font.
- Mostly tiny text. Labels are 1-3 words. No instruction walls. (A slide deck or a thinking app may use more text where it earns its place.)
- Must work instantly on a phone, touch-friendly, no errors. Long content must scroll smoothly (overflow:auto on the scrolling region).
- It must DO something the moment it loads (a strong default), usable right away.
IN-APP AI (use ONLY when the app needs a smart reply):
- To get a reply, call: parent.postMessage({type:'buddy_say',id,text,persona,long},'*') and listen for {type:'buddy_reply',id,text}.
- Set long:false for quick playful one-liners. Set long:true ONLY when the kid asked for a real, thoughtful answer (explaining, brainstorming, critical-thinking). long:true can take a few seconds — show a "thinking..." state and auto-scroll to the newest reply.
- ALWAYS include a short canned fallback reply after 5s (long:false) / 18s (long:true) if none arrives, so the app never hangs.
ABOUT AYYAYO (use ONLY when the creation is about ayyayo itself — never inject otherwise): ayyayo is a voice-to-code platform where kids speak and real software appears live as they talk. Code is generated on Cerebras at 1000+ TPS — always write it expanded: "1000+ tokens per second (about 750 words every second — faster than anyone can read)". Never assume the audience knows an acronym; expand it the first time. Kids boss the bot, judge its output, catch and de-slop AI slop, and publish to their own real website at name.ayyayo.app, durably archived on AWS S3. Voice runs on Gemini Live; the kid has the taste, the bot does the labor.
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
      return `A chat character the kid talks to. Include an input + send button and a scrolling chat log (overflow:auto, auto-scroll to newest).
When the kid sends a message, call: parent.postMessage({type:'buddy_say',id,text,persona,long:false},'*') and listen for {type:'buddy_reply',id,text}. If the kid clearly asks for a thoughtful or explaining answer, send long:true and show a "thinking..." bubble. Always include a canned fallback reply on timeout.`
    case 'deck':
      return `A presentation: 8-12 swipeable/tappable slides in ONE document. Show one slide at a time, full-bleed, with Next/Back controls (and arrow-key + swipe support). Slide 1 is a bold title slide. Each slide: a short headline and at most 3 tight bullet points — brutally concise, no paragraphs. A small slide counter (e.g. 3/10) in a corner. The FINAL slide must read "created with ayyayo" in a large, stylish, celebratory treatment.
PRESENTABLE EVERYWHERE: the deck must look right both embedded in a small preview and projected full screen — fluid type (clamp/vw units), full-bleed slides, no fixed pixel heights, generous touch targets. It must be genuinely presentable, not a toy.
STYLE: think like a real deck designer, not a template. If a style is requested (e.g. "minimal", "Apple style", "Vercel style", "Linear style"), COMMIT to it fully — typography, spacing, color system, background — the plush base style does NOT apply to decks unless asked. Default to confident minimal: huge type, generous whitespace, one accent color, consistent rhythm. Invent a fresh, distinctive design each time.
DOWNLOAD (required, even when nobody asks): include a small "download" button on every slide (corner, unobtrusive). On click, lazily load PptxGenJS from https://cdn.jsdelivr.net/npm/pptxgenjs/dist/pptxgen.bundle.js (inject a <script> tag at click time — this CDN script is the ONE allowed external resource, decks only) and export every slide's headline + bullets as a real .pptx via addText, matching the deck's colors. If the script fails to load within 5s, fall back to downloading the page itself as a self-contained .html file via a Blob — the button must always produce a file. Use common sense: a presentation people cannot take with them is a broken presentation.`
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
  const deckCloser =
    kind === 'deck'
      ? ' The VERY LAST slide MUST display "created with ayyayo" in a big, stylish, celebratory way — this is required.'
      : ''
  return `Make a ${kind}. ${kindBrief(kind)} ${idea ? `The kid wants: "${idea}".` : 'Pick a fun, strong default.'}${deckCloser}
Return the full single-file HTML document now.`
}

// Streams raw text chunks from Cerebras GLM-4.7. Throws on any failure so the
// caller can fall back to a cached template (spec sec 7).
// reasoning_effort "none": GLM-4.7 is a reasoning model and burns thousands of
// tokens thinking before the first HTML byte — we need 1000+ TPS of CODE.
export async function* streamCerebras(prompt: string): AsyncGenerator<string> {
  const key = process.env.CEREBRAS_API_KEY
  if (!key) throw new Error('no_cerebras_key')

  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
      // Cerebras' Cloudflare returns 403 to UA-less fetches from datacenter
      // IPs (Vercel edge). Any explicit UA passes; verified in production.
      'user-agent': 'curl/8.9.1',
    },
    body: JSON.stringify({
      model: 'zai-glm-4.7',
      stream: true,
      max_tokens: 12000,
      temperature: 0.7,
      reasoning_effort: 'none',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    console.error('[ayyayo] cerebras error', res.status, detail.slice(0, 300))
    throw new Error(`cerebras_${res.status}`)
  }

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

export { extractHtml } from './html'
