export interface VoiceTool {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export function toRealtimeTools(tools: VoiceTool[]) {
  return tools.map((t) => ({
    type: "function" as const,
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }))
}
