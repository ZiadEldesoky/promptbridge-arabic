# PromptBridge Arabic Browser Extension

This extension lets GUI users convert Arabic or Egyptian Arabic prompt text directly inside web AI tools such as ChatGPT, Claude, Gemini, Cursor web tools, and other pages with editable prompt boxes.

It uses the same local deterministic PromptBridge core engine. It does not call an external AI service.

The conversion script is injected into the active tab only after a user action, such as the popup, context menu, or keyboard shortcut.

## Use without building

For normal users, no build is required.

### From GitHub Releases

1. Download `promptbridge-arabic-browser-extension-v*.zip`.
2. Unzip it.
3. Open `chrome://extensions`.
4. Enable Developer mode.
5. Choose **Load unpacked** and select the unzipped folder.

### From the repository

If you cloned or downloaded the repository, load this folder directly from `chrome://extensions`:

```text
extensions/browser
```

## Local development

From the repository root:

```bash
npm install
npm run build:browser
```

To create a release-ready zip:

```bash
npm run release:browser
```

To load the local extension:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `extensions/browser`.

## Usage

1. Open a web AI app.
2. Write Arabic text in the prompt box.
3. Select the Arabic text, or leave the prompt box focused if focused-field fallback is enabled.
4. Use right click -> **Convert Arabic prompt with saved settings**, click the extension popup, or press `Command+Shift+Y` on macOS.

Use **Convert selected Arabic prompt and redact secrets** when you want common secret patterns redacted before the prompt is generated.

## Saved settings

The popup saves these browser-local defaults:

- Prompt mode, including the `general` fallback for friendly or business/product text.
- Redact common secrets.
- Include Arabic summary.
- Convert the focused prompt box when nothing is selected.

The context menu and keyboard shortcut use the same saved defaults.

## Site adapters

The extension includes prompt-box selectors for:

- ChatGPT.
- Claude.
- Gemini.
- Cursor web tools.
- Generic textareas, inputs, contenteditable fields, Lexical editors, and ProseMirror editors.

## Current limits

- The extension replaces selected text or the focused editable prompt field. It does not translate every keystroke while typing.
- Some heavily customized editors may block synthetic input events.
- Redaction is only applied when the redaction option is chosen.
