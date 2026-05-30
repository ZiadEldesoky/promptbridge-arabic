# PromptBridge Arabic for VS Code-Compatible Editors

Convert Arabic or Egyptian Arabic coding prompts into structured English prompts inside VS Code-compatible editors.

This extension uses the same deterministic local core engine as the PromptBridge CLI and browser extension. It does not require an API key and does not call external AI services.

## Commands

- **PromptBridge: Convert Arabic Selection**
  Replaces the selected Arabic text in the active editor with an English coding-agent prompt.

- **PromptBridge: Convert Arabic Prompt to Clipboard**
  Opens an input box, converts the Arabic prompt, and copies the English prompt to the clipboard.

- **PromptBridge: Insert Converted Arabic Prompt**
  Opens an input box, converts the Arabic prompt, and inserts the result into the active editor.

## Settings

- `promptbridge.mode`: `auto`, `fix`, `refactor`, `review`, `tests`, `explain`, or `security`.
- `promptbridge.redact`: redact common secrets before prompt generation.
- `promptbridge.bilingual`: include an Arabic summary after the English prompt.

## Local install from VSIX

```bash
code --install-extension artifacts/promptbridge-arabic-vscode-v0.9.1.vsix
```

Cursor and other VS Code-compatible editors may also support installing a `.vsix` file manually. Support varies by editor and version.
