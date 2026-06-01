# PromptBridge Arabic for VS Code-Compatible Editors

Convert Arabic or Egyptian Arabic coding prompts into structured English prompts inside VS Code-compatible editors.

This extension uses the same deterministic local core engine as the PromptBridge CLI and browser extension. It does not require an API key and does not call external AI services.

## Commands

- **PromptBridge: Convert Arabic Selection**
  Replaces the selected Arabic text in the active editor with an English coding-agent prompt.
  Shortcut: `Option+Y` on macOS or `Alt+Y` on Windows/Linux.
  The older `Cmd+Shift+Y` / `Ctrl+Shift+Y` shortcut still works as a fallback, and users can remap the shortcut from the editor's Keyboard Shortcuts if `Alt+Y` conflicts with their setup.
  You can also right-click selected text in the editor and choose **PromptBridge: Convert Arabic Selection**.

- **PromptBridge: Replace Selected Text in Focused Input**
  For IDE chat inputs and other focused text boxes that are not real editor documents, copies the selected Arabic text, converts it, and pastes the English prompt back over the selection.
  Shortcut: `Option+Y` on macOS or `Alt+Y` on Windows/Linux when focus is outside an editor document.
  The older `Cmd+Shift+Y` / `Ctrl+Shift+Y` shortcut still works as a fallback, and users can remap the shortcut from the editor's Keyboard Shortcuts if `Alt+Y` conflicts with their setup.

- **PromptBridge: Convert Arabic Prompt to Clipboard**
  Opens an input box, converts the Arabic prompt, and copies the English prompt to the clipboard.

- **PromptBridge: Insert Converted Arabic Prompt**
  Opens an input box, converts the Arabic prompt, and inserts the result into the active editor.

## Settings

- `promptbridge.mode`: `auto`, `general`, `fix`, `refactor`, `review`, `tests`, `explain`, or `security`.
- `promptbridge.redact`: redact common secrets before prompt generation.
- `promptbridge.bilingual`: include an Arabic summary after the English prompt.

## Local install from VSIX

```bash
code --install-extension artifacts/promptbridge-arabic-vscode-v0.12.1.vsix
```

Cursor and other VS Code-compatible editors may also support installing a `.vsix` file manually. Support varies by editor and version.

If the editor was already open during installation, run **Developer: Reload Window** once before using the shortcut.

## Current limits

The normal selection command works inside real editor documents. Some AI chat input boxes in VS Code-compatible editors are custom workbench UI, not normal editor documents. Use **PromptBridge: Replace Selected Text in Focused Input** for those inputs.

Focused input replacement is stable on macOS and experimental on Windows/Linux because it depends on platform input automation:

- macOS requires Accessibility permission for the editor.
- Windows uses PowerShell input automation.
- Linux requires `xdotool` on X11 or `wtype` on Wayland.
