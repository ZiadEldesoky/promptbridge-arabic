import type { GlossaryEntry } from "./glossary.js";
import { promptModes, type PromptMode } from "./modes.js";
import type { PreservedTechnicalToken } from "./preserveTechnicalTokens.js";

export type IntentConfidence = "low" | "medium" | "high";

export interface PromptIntentSignals {
  hasArabic: boolean;
  friendly: boolean;
  friendlyOnly: boolean;
  business: boolean;
  generalRequest: boolean;
  selectedFragment: boolean;
  codingIntent: boolean;
  cleanCode: boolean;
  organizedCode: boolean;
  responsive: boolean;
  performance: boolean;
  implementation: boolean;
  preserveDesign: boolean;
  preserveLogic: boolean;
  smallSafeChange: boolean;
  buildError: boolean;
  error: boolean;
  crash: boolean;
  saveReload: boolean;
  security: boolean;
  securityHardening: boolean;
  simpleExplanation: boolean;
  tests: boolean;
  review: boolean;
  reviewFeedback: boolean;
  noDeletion: boolean;
  urgent: boolean;
}

export interface PromptIntentSlots {
  targets: string[];
  constraints: string[];
  technicalHints: string[];
}

export interface PromptIntentAnalysis {
  mode: PromptMode;
  confidence: IntentConfidence;
  scores: Record<PromptMode, number>;
  matchedPatterns: string[];
  slots: PromptIntentSlots;
}

interface AnalyzePromptIntentInput {
  text: string;
  signals: PromptIntentSignals;
  glossaryMatches: GlossaryEntry[];
  tokens: PreservedTechnicalToken[];
}

const modeTieBreakPriority: PromptMode[] = [
  "tests",
  "explain",
  "security",
  "review",
  "fix",
  "refactor",
  "general"
];

export function analyzePromptIntent(
  input: AnalyzePromptIntentInput
): PromptIntentAnalysis {
  const scores = initialScores();
  const matchedPatterns: string[] = [];

  scoreSignals(scores, matchedPatterns, input.signals);
  scoreGlossaryTags(scores, matchedPatterns, input.glossaryMatches);
  scoreCombinedSignals(
    scores,
    matchedPatterns,
    input.signals,
    new Set(input.glossaryMatches.flatMap((match) => match.tags))
  );

  const mode = chooseMode(scores);
  const confidence = confidenceFor(scores, mode, input.signals);

  return {
    mode,
    confidence,
    scores,
    matchedPatterns: unique(matchedPatterns),
    slots: extractSlots(input.text, input.signals, input.tokens)
  };
}

function initialScores(): Record<PromptMode, number> {
  return Object.fromEntries(promptModes.map((mode) => [mode, 0])) as Record<
    PromptMode,
    number
  >;
}

function scoreSignals(
  scores: Record<PromptMode, number>,
  matchedPatterns: string[],
  signals: PromptIntentSignals
): void {
  if (signals.selectedFragment) {
    addScore(scores, matchedPatterns, "general", 100, "selected fragment");
    return;
  }

  if (signals.friendlyOnly) {
    addScore(scores, matchedPatterns, "general", 10, "friendly-only message");
  }

  if (signals.security) {
    addScore(scores, matchedPatterns, "security", 7, "security intent");
  }

  if (signals.security && signals.review) {
    addScore(scores, matchedPatterns, "security", 4, "security review");
  }

  if (signals.securityHardening) {
    addScore(scores, matchedPatterns, "security", 5, "security hardening");
  }

  if (signals.security && (signals.cleanCode || signals.organizedCode)) {
    addScore(
      scores,
      matchedPatterns,
      "security",
      5,
      "security plus code quality"
    );
  }

  if (signals.simpleExplanation) {
    addScore(scores, matchedPatterns, "explain", 8, "explanation request");
  }

  if (signals.tests) {
    addScore(scores, matchedPatterns, "tests", 8, "test request");
  }

  if (signals.reviewFeedback) {
    addScore(scores, matchedPatterns, "review", 9, "completed-work feedback");
  } else if (signals.review) {
    addScore(scores, matchedPatterns, "review", 6, "review request");
  }

  if (signals.buildError) {
    addScore(scores, matchedPatterns, "fix", 9, "build error");
  }

  if (signals.saveReload) {
    addScore(scores, matchedPatterns, "fix", 9, "save reload bug");
  }

  if (signals.crash) {
    addScore(scores, matchedPatterns, "fix", 8, "crash or hang");
  }

  if (signals.error) {
    addScore(scores, matchedPatterns, "fix", 5, "reported error");
  }

  if (signals.responsive) {
    addScore(scores, matchedPatterns, "refactor", 8, "responsive UI");
  }

  if (signals.performance) {
    addScore(scores, matchedPatterns, "refactor", 6, "performance request");
  }

  if (signals.cleanCode) {
    addScore(scores, matchedPatterns, "refactor", 5, "clean code");
  }

  if (signals.organizedCode) {
    addScore(scores, matchedPatterns, "refactor", 5, "organized code");
  }

  if (signals.preserveDesign) {
    addScore(scores, matchedPatterns, "refactor", 3, "preserve design");
  }

  if (signals.preserveLogic) {
    addScore(scores, matchedPatterns, "refactor", 3, "preserve logic");
  }

  if (signals.business) {
    addScore(scores, matchedPatterns, "general", 3, "business context");
  }

  if (signals.generalRequest) {
    addScore(scores, matchedPatterns, "general", 2, "general request");
  }

  if (signals.implementation) {
    addScore(scores, matchedPatterns, "general", 2, "implementation wording");
  }

  if (signals.hasArabic) {
    addScore(scores, matchedPatterns, "general", 1, "arabic text");
  }
}

function scoreGlossaryTags(
  scores: Record<PromptMode, number>,
  matchedPatterns: string[],
  matches: GlossaryEntry[]
): void {
  for (const tag of new Set(matches.flatMap((match) => match.tags))) {
    switch (tag) {
      case "security":
        addScore(scores, matchedPatterns, "security", 8, "glossary:security");
        break;
      case "tests":
        addScore(scores, matchedPatterns, "tests", 4, "glossary:tests");
        break;
      case "explain":
        addScore(scores, matchedPatterns, "explain", 4, "glossary:explain");
        break;
      case "review":
        addScore(scores, matchedPatterns, "review", 3, "glossary:review");
        break;
      case "fix":
      case "error":
      case "crash":
        addScore(scores, matchedPatterns, "fix", 2, `glossary:${tag}`);
        break;
      case "refactor":
      case "responsive":
      case "performance":
        addScore(scores, matchedPatterns, "refactor", 5, `glossary:${tag}`);
        break;
      case "friendly":
      case "business":
      case "general":
        addScore(scores, matchedPatterns, "general", 1, `glossary:${tag}`);
        break;
      default:
        break;
    }
  }
}

function scoreCombinedSignals(
  scores: Record<PromptMode, number>,
  matchedPatterns: string[],
  signals: PromptIntentSignals,
  tags: Set<string>
): void {
  if (
    signals.business &&
    signals.generalRequest &&
    tags.has("refactor") &&
    !signals.buildError &&
    !signals.error &&
    !signals.review &&
    !signals.security &&
    !signals.tests &&
    !signals.simpleExplanation
  ) {
    addScore(
      scores,
      matchedPatterns,
      "refactor",
      5,
      "business workflow improvement"
    );
  }
}

function addScore(
  scores: Record<PromptMode, number>,
  matchedPatterns: string[],
  mode: PromptMode,
  amount: number,
  pattern: string
): void {
  scores[mode] += amount;
  matchedPatterns.push(pattern);
}

function chooseMode(scores: Record<PromptMode, number>): PromptMode {
  return modeTieBreakPriority.reduce<PromptMode>((bestMode, candidateMode) => {
    if (scores[candidateMode] > scores[bestMode]) {
      return candidateMode;
    }

    return bestMode;
  }, "general");
}

function confidenceFor(
  scores: Record<PromptMode, number>,
  mode: PromptMode,
  signals: PromptIntentSignals
): IntentConfidence {
  if (signals.selectedFragment || signals.friendlyOnly) {
    return "high";
  }

  const sortedScores = [...promptModes]
    .map((candidateMode) => scores[candidateMode])
    .sort((left, right) => right - left);
  const winningScore = scores[mode];
  const runnerUpScore = sortedScores[1] ?? 0;

  if (winningScore <= 2) {
    return "low";
  }

  if (winningScore >= 8 && winningScore - runnerUpScore >= 3) {
    return "high";
  }

  return "medium";
}

function extractSlots(
  text: string,
  signals: PromptIntentSignals,
  tokens: PreservedTechnicalToken[]
): PromptIntentSlots {
  return {
    targets: extractTargets(text, tokens),
    constraints: extractConstraints(signals),
    technicalHints: unique(tokens.map((token) => token.value))
  };
}

function extractTargets(
  text: string,
  tokens: PreservedTechnicalToken[]
): string[] {
  const targets: string[] = tokens
    .filter((token) => token.kind === "file_path")
    .filter((token) => isLikelyTargetToken(token.value))
    .map((token) => token.value);

  addPatternTarget(targets, text, /\b([A-Za-z0-9_-]+)\s+flow\b/i, "$1 flow");
  addPatternTarget(targets, text, /\b(API\s+route)\b/i, "$1");
  addPatternTarget(targets, text, /صفحة\s+([A-Za-z0-9_-]+)/iu, "$1 page");
  addPatternTarget(targets, text, /زرار\s+([A-Za-z0-9_-]+)/iu, "$1 button");
  addPatternTarget(
    targets,
    text,
    /(?:فورم|الفورم)\s+([A-Za-z0-9_-]+)/iu,
    "$1 form"
  );

  return unique(targets.filter((target) => target && !hasArabicText(target)));
}

function isLikelyTargetToken(value: string): boolean {
  if (["Next.js", "React.js", "Vue.js"].includes(value)) {
    return false;
  }

  return true;
}

function addPatternTarget(
  targets: string[],
  text: string,
  pattern: RegExp,
  replacement: string
): void {
  const match = text.match(pattern);

  if (!match) {
    return;
  }

  targets.push(match[0].replace(pattern, replacement));
}

function extractConstraints(signals: PromptIntentSignals): string[] {
  const constraints: string[] = [];

  if (signals.preserveDesign) {
    constraints.push("preserve visual design");
  }

  if (signals.preserveLogic) {
    constraints.push("preserve business logic");
  }

  if (signals.noDeletion) {
    constraints.push("do not remove existing content or fields");
  }

  if (signals.smallSafeChange) {
    constraints.push("smallest safe change");
  }

  if (signals.urgent) {
    constraints.push("prioritize the blocking issue first");
  }

  return constraints;
}

function hasArabicText(input: string): boolean {
  return /[\u0600-\u06ff]/.test(input);
}

function unique<T>(values: T[]): T[] {
  return values.filter((value, index, array) => array.indexOf(value) === index);
}
