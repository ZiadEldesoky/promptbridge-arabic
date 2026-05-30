# Publishing to the Chrome Web Store

PromptBridge Arabic can be published to the Chrome Web Store so users can install it directly from Chrome.

## What is ready

- Manifest V3 browser extension under `extensions/browser`.
- Built extension bundle under `extensions/browser/dist`.
- Release-ready zip generated with:

```bash
npm run release:browser
```

The generated file is:

```text
artifacts/promptbridge-arabic-browser-extension-v<version>.zip
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

## Listing notes

- Single purpose: convert Arabic or Egyptian Arabic developer prompts into structured English prompts.
- Data handling: prompt conversion runs locally in the extension bundle.
- External services: none.
- Permissions used:
  - `activeTab`: send conversion command to the active tab.
  - `contextMenus`: provide conversion actions from the browser context menu.
  - `storage`: save local extension defaults.

## Official references

- Chrome developer registration: https://developer.chrome.com/docs/webstore/register
- Chrome publishing flow: https://developer.chrome.com/docs/webstore/publish
