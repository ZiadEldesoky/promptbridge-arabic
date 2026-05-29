# AGENTS.md

PromptBridge Arabic is a TypeScript Node.js CLI project.

## Project intent

Build a reusable core engine that converts Arabic or Egyptian Arabic coding prompts into structured English prompts for AI coding agents.

The project should work with any coding agent. Do not add direct Codex, VS Code, browser extension, desktop app, or Raycast integration to v0.1.

## v0.1 constraints

- Do not require an API key.
- Do not call external AI services.
- Use deterministic template-based rewriting.
- Preserve code blocks, inline code, file paths, commands, stack traces, package names, URLs, and environment variables.
- Redact secrets only when the caller enables redaction.
- Config files may set defaults, but explicit CLI flags should override config.
- Custom glossary entries should be merged into the built-in Egyptian Arabic glossary.
- Keep the architecture modular so future integrations can reuse the translator core.

## Useful commands

```bash
npm test
npm run typecheck
npm run build
npm run dev -- "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
```

## Source of truth

Use `docs/PROMPTBRIDGE_ARABIC_PROJECT_SPEC.md` as the product spec for the MVP when it exists. In early local scaffolds, the same spec may also exist at the repository root.
