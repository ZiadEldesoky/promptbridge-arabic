import { execFile } from "node:child_process";
import { promisify } from "node:util";
import clipboard from "clipboardy";
import type { TranslatePromptOptions } from "../translator/translatePrompt.js";
import {
  convertClipboardText,
  type ClipboardConversionEvent
} from "./watchClipboard.js";

const execFileAsync = promisify(execFile);

export interface ReplaceSelectedTextOptions {
  translateOptions?: TranslatePromptOptions;
  copyDelayMs?: number;
  pasteDelayMs?: number;
  restoreClipboard?: boolean;
  platform?: NodeJS.Platform | string;
  readText?: () => Promise<string>;
  writeText?: (text: string) => Promise<void>;
  sendShortcut?: (shortcut: "copy" | "paste") => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  onConvert?: (event: ClipboardConversionEvent) => void;
}

export async function replaceSelectedText(
  options: ReplaceSelectedTextOptions = {}
): Promise<ClipboardConversionEvent> {
  const platform = options.platform ?? process.platform;

  if (platform !== "darwin") {
    return {
      input: "",
      output: "",
      converted: false,
      reason: "unsupported_platform"
    };
  }

  const readText = options.readText ?? clipboard.read;
  const writeText = options.writeText ?? clipboard.write;
  const sendShortcut = options.sendShortcut ?? sendMacShortcut;
  const wait = options.sleep ?? sleep;
  const copyDelayMs = options.copyDelayMs ?? 120;
  const pasteDelayMs = options.pasteDelayMs ?? 120;
  const originalClipboard = await readText().catch(() => "");

  await sendShortcut("copy");
  await wait(copyDelayMs);

  const selectedText = await readText();
  const event = convertClipboardText(selectedText, options.translateOptions);

  if (!event.converted) {
    if (options.restoreClipboard) {
      await writeText(originalClipboard);
    }

    options.onConvert?.(event);
    return event;
  }

  await writeText(event.output);
  await wait(pasteDelayMs);
  await sendShortcut("paste");

  if (options.restoreClipboard) {
    await wait(pasteDelayMs);
    await writeText(originalClipboard);
  }

  options.onConvert?.(event);
  return event;
}

async function sendMacShortcut(shortcut: "copy" | "paste"): Promise<void> {
  const key = shortcut === "copy" ? "c" : "v";

  await execFileAsync("osascript", [
    "-e",
    `tell application "System Events" to keystroke "${key}" using command down`
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
