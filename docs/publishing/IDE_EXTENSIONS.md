# Publishing IDE Extensions

PromptBridge Arabic now includes a VS Code-compatible extension under `extensions/vscode`.

The extension is designed for:

- Visual Studio Code.
- Cursor, when it supports manual VSIX installation or compatible extension APIs.
- Other VS Code-compatible editors through VSIX or Open VSX, depending on editor support.
- Antigravity should be verified manually because its current public docs do not clearly document VSIX marketplace compatibility.

## What is ready

- VS Code-compatible extension manifest: `extensions/vscode/package.json`.
- Extension source: `extensions/vscode/src/extension.ts`.
- Bundled extension build:

```bash
npm run build:vscode
```

- VSIX packaging:

```bash
npm run release:vscode
```

The generated file is:

```text
artifacts/promptbridge-arabic-vscode-v<version>.vsix
```

## Manual install from VSIX

```bash
code --install-extension artifacts/promptbridge-arabic-vscode-v<version>.vsix
```

Many VS Code-compatible editors also expose an "Install from VSIX" command in the Extensions view.

## VS Code Marketplace publishing

1. Create a publisher in the Visual Studio Marketplace.
2. Create an Azure DevOps Personal Access Token with Marketplace Manage scope.
3. Build and package:

```bash
npm run release:vscode
```

4. Publish:

```bash
cd extensions/vscode
vsce login ziadeldesoky
vsce publish --packagePath ../../artifacts/promptbridge-arabic-vscode-v<version>.vsix
```

If the Marketplace publisher ID is not `ziadeldesoky`, update `extensions/vscode/package.json` before publishing.

## Open VSX publishing

Open VSX is useful for VS Code-compatible editors that use the Open VSX registry.

1. Create an Eclipse account.
2. Sign the Open VSX Publisher Agreement.
3. Create an Open VSX access token.
4. Create the namespace matching the `publisher` field:

```bash
npx ovsx create-namespace ziadeldesoky -p <token>
```

5. Publish the packaged VSIX:

```bash
npx ovsx publish artifacts/promptbridge-arabic-vscode-v<version>.vsix -p <token>
```

## Official references

- VS Code publishing: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Open VSX publishing: https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions
