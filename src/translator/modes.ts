export const promptModes = [
  "general",
  "fix",
  "refactor",
  "review",
  "tests",
  "explain",
  "security"
] as const;

export type PromptMode = (typeof promptModes)[number];

export interface ModeTemplate {
  task: string;
  requirements?: string[];
  focus?: string[];
  constraints?: string[];
  expectedOutput?: string[];
}

export const modeTemplates: Record<PromptMode, ModeTemplate> = {
  general: {
    task: "Translate and clarify this request in natural English.",
    requirements: [
      "Preserve the user's intent, tone, and useful details.",
      "Keep the English natural, concise, and actionable.",
      "If the request is business or product related, express it as practical implementation guidance.",
      "Do not invent technical details that were not provided."
    ],
    expectedOutput: ["A natural English version of the user's request."]
  },
  fix: {
    task: "Investigate and fix the reported issue.",
    requirements: [
      "Identify the root cause before making changes.",
      "Make the smallest safe code changes needed to fix the issue.",
      "Keep the existing UI and behavior unchanged unless the fix requires otherwise.",
      "Add or update tests if appropriate.",
      "Run the relevant build or test command after applying the fix.",
      "Summarize what caused the problem and what was changed."
    ]
  },
  refactor: {
    task: "Refactor and improve this code.",
    requirements: [
      "Preserve the existing behavior.",
      "Avoid unnecessary architectural changes.",
      "Keep public APIs stable unless a change is necessary.",
      "Reduce duplication where appropriate.",
      "Explain the main refactoring decisions."
    ]
  },
  review: {
    task: "Review this code and provide actionable feedback.",
    focus: [
      "Correctness.",
      "Edge cases.",
      "Maintainability.",
      "Performance.",
      "Security risks.",
      "Missing tests."
    ],
    constraints: [
      "Do not modify the code yet.",
      "First provide findings with severity and suggested fixes."
    ]
  },
  tests: {
    task: "Add or improve tests for this feature.",
    requirements: [
      "Cover the main success path.",
      "Cover important edge cases.",
      "Avoid brittle tests.",
      "Follow the existing test style in the project.",
      "Run the relevant test command if available."
    ]
  },
  explain: {
    task: "Explain how this code works.",
    requirements: [
      "Use simple language.",
      "Explain the main flow step by step.",
      "Identify the most important functions and files.",
      "Mention any confusing or risky parts.",
      "Provide a short summary at the end."
    ]
  },
  security: {
    task: "Review this code for potential security issues.",
    focus: [
      "Input validation.",
      "Authentication and authorization.",
      "Secrets exposure.",
      "Unsafe shell commands.",
      "Dependency risks.",
      "Injection vulnerabilities.",
      "Data leakage."
    ],
    constraints: [
      "Do not make changes yet.",
      "Provide findings with severity and recommended fixes."
    ]
  }
};

export function isPromptMode(value: string): value is PromptMode {
  return promptModes.includes(value as PromptMode);
}
