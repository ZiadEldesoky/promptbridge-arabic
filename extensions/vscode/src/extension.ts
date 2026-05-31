import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";
import { translatePrompt } from "../../../src/translator/translatePrompt.js";
import { isPromptMode, type PromptMode } from "../../../src/translator/modes.js";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF]/;
const COPY_TIMEOUT_MS = 1000;
const CLIPBOARD_POLL_MS = 50;
const PASTE_DELAY_MS = 150;
const execFileAsync = promisify(execFile);

interface ExtensionSettings {
  mode?: PromptMode;
  bilingual: boolean;
  redact: boolean;
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "promptbridge.convertSelection",
      convertSelection
    ),
    vscode.commands.registerCommand(
      "promptbridge.convertInputToClipboard",
      convertInputToClipboard
    ),
    vscode.commands.registerCommand(
      "promptbridge.convertInputToEditor",
      convertInputToEditor
    ),
    vscode.commands.registerCommand(
      "promptbridge.replaceFocusedSelection",
      replaceFocusedSelection
    )
  );
}

export function deactivate(): void {
  // VS Code calls this hook when the extension is unloaded.
}

async function convertSelection(): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage("Open an editor before converting text.");
    return;
  }

  const settings = readSettings();
  const replacements = editor.selections.map((selection) => {
    const selectedText = editor.document.getText(selection);

    return {
      selection,
      selectedText,
      convertedText: convertText(selectedText, settings)
    };
  });

  const convertible = replacements.filter(
    (replacement) => replacement.convertedText !== null
  );

  if (convertible.length === 0) {
    vscode.window.showWarningMessage("Select Arabic prompt text first.");
    return;
  }

  await editor.edit((editBuilder) => {
    for (const replacement of convertible) {
      editBuilder.replace(replacement.selection, replacement.convertedText ?? "");
    }
  });

  vscode.window.showInformationMessage(
    `PromptBridge converted ${convertible.length} selection${
      convertible.length === 1 ? "" : "s"
    }.`
  );
}

async function convertInputToClipboard(): Promise<void> {
  const input = await askForArabicPrompt();

  if (!input) {
    return;
  }

  const convertedText = convertText(input, readSettings());

  if (!convertedText) {
    vscode.window.showWarningMessage("The prompt does not contain Arabic text.");
    return;
  }

  await vscode.env.clipboard.writeText(convertedText);
  vscode.window.showInformationMessage("PromptBridge copied the English prompt.");
}

async function convertInputToEditor(): Promise<void> {
  const input = await askForArabicPrompt();

  if (!input) {
    return;
  }

  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage("Open an editor before inserting text.");
    return;
  }

  const convertedText = convertText(input, readSettings());

  if (!convertedText) {
    vscode.window.showWarningMessage("The prompt does not contain Arabic text.");
    return;
  }

  await editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      editBuilder.replace(selection, convertedText);
    }
  });
}

async function replaceFocusedSelection(): Promise<void> {
  if (!isSupportedFocusedInputPlatform(process.platform)) {
    vscode.window.showWarningMessage(
      "System selection replacement currently supports macOS, Windows, and Linux."
    );
    return;
  }

  const settings = readSettings();
  const originalClipboard = await readSystemClipboard().catch(() => "");

  try {
    await sendSystemShortcut("copy");
    const selectedText = await waitForCopiedText(originalClipboard);
    const convertedText = convertText(selectedText, settings);

    if (!convertedText) {
      await writeSystemClipboard(originalClipboard);
      vscode.window.showWarningMessage(
        selectedText.trim()
          ? "PromptBridge could not read Arabic from the focused selection."
          : "Select Arabic prompt text first, then run the PromptBridge focused input command."
      );
      return;
    }

    await writeSystemClipboard(convertedText);
    await sleep(PASTE_DELAY_MS);
    await sendSystemShortcut("paste");
  } catch {
    vscode.window.showWarningMessage(
      focusedInputPermissionMessage(process.platform)
    );
    return;
  }

  vscode.window.showInformationMessage(
    "PromptBridge replaced the selected Arabic text."
  );
}

async function askForArabicPrompt(): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt: "Write an Arabic or Egyptian Arabic coding prompt",
    placeHolder: "ظبطلي الكود دا وخليه responsive من غير ما تغير الديزاين",
    ignoreFocusOut: true
  });
}

function convertText(
  input: string,
  settings: ExtensionSettings
): string | null {
  const trimmedInput = input.trim();

  if (!trimmedInput || !ARABIC_TEXT_PATTERN.test(trimmedInput)) {
    return null;
  }

  return translatePrompt(trimmedInput, settings).output;
}

function readSettings(): ExtensionSettings {
  const config = vscode.workspace.getConfiguration("promptbridge");
  const configuredMode = config.get<string>("mode", "auto");

  return {
    mode: isPromptMode(configuredMode) ? configuredMode : undefined,
    bilingual: config.get<boolean>("bilingual", false),
    redact: config.get<boolean>("redact", false)
  };
}

function isSupportedFocusedInputPlatform(platform: NodeJS.Platform): boolean {
  return platform === "darwin" || platform === "win32" || platform === "linux";
}

async function sendSystemShortcut(shortcut: "copy" | "paste"): Promise<void> {
  if (process.platform === "darwin") {
    await sendMacShortcut(shortcut);
    return;
  }

  if (process.platform === "win32") {
    await sendWindowsShortcut(shortcut);
    return;
  }

  await sendLinuxShortcut(shortcut);
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

async function waitForCopiedText(originalClipboard: string): Promise<string> {
  const startedAt = Date.now();
  let latestText = originalClipboard;

  while (Date.now() - startedAt < COPY_TIMEOUT_MS) {
    await sleep(CLIPBOARD_POLL_MS);
    latestText = await readSystemClipboard().catch(() => latestText);

    if (
      latestText.trim() &&
      (latestText !== originalClipboard || ARABIC_TEXT_PATTERN.test(latestText))
    ) {
      return latestText;
    }
  }

  return latestText;
}

function readSystemClipboard(): Promise<string> {
  return Promise.resolve(vscode.env.clipboard.readText());
}

function writeSystemClipboard(text: string): Promise<void> {
  return Promise.resolve(vscode.env.clipboard.writeText(text));
}

function focusedInputPermissionMessage(platform: NodeJS.Platform): string {
  if (platform === "darwin") {
    return "PromptBridge could not control macOS copy/paste. Allow the editor in System Settings > Privacy & Security > Accessibility.";
  }

  if (platform === "win32") {
    return "PromptBridge could not control Windows copy/paste. Make sure PowerShell input automation is allowed and the focused field is still active.";
  }

  return "PromptBridge could not control Linux copy/paste. Install xdotool on X11 or wtype on Wayland, then try again.";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
