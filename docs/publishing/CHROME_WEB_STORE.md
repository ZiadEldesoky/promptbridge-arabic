# Publishing to the Chrome Web Store

PromptBridge Arabic can be published to the Chrome Web Store so users can install it directly from Chrome.

## What is ready

- Manifest V3 browser extension under `extensions/browser`.
- Built extension bundle under `extensions/browser/dist`.
- PNG extension icons under `extensions/browser/icons`.
- Privacy policy at `docs/PRIVACY.md`.
- Neutral screenshots under `docs/assets/screenshots/png`.
- Release-ready zip generated with:

```bash
npm run release:browser
```

The generated file is:

```text
artifacts/promptbridge-arabic-browser-extension-v<version>.zip
```

## Pre-submit commands

Run these before uploading a new package:

```bash
npm test
npm run typecheck:browser
npm run release:browser
```

Check the zip contents:

```bash
unzip -l artifacts/promptbridge-arabic-browser-extension-v<version>.zip
```

## Manual publishing flow

1. Register a Chrome Web Store developer account.
2. Run:

```bash
npm run release:browser
```

3. Open the Chrome Developer Dashboard.
4. Add a new item.
5. Upload the generated zip.
6. Fill the store listing, privacy, distribution, and test instructions fields.
7. Submit the item for review.

## Store listing copy

### Name

```text
PromptBridge Arabic
```

### Short description

```text
Convert Arabic developer prompts into structured English prompts for AI coding tools, locally.
```

### Category

```text
Developer Tools
```

### Detailed description

```text
PromptBridge Arabic helps Arabic-speaking developers write coding prompts naturally in Arabic or Egyptian Arabic, then convert them into structured English prompts for AI coding tools.

It is designed for developers using ChatGPT, Codex, Cursor, Claude, Gemini, and other coding assistants through the browser.

Current features:
- Convert selected Arabic or Egyptian Arabic prompt text.
- Replace the selected prompt directly in editable web prompt boxes.
- Choose task modes such as fix, refactor, review, tests, explain, and security.
- Optionally include bilingual output.
- Optionally redact common secret patterns before conversion.
- Preserve code blocks, inline code, file paths, commands, stack traces, package names, URLs, and environment variables.

PromptBridge Arabic runs locally in the extension bundle. It does not require an API key and does not call external AI, translation, analytics, or tracking services.
```

### Single purpose

```text
PromptBridge Arabic converts Arabic or Egyptian Arabic developer prompt text into structured English prompts for AI coding tools.
```

### Support and public URLs

```text
Homepage:
https://github.com/ZiadEldesoky/promptbridge-arabic

Support:
https://github.com/ZiadEldesoky/promptbridge-arabic/issues

Privacy policy:
https://github.com/ZiadEldesoky/promptbridge-arabic/blob/main/docs/PRIVACY.md
```

## Screenshot and icon assets

Use PNG assets for the store listing:

```text
Icon:
extensions/browser/icons/icon128.png

Workflow overview:
docs/assets/screenshots/png/workflow-overview.png

Browser extension:
docs/assets/screenshots/png/browser-extension.png

Terminal workflow:
docs/assets/screenshots/png/terminal-demo.png

Editor workflow:
docs/assets/screenshots/png/vscode-extension.png
```

## Privacy answers

- Single purpose: convert Arabic or Egyptian Arabic developer prompts into structured English prompts.
- Data handling: prompt conversion runs locally in the extension bundle after the user triggers an action.
- External services: none.
- Data collection: no user data is collected, transmitted, sold, or shared.
- Remote code: none. Extension logic is bundled in the package.
- Permissions used:
  - `activeTab`: access the current tab only after the user triggers conversion.
  - `contextMenus`: provide conversion actions from the browser context menu.
  - `scripting`: inject the local content script into the active tab only after user action.
  - `storage`: save local extension defaults.

## Reviewer test instructions

```text
1. Open any page with a textarea or contenteditable field.
2. Type or paste Arabic prompt text, for example:
   ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين
3. Select the Arabic text.
4. Use the extension popup, keyboard shortcut, or context menu action.
5. Confirm the selected Arabic prompt is replaced with a structured English coding-agent prompt.
6. Enable redaction in the popup and test with a dummy value such as sk-test-1234567890abcdef.
7. Confirm the output redacts the dummy secret locally.
```

## Official references

- Chrome developer registration: https://developer.chrome.com/docs/webstore/register
- Chrome publishing flow: https://developer.chrome.com/docs/webstore/publish
- Chrome user data policy: https://developer.chrome.com/docs/webstore/user_data
- Chrome extension quality guidance: https://developer.chrome.com/docs/extensions/get-started#publish_to_the_chrome_web_store
