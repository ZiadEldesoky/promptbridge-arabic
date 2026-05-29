# OpenAI OSS Submission Draft

Use this as a draft when applying for OpenAI's Codex for OSS program.

## Repository

https://github.com/ZiadEldesoky/promptbridge-arabic

## Project summary

PromptBridge Arabic is an open-source TypeScript CLI that helps Arabic-speaking developers write coding prompts naturally in Arabic or Egyptian Arabic, then converts them into structured English prompts optimized for AI coding agents.

It is agent-agnostic and works through CLI and clipboard workflows, so developers can use it with Codex, Cursor, Claude Code, Gemini CLI, ChatGPT, and other coding tools.

## Why this repository qualifies

PromptBridge Arabic improves accessibility for Arabic-speaking developers using AI coding agents. It addresses a real language friction: developers can explain bugs, UI constraints, code review needs, security concerns, and testing requests naturally in Arabic while still giving coding agents precise structured English prompts.

The project is local-first, does not require API keys, avoids external AI calls in the MVP, preserves technical tokens, supports redaction, includes tests, and is designed as a reusable core for future integrations.

## How Codex/API credits would be used

Credits would be used to improve the OSS maintenance workflow:

- Review pull requests and issues.
- Expand tests for Arabic dialect prompts.
- Improve redaction and token-preservation coverage.
- Build future agent adapters while keeping the core agent-agnostic.
- Improve examples for real-world stacks such as React, Next.js, Node.js, Python, and Flutter.

## Current status

- CLI MVP implemented.
- Config and custom glossary support implemented.
- MIT license.
- CI workflow.
- Contribution and security docs.
- v0.2.0 release tag.

## Remaining limitations

- Deterministic rewriting does not deeply translate arbitrary Arabic yet.
- Glossary coverage is intentionally small.
- No direct agent adapters yet.
- npm package publishing is still pending.
