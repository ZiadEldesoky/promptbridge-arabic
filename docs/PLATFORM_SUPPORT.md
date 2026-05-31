# Platform Support

PromptBridge Arabic is built around a reusable TypeScript core, so the translation and prompt-rewriting engine is not tied to one AI app or operating system.

The user experience differs by platform because selected-text replacement outside the browser or editor requires OS-specific input and accessibility APIs.

## Current Support

| Workflow | macOS | Windows | Linux | Notes |
| --- | --- | --- | --- | --- |
| CLI | Supported | Supported | Supported | Runs anywhere Node.js is available. |
| Clipboard watch | Supported | Supported | Supported | Uses the system clipboard through Node.js. |
| Browser extension | Supported | Supported | Supported | Works in Chrome-based browsers with editable prompt boxes. |
| VS Code-compatible editor selection | Supported | Supported | Supported | Replaces selected text inside normal editor documents. |
| VS Code-compatible focused chat input replacement | Supported | Planned | Planned | The current implementation uses macOS copy/paste automation for custom IDE prompt boxes. |
| Raycast helper | Supported | Not applicable | Not applicable | Raycast is macOS-only. |
| Native menu bar / tray helper | Experimental | Planned | Planned | The current helper is a macOS AppKit menu bar app. |

## Why the menu bar app is macOS-only

The current menu bar helper uses:

- AppKit for the top-bar icon and menu.
- macOS Accessibility APIs to observe selected text when apps expose it.
- macOS copy/paste events as a local fallback for apps that do not expose selected text directly.

Windows and Linux do not expose the same APIs. A cross-platform "select Arabic text and it instantly becomes English" workflow needs native implementations for each OS.

## What already works for everyone

Developers on macOS, Windows, and Linux can use:

- `promptbridge "<arabic prompt>"`.
- `promptbridge watch`.
- The browser extension in Chrome-based browsers.
- The VS Code-compatible extension inside normal editor documents.

That means the project is already useful to non-macOS users, but the low-friction native selected-text replacement experience is currently strongest on macOS.

## Best next path

The next cross-platform milestone should be a native tray/helper layer with shared conversion logic:

- Keep the TypeScript core as the source of truth.
- Keep browser and VS Code extensions lightweight.
- Add Windows selected-text replacement using a native helper or PowerShell-accessible input automation.
- Add Linux selected-text replacement using desktop-environment-aware helpers where possible.
- Consider a Tauri or Electron shell only if it can preserve a small install size and avoid requiring external AI services.

The goal is the same on every OS: select Arabic text, trigger or enable PromptBridge, and replace only the selected text with a useful English prompt.
