import { NextResponse } from "next/server"
import { createServiceClient, getSessionUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET /api/mine -> the signed-in user's published creations, newest first.
export async function GET() {
  const user = await getSessionUser()
  if (!user?.email) return NextResponse.json({ creations: [] }, { status: 401 })
  try {
    const sb = createServiceClient()
    const { data, error } = await sb
      .from("artifacts")
      .select("slug, kind, title, created_at")
      .eq("owner_email", user.email)
      .order("created_at", { ascending: false })
      .limit(20)
    if (error) throw error
    return NextResponse.json({ creations: data ?? [] })
  } catch {
    return NextResponse.json({ creations: [] })
  }
}
