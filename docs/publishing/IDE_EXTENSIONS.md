# Publishing IDE Extensions

PromptBridge Arabic now includes a VS Code-compatible extension under `extensions/vscode`.

The extension is designed for:

- Visual Studio Code.
- Cursor, when it supports manual VSIX installation or compatible extension APIs.
- Other VS Code-compatible editors through VSIX or Open VSX, depending on editor support.
- Antigravity should be verified manually because its current public docs do not clearly document VSIX marketplace compatibility.

## What is ready

- VS Code-compatible extension manifest: `extensions/vscode/package.json`.
- Extension source: `extensions/vscode/src/extension.ts`.
- PNG marketplace icon: `extensions/vscode/assets/icon.png`.
- Privacy policy: `docs/PRIVACY.md`.
- Bundled extension build:

```bash
npm run build:vscode
```

- VSIX packaging:

```bash
npm run release:vscode
```

The generated file is:

```text
artifacts/promptbridge-arabic-vscode-v<version>.vsix
```

## Pre-submit commands

Run these before publishing or uploading a VSIX:

```bash
npm test
npm run typecheck:vscode
npm run release:vscode
```

Check the VSIX contents:

```bash
unzip -l artifacts/promptbridge-arabic-vscode-v<version>.vsix
```

## Manual install from VSIX

```bash
code --install-extension artifacts/promptbridge-arabic-vscode-v<version>.vsix
```

Many VS Code-compatible editors also expose an "Install from VSIX" command in the Extensions view.

## Marketplace listing copy

### Display name

```text
PromptBridge Arabic
```

### Short description

```text
Convert Arabic or Egyptian Arabic coding prompts into structured English prompts inside VS Code-compatible editors.
```

### Categories

```text
Other
```

### Tags / keywords

```text
arabic, egyptian-arabic, prompt, prompt-engineering, coding-agent, developer-tools, ai
```

### Description

```text
PromptBridge Arabic helps Arabic-speaking developers use AI coding tools from inside their editor.

Write a coding prompt in Arabic or Egyptian Arabic, run a PromptBridge command, and get a structured English prompt designed for coding agents.

Features:
- Convert selected Arabic text in the active editor.
- Convert an Arabic prompt and copy the English output to the clipboard.
- Insert converted prompts into the active editor.
- Choose modes for fix, refactor, review, tests, explain, and security tasks.
- Optionally include bilingual output.
- Optionally redact common secret patterns.
- Preserve code blocks, inline code, file paths, commands, stack traces, package names, URLs, and environment variables.

PromptBridge Arabic runs locally, does not require an API key, and does not call external AI or translation services.
```

### Marketplace URLs

Use these public URLs in listing fields where accepted:

```text
Repository:
https://github.com/ZiadEldesoky/promptbridge-arabic

Homepage:
https://github.com/ZiadEldesoky/promptbridge-arabic#readme

Issues:
https://github.com/ZiadEldesoky/promptbridge-arabic/issues

Privacy policy:
https://github.com/ZiadEldesoky/promptbridge-arabic/blob/main/docs/PRIVACY.md
```

## VS Code Marketplace publishing

1. Create a publisher in the Visual Studio Marketplace.
2. Create an Azure DevOps Personal Access Token with Marketplace Manage scope.
3. Build and package:

```bash
npm run release:vscode
```

4. Publish:

```bash
cd extensions/vscode
vsce login ziadeldesoky
vsce publish --packagePath ../../artifacts/promptbridge-arabic-vscode-v<version>.vsix
```

If the Marketplace publisher ID is not `ziadeldesoky`, update `extensions/vscode/package.json` before publishing.

The VS Code publishing tool rejects unsafe marketplace media patterns such as user-provided SVG icons. PromptBridge uses a PNG icon and the extension README avoids marketplace-hosted SVG images.

## Open VSX publishing

Open VSX is useful for VS Code-compatible editors that use the Open VSX registry.

1. Create an Eclipse account.
2. Sign the Open VSX Publisher Agreement.
3. Create an Open VSX access token.
4. Create the namespace matching the `publisher` field:

```bash
npx ovsx create-namespace ziadeldesoky -p <token>
```

5. Publish the packaged VSIX:

```bash
npx ovsx publish artifacts/promptbridge-arabic-vscode-v<version>.vsix -p <token>
```

## Cursor and other VS Code-compatible editors

Use the generated VSIX first:

```bash
code --install-extension artifacts/promptbridge-arabic-vscode-v<version>.vsix
```

For Cursor or other VS Code-compatible editors, use the editor's "Install from VSIX" command when available. Marketplace support varies by editor and version, so verify the installed commands manually before announcing official support.

## Antigravity note

Treat Antigravity as compatibility testing for now. Publish the VSIX to general VS Code channels first, then test whether Antigravity supports manual VSIX installation or marketplace ingestion before claiming support in public copy.

## Official references

- VS Code publishing: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Open VSX publishing: https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions
