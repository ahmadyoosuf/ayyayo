// ayyayo pitch deck builder. Same design language as the site:
// paper bg, cartoon ink, plush cards, lowercase voice, no em-dashes.
// Run: node scripts/make-deck.mjs
// Videos: drop demos/build.mp4 and demos/deck.mp4 next to the repo root,
// rerun, and they get embedded so they play inside the slides.
import Pptx from "pptxgenjs"
import { existsSync } from "node:fs"

const PAPER = "FFFAF0"
const INK = "3B2A1F"
const INK_SOFT = "8E7261"
const LINE = "2B1E16"
const PEACH = "FFB68A"
const BUTTER = "FFD86B"
const SKY = "A6D8FF"
const MINT = "A8E5C8"
const WHITE = "FFFFFF"

const HEAD = "Segoe UI" // rounded-clean on Windows; falls back gracefully elsewhere
const MONO = "Consolas"

const pptx = new Pptx()
pptx.layout = "LAYOUT_WIDE" // 13.33 x 7.5
pptx.author = "ayyayo"
pptx.title = "ayyayo: boss the bot"

const W = 13.33
const H = 7.5

function paper(slide) {
  slide.background = { color: PAPER }
}

function plush(slide, x, y, w, h, fill = WHITE) {
  slide.addShape("roundRect", {
    x, y, w, h,
    fill: { color: fill },
    line: { color: LINE, width: 2.25 },
    rectRadius: 0.16,
    shadow: { type: "outer", color: LINE, opacity: 0.18, blur: 6, offset: 3, angle: 90 },
  })
}

function chip(slide, x, y, text, fill, w = 1.5) {
  slide.addShape("roundRect", {
    x, y, w, h: 0.42,
    fill: { color: fill },
    line: { color: LINE, width: 1.75 },
    rectRadius: 0.21,
  })
  slide.addText(text, {
    x, y, w, h: 0.42,
    align: "center", valign: "middle",
    fontFace: HEAD, fontSize: 12, bold: true, color: LINE,
  })
}

function title(slide, text) {
  slide.addText(text, {
    x: 0.7, y: 0.42, w: W - 1.4, h: 0.9,
    fontFace: HEAD, fontSize: 33, bold: true, color: INK, align: "left",
  })
}

function footer(slide, text) {
  slide.addText(text, {
    x: 0.7, y: H - 0.62, w: W - 1.4, h: 0.4,
    fontFace: HEAD, fontSize: 11.5, color: INK_SOFT, align: "center",
  })
}

function videoSlide(slide, heading, file, caption) {
  title(slide, heading)
  const vw = 9.6
  const vh = vw * 9 / 16
  const vx = (W - vw) / 2
  const vy = 1.35
  if (existsSync(file)) {
    plush(slide, vx - 0.12, vy - 0.12, vw + 0.24, vh + 0.24)
    slide.addMedia({ type: "video", path: file, x: vx, y: vy, w: vw, h: vh })
  } else {
    plush(slide, vx, vy, vw, vh)
    slide.addText(
      `drop ${file} in the repo and rerun\nnode scripts/make-deck.mjs`,
      { x: vx, y: vy, w: vw, h: vh, align: "center", valign: "middle", fontFace: MONO, fontSize: 16, color: INK_SOFT },
    )
  }
  slide.addText(caption, {
    x: vx, y: vy + vh + 0.18, w: vw, h: 0.4,
    fontFace: HEAD, fontSize: 14, italic: false, color: INK_SOFT, align: "center",
  })
}

// ── 1 · title ────────────────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  if (existsSync("scripts/logo-512.png")) {
    s.addImage({ path: "scripts/logo-512.png", x: W / 2 - 1.05, y: 1.05, w: 2.1, h: 2.1 })
  }
  s.addText("ayyayo", {
    x: 0, y: 3.25, w: W, h: 1.3,
    fontFace: HEAD, fontSize: 66, bold: true, color: INK, align: "center", charSpacing: -1,
  })
  s.addText("boss the bot.", {
    x: 0, y: 4.55, w: W, h: 0.7,
    fontFace: HEAD, fontSize: 26, bold: true, color: INK_SOFT, align: "center",
  })
  s.addText("voice-to-code for kids 8 to 11. they speak, the bot builds, they judge.", {
    x: 0, y: 5.35, w: W, h: 0.5,
    fontFace: HEAD, fontSize: 16, color: INK_SOFT, align: "center",
  })
  footer(s, "SuperAI NEXT 2026 · Singapore · ayyayo.app")
}

// ── 2 · what a kid does ──────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  title(s, "what a kid does")
  const cards = [
    { c: PEACH, n: "1", h: "speak it", t: "“make me a game where a dragon eats tacos”. that is the whole interface." },
    { c: BUTTER, n: "2", h: "watch it build", t: "the app paints itself on the canvas while they are still talking." },
    { c: SKY, n: "3", h: "make it live", t: "“publish it” puts it on their own link: dragon-tacos.ayyayo.app" },
    { c: MINT, n: "4", h: "boss the bot", t: "the de-slop gym: catch the AI’s lazy writing, name it, order the fix." },
  ]
  const cw = 5.85, ch = 2.35, gx = 0.45, gy = 0.45
  const x0 = (W - cw * 2 - gx) / 2
  const y0 = 1.6
  cards.forEach((card, i) => {
    const x = x0 + (i % 2) * (cw + gx)
    const y = y0 + Math.floor(i / 2) * (ch + gy)
    plush(s, x, y, cw, ch)
    s.addShape("ellipse", { x: x + 0.3, y: y + 0.3, w: 0.55, h: 0.55, fill: { color: card.c }, line: { color: LINE, width: 1.75 } })
    s.addText(card.n, { x: x + 0.3, y: y + 0.3, w: 0.55, h: 0.55, align: "center", valign: "middle", fontFace: HEAD, fontSize: 17, bold: true, color: LINE })
    s.addText(card.h, { x: x + 1.05, y: y + 0.28, w: cw - 1.3, h: 0.6, fontFace: HEAD, fontSize: 21, bold: true, color: INK })
    s.addText(card.t, { x: x + 1.05, y: y + 0.95, w: cw - 1.45, h: 1.2, fontFace: HEAD, fontSize: 14.5, color: INK_SOFT, lineSpacingMultiple: 1.15 })
  })
  footer(s, "no typing, no menus, no templates. the kid is the boss, the bot does the labor.")
}

// ── 3 · demo: build ──────────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  videoSlide(s, "watch: a game, spoken into existence", "demos/build.mp4",
    "one take, real time. spoken, rendered, published, opened. no edits.")
}

// ── 4 · demo: deck ───────────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  videoSlide(s, "watch: it makes slide decks too, live", "demos/deck.mp4",
    "designed fresh every run, presented in the app, exported as a real .pptx.")
}

// ── 5 · under the hood ───────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  title(s, "under the hood")
  const rows = [
    { c: SKY, tag: "Gemini Live", t: "a realtime voice agent hears the kid, talks back, and drives everything by tool calls. no buttons required." },
    { c: PEACH, tag: "Cerebras", t: "GLM-4.7 writes the code at 1000+ tokens per second, about 750 words every second, reasoning turned off. that is why it renders as you speak." },
    { c: BUTTER, tag: "Vercel", t: "born in v0, shipped on Vercel: hosting, functions, CLI, and wildcard DNS so every kid gets name.ayyayo.app with SSL." },
    { c: MINT, tag: "AWS", t: "every creation is archived to S3, and Kiro helped build the publish pipeline." },
    { c: WHITE, tag: "and more", t: "Supabase auth with invite-only access. Fireworks gpt-oss-120b powers the AI buddies living inside the kids’ creations." },
  ]
  const rh = 0.98, gap = 0.14
  let y = 1.5
  for (const r of rows) {
    plush(s, 0.7, y, W - 1.4, rh)
    chip(s, 0.95, y + (rh - 0.42) / 2, r.tag, r.c, 1.7)
    s.addText(r.t, { x: 2.85, y: y + 0.08, w: W - 3.8, h: rh - 0.16, fontFace: HEAD, fontSize: 14.5, color: INK, valign: "middle", lineSpacingMultiple: 1.1 })
    y += rh + gap
  }
}

// ── 6 · try it ───────────────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  title(s, "try it yourself")
  s.addText("ayyayo.app", {
    x: 0, y: 1.35, w: W, h: 0.95,
    fontFace: HEAD, fontSize: 44, bold: true, color: INK, align: "center",
  })
  const creds = [
    { email: "judge@ayyayo.app", pass: "taste-boss-2026", note: "pre-loaded with real creations", c: BUTTER },
    { email: "guest@ayyayo.app", pass: "boss-the-bot-26", note: "clean slate", c: SKY },
    { email: "builder@ayyayo.app", pass: "sharp-eyes-26", note: "clean slate", c: MINT },
  ]
  const cw = 3.85, ch = 2.0, gx = 0.35
  const x0 = (W - cw * 3 - gx * 2) / 2
  const y0 = 2.75
  creds.forEach((cr, i) => {
    const x = x0 + i * (cw + gx)
    plush(s, x, y0, cw, ch, i === 0 ? WHITE : WHITE)
    chip(s, x + 0.25, y0 + 0.25, cr.note, cr.c, cw - 0.5)
    s.addText(cr.email, { x: x + 0.25, y: y0 + 0.85, w: cw - 0.5, h: 0.45, fontFace: MONO, fontSize: 14, bold: true, color: INK, align: "center" })
    s.addText(cr.pass, { x: x + 0.25, y: y0 + 1.3, w: cw - 0.5, h: 0.45, fontFace: MONO, fontSize: 14, color: INK_SOFT, align: "center" })
  })
  s.addText("then just say: “make me a game where i dodge asteroids in space”", {
    x: 0, y: 5.35, w: W, h: 0.5,
    fontFace: HEAD, fontSize: 17, bold: true, color: INK, align: "center",
  })
  footer(s, "built solo at SuperAI NEXT 2026 · ayyayo.app")
}

await pptx.writeFile({ fileName: "ayyayo-deck.pptx" })
const haveBuild = existsSync("demos/build.mp4")
const haveDeck = existsSync("demos/deck.mp4")
console.log(`ayyayo-deck.pptx written. videos: build=${haveBuild ? "embedded" : "PLACEHOLDER"} deck=${haveDeck ? "embedded" : "PLACEHOLDER"}`)
