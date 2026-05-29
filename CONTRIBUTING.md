# Contributing

Thanks for considering a contribution to PromptBridge Arabic.

## Project scope

PromptBridge Arabic is an Arabic-first developer tool. It converts Arabic or Egyptian Arabic coding prompts into structured English prompts for AI coding agents.

The current scope is:

- CLI and clipboard workflows.
- Deterministic prompt rewriting.
- Arabic/Egyptian Arabic glossary expansion.
- Token preservation and redaction reliability.
- Config and custom glossary support.

Do not add desktop apps, browser extensions, VS Code extensions, or direct agent integrations before the reusable core remains stable.

## Local setup

```bash
npm install
npm test
npm run typecheck
npm run build
```

## Good first contributions

- Add Egyptian Arabic glossary terms.
- Add Gulf, Levantine, or Moroccan Arabic examples.
- Add tests for preserving real stack traces.
- Improve redaction patterns.
- Improve README examples for specific stacks such as React, Next.js, Node.js, Python, and Flutter.

## Pull request checklist

- Keep changes focused.
- Add or update tests for behavior changes.
- Keep deterministic rewriting local-only unless a future design explicitly adds AI translation.
- Run `npm test`, `npm run typecheck`, and `npm run build`.
- Update README or examples when CLI behavior changes.
