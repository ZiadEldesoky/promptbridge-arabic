# PromptBridge Arabic Linux Helper

Linux users can run selected-text replacement through the cross-platform CLI command:

```bash
promptbridge replace-selection --redact --quiet
```

The command sends `Ctrl+C`, converts the selected Arabic text locally, writes the English prompt to the clipboard, then sends `Ctrl+V`.

## Requirements

- Node.js.
- PromptBridge installed or linked so `promptbridge` is available in `PATH`.
- One keyboard automation tool:
  - `xdotool` for X11 sessions.
  - `wtype` for Wayland sessions that support virtual keyboard input.

Clipboard support is handled by `clipboardy`, which may require desktop clipboard tools depending on your distribution.

## Global Shortcut

Bind `promptbridge-replace-selection.sh` to a desktop shortcut such as `Ctrl+Alt+Y` using your desktop environment keyboard settings.

Workflow:

1. Select Arabic text in any editable prompt box.
2. Press the shortcut you configured.
3. PromptBridge replaces the selected Arabic text with the English prompt.

No external AI service is called.
