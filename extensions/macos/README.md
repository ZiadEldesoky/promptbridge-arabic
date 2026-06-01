# PromptBridge Arabic macOS Menu Bar Helper

Experimental macOS menu bar helper for selected Arabic prompt replacement.

## What it does

- Adds a PromptBridge text-bubble icon to the macOS menu bar.
- Lets the user enable **Auto Replace Selected Arabic**.
- Watches for selection changes from mouse or keyboard events.
- Converts only the currently selected Arabic text.
- Replaces the selection with the generated English coding-agent prompt.
- Includes **Check for Updates**, which opens or checks GitHub Releases only when the user clicks it.

## Requirements

- macOS 13 or later.
- Accessibility permission for the app.
- Node.js available in the user's login shell.

For local development:

```bash
npm install
npm run build
```

## Build Locally

```bash
npm run release:macos
```

The packaged app zip is written to `artifacts/PromptBridgeArabicMenuBar-v<version>-macos.zip`.
The built app bundle is written to `artifacts/PromptBridgeArabicMenuBar.app`.

For the most stable Accessibility permission, copy the built app to `/Applications/PromptBridgeArabicMenuBar.app` and keep that same app name between releases.

## Current Limits

- This is experimental and macOS-only.
- Some apps do not expose selected text through Accessibility, so the helper falls back to copy/paste.
- Auto replacement is intentionally off by default because it can affect any selected Arabic text while enabled.
- It does not call external AI services; conversion uses a bundled deterministic PromptBridge converter built from the TypeScript core.
- The update checker contacts GitHub Releases only when the user chooses **Check for Updates**.
