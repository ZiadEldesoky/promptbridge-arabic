# PromptBridge Arabic Raycast Helper

This helper gives GUI users a one-command selected-text workflow on macOS:

1. Select Arabic prompt text in any app.
2. Run the Raycast script command.
3. PromptBridge copies the selection, converts it through the local core engine, and pastes the English prompt back into the active app.

## Setup

1. Install and link PromptBridge:

```bash
npm install
npm run build
npm link
```

2. Add this folder to Raycast Script Commands:

```text
extensions/raycast
```

3. Give Raycast Accessibility permission in macOS System Settings.

## Notes

- The script uses `promptbridge replace-selection --redact --quiet`.
- Redaction is enabled here because selected GUI text may include copied tokens or environment values.
- This does not require an API key and does not call external AI services.
