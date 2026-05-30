import * as vscode from "vscode";
import { translatePrompt } from "../../../src/translator/translatePrompt.js";
import { isPromptMode, type PromptMode } from "../../../src/translator/modes.js";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF]/;

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
