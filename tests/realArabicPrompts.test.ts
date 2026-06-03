import { describe, expect, it } from "vitest";
import { translatePrompt } from "../src/translator/translatePrompt.js";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06ff]/;

function expectNoArabicLeftovers(output: string): void {
  expect(output).not.toMatch(ARABIC_TEXT_PATTERN);
}

describe("real Arabic prompt corpus", () => {
  it("handles a real build-error fix request with preserved commands and paths", () => {
    const result = translatePrompt(
      "لما بشغل npm run build في Next.js بيطلع error في app/orders/page.tsx صلحه بأقل تعديل"
    );

    expect(result.mode).toBe("fix");
    expect(result.englishPrompt).toContain(
      "Investigate and fix the build error in this project."
    );
    expect(result.englishPrompt).toContain(
      "The user is likely reporting a build failure."
    );
    expect(result.englishPrompt).toContain(
      "Make the smallest safe change that solves the request."
    );
    expect(result.englishPrompt).toContain("Likely target: app/orders/page.tsx.");
    expect(result.englishPrompt).toContain("npm run build");
    expect(result.englishPrompt).toContain("Next.js");
    expect(result.englishPrompt).toContain("app/orders/page.tsx");
    expectNoArabicLeftovers(result.englishPrompt);
  });

  it("handles a save button reload bug as a fix request", () => {
    const result = translatePrompt(
      "زرار Save في SettingsForm.tsx بيعمل reload ومش بيحفظ البيانات"
    );

    expect(result.mode).toBe("fix");
    expect(result.englishPrompt).toContain(
      "Investigate and fix the bug where clicking Save reloads the page and does not persist the data."
    );
    expect(result.englishPrompt).toContain(
      "The user is reporting that a save action reloads the page."
    );
    expect(result.englishPrompt).toContain("Save button");
    expect(result.englishPrompt).toContain("SettingsForm.tsx");
    expectNoArabicLeftovers(result.englishPrompt);
  });

  it("turns a practical login-flow test request into tests mode", () => {
    const result = translatePrompt(
      "اكتب tests للـ login flow وتأكد إن validation errors بتظهر"
    );

    expect(result.mode).toBe("tests");
    expect(result.englishPrompt).toContain(
      "Add or improve tests for this feature."
    );
    expect(result.englishPrompt).toContain("login flow");
    expect(result.englishPrompt).toContain("validation errors");
    expect(result.englishPrompt).toContain("Cover important edge cases.");
    expectNoArabicLeftovers(result.englishPrompt);
  });

  it("classifies auth and data-leak review prompts as security reviews", () => {
    const result = translatePrompt(
      "راجع API route في app/api/orders/route.ts وشوف لو فيه مشكلة auth أو data leak"
    );

    expect(result.mode).toBe("security");
    expect(result.englishPrompt).toContain(
      "Review this code for potential security issues."
    );
    expect(result.englishPrompt).toContain("Authentication and authorization.");
    expect(result.englishPrompt).toContain("Data leakage.");
    expect(result.englishPrompt).toContain("app/api/orders/route.ts");
    expectNoArabicLeftovers(result.englishPrompt);
  });

  it("keeps explicit auth test requests in tests mode instead of over-prioritizing security words", () => {
    const result = translatePrompt(
      "اكتب tests للـ auth flow وتأكد إن forbidden users مش بيدخلوا"
    );

    expect(result.mode).toBe("tests");
    expect(result.englishPrompt).toContain(
      "Add or improve tests for this feature."
    );
    expect(result.englishPrompt).toContain("Likely target: auth flow.");
    expect(result.englishPrompt).toContain("auth flow");
    expect(result.englishPrompt).toContain("forbidden users cannot access");
    expectNoArabicLeftovers(result.englishPrompt);
  });

  it("keeps explanation prompts simple and preserves hook names", () => {
    const result = translatePrompt(
      "اشرحلي useEffect دا ببساطة من غير كلام كتير"
    );

    expect(result.mode).toBe("explain");
    expect(result.englishPrompt).toContain(
      "Explain how this code works in simple language."
    );
    expect(result.englishPrompt).toContain("useEffect");
    expect(result.englishPrompt).toContain("Use simple language.");
    expectNoArabicLeftovers(result.englishPrompt);
  });

  it("captures responsive checkout constraints without changing logic or removing fields", () => {
    const result = translatePrompt(
      "في صفحة checkout خلي الفورم responsive على الموبايل من غير ما تغير اللوجيك أو تحذف أي field"
    );

    expect(result.mode).toBe("refactor");
    expect(result.englishPrompt).toContain(
      "Refactor this code to make it responsive."
    );
    expect(result.englishPrompt).toContain("checkout");
    expect(result.englishPrompt).toContain(
      "Do not change the existing business logic."
    );
    expect(result.englishPrompt).toContain(
      "Do not remove existing content or fields unless explicitly required."
    );
    expect(result.englishPrompt).toContain(
      "Detected constraints: preserve business logic and do not remove existing content or fields."
    );
    expectNoArabicLeftovers(result.englishPrompt);
  });
});
