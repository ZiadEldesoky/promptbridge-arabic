import type { GlossaryEntry } from "../translator/glossary.js";
import type { PromptMode } from "../translator/modes.js";

export type PromptBridgeOutput = "english" | "bilingual";

export interface PromptBridgeConfig {
  defaultMode?: PromptMode;
  defaultOutput?: PromptBridgeOutput;
  preserveArabicUIText?: boolean;
  redactSecrets?: boolean;
  agent?: string;
  style?: "structured";
  glossaryPath?: string;
}

export interface LoadedPromptBridgeConfig {
  config: PromptBridgeConfig;
  configPath?: string;
  glossaryEntries: GlossaryEntry[];
}
