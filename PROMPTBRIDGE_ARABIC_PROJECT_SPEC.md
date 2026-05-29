# PromptBridge Arabic

**Arabic-first prompt translator and optimizer for AI coding agents.**

PromptBridge Arabic helps Arabic-speaking developers write naturally in Arabic or Egyptian Arabic, then converts their input into clear, structured English prompts optimized for coding agents such as Codex, Claude Code, Cursor, Gemini CLI, and other AI developer tools.

The goal is not literal translation. The goal is to preserve the developer’s intent, technical context, code references, and constraints, then rewrite the prompt in a format that AI coding agents understand and execute more reliably.

---

## Why this project exists

Many Arab developers think and explain problems naturally in Arabic, especially when describing bugs, product behavior, UI issues, or development goals.

However, most AI coding agents respond better to precise, structured English prompts. This creates friction:

- The developer has to manually translate their thoughts.
- Technical meaning can be lost during translation.
- Arabic slang and coding context may be misunderstood.
- File names, commands, stack traces, and code snippets may be accidentally translated.
- The final prompt often lacks structure, constraints, and expected output.

PromptBridge Arabic solves this by turning Arabic developer intent into high-quality English coding prompts.

---

## Example

### Input

```text
الكود دا بيعمل build error ومش فاهم السبب. شوف المشكلة وصلحها بس متغيرش شكل الديزاين، ولو محتاج تعدل خلي التعديل بسيط وآمن.
```

### Output

```text
Investigate and fix the build error in this project.

Requirements:
- Identify the root cause before making changes.
- Keep the existing UI and design unchanged.
- Make the smallest safe code changes needed to fix the issue.
- Preserve the current public API unless a change is necessary.
- Run the relevant build or test command after applying the fix.
- Summarize what caused the problem and what was changed.
```

---

## Core idea

PromptBridge Arabic acts as a bridge between Arabic developer language and English AI-agent instructions.

It supports three main workflows:

1. Translate Arabic prompt to English.
2. Optimize the translated prompt for coding agents.
3. Optionally translate the agent’s response back to Arabic.

The project should support both simple clipboard usage and deeper integration with AI coding workflows.

---

## Target users

- Arabic-speaking software developers.
- Egyptian Arabic-speaking developers.
- Students learning programming with AI agents.
- Open-source maintainers who prefer explaining issues in Arabic.
- Developers using Codex, Cursor, Claude Code, Gemini CLI, or similar tools.
- Teams that want bilingual AI coding workflows.

---

## Product goals

### Primary goal

Make Arabic prompts work better with AI coding agents.

### Secondary goals

- Reduce friction for Arabic-speaking developers.
- Preserve technical accuracy during translation.
- Improve agent reliability through structured prompt rewriting.
- Support privacy-safe prompt handling.
- Provide reusable workflows for Codex and other agents.
- Become a useful open-source developer tool for the Arabic AI coding community.

---

## Non-goals

PromptBridge Arabic is not intended to be:

- A general-purpose translation app.
- A chatbot.
- A replacement for Codex or other coding agents.
- A full IDE.
- A code execution engine.
- A tool that sends sensitive data without user control.

---

## Key principles

### 1. Intent over literal translation

The tool should understand what the developer means, not just translate word-by-word.

Example:

```text
ظبط الكومبوننت دا
```

Should not become:

```text
Adjust this component.
```

A better output is:

```text
Refactor and improve this component while preserving its existing behavior and visual design.
```

---

### 2. Preserve technical tokens

The tool must not translate or damage:

- File names.
- Folder paths.
- Function names.
- Class names.
- Variable names.
- Terminal commands.
- Error messages.
- Stack traces.
- Package names.
- Environment variables.
- API names.
- Code snippets.
- URLs.
- JSON/YAML/TOML content.

---

### 3. Structure the prompt

The output should usually be structured into sections such as:

- Task.
- Context.
- Requirements.
- Constraints.
- Steps.
- Expected output.

---

### 4. Keep the user in control

The tool should not automatically execute dangerous actions. It should generate or pass prompts safely.

---

### 5. Support bilingual workflows

The developer should be able to choose:

- Arabic input → English output.
- Arabic input → English optimized prompt → Arabic explanation.
- English agent response → Arabic summary.
- Bilingual response format.

---

## MVP features

### Version 0.1

The first version should be a CLI tool.

Example:

```bash
promptbridge "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
```

Output:

```text
Refactor this code to make it responsive.

Requirements:
- Preserve the existing visual design.
- Avoid changing the public API unless necessary.
- Make the smallest safe changes.
- Explain what was changed and why.
```

---

## CLI interface

### Basic usage

```bash
promptbridge "<arabic prompt>"
```

### Copy output to clipboard

```bash
promptbridge "<arabic prompt>" --copy
```

### Choose task mode

```bash
promptbridge "<arabic prompt>" --mode fix
promptbridge "<arabic prompt>" --mode refactor
promptbridge "<arabic prompt>" --mode review
promptbridge "<arabic prompt>" --mode tests
promptbridge "<arabic prompt>" --mode explain
promptbridge "<arabic prompt>" --mode security
```

### Bilingual output

```bash
promptbridge "<arabic prompt>" --bilingual
```

### Privacy-safe mode

```bash
promptbridge "<arabic prompt>" --redact
```

### Agent-ready output

```bash
promptbridge "<arabic prompt>" --agent codex
promptbridge "<arabic prompt>" --agent cursor
promptbridge "<arabic prompt>" --agent claude
```

---

## Prompt modes

### fix

For bug fixing.

Input:

```text
في bug لما بدوس save الصفحة بتعمل reload ومش بتحفظ
```

Output style:

```text
Investigate and fix the bug where clicking Save reloads the page and does not persist the data.

Requirements:
- Reproduce or identify the likely cause.
- Prevent the unwanted page reload.
- Ensure the save action persists data correctly.
- Keep the existing UI unchanged.
- Add or update tests if appropriate.
- Explain the root cause and the fix.
```

---

### refactor

For improving code structure without changing behavior.

```text
Refactor this code to improve readability and maintainability.

Requirements:
- Preserve the existing behavior.
- Avoid unnecessary architectural changes.
- Keep public APIs stable.
- Reduce duplication where appropriate.
- Explain the main refactoring decisions.
```

---

### review

For code review.

```text
Review this code and provide actionable feedback.

Focus on:
- Correctness.
- Edge cases.
- Maintainability.
- Performance.
- Security risks.
- Missing tests.

Do not modify the code yet. First provide findings with severity and suggested fixes.
```

---

### tests

For test generation.

```text
Add or improve tests for this feature.

Requirements:
- Cover the main success path.
- Cover important edge cases.
- Avoid brittle tests.
- Follow the existing test style in the project.
- Run the relevant test command if available.
```

---

### explain

For explanation and learning.

```text
Explain how this code works.

Requirements:
- Use simple language.
- Explain the main flow step by step.
- Identify the most important functions and files.
- Mention any confusing or risky parts.
- Provide a short summary at the end.
```

---

### security

For security review.

```text
Review this code for potential security issues.

Focus on:
- Input validation.
- Authentication and authorization.
- Secrets exposure.
- Unsafe shell commands.
- Dependency risks.
- Injection vulnerabilities.
- Data leakage.

Do not make changes yet. Provide findings with severity and recommended fixes.
```

---

## Translation rules

The translation engine should follow these rules:

1. Preserve code blocks exactly.
2. Preserve inline code exactly.
3. Preserve file paths exactly.
4. Preserve error messages exactly unless the user explicitly asks to translate them.
5. Preserve commands exactly.
6. Preserve package names exactly.
7. Preserve variable and function names exactly.
8. Convert vague Arabic instructions into clear engineering requirements.
9. Expand implied constraints when they are obvious.
10. Do not invent project context that the user did not provide.
11. When uncertain, keep the prompt general rather than adding false details.
12. Prefer concise, agent-friendly English.
13. Preserve urgency and priority if expressed by the user.
14. Keep Arabic comments or UI text unchanged if the user is working on Arabic localization.

---

## Egyptian Arabic glossary examples

```json
{
  "ظبط": "fix, improve, or refactor depending on context",
  "شوف المشكلة": "investigate the issue",
  "متبوظش الديزاين": "preserve the existing design",
  "خليها responsive": "make it responsive",
  "بيكراش": "crashes",
  "مش راضي يشتغل": "does not work",
  "بيطلع error": "throws an error",
  "شغال عندي": "works on my machine",
  "نضف الكود": "clean up the code",
  "من غير ما تغير اللوجيك": "without changing the business logic",
  "خلي التعديل بسيط": "make the smallest safe change"
}
```

---

## Privacy and safety

PromptBridge Arabic should include privacy protections.

### Redaction targets

The tool should detect and optionally redact:

- API keys.
- Access tokens.
- Passwords.
- Emails.
- Phone numbers.
- Database URLs.
- `.env` values.
- Private keys.
- Bearer tokens.
- GitHub tokens.
- Stripe keys.
- OpenAI API keys.

### Example

Before:

```text
استخدم المفتاح دا sk-xxxxxxxx وخليني أجرب
```

After:

```text
Use the provided API key [REDACTED_SECRET] for testing.
```

---

## Configuration

The tool should support a config file:

```json
{
  "defaultMode": "fix",
  "defaultOutput": "english",
  "preserveArabicUIText": true,
  "redactSecrets": true,
  "agent": "codex",
  "style": "structured",
  "glossaryPath": "./promptbridge.glossary.json"
}
```

Possible locations:

```text
.promptbridge.json
promptbridge.config.json
~/.promptbridge/config.json
```

---

## Suggested project structure

```text
promptbridge-arabic/
  README.md
  LICENSE
  package.json
  src/
    cli.ts
    index.ts
    translator/
      translatePrompt.ts
      systemPrompt.ts
      modes.ts
      glossary.ts
    redaction/
      redactSecrets.ts
      patterns.ts
    formatting/
      formatOutput.ts
    clipboard/
      copyToClipboard.ts
    agents/
      codex.ts
      cursor.ts
      claude.ts
    config/
      loadConfig.ts
  examples/
    fix.md
    refactor.md
    review.md
    tests.md
    security.md
  skills/
    arabic-prompt-bridge/
      SKILL.md
  tests/
    translatePrompt.test.ts
    redactSecrets.test.ts
    glossary.test.ts
```

---

## Codex Skill concept

The project can include a Codex Skill called:

```text
arabic-prompt-bridge
```

Purpose:

```text
Use this skill when the user writes Arabic or Egyptian Arabic while asking for coding help. Convert the user’s request into a precise English coding-agent prompt internally, preserve technical tokens, then respond in the user’s preferred language.
```

The skill should help Codex:

- Understand Arabic developer intent.
- Preserve technical details.
- Avoid mistranslating code or errors.
- Ask fewer unnecessary clarification questions.
- Return Arabic summaries when useful.

---

## Agent output format

When `--bilingual` is enabled, the output can be:

```text
## English prompt

Investigate and fix the build error in this project.

Requirements:
- Identify the root cause.
- Keep the existing UI unchanged.
- Make the smallest safe code changes.
- Run the build command after the fix.

## Arabic summary

المطلوب هو فحص سبب خطأ الـ build، إصلاحه بأقل تعديل ممكن، الحفاظ على شكل الواجهة، وتشغيل أمر البناء بعد الإصلاح.
```

---

## Open-source positioning

PromptBridge Arabic is an open-source tool for Arabic-speaking developers using AI coding agents.

It focuses on:

- Developer productivity.
- Accessibility for Arabic speakers.
- Better AI-agent prompting.
- Bilingual coding workflows.
- Safe handling of technical prompts.

---

## Possible integrations

### CLI

The first and most important integration.

### Clipboard helper

Useful for quick workflows with any coding agent.

### Codex Skill

Useful for reusable Codex workflows.

### VS Code extension

Allows developers to select Arabic text and convert it into an English prompt.

### Raycast extension

Useful for macOS users who want global shortcut translation.

### Browser extension

Useful for web-based AI coding tools.

### GitHub Action

Can translate Arabic GitHub issues into structured English issue summaries.

---

## Roadmap

### v0.1 — CLI MVP

- Accept Arabic prompt from command line.
- Convert it to structured English.
- Support `--copy`.
- Support basic modes: fix, refactor, review, tests, explain.
- Add README examples.
- Add tests for redaction and prompt formatting.

### v0.2 — Privacy and glossary

- Add secret redaction.
- Add custom glossary.
- Add config file support.
- Add Egyptian Arabic examples.
- Add bilingual output.

### v0.3 — Codex integration

- Add Codex Skill.
- Add `--agent codex`.
- Add prompt templates optimized for Codex workflows.
- Add examples for fixing, reviewing, and testing code with Codex.

### v0.4 — Developer experience

- Add interactive mode.
- Add history.
- Add better terminal formatting.
- Add package publishing.
- Add installation docs.

### v1.0 — Stable release

- Stable CLI API.
- Strong test coverage.
- Public documentation.
- Examples for real projects.
- Contribution guide.
- Security policy.
- Community feedback.

---

## Success metrics

The project is successful if it helps developers:

- Write Arabic prompts naturally.
- Get better English prompts for coding agents.
- Preserve technical meaning.
- Reduce failed agent tasks.
- Use Codex and similar agents more effectively.
- Contribute to open-source projects with less language friction.

Potential measurable indicators:

- GitHub stars.
- Issues from real users.
- Pull requests from contributors.
- Downloads.
- Usage demos.
- Before/after prompt examples.
- Community feedback from Arabic-speaking developers.

---

## Contribution ideas

Good first issues:

- Add more Egyptian Arabic glossary terms.
- Add Gulf Arabic examples.
- Add Levantine Arabic examples.
- Add more prompt modes.
- Improve secret redaction patterns.
- Add tests for preserving code blocks.
- Add examples for React, Next.js, Node.js, Python, and Flutter.
- Add Codex Skill documentation.
- Add VS Code extension prototype.

---

## License

MIT License is recommended for maximum adoption.

---

# Codex Implementation Plan

## Project

Build `promptbridge-arabic`, a TypeScript CLI tool that converts Arabic or Egyptian Arabic developer prompts into structured English prompts optimized for AI coding agents.

## Milestone 1: CLI MVP

Create a Node.js/TypeScript CLI package with the following behavior:

```bash
promptbridge "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
```

Expected output:

```text
Refactor this code to make it responsive.

Requirements:
- Preserve the existing visual design.
- Avoid changing the public API unless necessary.
- Make the smallest safe changes.
- Explain what was changed and why.
```

## Required features

1. Initialize a TypeScript CLI project.
2. Add a CLI entry point named `promptbridge`.
3. Accept a prompt as a command-line argument.
4. Support these flags:
   - `--mode fix`
   - `--mode refactor`
   - `--mode review`
   - `--mode tests`
   - `--mode explain`
   - `--mode security`
   - `--copy`
   - `--bilingual`
   - `--redact`
5. Implement static prompt templates for each mode.
6. Implement basic Arabic/Egyptian Arabic phrase normalization.
7. Preserve technical tokens:
   - code blocks
   - inline code
   - file paths
   - commands
   - stack traces
   - package names
   - environment variables
8. Implement secret redaction for common patterns:
   - API keys
   - Bearer tokens
   - `.env` values
   - private keys
   - database URLs
9. Add tests for:
   - prompt formatting
   - mode selection
   - secret redaction
   - preserving code blocks
   - preserving file paths and commands
10. Add README examples.

## Suggested stack

- TypeScript
- Node.js
- `commander` for CLI parsing
- `clipboardy` for clipboard support
- `vitest` for tests
- `tsx` for local development
- `eslint` and `prettier` for formatting

## Suggested files

```text
src/
  cli.ts
  index.ts
  translator/
    translatePrompt.ts
    modes.ts
    glossary.ts
    preserveTechnicalTokens.ts
  redaction/
    redactSecrets.ts
    patterns.ts
  formatting/
    formatOutput.ts
  clipboard/
    copyToClipboard.ts
tests/
  translatePrompt.test.ts
  redactSecrets.test.ts
  preserveTechnicalTokens.test.ts
```

## Important implementation rules

- Do not overbuild the first version.
- Do not require an API key in v0.1.
- Start with deterministic template-based rewriting.
- Keep the architecture ready for adding AI-based translation later.
- Make sure the CLI works locally before adding integrations.
- Prioritize useful examples and documentation.

## First task for Codex

Implement the v0.1 CLI MVP for `promptbridge-arabic`.

Start by creating the project structure, package scripts, TypeScript config, CLI parser, mode templates, redaction utilities, and tests. Keep the implementation simple, readable, and easy to extend.

---

## Suggested first Codex prompt

Use this prompt inside Codex when starting the repository:

```text
Implement the v0.1 CLI MVP for promptbridge-arabic.

Build a TypeScript Node.js CLI tool that converts Arabic or Egyptian Arabic developer prompts into structured English prompts optimized for AI coding agents.

Requirements:
- Use commander for CLI parsing.
- Add a binary command named promptbridge.
- Accept the Arabic prompt as a command-line argument.
- Support flags: --mode, --copy, --bilingual, --redact.
- Support modes: fix, refactor, review, tests, explain, security.
- Implement deterministic template-based rewriting first. Do not require an API key.
- Add a glossary for common Egyptian Arabic developer phrases.
- Preserve code blocks, inline code, file paths, commands, package names, environment variables, stack traces, and URLs.
- Add redaction utilities for common secrets and tokens.
- Add tests with vitest.
- Add README usage examples.
- Keep the implementation simple, readable, and extensible.
```
