import {
  formatOutput,
  formatStructuredPrompt,
  type StructuredPrompt
} from "../formatting/formatOutput.js";
import { redactSecrets } from "../redaction/redactSecrets.js";
import {
  findGlossaryMatches,
  mergeGlossaries,
  normalizeDeveloperPhrases,
  replaceGlossaryPhrase,
  type GlossaryEntry
} from "./glossary.js";
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
  glossary?: GlossaryEntry[];
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
  hasArabic: boolean;
  friendly: boolean;
  friendlyOnly: boolean;
  business: boolean;
  generalRequest: boolean;
  selectedFragment: boolean;
  codingIntent: boolean;
  cleanCode: boolean;
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
  const glossary = mergeGlossaries(options.glossary);
  const signals = detectSignals(redaction.text);
  const mode = options.mode ?? inferMode(redaction.text, signals, glossary);
  const structuredPrompt = buildStructuredPrompt(
    mode,
    signals,
    redaction.text,
    preserved.tokens,
    glossary
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

function inferMode(
  text: string,
  signals: PromptSignals,
  glossary: GlossaryEntry[]
): PromptMode {
  const glossaryMatches = findGlossaryMatches(text, glossary);
  const tags = new Set(glossaryMatches.flatMap((match) => match.tags));

  if (signals.selectedFragment) {
    return "general";
  }

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

  if (
    signals.friendlyOnly ||
    signals.business ||
    signals.generalRequest ||
    tags.has("friendly") ||
    tags.has("business") ||
    tags.has("general") ||
    signals.hasArabic
  ) {
    return "general";
  }

  return "fix";
}

function buildStructuredPrompt(
  mode: PromptMode,
  signals: PromptSignals,
  text: string,
  tokens: PreservedTechnicalToken[],
  glossary: GlossaryEntry[]
): StructuredPrompt {
  const friendlyTranslation = translateFriendlyOnlyMessage(text);
  const naturalTranslation = translateNaturalMessage(text, glossary);

  if (mode === "general" && signals.friendlyOnly && friendlyTranslation) {
    return { task: friendlyTranslation };
  }

  if (mode === "general" && naturalTranslation) {
    return { task: naturalTranslation };
  }

  const template = modeTemplates[mode];
  const prompt: StructuredPrompt = {
    task: buildTask(mode, signals, template),
    context: contextFromInput(text, signals, glossary),
    requirements: unique([
      ...modeRequirements(mode, template, signals),
      ...signalRequirements(mode, signals)
    ]),
    focus: template.focus,
    constraints: unique([
      ...modeConstraints(mode, template, signals),
      ...signalConstraints(mode, signals)
    ]),
    expectedOutput: expectedOutputForMode(mode, signals),
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
  signals: PromptSignals,
  glossary: GlossaryEntry[]
): string[] {
  const approximateRequest = approximateEnglishRequest(text, glossary);
  const phraseContext = normalizeDeveloperPhrases(text, glossary).filter(
    (phrase) => !approximateRequest?.includes(phrase)
  );
  const context = approximateRequest
    ? [`Natural English interpretation: ${approximateRequest}`, ...phraseContext]
    : [...phraseContext];

  if (signals.buildError) {
    context.push("The user is likely reporting a build failure.");
  }

  if (signals.saveReload) {
    context.push("The user is reporting that a save action reloads the page.");
  }

  if (signals.crash) {
    context.push("The user is reporting a crash or hang.");
  }

  if (signals.business) {
    context.push("The request includes business or product workflow context.");
  }

  if (signals.friendly && !signals.friendlyOnly) {
    context.push("The user included a friendly greeting or casual tone.");
  }

  return unique(context);
}

function buildTask(
  mode: PromptMode,
  signals: PromptSignals,
  template: ModeTemplate
): string {
  if (mode === "general") {
    if (signals.business) {
      return "Turn this Arabic business or product request into a clear English implementation prompt.";
    }

    return "Translate and clarify this Arabic request in natural English.";
  }

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

  if (mode === "refactor" && signals.performance) {
    return "Improve this code's performance while preserving its behavior.";
  }

  if (mode === "explain" && signals.simpleExplanation) {
    return "Explain how this code works in simple language.";
  }

  if (mode === "security") {
    if (signals.securityHardening) {
      if (signals.cleanCode) {
        return "Improve this code to make it secure, clean, and maintainable.";
      }

      return "Improve this code to make it more secure.";
    }

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

  if (mode === "refactor" && signals.performance) {
    return [
      "Identify the likely performance bottleneck before changing code.",
      "Make targeted improvements that preserve existing behavior.",
      "Avoid broad rewrites unless they are necessary for the performance fix.",
      "Keep public APIs stable unless a change is required.",
      "Run the relevant build, test, or profiling command when available.",
      "Explain what improved and how it was verified."
    ];
  }

  if (mode === "security" && signals.securityHardening) {
    const requirements = [
      "Identify the security risks that are relevant to the provided code or request.",
      "Make the smallest safe changes needed to improve security.",
      "Preserve existing behavior and public APIs unless a security fix requires otherwise.",
      "Avoid broad rewrites or unrelated refactors.",
      "Add or update tests if the security change affects behavior.",
      "Run the relevant build, test, or security check when available.",
      "Explain what was hardened and why."
    ];

    if (signals.cleanCode) {
      requirements.splice(
        3,
        0,
        "Improve readability, structure, and maintainability without changing behavior."
      );
    }

    return requirements;
  }

  return template.requirements ?? [];
}

function modeConstraints(
  mode: PromptMode,
  template: ModeTemplate,
  signals: PromptSignals
): string[] {
  if (mode === "security" && signals.securityHardening) {
    return [];
  }

  return template.constraints ?? [];
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

  if (signals.business) {
    requirements.push(
      "Preserve any business entities, workflows, and product constraints mentioned by the user."
    );
  }

  if (mode === "general" && signals.implementation) {
    requirements.push("Express the request as a concise implementation prompt.");
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

function expectedOutputForMode(
  mode: PromptMode,
  signals: PromptSignals
): string[] {
  if (mode === "general") {
    return [
      "A natural English version of the request.",
      "A concise actionable prompt when the request is product or implementation related."
    ];
  }

  if (mode === "security" && signals.securityHardening) {
    return [
      "A concise summary of the security changes.",
      "The risks addressed by the changes.",
      "What was verified."
    ];
  }

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
  const security = containsAny(normalized, [
    "security",
    "secure",
    "secure it",
    "secure the code",
    "make it secure",
    "make the code secure",
    "harden",
    "hardening",
    "حماية",
    "أمان",
    "امان",
    "أمن",
    "امن",
    "آمن",
    "آمنة",
    "امنة",
    "ثغرة",
    "ثغرات",
    "vulnerability",
    "vulnerabilities"
  ]);
  const securityHardening =
    security &&
    containsAny(normalized, [
      "خلي",
      "خلّي",
      "خليه",
      "خليها",
      "اجعل",
      "اعمل",
      "حسن",
      "حسّن",
      "زود",
      "ضيف",
      "صلح",
      "make",
      "improve",
      "secure it",
      "secure the code",
      "make it secure",
      "make this secure",
      "make the code secure",
      "harden"
    ]) &&
    !containsAny(normalized, [
      "راجع بس",
      "review only",
      "do not change",
      "without changing",
      "متعدلش",
      "من غير تعديل"
    ]);
  const cleanCode = containsAny(normalized, [
    "clean",
    "clean code",
    "maintainable",
    "maintainability",
    "نضيف",
    "نظيف",
    "نظيفة",
    "نضيفه",
    "نضف",
    "نظف",
    "رتب",
    "منظم",
    "قابل للصيانة"
  ]);
  const friendly = containsAny(normalized, [
    "هاي",
    "هاى",
    "مرحبا",
    "أهلا",
    "اهلا",
    "السلام عليكم",
    "ازيك",
    "إزيك",
    "عامل ايه",
    "صباح الخير",
    "مساء الخير",
    "شكرا"
  ]);
  const friendlyOnly = isFriendlyOnlyMessage(normalized);
  const business = containsAny(normalized, [
    "business",
    "product",
    "بزنس",
    "بيزنس",
    "منتج",
    "مشروع",
    "عميل",
    "عملاء",
    "طلبات",
    "اوردر",
    "أوردر",
    "order",
    "orders",
    "مبيعات",
    "sales",
    "مخزون",
    "inventory",
    "فاتورة",
    "invoice",
    "checkout",
    "دفع",
    "payment",
    "شحن",
    "shipping",
    "store",
    "متجر",
    "لوحة تحكم",
    "dashboard",
    "صفحة",
    "زرار",
    "فورم",
    "واجهة",
    "login",
    "auth"
  ]);
  const generalRequest = containsAny(normalized, [
    "عايز",
    "محتاج",
    "لو سمحت",
    "اعمل",
    "أزود",
    "ازود",
    "أضيف",
    "ضيف",
    "زود",
    "ظبط",
    "ظبطلي",
    "اضبط",
    "خلي",
    "اكتب",
    "حوّل",
    "حول",
    "translate",
    "convert"
  ]);
  const responsive = containsAny(normalized, [
    "responsive",
    "ريسبونسيف",
    "متجاوب",
    "الموبايل",
    "موبايل",
    "mobile"
  ]);
  const performance = containsAny(normalized, [
    "performance",
    "faster",
    "slow",
    "optimize",
    "تحسين الأداء",
    "تحسين الاداء",
    "الأداء",
    "الاداء",
    "أسرع",
    "اسرع",
    "بطيء",
    "بطئ"
  ]);
  const simpleExplanation = containsAny(normalized, [
    "اشرح",
    "اشرحلي",
    "ببساطة",
    "explain",
    "simple"
  ]);
  const tests = containsAny(normalized, [
    "test",
    "tests",
    "اختبار",
    "اختبارات",
    "تيست",
    "تيستات",
    "vitest",
    "jest"
  ]);
  const review = containsAny(normalized, [
    "راجع",
    "افحص",
    "review",
    "code review",
    "شوف فيه مشاكل"
  ]);
  const buildError = containsAny(normalized, [
    "build error",
    "بيلد error",
    "خطأ build",
    "مشكلة build",
    "npm run build"
  ]);
  const error = containsAny(normalized, [
    "error",
    "bug",
    "مشكلة",
    "غلط",
    "مش شغال",
    "مش راضي يشتغل",
    "بيطلع"
  ]);
  const crash = containsAny(normalized, ["crash", "بيكراش", "بيهنج", "hang"]);
  const implementation = containsAny(normalized, [
    "نفذ",
    "طبّق",
    "طبق",
    "ابني",
    "اعمل",
    "ضيف",
    "زود",
    "implement",
    "build",
    "add",
    "create"
  ]);
  const codingIntent =
    business ||
    responsive ||
    performance ||
    security ||
    cleanCode ||
    simpleExplanation ||
    tests ||
    review ||
    buildError ||
    error ||
    crash ||
    implementation ||
    containsAny(normalized, [
      "الكود",
      "كود",
      "code",
      "api",
      "function",
      "component",
      "database",
      "db",
      "frontend",
      "backend",
      "ui",
      "ux"
    ]);
  const selectedFragment =
    hasArabicText(normalized) &&
    !generalRequest &&
    !implementation &&
    !review &&
    !tests &&
    !simpleExplanation &&
    !buildError &&
    !error &&
    !crash &&
    wordCount(normalized) <= 5;

  return {
    hasArabic: hasArabicText(normalized),
    friendly,
    friendlyOnly,
    business,
    generalRequest,
    selectedFragment,
    codingIntent,
    cleanCode,
    responsive,
    performance,
    implementation,
    preserveDesign: containsAny(normalized, [
      "بدون ما تغير في الديزاين",
      "بدون ما تغير الديزاين",
      "بدون تغيير الديزاين",
      "بدون تغيير التصميم",
      "من غير ما تغير الديزاين",
      "من غير ما تغير التصميم",
      "من غير تغيير الديزاين",
      "من غير تغيير التصميم",
      "متغيرش الديزاين",
      "متغيرش شكل",
      "متبوظش الديزاين",
      "متبوظش التصميم",
      "نفس الديزاين",
      "نفس التصميم",
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
    buildError,
    error,
    crash,
    saveReload: containsAny(normalized, [
      "save",
      "حفظ"
    ]) && containsAny(normalized, ["reload", "refresh", "ريلود", "بتعمل reload"]),
    security,
    securityHardening,
    simpleExplanation,
    tests,
    review,
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
    general:
      "المطلوب تحويل الكلام العربي إلى إنجليزي طبيعي وواضح مع الحفاظ على المعنى والنبرة والتفاصيل المهمة.",
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

  if (mode === "security" && signals.securityHardening) {
    details[0] =
      "المطلوب تحسين أمان الكود بأقل تغييرات آمنة ممكنة، مع الحفاظ على السلوك الحالي وتشغيل الاختبار المناسب.";
  }

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

function hasArabicText(input: string): boolean {
  return /[\u0600-\u06ff]/.test(input);
}

function wordCount(input: string): number {
  return input.trim().split(/\s+/).filter(Boolean).length;
}

function isFriendlyOnlyMessage(input: string): boolean {
  const normalized = normalizeFriendlyText(input);
  const friendlyPhrases = [
    "هاي",
    "هاى",
    "مرحبا",
    "أهلا",
    "اهلا",
    "السلام عليكم",
    "صباح الخير",
    "مساء الخير",
    "شكرا",
    "ازيك",
    "إزيك",
    "عامل ايه",
    "إزيك عامل ايه",
    "ازيك عامل ايه",
    "تمام"
  ];

  return friendlyPhrases.includes(normalized);
}

function translateFriendlyOnlyMessage(input: string): string | undefined {
  switch (normalizeFriendlyText(input)) {
    case "هاي":
    case "هاى":
      return "Hi.";
    case "مرحبا":
    case "أهلا":
    case "اهلا":
    case "السلام عليكم":
      return "Hello.";
    case "صباح الخير":
      return "Good morning.";
    case "مساء الخير":
      return "Good evening.";
    case "شكرا":
      return "Thank you.";
    case "ازيك":
    case "إزيك":
    case "عامل ايه":
    case "إزيك عامل ايه":
    case "ازيك عامل ايه":
      return "How are you?";
    case "تمام":
      return "Okay.";
    default:
      return undefined;
  }
}

function normalizeFriendlyText(input: string): string {
  return input
    .trim()
    .replace(/[؟?!.,،؛:]+/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function approximateEnglishRequest(
  text: string,
  glossary: GlossaryEntry[]
): string | undefined {
  if (!hasArabicText(text)) {
    return undefined;
  }

  const matches = findGlossaryMatches(text, glossary).sort(
    (left, right) => right.arabic.length - left.arabic.length
  );

  if (!matches.length) {
    return undefined;
  }

  let translated = text.trim();

  for (const entry of matches) {
    translated = replaceGlossaryPhrase(translated, entry.arabic, entry.english);
  }

  translated = translated
    .replace(/[،؛]/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  return translated === text.trim() ? undefined : translated;
}

function translateNaturalMessage(
  text: string,
  glossary: GlossaryEntry[]
): string | undefined {
  const translated = approximateEnglishRequest(text, glossary);

  if (!translated) {
    return undefined;
  }

  return sentenceCase(cleanApproximateTranslation(translated));
}

function cleanApproximateTranslation(input: string): string {
  return input
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCase(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return trimmed;
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function unique(values: string[]): string[] {
  return values.filter((value, index, array) => array.indexOf(value) === index);
}
