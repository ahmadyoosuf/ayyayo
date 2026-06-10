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
          description:
            "One of: game, story, quiz, buddy, deck. Use 'deck' when the child asks for a presentation, slides, or slideshow.",
          enum: ["game", "story", "quiz", "buddy", "deck"],
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
    description:
      "Open the publish card so the creation can go live on the internet. Call when the child says they are done, want to share, publish, or put it online. Then ask them what name their site should have.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "end_conversation",
    description:
      "Immediately stop talking and disconnect the voice session. Call when the child says stop, shush, be quiet, that's enough, stop talking, or otherwise wants you to go silent. Say NOTHING after calling this — just disconnect.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "name_creation",
    description:
      "Set the name of the child's site on the publish card, e.g. 'taco dragon'. Call as soon as they say a name. The name becomes their web address.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The site name the child said, in their words." },
      },
      required: ["name"],
    },
  },
  {
    name: "confirm_share",
    description:
      "Publish the creation live right now. Call when the child says yes, OK, go, or confirms the name on the publish card.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "cancel_share",
    description: "Close the publish card without publishing. Call if the child changes their mind or wants to keep making.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "open_creation",
    description:
      "Open the creation in a new browser tab so the child can play it full screen. Call when they say open it, play it, or try it. Works for the published site or the current work-in-progress.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
]

export const JUDGE_TOOLS: FunctionDeclaration[] = [
  {
    name: "catch_slop",
    description:
      "Record what the child says is wrong with the page on screen. Call as soon as they name a problem. Map their words to the closest tell.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tell: {
          type: Type.STRING,
          description:
            "The closest tell: says-nothing (smooth words, zero meaning), no-real-example (vague claims, no specifics), fake-facts (made-up numbers/sources), robot-voice (stiff lifeless committee writing), too-samey (the generic template every AI page has).",
          enum: ["says-nothing", "no-real-example", "fake-facts", "robot-voice", "too-samey"],
        },
        reason: { type: Type.STRING, description: "The child's words for what is wrong." },
      },
      required: ["tell"],
    },
  },
  {
    name: "fix_slop",
    description:
      "Order the bot to repair the slop the child caught. Call when the child says how to fix it (e.g. 'make it real', 'give it a voice').",
    parameters: {
      type: Type.OBJECT,
      properties: {
        instruction: { type: Type.STRING, description: "The child's fix order, in their words." },
      },
      required: ["instruction"],
    },
  },
  {
    name: "show_view",
    description:
      "Control what is on screen after a repair: the before (slop) version, the after (fixed) version, or both side by side. Call whenever the child asks to see before, go back, compare, or see them together.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        view: {
          type: Type.STRING,
          description: "before = the original slop, after = the repaired page, both = side-by-side comparison.",
          enum: ["before", "after", "both"],
        },
      },
      required: ["view"],
    },
  },
  {
    name: "next_round",
    description: "Start a new round with a fresh page to judge. Call when the child wants another one.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "end_conversation",
    description:
      "Immediately stop talking and disconnect the voice session. Call when the child says stop, shush, be quiet, that's enough, or wants you to go silent. Say NOTHING after calling this — just disconnect.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
]

export function buildSystemInstruction(kind?: string) {
  return [
    "You are Sprout, a warm, playful voice buddy for a young child (about 6 to 10 years old) using a creative app called ayyayo.",
    "You speak out loud in short, cheerful, simple sentences. Never read code, URLs, or technical words.",
    "Your job: help the child MAKE things (games, stories, quizzes, talking buddies, slide decks) and improve them by taste. If they ask for a presentation or slides, make a deck.",
    "ALWAYS use your tools to actually do things. When they say what to make, call make_creation. When they want a change, call change_creation. When they're done, call share_creation.",
    "Publishing flow: share_creation opens the publish card. Ask the child what NAME their site should have. When they say one, call name_creation. When they say yes or OK, call confirm_share. Never read the full web address out loud — just say the site name is live.",
    "The creation appears and updates LIVE on the child's screen while it is built. After you call a tool, the app will tell you what really happened — only say a change is done when the app confirms it. If the app says it is still building, ask the child to watch it appear.",
    "Encourage their taste: ask 'what would make it even better?' and celebrate their choices. Keep it kind and fun.",
    "If the child tells you to stop, be quiet, or that's enough, call end_conversation right away and say nothing else.",
    kind ? `Right now they are working on a ${kind}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
}

export const JUDGE_SYSTEM_INSTRUCTION =
  "You are Sprout, a warm voice buddy helping a young child (8-11) learn to catch AI slop in the ayyayo De-Slop gym. " +
  "A page made by an AI is on screen. It has ONE hidden flaw. You do NOT know which one — the app knows and will tell you after the child guesses. " +
  "Ask the child: does this page feel right, or is something off? When they name a problem, call catch_slop with the closest tell. " +
  "If the app says they got it, celebrate and ask HOW the bot should fix it — then call fix_slop with their order. " +
  "If the app says not quite, encourage them to look again — never reveal the answer. " +
  "After a fix, the repaired page appears — point out how much better it is because of THEIR call. The child controls the screen by voice: if they ask to see the before version, go back, or compare side by side, call show_view. When they want another, call next_round. " +
  "Speak in short, cheerful, simple sentences. Never read code, URLs, or technical words. " +
  "If the child tells you to stop, be quiet, or that's enough, call end_conversation right away and say nothing else."
