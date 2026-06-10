import { streamCerebras } from "@/lib/cerebras"
import { TELLS, TOPICS, CANNED_SLOP, buildSlopPrompt } from "@/lib/slop"

// Node runtime — same Cloudflare-blocks-edge issue as /api/generate.
export const runtime = "nodejs"

// POST /api/slop -> streams a freshly generated piece of real AI slop with
// ONE planted tell. Headers carry the answer key (the client keeps it secret
// from the kid until they catch it). Falls back to a canned round so the
// Judge gym can never break on stage.
export async function POST() {
  const tell = TELLS[Math.floor(Math.random() * TELLS.length)]
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  const encoder = new TextEncoder()

  const headers = (source: "cerebras" | "fallback", tellId: string, topicText: string) =>
    new Headers({
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-ayyayo-source": source,
      "x-ayyayo-tell": tellId,
      "x-ayyayo-topic": encodeURIComponent(topicText),
    })

  try {
    const gen = streamCerebras(buildSlopPrompt(topic, tell))
    const first = await gen.next()
    if (first.done) throw new Error("empty_stream")

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(first.value))
        try {
          for await (const chunk of gen) controller.enqueue(encoder.encode(chunk))
        } catch (err) {
          console.error("[ayyayo] slop mid-stream error:", (err as Error).message)
        }
        controller.close()
      },
    })
    return new Response(stream, { headers: headers("cerebras", tell.id, topic) })
  } catch (err) {
    console.error("[ayyayo] slop error:", (err as Error).message)
    // Canned fallback: deterministic, offline-safe rounds.
    const ids = Object.keys(CANNED_SLOP)
    const id = ids[Math.floor(Math.random() * ids.length)]
    const canned = CANNED_SLOP[id]
    return new Response(canned.html, { headers: headers("fallback", id, canned.topic) })
  }
}
