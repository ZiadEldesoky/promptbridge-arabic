import { access, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { normalizeBrowserSettings } from "../extensions/browser/src/settings.js";
import {
  getPromptFieldSelectors,
  hasPromptFieldAdapter
} from "../extensions/browser/src/siteAdapters.js";

describe("GUI integration metadata", () => {
  it("keeps the browser extension manifest aligned with the package version", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8")
    ) as { version: string };
    const manifest = JSON.parse(
      await readFile(
        new URL("../extensions/browser/manifest.json", import.meta.url),
        "utf8"
      )
    ) as {
      version: string;
      permissions: string[];
      content_scripts?: Array<{
        matches: string[];
        js: string[];
      }>;
      icons: Record<string, string>;
    };

    expect(manifest.version).toBe(packageJson.version);
    expect(manifest.permissions).toContain("activeTab");
    expect(manifest.permissions).toContain("contextMenus");
    expect(manifest.permissions).toContain("scripting");
    expect(manifest.permissions).toContain("storage");
    expect(manifest.content_scripts?.[0]?.matches).toContain(
      "https://chatgpt.com/*"
    );
    expect(manifest.content_scripts?.[0]?.matches).toContain(
      "https://claude.ai/*"
    );
    expect(manifest.content_scripts?.[0]?.js).toContain("dist/content.js");
    expect(manifest.icons["128"]).toBe("icons/icon128.png");
  });

  it("keeps the VS Code extension manifest aligned with the package version", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8")
    ) as { version: string };
    const manifest = JSON.parse(
      await readFile(
        new URL("../extensions/vscode/package.json", import.meta.url),
        "utf8"
      )
    ) as {
      version: string;
      main: string;
      activationEvents: string[];
      contributes: {
        commands: Array<{ command: string; title: string }>;
        keybindings: Array<{
          command: string;
          key: string;
          mac?: string;
          when?: string;
        }>;
        menus: { "editor/context": Array<{ command: string }> };
        configuration: {
          properties: {
            "promptbridge.mode": {
              enum: string[];
            };
          };
        };
      };
    };

    expect(manifest.version).toBe(packageJson.version);
    expect(manifest.main).toBe("./dist/extension.js");
    expect(manifest.activationEvents).toContain(
      "onCommand:promptbridge.replaceFocusedSelection"
    );
    expect(manifest.contributes.commands).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.convertSelection"
      })
    );
    expect(manifest.activationEvents).toContain(
      "onCommand:promptbridge.convertSelectionWithMode"
    );
    expect(manifest.contributes.commands).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.convertSelectionWithMode",
        title: "PromptBridge: Convert Arabic Selection with Mode..."
      })
    );
    expect(manifest.contributes.commands).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.replaceFocusedSelection",
        title: "PromptBridge: Replace Selected Text in Focused Input"
      })
    );
    expect(
      manifest.contributes.configuration.properties["promptbridge.mode"].enum
    ).toContain("general");
    expect(manifest.contributes.keybindings).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.convertSelection",
        key: "alt+y",
        mac: "alt+y",
        when: "editorTextFocus && editorHasSelection"
      })
    );
    expect(manifest.contributes.keybindings).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.convertSelection",
        mac: "cmd+shift+y",
        when: "editorTextFocus && editorHasSelection"
      })
    );
    expect(manifest.contributes.keybindings).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.replaceFocusedSelection",
        key: "alt+y",
        mac: "alt+y",
        when: "!editorTextFocus"
      })
    );
    expect(manifest.contributes.keybindings).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.replaceFocusedSelection",
        mac: "cmd+shift+y",
        when: "!editorTextFocus"
      })
    );
    expect(manifest.contributes.menus["editor/context"]).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.convertSelection"
      })
    );
    expect(manifest.contributes.menus["editor/context"]).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.convertSelectionWithMode"
      })
    );
  });

  it("keeps the load-unpacked browser extension bundle committed", async () => {
    await expect(
      access(new URL("../extensions/browser/dist/content.js", import.meta.url))
    ).resolves.toBeUndefined();
    await expect(
      access(new URL("../extensions/browser/dist/background.js", import.meta.url))
    ).resolves.toBeUndefined();
    await expect(
      access(new URL("../extensions/browser/dist/popup.js", import.meta.url))
    ).resolves.toBeUndefined();
    await expect(
      access(new URL("../extensions/browser/icons/icon128.png", import.meta.url))
    ).resolves.toBeUndefined();
  });

  it("keeps the browser floating convert button wired locally", async () => {
    const source = await readFile(
      new URL("../extensions/browser/src/content.ts", import.meta.url),
      "utf8"
    );

    expect(source).toContain("installFloatingConvertButton");
    expect(source).toContain("promptbridge-arabic-floating-convert");
    expect(source).toContain("loadBrowserSettings");
    expect(source).toContain("Convert");
  });

  it("keeps the Raycast helper wired to selected-text replacement", async () => {
    const script = await readFile(
      new URL(
        "../extensions/raycast/promptbridge-replace-selection.sh",
        import.meta.url
      ),
      "utf8"
    );

    expect(script).toContain("# @raycast.schemaVersion 1");
    expect(script).toContain("promptbridge replace-selection --redact --quiet");
  });

  it("keeps Windows and Linux shortcut helpers wired to selected-text replacement", async () => {
    const windowsScript = await readFile(
      new URL(
        "../extensions/windows/promptbridge-replace-selection.ps1",
        import.meta.url
      ),
      "utf8"
    );
    const autoHotkeyScript = await readFile(
      new URL(
        "../extensions/windows/promptbridge-replace-selection.ahk",
        import.meta.url
      ),
      "utf8"
    );
    const linuxScript = await readFile(
      new URL(
        "../extensions/linux/promptbridge-replace-selection.sh",
        import.meta.url
      ),
      "utf8"
    );

    expect(windowsScript).toContain(
      "promptbridge replace-selection --redact --quiet"
    );
    expect(autoHotkeyScript).toContain("AutoHotkey v2.0");
    expect(autoHotkeyScript).toContain(
      "promptbridge replace-selection --redact --quiet"
    );
    expect(linuxScript).toContain(
      "promptbridge replace-selection --redact --quiet"
    );
  });

  it("keeps the VS Code extension independent from the Node clipboard package", async () => {
    const source = await readFile(
      new URL("../extensions/vscode/src/extension.ts", import.meta.url),
      "utf8"
    );

    expect(source).toContain("vscode.env.clipboard.readText");
    expect(source).toContain("convertSelectionWithMode");
    expect(source).toContain("showQuickPick");
    expect(source).toContain("powershell.exe");
    expect(source).toContain("xdotool");
    expect(source).toContain("wtype");
    expect(source).not.toContain("pbpaste");
    expect(source).not.toContain("pbcopy");
    expect(source).not.toContain("clipboardy");
    expect(source).not.toContain("replaceSelection.js");
  });

  it("keeps the macOS menu bar helper wired to the bundled converter", async () => {
    const packageManifest = await readFile(
      new URL("../extensions/macos/Package.swift", import.meta.url),
      "utf8"
    );
    const source = await readFile(
      new URL(
        "../extensions/macos/Sources/PromptBridgeMenuBar/main.swift",
        import.meta.url
      ),
      "utf8"
    );
    const buildScript = await readFile(
      new URL("../scripts/build-macos-menubar.mjs", import.meta.url),
      "utf8"
    );
    const converter = await readFile(
      new URL("../extensions/macos/src/convertPromptForMenuBar.ts", import.meta.url),
      "utf8"
    );

    expect(packageManifest).toContain('name: "PromptBridgeMenuBar"');
    expect(source).toContain("NSStatusBar.system.statusItem");
    expect(source).toContain("NSStatusItem.squareLength");
    expect(source).toContain("text.bubble");
    expect(source).toContain("PromptBridgeMenuBarLauncher");
    expect(source).toContain("AXIsProcessTrustedWithOptions");
    expect(source).toContain('"general"');
    expect(source).toContain("disableAutomaticTermination");
    expect(source).toContain("applicationShouldTerminate");
    expect(source).toContain("unicodeScalars.contains");
    expect(source).not.toContain("NSRegularExpression");
    expect(source).toContain("Auto Replace Selected Arabic");
    expect(source).toContain("Download Update");
    expect(source).toContain("downloadsDirectory");
    expect(source).toContain("activateFileViewerSelecting");
    expect(source).toContain("browser_download_url");
    expect(source).toContain("originalChangeCount");
    expect(source).toContain("promptbridge-convert.mjs");
    expect(converter).toContain("translatePrompt");
    expect(buildScript).toContain("PromptBridgeArabicMenuBar.app");
    expect(buildScript).toContain("NSSupportsAutomaticTermination");
    expect(buildScript).toContain("promptbridge-convert.mjs");
  });

  it("normalizes browser extension settings safely", () => {
    expect(
      normalizeBrowserSettings({
        mode: "general",
        bilingual: true,
        redact: true,
        fallbackToFocusedField: false
      })
    ).toEqual({
      mode: "general",
      bilingual: true,
      redact: true,
      fallbackToFocusedField: false
    });

    expect(
      normalizeBrowserSettings({
        mode: "translate-everything",
        bilingual: "yes",
        redact: "no"
      })
    ).toEqual({
      bilingual: false,
      redact: false,
      fallbackToFocusedField: true,
      mode: undefined
    });
  });

  it("returns site-aware prompt selectors for common web AI tools", () => {
    expect(getPromptFieldSelectors("chatgpt.com")).toContain(
      '[data-testid="prompt-textarea"]'
    );
    expect(getPromptFieldSelectors("claude.ai")).toContain(
      '.ProseMirror[contenteditable="true"]'
    );
    expect(getPromptFieldSelectors("gemini.google.com")).toContain(
      "rich-textarea [contenteditable='true']"
    );
    expect(getPromptFieldSelectors("example.com")).toContain("textarea");
    expect(hasPromptFieldAdapter("chatgpt.com")).toBe(true);
    expect(hasPromptFieldAdapter("example.com")).toBe(false);
  });
});
