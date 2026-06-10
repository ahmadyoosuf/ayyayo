// Deterministic PPTX export harness, injected into every generated deck.
// The model defines window.SLIDES (data only) and wires its download button
// to AYYAYO_EXPORT(window.SLIDES). It never writes export code itself —
// model-written PptxGenJS layout was unreliable (overlapping runaway text).
// This one implementation is tested once and identical for every deck.

export const DECK_EXPORTER_SCRIPT = `<script>
window.AYYAYO_EXPORT = async function (slides) {
  function fallbackHtml() {
    var blob = new Blob(['<!doctype html>' + document.documentElement.outerHTML], { type: 'text/html' })
    var a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ayyayo-deck.html'
    document.body.appendChild(a); a.click(); a.remove()
  }
  try {
    if (!Array.isArray(slides) || slides.length === 0) throw new Error('no slides')
    if (!window.PptxGenJS) {
      await new Promise(function (res, rej) {
        var s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
        s.onload = res; s.onerror = rej
        document.head.appendChild(s)
        setTimeout(rej, 8000)
      })
    }
    var pptx = new window.PptxGenJS()
    pptx.defineLayout({ name: 'AYYAYO', width: 13.33, height: 7.5 })
    pptx.layout = 'AYYAYO'
    var hex = function (c, d) {
      c = String(c || d || '111111').replace('#', '').trim()
      if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
      return /^[0-9a-fA-F]{6}$/.test(c) ? c.toUpperCase() : (d || '111111')
    }
    slides.forEach(function (s) {
      var sl = pptx.addSlide()
      sl.background = { color: hex(s.bg, 'FFFFFF') }
      var fg = hex(s.fg, '111111')
      var bullets = (s.bullets || []).map(String).filter(Boolean)
      var titleOnly = bullets.length === 0
      if (s.title) {
        sl.addText(String(s.title), {
          x: 0.7, y: titleOnly ? 2.6 : 0.6, w: 11.9, h: titleOnly ? 2.3 : 1.5,
          fontSize: titleOnly ? 54 : 38, bold: true, color: fg,
          align: titleOnly ? 'center' : 'left', fontFace: 'Arial', valign: 'middle',
        })
      }
      if (bullets.length) {
        sl.addText(
          bullets.map(function (t) { return { text: t, options: { bullet: { indent: 14 }, breakLine: true } } }),
          { x: 1.0, y: 2.3, w: 11.3, h: 4.6, fontSize: 24, color: fg,
            fontFace: 'Arial', valign: 'top', lineSpacingMultiple: 1.4, paraSpaceAfter: 10 }
        )
      }
      if (s.accent) {
        sl.addShape(pptx.ShapeType.rect, { x: 0.7, y: 6.85, w: 1.6, h: 0.12, fill: { color: hex(s.accent, fg) } })
      }
    })
    await pptx.writeFile({ fileName: 'ayyayo-deck.pptx' })
  } catch (e) {
    fallbackHtml()
  }
}
</scr` + `ipt>`

// Inject the exporter right after <head> so it's defined before the deck's
// own script runs. Falls back to <html...> if no head tag is found.
export function injectDeckExporter(html: string): string {
  if (html.includes("AYYAYO_EXPORT")) return html
  const head = html.search(/<head[^>]*>/i)
  if (head >= 0) {
    const end = html.indexOf(">", head) + 1
    return html.slice(0, end) + DECK_EXPORTER_SCRIPT + html.slice(end)
  }
  const htmlTag = html.search(/<html[^>]*>/i)
  if (htmlTag >= 0) {
    const end = html.indexOf(">", htmlTag) + 1
    return html.slice(0, end) + DECK_EXPORTER_SCRIPT + html.slice(end)
  }
  return DECK_EXPORTER_SCRIPT + html
}
