import { NextRequest, NextResponse } from "next/server"

// Subdomain serving: slug.ayyayo.app -> /a/slug, so every kid creation lives at
// its own address. Falls through untouched in local/preview (no subdomain).
const ROOT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "ayyayo.app",
  "www.ayyayo.app",
])

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0]
  const url = req.nextUrl

  // Only attempt subdomain rewrite for *.ayyayo.app
  if (host.endsWith(".ayyayo.app") && !ROOT_HOSTS.has(host)) {
    const sub = host.replace(".ayyayo.app", "")
    // already an app path? leave it
    if (sub && !url.pathname.startsWith("/a/") && !url.pathname.startsWith("/api")) {
      const rewritten = req.nextUrl.clone()
      rewritten.pathname = `/a/${sub}${url.pathname === "/" ? "" : url.pathname}`
      return NextResponse.rewrite(rewritten)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
