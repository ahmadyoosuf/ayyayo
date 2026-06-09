import { Type, type FunctionDeclaration } from "@google/genai"

// These are the actions the Gemini Live model can take to drive the app.
// The model hears the kid's raw voice and decides which tool to call —
// there is no text bridge. Each loop registers the handlers it cares about.

export const BUILD_TOOLS: FunctionDeclaration[] = [
  {
    name: "make_creation",
    description:
      "Start a brand new creation of a given kind. Call this as soon as the child says what they want to make.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kind: {
          type: Type.STRING,
          description: "One of: game, story, quiz, buddy.",
          enum: ["game", "story", "quiz", "buddy"],
        },
        idea: {
          type: Type.STRING,
          description: "A short description of what the child wants, in their words.",
        },
      },
      required: ["kind", "idea"],
    },
  },
  {
    name: "change_creation",
    description:
      "Change the current creation based on what the child asked for. Call this every time they want it different.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        instruction: {
          type: Type.STRING,
          description: "The concrete change the child wants, e.g. 'make it about space' or 'add a jumping cat'.",
        },
      },
      required: ["instruction"],
    },
  },
  {
    name: "share_creation",
    description: "Save and share the current creation so others can see it. Call when the child says they are done or want to share.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
]

export const JUDGE_TOOLS: FunctionDeclaration[] = [
  {
    name: "pick_better",
    description:
      "Record which of the two creations the child thinks is better. Call as soon as they choose A or B.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        choice: { type: Type.STRING, description: "Which one they picked.", enum: ["A", "B"] },
        reason: {
          type: Type.STRING,
          description: "Why they think it is better, in their words. Empty string if they did not say yet.",
        },
      },
      required: ["choice"],
    },
  },
  {
    name: "next_round",
    description: "Move on to a new pair of creations to judge. Call when the child wants another one.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
]

export function buildSystemInstruction(kind?: string) {
  return [
    "You are Sprout, a warm, playful voice buddy for a young child (about 6 to 10 years old) using a creative app called ayyayo.",
    "You speak out loud in short, cheerful, simple sentences. Never read code, URLs, or technical words.",
    "Your job: help the child MAKE things (games, stories, quizzes, talking buddies) and improve them by taste.",
    "ALWAYS use your tools to actually do things. When they say what to make, call make_creation. When they want a change, call change_creation. When they're done, call share_creation.",
    "Encourage their taste: ask 'what would make it even better?' and celebrate their choices. Keep it kind and fun.",
    kind ? `Right now they are working on a ${kind}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
}

export const JUDGE_SYSTEM_INSTRUCTION =
  "You are Sprout, a warm voice buddy helping a young child build taste in the ayyayo Judge game. " +
  "Two creations are shown side by side: one is good, one has a flaw (too much text, cluttered, boring, or generic). " +
  "Ask the child which one is better and WHY. When they choose, call pick_better with their choice and reason. " +
  "Gently celebrate good taste and explain the lesson in one simple sentence. When they want another, call next_round. " +
  "Speak in short, cheerful, simple sentences. Never read code or technical words."
