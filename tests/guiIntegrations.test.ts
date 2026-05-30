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
      icons: Record<string, string>;
    };

    expect(manifest.version).toBe(packageJson.version);
    expect(manifest.permissions).toContain("activeTab");
    expect(manifest.permissions).toContain("contextMenus");
    expect(manifest.permissions).toContain("scripting");
    expect(manifest.permissions).toContain("storage");
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
    expect(manifest.contributes.commands).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.replaceFocusedSelection",
        title: "PromptBridge: Replace Selected Text in Focused Input"
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
        mac: "cmd+shift+y",
        when: "!editorTextFocus"
      })
    );
    expect(manifest.contributes.menus["editor/context"]).toContainEqual(
      expect.objectContaining({
        command: "promptbridge.convertSelection"
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

  it("keeps the VS Code extension independent from the Node clipboard package", async () => {
    const source = await readFile(
      new URL("../extensions/vscode/src/extension.ts", import.meta.url),
      "utf8"
    );

    expect(source).toContain("vscode.env.clipboard");
    expect(source).not.toContain("clipboardy");
    expect(source).not.toContain("replaceSelection.js");
  });

  it("normalizes browser extension settings safely", () => {
    expect(
      normalizeBrowserSettings({
        mode: "security",
        bilingual: true,
        redact: true,
        fallbackToFocusedField: false
      })
    ).toEqual({
      mode: "security",
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
