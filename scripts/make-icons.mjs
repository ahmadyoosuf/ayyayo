// Rasterize app/icon.svg into favicon.ico, apple-icon.png, and a deck logo PNG.
// Run: node scripts/make-icons.mjs
import sharp from "sharp"
import { readFileSync, writeFileSync } from "node:fs"

const svg = readFileSync("app/icon.svg")

// ICO container holding one 256px PNG (valid since Vista; all modern browsers).
function pngToIco(png) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // count
  const entry = Buffer.alloc(16)
  entry.writeUInt8(0, 0) // width 0 = 256
  entry.writeUInt8(0, 1) // height 0 = 256
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // planes
  entry.writeUInt16LE(32, 6) // bpp
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(22, 12) // data offset: 6 + 16
  return Buffer.concat([header, entry, png])
}

const png256 = await sharp(svg, { density: 300 }).resize(256, 256).png().toBuffer()
writeFileSync("app/favicon.ico", pngToIco(png256))

// Apple touch icon: no transparency allowed; paper background, mascot inset.
const mark = await sharp(svg, { density: 300 }).resize(150, 150).png().toBuffer()
await sharp({
  create: { width: 180, height: 180, channels: 4, background: "#fffaf0" },
})
  .composite([{ input: mark, top: 15, left: 15 }])
  .png()
  .toFile("app/apple-icon.png")

// Big transparent mark for the pitch deck title slide.
await sharp(svg, { density: 300 }).resize(512, 512).png().toFile("scripts/logo-512.png")

console.log("icons written: app/favicon.ico, app/apple-icon.png, scripts/logo-512.png")
