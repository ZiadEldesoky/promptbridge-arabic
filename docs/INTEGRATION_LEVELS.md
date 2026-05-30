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

Useful for VS Code and editors that support compatible VSIX extensions.

Current limits:

- Cursor and other VS Code-compatible editors need manual VSIX testing.
- Antigravity compatibility should be verified manually because public docs do not clearly document VSIX support.
- The extension converts explicit selections or prompt input; it does not intercept every IDE chat box yet.

## Level 7: Direct app integrations and input methods

For true conversion while typing inside GUI apps, PromptBridge needs app-specific or OS-level integrations:

- macOS input method.
- Deeper IDE chat integrations where the editor exposes stable APIs.
- Native app integration.

This is the only route to conversion with no copy, paste, selection, or shortcut.
