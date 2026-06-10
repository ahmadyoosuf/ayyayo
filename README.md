# ayyayo

**boss the bot.** · [ayyayo.ai](https://ayyayo.ai)

Voice-to-code for kids 8 to 11. They speak, the bot builds, they judge.

## What a kid does

1. **speak it** · "make me a game where a dragon eats tacos"
2. **watch it build** · the app paints itself on screen while they talk
3. **make it live** · "publish it" puts it at dragon-tacos.ayyayo.app
4. **boss the bot** · the de-slop gym: catch the AI's lazy writing, order the fix

## Under the hood

- **AWS** · every creation archived to S3; Kiro in the build pipeline
- **Vercel** · born in v0; hosting, functions, CLI, wildcard DNS
- **voice** · a speech-to-speech agent runs the whole app through tool calls
- **speed** · inference at 1000+ tokens per second, so it renders as you speak

## Run it

```bash
pnpm install
pnpm dev
```

Built at SuperAI NEXT Hackathon 2026, Singapore.
