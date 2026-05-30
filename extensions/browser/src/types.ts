import type { PromptMode } from "../../../src/translator/modes.js";

export interface BrowserPromptBridgeOptions {
  mode?: PromptMode;
  bilingual?: boolean;
  redact?: boolean;
  fallbackToFocusedField?: boolean;
}

export interface PromptBridgeMessage {
  type: "PROMPTBRIDGE_REPLACE_SELECTION";
  options?: BrowserPromptBridgeOptions;
}

export interface ReplacementResult {
  converted: boolean;
  reason?: string;
  characterCount?: number;
}
