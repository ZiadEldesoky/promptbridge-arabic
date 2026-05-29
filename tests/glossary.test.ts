import { describe, expect, it } from "vitest";
import {
  findGlossaryMatches,
  mergeGlossaries,
  normalizeDeveloperPhrases
} from "../src/translator/glossary.js";

describe("glossary", () => {
  it("matches Egyptian Arabic developer phrases", () => {
    const matches = findGlossaryMatches(
      "ظبطلي الكود وخليه responsive من غير ما تغير اللوجيك"
    );

    expect(matches.map((match) => match.arabic)).toEqual(
      expect.arrayContaining([
        "ظبطلي",
        "خليه responsive",
        "من غير ما تغير اللوجيك"
      ])
    );
  });

  it("normalizes matched phrases into unique English hints", () => {
    const hints = normalizeDeveloperPhrases(
      "ظبطلي الكود دا، ظبط الجزء دا وخلي التعديل بسيط"
    );

    expect(hints).toContain("fix or improve this for me");
    expect(hints).toContain("make the smallest safe change");
    expect(new Set(hints).size).toBe(hints.length);
  });

  it("lets custom glossary entries participate before built-in entries", () => {
    const glossary = mergeGlossaries([
      {
        arabic: "راجع الصلاحيات",
        english: "review authorization rules",
        tags: ["security"]
      }
    ]);

    const hints = normalizeDeveloperPhrases("راجع الصلاحيات كويس", glossary);

    expect(hints[0]).toBe("review authorization rules");
  });
});
