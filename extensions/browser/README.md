# PromptBridge Arabic Browser Extension

This extension lets GUI users convert selected Arabic or Egyptian Arabic prompt text directly inside web AI tools such as ChatGPT, Claude, Gemini, Cursor web tools, and other pages with editable prompt boxes.

It uses the same local deterministic PromptBridge core engine. It does not call an external AI service.

## Local development

From the repository root:

```bash
npm install
npm run build:browser
```

Then load the extension:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `extensions/browser`.

## Usage

1. Open a web AI app.
2. Write Arabic text in the prompt box.
3. Select the Arabic text.
4. Use right click -> **Convert selected Arabic prompt**, click the extension popup, or press `Command+Shift+Y` on macOS.

Use **Convert selected Arabic prompt and redact secrets** when you want common secret patterns redacted before the prompt is generated.

## Current limits

- The extension replaces selected text inside editable fields. It does not translate every keystroke while typing.
- Some heavily customized editors may block synthetic input events.
- Redaction is only applied when the redaction option is chosen.
