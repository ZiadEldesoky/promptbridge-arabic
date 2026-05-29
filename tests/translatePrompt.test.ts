import { describe, expect, it } from "vitest";
import { translatePrompt } from "../src/translator/translatePrompt.js";

describe("translatePrompt", () => {
  it("turns a responsive Egyptian Arabic request into a refactor prompt", () => {
    const result = translatePrompt(
      "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
    );

    expect(result.mode).toBe("refactor");
    expect(result.englishPrompt).toContain(
      "Refactor this code to make it responsive."
    );
    expect(result.englishPrompt).toContain("Context:");
    expect(result.englishPrompt).toContain("make it responsive");
    expect(result.englishPrompt).toContain(
      "Preserve the existing visual design."
    );
    expect(result.englishPrompt).toContain("Make the smallest safe changes.");
  });

  it("uses an explicit fix mode", () => {
    const result = translatePrompt("شوف المشكلة دي وصلحها", { mode: "fix" });

    expect(result.mode).toBe("fix");
    expect(result.englishPrompt).toContain("Investigate and fix");
    expect(result.englishPrompt).toContain("Identify the root cause");
  });

  it("supports security review mode", () => {
    const result = translatePrompt("راجع الكود وشوف فيه مشاكل security", {
      mode: "security"
    });

    expect(result.mode).toBe("security");
    expect(result.englishPrompt).toContain(
      "Review this code for potential security issues."
    );
    expect(result.englishPrompt).toContain("Injection vulnerabilities.");
    expect(result.englishPrompt).toContain("Do not make changes yet.");
  });

  it("supports bilingual output", () => {
    const result = translatePrompt("اشرحلي الكود دا ببساطة", {
      mode: "explain",
      bilingual: true
    });

    expect(result.output).toContain("## English prompt");
    expect(result.output).toContain("## Arabic summary");
    expect(result.output).toContain("المطلوب شرح الكود");
  });

  it("redacts secrets only when requested", () => {
    const input = "استخدم sk-abcdefghijklmnopqrstuvwxyz123456 في src/api.ts";
    const unredacted = translatePrompt(input);
    const redacted = translatePrompt(input, { redact: true });

    expect(unredacted.output).toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
    expect(redacted.output).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
    expect(redacted.output).toContain("[REDACTED_SECRET]");
  });

  it("preserves user-specific technical context in the generated prompt", () => {
    const result = translatePrompt(
      "CheckoutForm.tsx بيطلع error مع @stripe/stripe-js لما بشغل npm run build",
      { mode: "fix" }
    );

    expect(result.englishPrompt).toContain("CheckoutForm.tsx");
    expect(result.englishPrompt).toContain("@stripe/stripe-js");
    expect(result.englishPrompt).toContain("npm run build");
    expect(result.englishPrompt).toContain(
      "The user is likely reporting a build failure."
    );
  });
});
