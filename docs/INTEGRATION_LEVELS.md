# Integration Levels

PromptBridge Arabic has different integration levels depending on where the user writes prompts.

## Level 1: CLI command

```bash
promptbridge "ظبطلي الكود دا"
```

Useful, but the user must remember the `promptbridge` command.

## Level 2: Clipboard automation

```bash
promptbridge watch --redact
```

The user copies Arabic text, then PromptBridge replaces the clipboard with an English prompt.

## Level 3: Selected-text replacement

```bash
promptbridge replace-selection --redact
```

The user selects Arabic text, runs a shortcut, and PromptBridge replaces it in place.

## Level 4: CLI agent wrappers

After shell setup, the user can write Arabic directly in agent commands:

```bash
codex "ظبطلي الكود دا وخليه responsive"
```

The shell wrapper runs:

```bash
promptbridge run codex "ظبطلي الكود دا وخليه responsive"
```

PromptBridge converts Arabic arguments before executing the real agent command.

## Level 5: Browser GUI integration

```bash
npm run build:browser
```

The browser extension lets the user select Arabic text inside an editable web prompt box and replace it in place through a context menu, popup action, or keyboard shortcut. It can also convert the focused prompt box when no text is selected if that saved setting is enabled.

Normal users do not need to run the build command. They can load `extensions/browser` directly from the repository or download the release zip.

Useful for GUI-heavy AI workflows in ChatGPT, Claude, Gemini, Cursor web tools, and similar browser-based apps.

Current limits:

- It converts selected text, not every keystroke while typing.
- Redaction is only applied when the user chooses the redaction action.
- Some custom web editors may need adapter-specific handling later.

## Level 6: IDE extension

```bash
npm run release:vscode
```

PromptBridge includes a VS Code-compatible extension that can convert selected Arabic text inside an editor, copy converted prompt input to the clipboard, or insert converted prompt input into the active editor.

For custom IDE chat inputs such as Antigravity and Cursor prompt boxes on macOS, the extension also exposes focused selection replacement: the user selects Arabic text in the prompt box, presses `Cmd+Shift+Y`, and PromptBridge copies, converts, and pastes the English prompt back over the same selection.

Useful for VS Code and editors that support compatible VSIX extensions.

Current limits:

- Cursor and Antigravity can install the VSIX manually when their VS Code-compatible extension support is available.
- Focused input replacement is currently macOS-only because it uses system copy/paste shortcuts.
- The extension converts explicit selections or prompt input; it does not intercept every keystroke while typing.

## Level 7: macOS menu bar helper

```bash
npm run release:macos
```

PromptBridge includes an experimental native macOS menu bar helper. The user opens the helper, enables **Auto Replace Selected Arabic**, selects Arabic text in a prompt box, and PromptBridge tries to replace only that selected text with the generated English prompt.

Useful for GUI-heavy workflows where even a keyboard shortcut feels too slow.

Current limits:

- macOS-only.
- Requires Accessibility permission.
- Requires Node.js to be available in the user's login shell.
- Some apps do not expose selected text through Accessibility, so the helper falls back to copy/paste.
- Auto replacement is off by default because it can affect any selected Arabic text while enabled.

## Level 8: Direct app integrations and input methods

For true conversion while typing inside GUI apps, PromptBridge needs app-specific or OS-level integrations:

- macOS input method.
- Deeper IDE chat integrations where the editor exposes stable APIs.
- Native app integration.

This is the only route to conversion with no copy, paste, selection, or shortcut.
