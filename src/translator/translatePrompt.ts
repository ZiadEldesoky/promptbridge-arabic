import {
  formatOutput,
  formatStructuredPrompt,
  type StructuredPrompt
} from "../formatting/formatOutput.js";
import { redactSecrets } from "../redaction/redactSecrets.js";
import { findGlossaryMatches, normalizeDeveloperPhrases } from "./glossary.js";
import {
  modeTemplates,
  type ModeTemplate,
  type PromptMode
} from "./modes.js";
import {
  preserveTechnicalTokens,
  type PreservedTechnicalToken
} from "./preserveTechnicalTokens.js";

export interface TranslatePromptOptions {
  mode?: PromptMode;
  bilingual?: boolean;
  redact?: boolean;
}

export interface TranslatePromptResult {
  mode: PromptMode;
  englishPrompt: string;
  arabicSummary?: string;
  output: string;
  redactionCount: number;
  preservedTokens: PreservedTechnicalToken[];
}

interface PromptSignals {
  responsive: boolean;
  preserveDesign: boolean;
  preserveLogic: boolean;
  smallSafeChange: boolean;
  buildError: boolean;
  error: boolean;
  crash: boolean;
  saveReload: boolean;
  security: boolean;
  simpleExplanation: boolean;
  tests: boolean;
  review: boolean;
  noDeletion: boolean;
  urgent: boolean;
}

export function translatePrompt(
  input: string,
  options: TranslatePromptOptions = {}
): TranslatePromptResult {
  const redaction = options.redact
    ? redactSecrets(input)
    : { text: input, redactionCount: 0, redactedPatternNames: [] };
  const preserved = preserveTechnicalTokens(redaction.text);
  const signals = detectSignals(redaction.text);
  const mode = options.mode ?? inferMode(redaction.text, signals);
  const structuredPrompt = buildStructuredPrompt(
    mode,
    signals,
    redaction.text,
    preserved.tokens
  );

  if (redaction.redactionCount > 0) {
    structuredPrompt.notes = [
      ...(structuredPrompt.notes ?? []),
      "Sensitive values were redacted before this prompt was generated."
    ];
  }

  const englishPrompt = formatStructuredPrompt(structuredPrompt);
  const arabicSummary = options.bilingual
    ? buildArabicSummary(mode, signals, redaction.redactionCount)
    : undefined;
  const output = formatOutput({
    englishPrompt,
    bilingual: options.bilingual,
    arabicSummary
  });

  return {
    mode,
    englishPrompt,
    arabicSummary,
    output,
    redactionCount: redaction.redactionCount,
    preservedTokens: preserved.tokens
  };
}

function inferMode(text: string, signals: PromptSignals): PromptMode {
  const glossaryMatches = findGlossaryMatches(text);
  const tags = new Set(glossaryMatches.flatMap((match) => match.tags));

  if (signals.security || tags.has("security")) {
    return "security";
  }

  if (signals.simpleExplanation || tags.has("explain")) {
    return "explain";
  }

  if (signals.tests || tags.has("tests")) {
    return "tests";
  }

  if (signals.review || tags.has("review")) {
    return "review";
  }

  if (
    signals.responsive ||
    signals.preserveDesign ||
    signals.preserveLogic ||
    tags.has("refactor")
  ) {
    return "refactor";
  }

  return "fix";
}

function buildStructuredPrompt(
  mode: PromptMode,
  signals: PromptSignals,
  text: string,
  tokens: PreservedTechnicalToken[]
): StructuredPrompt {
  const template = modeTemplates[mode];
  const prompt: StructuredPrompt = {
    task: buildTask(mode, signals, template),
    context: contextFromInput(text, signals),
    requirements: unique([
      ...modeRequirements(mode, template, signals),
      ...signalRequirements(mode, signals)
    ]),
    focus: template.focus,
    constraints: unique([
      ...(template.constraints ?? []),
      ...signalConstraints(mode, signals)
    ]),
    expectedOutput: expectedOutputForMode(mode),
    technicalContext: technicalContextFromTokens(tokens)
  };

  if (!prompt.requirements?.length) {
    delete prompt.requirements;
  }

  if (!prompt.context?.length) {
    delete prompt.context;
  }

  if (!prompt.constraints?.length) {
    delete prompt.constraints;
  }

  if (!prompt.expectedOutput?.length) {
    delete prompt.expectedOutput;
  }

  return prompt;
}

function contextFromInput(
  text: string,
  signals: PromptSignals
): string[] {
  const phraseContext = normalizeDeveloperPhrases(text);
  const context = [...phraseContext];

  if (signals.buildError) {
    context.push("The user is likely reporting a build failure.");
  }

  if (signals.saveReload) {
    context.push("The user is reporting that a save action reloads the page.");
  }

  if (signals.crash) {
    context.push("The user is reporting a crash or hang.");
  }

  return unique(context);
}

function buildTask(
  mode: PromptMode,
  signals: PromptSignals,
  template: ModeTemplate
): string {
  if (mode === "fix") {
    if (signals.buildError) {
      return "Investigate and fix the build error in this project.";
    }

    if (signals.saveReload) {
      return "Investigate and fix the bug where clicking Save reloads the page and does not persist the data.";
    }

    if (signals.crash) {
      return "Investigate and fix the crash in this code or project.";
    }

    if (signals.error) {
      return "Investigate and fix the reported error.";
    }
  }

  if (mode === "refactor" && signals.responsive) {
    return "Refactor this code to make it responsive.";
  }

  if (mode === "explain" && signals.simpleExplanation) {
    return "Explain how this code works in simple language.";
  }

  if (mode === "security") {
    return "Review this code for potential security issues.";
  }

  return template.task;
}

function modeRequirements(
  mode: PromptMode,
  template: ModeTemplate,
  signals: PromptSignals
): string[] {
  if (mode === "refactor" && signals.responsive) {
    return [
      "Make the affected UI responsive across common screen sizes.",
      "Preserve the existing behavior.",
      "Avoid changing public APIs unless necessary.",
      "Make the smallest safe changes.",
      "Explain what was changed and why."
    ];
  }

  return template.requirements ?? [];
}

function signalRequirements(
  mode: PromptMode,
  signals: PromptSignals
): string[] {
  const requirements: string[] = [];

  if (signals.preserveDesign) {
    requirements.push("Preserve the existing visual design.");
  }

  if (signals.preserveLogic) {
    requirements.push("Do not change the existing business logic.");
  }

  if (signals.noDeletion) {
    requirements.push("Do not remove existing content or fields unless explicitly required.");
  }

  if (signals.smallSafeChange && mode !== "refactor") {
    requirements.push("Make the smallest safe change that solves the request.");
  }

  if (signals.buildError && mode !== "fix") {
    requirements.push("Run the relevant build command after applying the fix.");
  }

  if (signals.tests && mode !== "tests") {
    requirements.push("Add or update tests if the change affects behavior.");
  }

  if (signals.urgent) {
    requirements.push("Prioritize the main blocking issue first.");
  }

  return requirements;
}

function signalConstraints(
  mode: PromptMode,
  signals: PromptSignals
): string[] {
  const constraints: string[] = [];

  if (signals.preserveDesign && mode !== "review" && mode !== "security") {
    constraints.push("Do not redesign the UI.");
  }

  if (signals.preserveLogic) {
    constraints.push("Avoid broad rewrites or unrelated refactors.");
  }

  return constraints;
}

function expectedOutputForMode(mode: PromptMode): string[] {
  if (mode === "review" || mode === "security") {
    return [
      "List findings ordered by severity.",
      "Include the reason each issue matters.",
      "Suggest concrete fixes."
    ];
  }

  if (mode === "explain") {
    return [
      "A clear explanation.",
      "Important files, functions, or flow details.",
      "A short summary."
    ];
  }

  return ["A concise summary of what changed and what was verified."];
}

function detectSignals(text: string): PromptSignals {
  const normalized = text.toLowerCase();

  return {
    responsive: containsAny(normalized, [
      "responsive",
      "ريسبونسيف",
      "متجاوب",
      "الموبايل",
      "موبايل",
      "mobile"
    ]),
    preserveDesign: containsAny(normalized, [
      "من غير ما تغير الديزاين",
      "من غير ما تغير التصميم",
      "متغيرش الديزاين",
      "متغيرش شكل",
      "متبوظش الديزاين",
      "متبوظش التصميم",
      "preserve design",
      "without changing the design"
    ]),
    preserveLogic: containsAny(normalized, [
      "من غير ما تغير اللوجيك",
      "متغيرش اللوجيك",
      "من غير ما تغير ال logic",
      "business logic",
      "without changing the logic"
    ]),
    smallSafeChange: containsAny(normalized, [
      "خلي التعديل بسيط",
      "تعديل بسيط",
      "بأقل تعديل",
      "اقل تعديل",
      "smallest safe",
      "safe change"
    ]),
    buildError: containsAny(normalized, [
      "build error",
      "بيلد error",
      "خطأ build",
      "مشكلة build",
      "npm run build"
    ]),
    error: containsAny(normalized, [
      "error",
      "bug",
      "مشكلة",
      "غلط",
      "مش شغال",
      "مش راضي يشتغل",
      "بيطلع"
    ]),
    crash: containsAny(normalized, ["crash", "بيكراش", "بيهنج", "hang"]),
    saveReload: containsAny(normalized, [
      "save",
      "حفظ"
    ]) && containsAny(normalized, ["reload", "refresh", "ريلود", "بتعمل reload"]),
    security: containsAny(normalized, [
      "security",
      "secure",
      "حماية",
      "أمان",
      "امان",
      "ثغرة",
      "vulnerability"
    ]),
    simpleExplanation: containsAny(normalized, [
      "اشرح",
      "اشرحلي",
      "ببساطة",
      "explain",
      "simple"
    ]),
    tests: containsAny(normalized, [
      "test",
      "tests",
      "اختبار",
      "اختبارات",
      "تيست",
      "vitest",
      "jest"
    ]),
    review: containsAny(normalized, [
      "راجع",
      "review",
      "code review",
      "شوف فيه مشاكل"
    ]),
    noDeletion: containsAny(normalized, [
      "متحذفش",
      "من غير ما تحذف",
      "بدون ما تحذف",
      "do not remove",
      "without removing"
    ]),
    urgent: containsAny(normalized, [
      "ضروري",
      "بسرعة",
      "urgent",
      "asap",
      "مهم"
    ])
  };
}

function buildArabicSummary(
  mode: PromptMode,
  signals: PromptSignals,
  redactionCount: number
): string {
  const summaries: Record<PromptMode, string> = {
    fix:
      "المطلوب فحص المشكلة، تحديد السبب الأساسي، إصلاحها بأقل تعديل آمن، وتشغيل الاختبار أو build المناسب بعد الإصلاح.",
    refactor:
      "المطلوب تحسين الكود وتنظيمه مع الحفاظ على السلوك الحالي وتجنب أي تغييرات غير ضرورية.",
    review:
      "المطلوب مراجعة الكود وإخراج ملاحظات عملية مرتبة حسب الخطورة بدون تعديل الكود مباشرة.",
    tests:
      "المطلوب إضافة أو تحسين tests تغطي المسار الأساسي والحالات المهمة بدون اختبارات هشة.",
    explain:
      "المطلوب شرح الكود بلغة بسيطة، خطوة بخطوة، مع توضيح أهم الملفات أو الدوال ونقاط الحذر.",
    security:
      "المطلوب مراجعة الكود من ناحية security وإخراج findings واضحة بالخطورة والحلول المقترحة."
  };

  const details: string[] = [summaries[mode]];

  if (signals.responsive) {
    details.push("كمان لازم نخلي الواجهة responsive.");
  }

  if (signals.preserveDesign) {
    details.push("لازم نحافظ على نفس شكل التصميم الحالي.");
  }

  if (signals.preserveLogic) {
    details.push("لازم نحافظ على نفس business logic.");
  }

  if (redactionCount > 0) {
    details.push("تم إخفاء secrets حساسة قبل توليد الـ prompt.");
  }

  return details.join(" ");
}

function technicalContextFromTokens(tokens: PreservedTechnicalToken[]): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const token of tokens) {
    if (seen.has(token.value)) {
      continue;
    }

    seen.add(token.value);
    values.push(token.value);
  }

  return values;
}

function containsAny(input: string, values: string[]): boolean {
  return values.some((value) => input.includes(value.toLowerCase()));
}

function unique(values: string[]): string[] {
  return values.filter((value, index, array) => array.indexOf(value) === index);
}
