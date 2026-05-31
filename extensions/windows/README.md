# PromptBridge Arabic Windows Helper

Windows users can run selected-text replacement through the cross-platform CLI command:

```powershell
promptbridge replace-selection --redact --quiet
```

The command sends `Ctrl+C`, converts the selected Arabic text locally, writes the English prompt to the clipboard, then sends `Ctrl+V`.

## Optional AutoHotkey Shortcut

Install AutoHotkey v2, then bind a global shortcut with `promptbridge-replace-selection.ahk`.

Default shortcut:

```text
Ctrl+Alt+Y
```

Workflow:

1. Select Arabic text in any editable prompt box.
2. Press `Ctrl+Alt+Y`.
3. PromptBridge replaces the selected Arabic text with the English prompt.

## Requirements

- Node.js.
- PromptBridge installed or linked so `promptbridge` is available in `PATH`.
- Windows PowerShell input automation must be allowed for the focused app.

No external AI service is called.
