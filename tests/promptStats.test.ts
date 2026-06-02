import { describe, expect, it } from "vitest";
import {
  analyzePromptStats,
  analyzeText,
  estimateApproximateTokens,
  formatPromptStats
} from "../src/stats/promptStats.js";

describe("prompt stats", () => {
  it("estimates text size without calling external services", () => {
    const stats = analyzeText("ظبطلي الكود دا");

    expect(stats.characters).toBeGreaterThan(0);
    expect(stats.words).toBe(3);
    expect(stats.estimatedTokens).toBeGreaterThanOrEqual(stats.words);
  });

  it("uses a different deterministic estimate for Arabic-heavy text", () => {
    expect(estimateApproximateTokens("fix this bug")).toBeLessThan(
      estimateApproximateTokens("صلحلي المشكلة دي")
    );
  });

  it("analyzes the generated prompt output", () => {
    const stats = analyzePromptStats(
      "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
    );

    expect(stats.mode).toBe("refactor");
    expect(stats.input.estimatedTokens).toBeGreaterThan(0);
    expect(stats.output.estimatedTokens).toBeGreaterThan(0);
    expect(stats.preservedTechnicalTokens).toBe(0);
    expect(stats.redactionCount).toBe(0);
  });

  it("formats readable CLI output", () => {
    const stats = analyzePromptStats("راجع الكود وشوف فيه مشاكل security");
    const output = formatPromptStats(stats);

    expect(output).toContain("PromptBridge stats");
    expect(output).toContain("Mode:");
    expect(output).toContain("estimated tokens");
    expect(output).toContain("model-specific tokenizer");
  });
});
