import { describe, expect, it } from "vitest";
import {
  containsArabic,
  convertClipboardOnce,
  convertClipboardText
} from "../src/clipboard/watchClipboard.js";

describe("watchClipboard", () => {
  it("detects Arabic text", () => {
    expect(containsArabic("ظبطلي الكود")).toBe(true);
    expect(containsArabic("Refactor this code")).toBe(false);
  });

  it("converts Arabic clipboard text", () => {
    const result = convertClipboardText(
      "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
    );

    expect(result.converted).toBe(true);
    expect(result.output).toContain("Refactor this code to make it responsive.");
  });

  it("skips non-Arabic clipboard text", () => {
    const result = convertClipboardText("Refactor this code");

    expect(result.converted).toBe(false);
    expect(result.reason).toBe("no_arabic");
    expect(result.output).toBe("Refactor this code");
  });

  it("converts clipboard once through injectable clipboard functions", async () => {
    let clipboardText = "راجع الكود وشوف فيه مشاكل security";
    const result = await convertClipboardOnce({
      readText: async () => clipboardText,
      writeText: async (text) => {
        clipboardText = text;
      }
    });

    expect(result.converted).toBe(true);
    expect(clipboardText).toContain(
      "Review this code for potential security issues."
    );
  });
});
