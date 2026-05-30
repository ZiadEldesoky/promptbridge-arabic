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
      content_scripts: Array<{ js: string[] }>;
    };

    expect(manifest.version).toBe(packageJson.version);
    expect(manifest.permissions).toContain("contextMenus");
    expect(manifest.permissions).toContain("storage");
    expect(manifest.content_scripts[0]?.js).toContain("dist/content.js");
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
