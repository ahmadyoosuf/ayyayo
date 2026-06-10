// ayyayo pitch deck builder. Same design language as the site:
// paper bg, cartoon ink, plush cards, lowercase voice, minimal words.
// Run: node scripts/make-deck.mjs
// Videos: drop demos/build.mp4 and demos/deck.mp4, rerun, they embed.
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

const HEAD = "Segoe UI"
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

function videoSlide(slide, heading, file) {
  title(slide, heading)
  const vw = 9.9
  const vh = vw * 9 / 16
  const vx = (W - vw) / 2
  const vy = 1.45
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
}

// ── 1 · title ────────────────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  if (existsSync("scripts/logo-512.png")) {
    s.addImage({ path: "scripts/logo-512.png", x: W / 2 - 1.05, y: 1.0, w: 2.1, h: 2.1 })
  }
  s.addText("ayyayo", {
    x: 0, y: 3.2, w: W, h: 1.3,
    fontFace: HEAD, fontSize: 66, bold: true, color: INK, align: "center", charSpacing: -1,
  })
  s.addText("boss the bot.", {
    x: 0, y: 4.5, w: W, h: 0.7,
    fontFace: HEAD, fontSize: 26, bold: true, color: INK_SOFT, align: "center",
  })
  s.addText("voice-to-code for kids 8 to 11", {
    x: 0, y: 5.25, w: W, h: 0.5,
    fontFace: HEAD, fontSize: 16, color: INK_SOFT, align: "center",
  })
  s.addText("ayyayo.app", {
    x: 0, y: 5.95, w: W, h: 0.6,
    fontFace: HEAD, fontSize: 22, bold: true, color: INK, align: "center",
  })
  footer(s, "SuperAI NEXT 2026 · Singapore")
}

// ── 2 · what a kid does ──────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  title(s, "what a kid does")
  const cards = [
    { c: PEACH, n: "1", h: "speak it", t: "“make me a game where a dragon eats tacos”" },
    { c: BUTTER, n: "2", h: "watch it build", t: "it paints while they talk" },
    { c: SKY, n: "3", h: "make it live", t: "“publish it” · dragon-tacos.ayyayo.app" },
    { c: MINT, n: "4", h: "boss the bot", t: "catch the slop, order the fix" },
  ]
  const cw = 5.85, ch = 2.1, gx = 0.45, gy = 0.45
  const x0 = (W - cw * 2 - gx) / 2
  const y0 = 1.75
  cards.forEach((card, i) => {
    const x = x0 + (i % 2) * (cw + gx)
    const y = y0 + Math.floor(i / 2) * (ch + gy)
    plush(s, x, y, cw, ch)
    s.addShape("ellipse", { x: x + 0.35, y: y + ch / 2 - 0.275, w: 0.55, h: 0.55, fill: { color: card.c }, line: { color: LINE, width: 1.75 } })
    s.addText(card.n, { x: x + 0.35, y: y + ch / 2 - 0.275, w: 0.55, h: 0.55, align: "center", valign: "middle", fontFace: HEAD, fontSize: 17, bold: true, color: LINE })
    s.addText(card.h, { x: x + 1.15, y: y + 0.45, w: cw - 1.4, h: 0.55, fontFace: HEAD, fontSize: 22, bold: true, color: INK })
    s.addText(card.t, { x: x + 1.15, y: y + 1.1, w: cw - 1.5, h: 0.6, fontFace: HEAD, fontSize: 14.5, color: INK_SOFT })
  })
  footer(s, "the kid is the boss. the bot does the labor.")
}

// ── 3 · demo: build ──────────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  videoSlide(s, "a game, spoken into existence", "demos/build.mp4")
}

// ── 4 · demo: deck ───────────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  videoSlide(s, "it makes decks too. live.", "demos/deck.mp4")
}

// ── 5 · under the hood ───────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  title(s, "under the hood")
  const rows = [
    { c: PEACH, tag: "AWS", t: "every creation is archived to S3. Kiro helped build the pipeline." },
    { c: BUTTER, tag: "Vercel", t: "born in v0. hosting, functions, CLI, wildcard DNS for name.ayyayo.app." },
    { c: SKY, tag: "voice", t: "a speech-to-speech agent hears the kid and runs the whole app through tool calls." },
    { c: MINT, tag: "speed", t: "inference at 1000+ tokens per second. that is why it renders as you speak." },
  ]
  const rh = 1.12, gap = 0.22
  let y = 1.65
  for (const r of rows) {
    plush(s, 0.7, y, W - 1.4, rh)
    chip(s, 0.95, y + (rh - 0.42) / 2, r.tag, r.c, 1.7)
    s.addText(r.t, { x: 2.85, y: y + 0.08, w: W - 3.8, h: rh - 0.16, fontFace: HEAD, fontSize: 15.5, color: INK, valign: "middle" })
    y += rh + gap
  }
}

// ── 6 · try it ───────────────────────────────────────────────
{
  const s = pptx.addSlide()
  paper(s)
  title(s, "try it")
  s.addText("ayyayo.app", {
    x: 0, y: 1.5, w: W, h: 0.95,
    fontFace: HEAD, fontSize: 44, bold: true, color: INK, align: "center",
  })
  const cw = 4.6, ch = 2.0
  const x = (W - cw) / 2
  const y0 = 2.95
  plush(s, x, y0, cw, ch)
  chip(s, x + 0.4, y0 + 0.3, "pre-loaded with real creations", BUTTER, cw - 0.8)
  s.addText("judge@ayyayo.app", { x: x + 0.3, y: y0 + 0.9, w: cw - 0.6, h: 0.45, fontFace: MONO, fontSize: 15, bold: true, color: INK, align: "center" })
  s.addText("taste-boss-2026", { x: x + 0.3, y: y0 + 1.35, w: cw - 0.6, h: 0.45, fontFace: MONO, fontSize: 15, color: INK_SOFT, align: "center" })
  s.addText("say: “make me a game where i dodge asteroids”", {
    x: 0, y: 5.55, w: W, h: 0.5,
    fontFace: HEAD, fontSize: 17, bold: true, color: INK, align: "center",
  })
  footer(s, "SuperAI NEXT 2026")
}

await pptx.writeFile({ fileName: "ayyayo-deck.pptx" })
const haveBuild = existsSync("demos/build.mp4")
const haveDeck = existsSync("demos/deck.mp4")
console.log(`ayyayo-deck.pptx written. videos: build=${haveBuild ? "embedded" : "PLACEHOLDER"} deck=${haveDeck ? "embedded" : "PLACEHOLDER"}`)
