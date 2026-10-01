# ayyayo

Voice-to-code for kids. They speak, software appears, they refine it, it ships to a real URL.

## Stack

- **Supabase** — auth, database, storage
- **Vercel** — hosting, functions, wildcard DNS (`*.ayyayo.app`)
- **Gemini Live on Vertex AI** — native speech-to-speech voice (`gemini-3.8-live`), relayed through `/api/live`
- **Cerebras** — fast HTML codegen (`gpt-oss-120b`)
- **Azure Foundry / Fireworks** — in-app buddy replies (`gpt-oss-120b`)

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev
```

Create a Supabase Storage bucket named `artifacts` (private). The save route archives published HTML there best-effort.

## Environment variables

See `.env.example`.
