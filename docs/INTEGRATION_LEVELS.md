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

## Level 5: Direct app integrations

For true conversion while typing inside GUI apps, PromptBridge needs app-specific or OS-level integrations:

- macOS input method.
- Browser extension.
- VS Code/Cursor extension.
- Native app integration.

This is the only route to conversion with no copy, paste, selection, or shortcut.
