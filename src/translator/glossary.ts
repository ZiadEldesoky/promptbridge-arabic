export interface GlossaryEntry {
  arabic: string;
  english: string;
  tags: string[];
}

export const egyptianDeveloperGlossary: GlossaryEntry[] = [
  {
    arabic: "ظبط",
    english: "fix, improve, or refactor depending on context",
    tags: ["fix", "refactor"]
  },
  {
    arabic: "ظبطلي",
    english: "fix or improve this for me",
    tags: ["fix", "refactor"]
  },
  {
    arabic: "شوف المشكلة",
    english: "investigate the issue",
    tags: ["fix"]
  },
  {
    arabic: "صلحها",
    english: "fix it",
    tags: ["fix"]
  },
  {
    arabic: "متبوظش الديزاين",
    english: "preserve the existing design",
    tags: ["design"]
  },
  {
    arabic: "من غير ما تغير الديزاين",
    english: "without changing the design",
    tags: ["design"]
  },
  {
    arabic: "خليها responsive",
    english: "make it responsive",
    tags: ["responsive"]
  },
  {
    arabic: "خليه responsive",
    english: "make it responsive",
    tags: ["responsive"]
  },
  {
    arabic: "بيكراش",
    english: "crashes",
    tags: ["fix", "crash"]
  },
  {
    arabic: "مش راضي يشتغل",
    english: "does not work",
    tags: ["fix"]
  },
  {
    arabic: "بيطلع error",
    english: "throws an error",
    tags: ["fix", "error"]
  },
  {
    arabic: "شغال عندي",
    english: "works on my machine",
    tags: ["environment"]
  },
  {
    arabic: "نضف الكود",
    english: "clean up the code",
    tags: ["refactor"]
  },
  {
    arabic: "من غير ما تغير اللوجيك",
    english: "without changing the business logic",
    tags: ["logic"]
  },
  {
    arabic: "خلي التعديل بسيط",
    english: "make the smallest safe change",
    tags: ["small-change"]
  },
  {
    arabic: "راجع الكود",
    english: "review the code",
    tags: ["review"]
  },
  {
    arabic: "اشرحلي",
    english: "explain to me",
    tags: ["explain"]
  }
];

export function mergeGlossaries(
  customGlossary: GlossaryEntry[] = []
): GlossaryEntry[] {
  return [...customGlossary, ...egyptianDeveloperGlossary];
}

export function findGlossaryMatches(
  input: string,
  glossary: GlossaryEntry[] = egyptianDeveloperGlossary
): GlossaryEntry[] {
  const normalizedInput = input.toLowerCase();

  return glossary.filter((entry) =>
    normalizedInput.includes(entry.arabic.toLowerCase())
  );
}

export function normalizeDeveloperPhrases(
  input: string,
  glossary: GlossaryEntry[] = egyptianDeveloperGlossary
): string[] {
  const seen = new Set<string>();

  return findGlossaryMatches(input, glossary)
    .map((entry) => entry.english)
    .filter((english) => {
      if (seen.has(english)) {
        return false;
      }

      seen.add(english);
      return true;
    });
}
