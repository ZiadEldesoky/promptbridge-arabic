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

  it("keeps natural friendly messages natural instead of forcing a coding template", () => {
    expect(translatePrompt("هاي").output).toBe("Hi.");
    expect(translatePrompt("مرحبا").output).toBe("Hello.");
    expect(translatePrompt("ازيك عامل ايه").output).toBe("How are you?");
  });

  it("uses a general fallback for Arabic that is not specifically a coding task", () => {
    const result = translatePrompt("عايز رسالة ترحيب بسيطة للعميل");

    expect(result.mode).toBe("general");
    expect(result.output).toBe("I want a simple welcome message for the customer");
  });

  it("keeps explicit general mode as direct translation instead of a meta-template", () => {
    const result = translatePrompt("خلي الكود آمن", { mode: "general" });

    expect(result.mode).toBe("general");
    expect(result.output).toBe("Make the code secure");
    expect(result.output).not.toContain("Translate and clarify");
  });

  it("translates compound code-quality phrases without leaving Arabic fragments", () => {
    const result = translatePrompt("خلي الكود آمن ونظيف", { mode: "general" });

    expect(result.mode).toBe("general");
    expect(result.output).toBe(
      "Make the code secure, clean, and maintainable"
    );
    expect(result.output).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("turns secure and clean code requests into practical hardening guidance", () => {
    const result = translatePrompt("خلي الكود آمن ونظيف");

    expect(result.mode).toBe("security");
    expect(result.englishPrompt).toContain(
      "Improve this code to make it secure, clean, and maintainable."
    );
    expect(result.englishPrompt).toContain(
      "Natural English interpretation: make the code secure, clean, and maintainable"
    );
    expect(result.englishPrompt).toContain(
      "Improve readability, structure, and maintainability without changing behavior."
    );
    expect(result.englishPrompt).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("keeps short selected fragments as fragment translations", () => {
    const result = translatePrompt("آمن ونظيف");

    expect(result.mode).toBe("general");
    expect(result.output).toBe("Secure, clean, and maintainable");
    expect(result.output).not.toContain("Review this code");
    expect(result.output).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("translates organized-code requests without leaving Arabic fragments", () => {
    const direct = translatePrompt("خلي الكود منظم", { mode: "general" });
    const structured = translatePrompt("خلي الكود منظم");

    expect(direct.output).toBe("Make the code organized and maintainable");
    expect(direct.output).not.toMatch(/[\u0600-\u06ff]/);
    expect(structured.mode).toBe("refactor");
    expect(structured.englishPrompt).toContain(
      "Organize this code and improve its maintainability while preserving behavior."
    );
    expect(structured.englishPrompt).toContain(
      "Natural English interpretation: make the code organized and maintainable"
    );
    expect(structured.englishPrompt).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("handles organized and secure code requests without Arabic leftovers", () => {
    const direct = translatePrompt("خلي الكود منظم وآمن", { mode: "general" });
    const structured = translatePrompt("خلي الكود منظم وآمن");

    expect(direct.output).toBe(
      "Make the code organized, maintainable, and secure"
    );
    expect(direct.output).not.toMatch(/[\u0600-\u06ff]/);
    expect(structured.mode).toBe("security");
    expect(structured.englishPrompt).toContain(
      "Improve this code to make it secure, organized, and maintainable."
    );
    expect(structured.englishPrompt).toContain(
      "Natural English interpretation: make the code organized, maintainable, and secure"
    );
    expect(structured.englishPrompt).not.toContain(
      "make the code organized and maintainable"
    );
    expect(structured.englishPrompt).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("normalizes decomposed Arabic characters before glossary matching", () => {
    const result = translatePrompt("خلي الكود منظم وآمن", {
      mode: "general"
    });

    expect(result.output).toBe(
      "Make the code organized, maintainable, and secure"
    );
    expect(result.output).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("handles organized secure and maintainable code requests without Arabic leftovers", () => {
    const direct = translatePrompt("خلي الكود منظم وآمن وقابل للصيانة", {
      mode: "general"
    });
    const structured = translatePrompt("خلي الكود منظم وآمن وقابل للصيانة");

    expect(direct.output).toBe(
      "Make the code organized, secure, and maintainable"
    );
    expect(direct.output).not.toMatch(/[\u0600-\u06ff]/);
    expect(structured.mode).toBe("security");
    expect(structured.englishPrompt).toContain(
      "Improve this code to make it secure, organized, and maintainable."
    );
    expect(structured.englishPrompt).toContain(
      "Natural English interpretation: make the code organized, secure, and maintainable"
    );
    expect(structured.englishPrompt).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("parses longer code quality prompts without relying on exact phrase order", () => {
    const direct = translatePrompt(
      "خلي الكود منظم وقابل للصيانة واهتم بالأمان بتاعه",
      { mode: "general" }
    );
    const structured = translatePrompt(
      "خلي الكود منظم وقابل للصيانة واهتم بالأمان بتاعه"
    );

    expect(direct.output).toBe(
      "Make the code organized, maintainable, and secure"
    );
    expect(direct.output).not.toMatch(/[\u0600-\u06ff]/);
    expect(structured.mode).toBe("security");
    expect(structured.englishPrompt).toContain(
      "Improve this code to make it secure, organized, and maintainable."
    );
    expect(structured.englishPrompt).toContain(
      "Natural English interpretation: make the code organized, maintainable, and secure"
    );
    expect(structured.englishPrompt).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("deduplicates maintainability when organized and maintainable fragments are selected", () => {
    const result = translatePrompt("منظم وقابل للصيانة");

    expect(result.mode).toBe("general");
    expect(result.output).toBe("Organized and maintainable");
    expect(result.output).not.toContain("maintainable maintainable");
    expect(result.output).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("keeps maintainability fragments as direct fragment translations", () => {
    const result = translatePrompt("قابل للصيانة");

    expect(result.mode).toBe("general");
    expect(result.output).toBe("Maintainable");
    expect(result.output).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("keeps organized-code fragments as fragment translations", () => {
    const result = translatePrompt("منظم");

    expect(result.mode).toBe("general");
    expect(result.output).toBe("Organized and maintainable");
    expect(result.output).not.toContain("Translate and clarify");
    expect(result.output).not.toMatch(/[\u0600-\u06ff]/);
  });

  it("preserves business context inside coding prompts", () => {
    const result = translatePrompt(
      "ظبطلي صفحة الطلبات عشان العميل يعرف حالة الشحن والدفع"
    );

    expect(result.mode).toBe("refactor");
    expect(result.englishPrompt).toContain(
      "Natural English interpretation: fix or improve this for me orders page so that the customer can see shipping status and payment"
    );
    expect(result.englishPrompt).toContain("orders page");
    expect(result.englishPrompt).toContain("customer");
    expect(result.englishPrompt).toContain("shipping");
    expect(result.englishPrompt).toContain("payment");
    expect(result.englishPrompt).toContain(
      "Preserve any business entities, workflows, and product constraints mentioned by the user."
    );
  });

  it("detects common Egyptian variants for preserving the current design", () => {
    const result = translatePrompt(
      "خلي الكود كله responsive بدون ما تغير في الديزاين"
    );

    expect(result.mode).toBe("refactor");
    expect(result.englishPrompt).toContain(
      "Preserve the existing visual design."
    );
    expect(result.englishPrompt).toContain("Do not redesign the UI.");
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
    expect(result.englishPrompt).toContain(
      "Natural English interpretation: review the code and check for security issues"
    );
    expect(result.englishPrompt).toContain("Injection vulnerabilities.");
    expect(result.englishPrompt).toContain("Do not make changes yet.");
  });

  it("turns short Arabic security hardening requests into actionable security prompts", () => {
    const result = translatePrompt("خلي الكود آمن");

    expect(result.mode).toBe("security");
    expect(result.englishPrompt).toContain(
      "Improve this code to make it more secure."
    );
    expect(result.englishPrompt).toContain(
      "Natural English interpretation: make the code secure"
    );
    expect(result.englishPrompt).toContain(
      "Make the smallest safe changes needed to improve security."
    );
    expect(result.englishPrompt).toContain(
      "The risks addressed by the changes."
    );
    expect(result.englishPrompt).not.toContain("Do not make changes yet.");
    expect(result.englishPrompt).not.toContain(
      "Investigate and fix the reported issue."
    );
  });

  it("turns short Arabic performance requests into targeted refactor prompts", () => {
    const result = translatePrompt("خلي الكود أسرع");

    expect(result.mode).toBe("refactor");
    expect(result.englishPrompt).toContain(
      "Improve this code's performance while preserving its behavior."
    );
    expect(result.englishPrompt).toContain(
      "Natural English interpretation: make the code faster"
    );
    expect(result.englishPrompt).toContain(
      "Identify the likely performance bottleneck before changing code."
    );
  });

  it("keeps non-coding selected Arabic text as a natural English translation", () => {
    const result = translatePrompt("تمام");

    expect(result.mode).toBe("general");
    expect(result.output).toBe("Okay.");
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

  it("uses custom glossary entries for context and mode inference", () => {
    const result = translatePrompt("راجع الصلاحيات في middleware.ts", {
      glossary: [
        {
          arabic: "راجع الصلاحيات",
          english: "review authorization rules",
          tags: ["security"]
        }
      ]
    });

    expect(result.mode).toBe("security");
    expect(result.englishPrompt).toContain("review authorization rules");
    expect(result.englishPrompt).toContain("middleware.ts");
  });
});
