import { createClient } from '@supabase/supabase-js'

// Browser client — uses the public anon key (RLS enforced).
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
