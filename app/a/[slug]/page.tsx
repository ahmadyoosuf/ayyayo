import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/server"
import { ArtifactPlayer } from "@/components/artifact-player"
import type { Artifact } from "@/lib/types"

async function getArtifact(slug: string): Promise<Artifact | null> {
  try {
    const sb = createServiceClient()
    const { data } = await sb.from("artifacts").select("*").eq("slug", slug).single()
    return (data as Artifact) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const art = await getArtifact(slug)
  if (!art) return { title: "not found · ayyayo" }
  return {
    title: `${art.title || "a creation"} · ayyayo`,
    description: "Made by a kid on ayyayo. They had the taste.",
  }
}

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const art = await getArtifact(slug)
  if (!art) notFound()

  return (
    <main style={{ height: "100dvh", overflow: "hidden" }}>
      <ArtifactPlayer
        html={art.html}
        slug={art.slug}
        kind={art.kind}
        persona={art.buddy_persona}
      />
    </main>
  )
}
