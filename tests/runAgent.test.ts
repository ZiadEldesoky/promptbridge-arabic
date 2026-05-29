import { describe, expect, it } from "vitest";
import { prepareAgentArgs } from "../src/agents/runAgent.js";

describe("prepareAgentArgs", () => {
  it("converts Arabic prompt arguments before agent execution", () => {
    const result = prepareAgentArgs([
      "codex",
      "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين"
    ]);

    expect(result.command).toBe("codex");
    expect(result.convertedArgs).toBe(1);
    expect(result.args[0]).toContain("Refactor this code to make it responsive.");
    expect(result.args[0]).toContain("Preserve the existing visual design.");
  });

  it("keeps non-Arabic agent flags unchanged", () => {
    const result = prepareAgentArgs([
      "claude",
      "--model",
      "sonnet",
      "Review this code"
    ]);

    expect(result.convertedArgs).toBe(0);
    expect(result.args).toEqual(["--model", "sonnet", "Review this code"]);
  });

  it("uses translate options when converting prompt arguments", () => {
    const result = prepareAgentArgs(
      ["gemini", "راجع الكود وشوف فيه مشاكل security"],
      {
        translateOptions: {
          mode: "security",
          redact: true
        }
      }
    );

    expect(result.convertedArgs).toBe(1);
    expect(result.args[0]).toContain(
      "Review this code for potential security issues."
    );
  });

  it("requires an agent command", () => {
    expect(() => prepareAgentArgs([])).toThrow("Missing agent command.");
  });
});
