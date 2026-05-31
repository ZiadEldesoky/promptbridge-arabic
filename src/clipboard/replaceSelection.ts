import { execFile } from "node:child_process";
import { promisify } from "node:util";
import clipboard from "clipboardy";
import type { TranslatePromptOptions } from "../translator/translatePrompt.js";
import {
  convertClipboardText,
  type ClipboardConversionEvent
} from "./watchClipboard.js";

const execFileAsync = promisify(execFile);
const supportedPlatforms = new Set(["darwin", "win32", "linux"]);

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

  if (!supportedPlatforms.has(platform)) {
    return {
      input: "",
      output: "",
      converted: false,
      reason: "unsupported_platform"
    };
  }

  const readText = options.readText ?? clipboard.read;
  const writeText = options.writeText ?? clipboard.write;
  const sendShortcut =
    options.sendShortcut ?? defaultShortcutSenderForPlatform(platform);
  const wait = options.sleep ?? sleep;
  const copyDelayMs = options.copyDelayMs ?? 120;
  const pasteDelayMs = options.pasteDelayMs ?? 120;
  const originalClipboard = await readText().catch(() => "");

  try {
    await sendShortcut("copy");
  } catch (error) {
    return {
      input: "",
      output: "",
      converted: false,
      reason: shortcutFailureReason(platform, error)
    };
  }

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

  try {
    await sendShortcut("paste");
  } catch (error) {
    if (options.restoreClipboard) {
      await writeText(originalClipboard);
    }

    return {
      input: selectedText,
      output: event.output,
      converted: false,
      reason: shortcutFailureReason(platform, error)
    };
  }

  if (options.restoreClipboard) {
    await wait(pasteDelayMs);
    await writeText(originalClipboard);
  }

  options.onConvert?.(event);
  return event;
}

function defaultShortcutSenderForPlatform(
  platform: NodeJS.Platform | string
): (shortcut: "copy" | "paste") => Promise<void> {
  switch (platform) {
    case "darwin":
      return sendMacShortcut;
    case "win32":
      return sendWindowsShortcut;
    case "linux":
      return sendLinuxShortcut;
    default:
      return async () => {
        throw new Error(`Unsupported platform: ${platform}`);
      };
  }
}

async function sendMacShortcut(shortcut: "copy" | "paste"): Promise<void> {
  const key = shortcut === "copy" ? "c" : "v";

  await execFileAsync("osascript", [
    "-e",
    `tell application "System Events" to keystroke "${key}" using command down`
  ]);
}

async function sendWindowsShortcut(shortcut: "copy" | "paste"): Promise<void> {
  const key = shortcut === "copy" ? "c" : "v";

  await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    [
      "Add-Type -AssemblyName System.Windows.Forms;",
      `[System.Windows.Forms.SendKeys]::SendWait('^${key}')`
    ].join(" ")
  ]);
}

async function sendLinuxShortcut(shortcut: "copy" | "paste"): Promise<void> {
  const key = shortcut === "copy" ? "c" : "v";

  try {
    await execFileAsync("xdotool", ["key", "--clearmodifiers", `ctrl+${key}`]);
    return;
  } catch {
    await execFileAsync("wtype", ["-M", "ctrl", "-k", key, "-m", "ctrl"]);
  }
}

function shortcutFailureReason(
  platform: NodeJS.Platform | string,
  error: unknown
): string {
  const message = error instanceof Error ? error.message : String(error);

  if (platform === "linux") {
    return `shortcut_failed_linux_install_xdotool_or_wtype: ${message}`;
  }

  if (platform === "win32") {
    return `shortcut_failed_windows_input_automation: ${message}`;
  }

  if (platform === "darwin") {
    return `shortcut_failed_macos_accessibility: ${message}`;
  }

  return `shortcut_failed: ${message}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
