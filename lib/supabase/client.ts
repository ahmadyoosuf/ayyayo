'use client'

import { createBrowserClient } from '@supabase/ssr'

// Browser client with cookie-based sessions (@supabase/ssr) so the proxy
// gate and server routes can read the same session.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
