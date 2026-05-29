export interface StructuredPrompt {
  task: string;
  context?: string[];
  requirements?: string[];
  focus?: string[];
  constraints?: string[];
  expectedOutput?: string[];
  technicalContext?: string[];
  notes?: string[];
}

export interface FormatOutputOptions {
  englishPrompt: string;
  bilingual?: boolean;
  arabicSummary?: string;
}

export function formatStructuredPrompt(prompt: StructuredPrompt): string {
  const lines: string[] = [prompt.task.trim()];

  appendSection(lines, "Context", prompt.context);
  appendSection(lines, "Requirements", prompt.requirements);
  appendSection(lines, "Focus on", prompt.focus);
  appendSection(lines, "Constraints", prompt.constraints);
  appendSection(lines, "Expected output", prompt.expectedOutput);
  appendTechnicalContext(lines, prompt.technicalContext);
  appendSection(lines, "Notes", prompt.notes);

  return lines.join("\n").trim();
}

export function formatOutput(options: FormatOutputOptions): string {
  if (!options.bilingual) {
    return options.englishPrompt.trim();
  }

  return [
    "## English prompt",
    "",
    options.englishPrompt.trim(),
    "",
    "## Arabic summary",
    "",
    options.arabicSummary?.trim() ?? "تم تحويل الطلب إلى Prompt إنجليزي منظم."
  ].join("\n");
}

function appendSection(
  lines: string[],
  title: string,
  items: string[] | undefined
): void {
  if (!items?.length) {
    return;
  }

  lines.push("", `${title}:`);
  items.forEach((item) => lines.push(`- ${item}`));
}

function appendTechnicalContext(
  lines: string[],
  technicalContext: string[] | undefined
): void {
  if (!technicalContext?.length) {
    return;
  }

  lines.push("", "Preserved technical context:");

  technicalContext.forEach((item) => {
    if (item.includes("\n") || item.trim().startsWith("```")) {
      lines.push("", item.trim(), "");
      return;
    }

    lines.push(`- ${item}`);
  });
}
