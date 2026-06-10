import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Two jobs:
// 1. Subdomain serving: slug.ayyayo.app -> /a/slug. Published creations are
//    PUBLIC (sharing is the product) — no auth, no extra latency.
// 2. Gate: the builder (/home /build /judge) and its expensive APIs require
//    a signed-in user. Login-only, no signup — credentials are seeded.
const ROOT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "ayyayo.app",
  "www.ayyayo.app",
])

// Public without any auth check (fast path, no network call).
const PUBLIC_PREFIXES = ["/a/", "/api/buddy", "/api/pairs"]

export async function proxy(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0]
  const url = req.nextUrl
  const { pathname } = url

  // Kid-site subdomains: rewrite and serve, always public.
  if (host.endsWith(".ayyayo.app") && !ROOT_HOSTS.has(host)) {
    const sub = host.replace(".ayyayo.app", "")
    if (sub && !pathname.startsWith("/a/") && !pathname.startsWith("/api")) {
      const rewritten = req.nextUrl.clone()
      rewritten.pathname = `/a/${sub}${pathname === "/" ? "" : pathname}`
      return NextResponse.rewrite(rewritten)
    }
    return NextResponse.next()
  }

  // Assets and public paths skip auth entirely.
  if (pathname.includes(".")) return NextResponse.next()
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // Everything else needs the session checked: either to gate it, or to
  // bounce an already-signed-in user past the landing/login pages.
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isEntry = pathname === "/" || pathname === "/login"
  if (user && isEntry) {
    return NextResponse.redirect(new URL("/home", req.url))
  }
  if (!user && !isEntry) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "sign in first" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
