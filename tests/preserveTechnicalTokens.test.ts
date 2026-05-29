import { describe, expect, it } from "vitest";
import {
  preserveTechnicalTokens,
  restoreTechnicalTokens
} from "../src/translator/preserveTechnicalTokens.js";

describe("preserveTechnicalTokens", () => {
  it("preserves and restores code blocks exactly", () => {
    const input = `اشرح الكود دا:
\`\`\`ts
export function sum(a: number, b: number) {
  return a + b;
}
\`\`\``;

    const result = preserveTechnicalTokens(input);
    const restored = restoreTechnicalTokens(result.text, result.tokens);

    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0]?.kind).toBe("code_block");
    expect(restored).toBe(input);
  });

  it("detects file paths and commands", () => {
    const input = "شغل npm run build وشوف src/app/page.tsx";
    const result = preserveTechnicalTokens(input);

    expect(result.tokens.map((token) => token.value)).toEqual(
      expect.arrayContaining(["npm run build", "src/app/page.tsx"])
    );
  });

  it("detects urls, packages, and environment variables", () => {
    const input =
      "راجع @prisma/client مع DATABASE_URL وشوف https://example.com/docs";
    const result = preserveTechnicalTokens(input);
    const values = result.tokens.map((token) => token.value);

    expect(values).toContain("@prisma/client");
    expect(values).toContain("DATABASE_URL");
    expect(values).toContain("https://example.com/docs");
  });
});
