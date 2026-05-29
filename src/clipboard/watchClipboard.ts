import clipboard from "clipboardy";
import type { TranslatePromptOptions } from "../translator/translatePrompt.js";
import { translatePrompt } from "../translator/translatePrompt.js";

export interface WatchClipboardOptions {
  translateOptions?: TranslatePromptOptions;
  intervalMs?: number;
  once?: boolean;
  quiet?: boolean;
  readText?: () => Promise<string>;
  writeText?: (text: string) => Promise<void>;
  onConvert?: (event: ClipboardConversionEvent) => void;
}

export interface ClipboardConversionEvent {
  input: string;
  output: string;
  converted: boolean;
  reason?: string;
}

const defaultIntervalMs = 750;

export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

export async function convertClipboardOnce(
  options: WatchClipboardOptions = {}
): Promise<ClipboardConversionEvent> {
  const readText = options.readText ?? clipboard.read;
  const writeText = options.writeText ?? clipboard.write;
  const input = await readText();
  const event = convertClipboardText(input, options.translateOptions);

  if (event.converted) {
    await writeText(event.output);
  }

  options.onConvert?.(event);
  return event;
}

export async function watchClipboard(
  options: WatchClipboardOptions = {}
): Promise<void> {
  if (options.once) {
    await convertClipboardOnce(options);
    return;
  }

  const readText = options.readText ?? clipboard.read;
  const writeText = options.writeText ?? clipboard.write;
  const intervalMs = Math.max(options.intervalMs ?? defaultIntervalMs, 200);
  let lastSeen = "";
  let lastOutput = "";

  if (!options.quiet) {
    console.error(
      `Watching clipboard for Arabic prompts every ${intervalMs}ms. Press Ctrl+C to stop.`
    );
  }

  for (;;) {
    const input = await readText().catch(() => "");

    if (input && input !== lastSeen && input !== lastOutput) {
      const event = convertClipboardText(input, options.translateOptions);
      lastSeen = input;

      if (event.converted) {
        await writeText(event.output);
        lastOutput = event.output;
        options.onConvert?.(event);

        if (!options.quiet) {
          console.error("Converted Arabic clipboard text to English prompt.");
        }
      }
    }

    await sleep(intervalMs);
  }
}

export function convertClipboardText(
  input: string,
  options: TranslatePromptOptions = {}
): ClipboardConversionEvent {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return {
      input,
      output: input,
      converted: false,
      reason: "empty"
    };
  }

  if (!containsArabic(trimmedInput)) {
    return {
      input,
      output: input,
      converted: false,
      reason: "no_arabic"
    };
  }

  const result = translatePrompt(trimmedInput, options);

  return {
    input,
    output: result.output,
    converted: true
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
