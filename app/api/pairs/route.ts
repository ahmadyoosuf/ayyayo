import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import type { JudgePair } from "@/lib/types"

// GET /api/pairs -> curated good-vs-slop pairs for the Judge gym.
// Curated, never generated at runtime, so the lesson is always clean.
export async function GET() {
  try {
    const sb = createServiceClient()
    const { data, error } = await sb
      .from("judge_pairs")
      .select("*")
      .order("sort_order", { ascending: true })
    if (error) throw error
    return NextResponse.json({ pairs: (data as JudgePair[]) ?? [] })
  } catch {
    return NextResponse.json({ pairs: [] })
  }
}
