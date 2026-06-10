// Pull just the HTML document out of whatever the model returned.
// Shared by the server route and the client's progressive renderer.
export function extractHtml(raw: string): string {
  let s = raw.trim()
  const fence = s.match(/```(?:html)?\s*([\s\S]*?)(?:```|$)/i)
  if (fence && fence[1].trim()) s = fence[1].trim()
  const start = s.search(/<!doctype html|<html/i)
  if (start > 0) s = s.slice(start)
  const end = s.search(/<\/html>/i)
  if (end >= 0) s = s.slice(0, end + 7)
  return s
}

export function looksLikeHtml(s: string): boolean {
  return /<!doctype html|<html/i.test(s)
}
