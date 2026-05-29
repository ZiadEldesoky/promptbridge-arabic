# PromptBridge Arabic

Arabic-first prompt translator and optimizer for AI coding agents.

PromptBridge Arabic lets Arabic-speaking developers write coding prompts in Arabic or Egyptian Arabic, then converts them into structured English prompts that work well with Codex, Claude Code, Cursor, Gemini CLI, and other AI developer tools.

The v0.1 MVP is intentionally local and deterministic:

- No API key required.
- No AI translation yet.
- No desktop app, browser extension, VS Code extension, or direct agent integration yet.
- CLI-first, clipboard-friendly, and built around a reusable TypeScript core.

## Install locally

```bash
npm install
npm run build
npm link
```

Then run:

```bash
promptbridge "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
```

For development without linking:

```bash
npm run dev -- "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
```

## CLI examples

```bash
promptbridge "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
```

```bash
promptbridge "شوف المشكلة دي وصلحها" --mode fix
```

```bash
promptbridge "راجع الكود وشوف فيه مشاكل security" --mode security --copy
```

```bash
promptbridge "اشرحلي الكود دا ببساطة" --mode explain --bilingual
```

```bash
promptbridge "استخدم sk-... في src/api.ts" --redact
```

## Options

```text
--mode <mode>   Choose one of: fix, refactor, review, tests, explain, security
--copy          Copy the generated prompt to the clipboard
--bilingual     Include an Arabic summary after the English prompt
--redact        Redact common secrets before generating the prompt
```

## Example output

Input:

```text
ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين
```

Output:

```text
Refactor this code to make it responsive.

Requirements:
- Make the affected UI responsive across common screen sizes.
- Preserve the existing behavior.
- Avoid changing public APIs unless necessary.
- Make the smallest safe changes.
- Explain what was changed and why.
- Preserve the existing visual design.

Constraints:
- Do not redesign the UI.

Expected output:
- A concise summary of what changed and what was verified.
```

## Architecture

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

The core flow is:

1. Optionally redact secrets.
2. Preserve technical tokens such as code blocks, file paths, commands, URLs, package names, stack traces, and environment variables.
3. Detect prompt intent and glossary signals.
4. Apply a deterministic mode template.
5. Format an agent-ready English prompt.
6. Optionally include a bilingual Arabic summary.
7. Optionally copy the result to the clipboard.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

## Current modes

- `fix`
- `refactor`
- `review`
- `tests`
- `explain`
- `security`

## Current limitations

- Translation is deterministic and template-based, so it does not deeply translate every Arabic sentence yet.
- The glossary is intentionally small in v0.1.
- There are no direct agent adapters yet.
- Config files and custom glossary loading are planned for the next version.

## Roadmap

Near-term improvements:

- Add config file support.
- Add custom glossary loading.
- Add `--agent` adapters for Codex, Cursor, Claude, and Gemini CLI.
- Add more Arabic dialect examples.
- Add interactive stdin mode.

## License

MIT
