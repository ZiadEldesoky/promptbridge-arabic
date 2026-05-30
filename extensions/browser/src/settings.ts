import { isPromptMode } from "../../../src/translator/modes.js";
import type { BrowserPromptBridgeOptions } from "./types.js";

const STORAGE_KEY = "promptbridgeBrowserSettings";

export interface BrowserSettings extends BrowserPromptBridgeOptions {
  bilingual: boolean;
  redact: boolean;
  fallbackToFocusedField: boolean;
}

export const DEFAULT_BROWSER_SETTINGS: BrowserSettings = {
  bilingual: false,
  redact: false,
  fallbackToFocusedField: true
};

declare const chrome:
  | {
      runtime?: {
        lastError?: { message?: string };
      };
      storage?: {
        sync?: {
          get: (
            keys: string[],
            callback: (items: Record<string, unknown>) => void
          ) => void;
          set: (items: Record<string, unknown>, callback?: () => void) => void;
        };
      };
    }
  | undefined;

export async function loadBrowserSettings(): Promise<BrowserSettings> {
  if (!chrome?.storage?.sync) {
    return DEFAULT_BROWSER_SETTINGS;
  }

  return new Promise((resolve) => {
    chrome.storage?.sync?.get([STORAGE_KEY], (items) => {
      if (chrome?.runtime?.lastError) {
        resolve(DEFAULT_BROWSER_SETTINGS);
        return;
      }

      resolve(normalizeBrowserSettings(items[STORAGE_KEY]));
    });
  });
}

export async function saveBrowserSettings(
  settings: BrowserSettings
): Promise<void> {
  if (!chrome?.storage?.sync) {
    return;
  }

  const normalizedSettings = normalizeBrowserSettings(settings);

  await new Promise<void>((resolve) => {
    chrome.storage?.sync?.set({ [STORAGE_KEY]: normalizedSettings }, () => {
      resolve();
    });
  });
}

export function normalizeBrowserSettings(value: unknown): BrowserSettings {
  if (!isRecord(value)) {
    return { ...DEFAULT_BROWSER_SETTINGS };
  }

  const mode =
    typeof value.mode === "string" && isPromptMode(value.mode)
      ? value.mode
      : undefined;

  return {
    ...DEFAULT_BROWSER_SETTINGS,
    mode,
    bilingual:
      typeof value.bilingual === "boolean"
        ? value.bilingual
        : DEFAULT_BROWSER_SETTINGS.bilingual,
    redact:
      typeof value.redact === "boolean"
        ? value.redact
        : DEFAULT_BROWSER_SETTINGS.redact,
    fallbackToFocusedField:
      typeof value.fallbackToFocusedField === "boolean"
        ? value.fallbackToFocusedField
        : DEFAULT_BROWSER_SETTINGS.fallbackToFocusedField
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
