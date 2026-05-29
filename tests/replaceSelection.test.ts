import { describe, expect, it } from "vitest";
import { replaceSelectedText } from "../src/clipboard/replaceSelection.js";

describe("replaceSelectedText", () => {
  it("reports unsupported platforms without mutating clipboard", async () => {
    let clipboardText = "ظبطلي الكود";
    const result = await replaceSelectedText({
      platform: "linux",
      readText: async () => clipboardText,
      writeText: async (text) => {
        clipboardText = text;
      },
      sendShortcut: async () => {
        throw new Error("should not send shortcuts");
      }
    });

    expect(result.converted).toBe(false);
    expect(result.reason).toBe("unsupported_platform");
    expect(clipboardText).toBe("ظبطلي الكود");
  });

  it("copies selected Arabic text, converts it, and pastes it on macOS", async () => {
    let clipboardText = "previous clipboard";
    const shortcuts: string[] = [];
    const result = await replaceSelectedText({
      platform: "darwin",
      readText: async () => clipboardText,
      writeText: async (text) => {
        clipboardText = text;
      },
      sendShortcut: async (shortcut) => {
        shortcuts.push(shortcut);

        if (shortcut === "copy") {
          clipboardText = "ظبطلي الكود دا";
        }
      },
      sleep: async () => undefined
    });

    expect(result.converted).toBe(true);
    expect(shortcuts).toEqual(["copy", "paste"]);
    expect(clipboardText).toContain("Refactor and improve this code.");
  });

  it("can restore the previous clipboard after pasting", async () => {
    let clipboardText = "previous clipboard";
    const result = await replaceSelectedText({
      platform: "darwin",
      restoreClipboard: true,
      readText: async () => clipboardText,
      writeText: async (text) => {
        clipboardText = text;
      },
      sendShortcut: async (shortcut) => {
        if (shortcut === "copy") {
          clipboardText = "راجع الكود وشوف فيه مشاكل security";
        }
      },
      sleep: async () => undefined
    });

    expect(result.converted).toBe(true);
    expect(clipboardText).toBe("previous clipboard");
  });
});
