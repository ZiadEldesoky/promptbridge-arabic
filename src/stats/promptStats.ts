import {
  translatePrompt,
  type TranslatePromptOptions,
  type TranslatePromptResult
} from "../translator/translatePrompt.js";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF]/g;

export interface TextStats {
  characters: number;
  words: number;
  estimatedTokens: number;
}

export interface PromptStatsResult {
  mode: TranslatePromptResult["mode"];
  input: TextStats;
  output: TextStats;
  delta: {
    characters: number;
    estimatedTokens: number;
  };
  preservedTechnicalTokens: number;
  redactionCount: number;
  note: string;
}

export function analyzePromptStats(
  input: string,
  options: TranslatePromptOptions = {}
): PromptStatsResult {
  const result = translatePrompt(input, options);
  const inputStats = analyzeText(input);
  const outputStats = analyzeText(result.output);

  return {
    mode: result.mode,
    input: inputStats,
    output: outputStats,
    delta: {
      characters: outputStats.characters - inputStats.characters,
      estimatedTokens:
        outputStats.estimatedTokens - inputStats.estimatedTokens
    },
    preservedTechnicalTokens: result.preservedTokens.length,
    redactionCount: result.redactionCount,
    note:
      "Token counts are deterministic estimates, not model-specific tokenizer results."
  };
}

export function analyzeText(text: string): TextStats {
  const normalizedText = text.trim();

  return {
    characters: [...normalizedText].length,
    words: countWords(normalizedText),
    estimatedTokens: estimateApproximateTokens(normalizedText)
  };
}

export function estimateApproximateTokens(text: string): number {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return 0;
  }

  const arabicCharacters = normalizedText.match(ARABIC_TEXT_PATTERN)?.length ?? 0;
  const nonArabicCharacters = [...normalizedText].length - arabicCharacters;
  const whitespaceChunks = normalizedText.split(/\s+/).filter(Boolean).length;
  const characterEstimate = Math.ceil(
    arabicCharacters / 1.6 + nonArabicCharacters / 4
  );

  return Math.max(whitespaceChunks, characterEstimate);
}

export function formatPromptStats(stats: PromptStatsResult): string {
  return [
    "PromptBridge stats",
    `Mode: ${stats.mode}`,
    `Input: ${formatTextStats(stats.input)}`,
    `Output: ${formatTextStats(stats.output)}`,
    `Delta: ${formatSigned(stats.delta.characters)} characters, ${formatSigned(
      stats.delta.estimatedTokens
    )} estimated tokens`,
    `Preserved technical tokens: ${stats.preservedTechnicalTokens}`,
    `Redacted secrets: ${stats.redactionCount}`,
    `Note: ${stats.note}`
  ].join("\n");
}

function countWords(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return text.split(/\s+/).filter(Boolean).length;
}

function formatTextStats(stats: TextStats): string {
  return `${stats.characters} characters, ${stats.words} words, ~${stats.estimatedTokens} tokens`;
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
