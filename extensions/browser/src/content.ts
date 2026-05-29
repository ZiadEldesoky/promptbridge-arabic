import { translatePrompt } from "../../../src/translator/translatePrompt.js";
import type { PromptMode } from "../../../src/translator/modes.js";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF]/;

interface PromptBridgeMessage {
  type: "PROMPTBRIDGE_REPLACE_SELECTION";
  options?: {
    mode?: PromptMode;
    bilingual?: boolean;
    redact?: boolean;
  };
}

interface ReplacementResult {
  converted: boolean;
  reason?: string;
  characterCount?: number;
}

declare const chrome:
  | {
      runtime?: {
        onMessage?: {
          addListener: (
            listener: (
              message: PromptBridgeMessage,
              sender: unknown,
              sendResponse: (response: ReplacementResult) => void
            ) => boolean | void
          ) => void;
        };
      };
    }
  | undefined;

chrome?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message.type !== "PROMPTBRIDGE_REPLACE_SELECTION") {
    return false;
  }

  sendResponse(replaceActiveSelection(message.options ?? {}));
  return false;
});

function replaceActiveSelection(
  options: NonNullable<PromptBridgeMessage["options"]>
): ReplacementResult {
  const activeElement = document.activeElement;

  if (isTextControl(activeElement)) {
    return replaceTextControlSelection(activeElement, options);
  }

  return replaceContentEditableSelection(options);
}

function replaceTextControlSelection(
  element: HTMLInputElement | HTMLTextAreaElement,
  options: NonNullable<PromptBridgeMessage["options"]>
): ReplacementResult {
  const selectionStart = element.selectionStart;
  const selectionEnd = element.selectionEnd;

  if (
    selectionStart === null ||
    selectionEnd === null ||
    selectionStart === selectionEnd
  ) {
    return { converted: false, reason: "no_selection" };
  }

  const selectedText = element.value.slice(selectionStart, selectionEnd);
  const output = convertSelectedText(selectedText, options);

  if (!output.converted || !output.text) {
    return output;
  }

  element.setRangeText(output.text, selectionStart, selectionEnd, "end");
  dispatchInputEvent(element, output.text);

  return {
    converted: true,
    characterCount: output.text.length
  };
}

function replaceContentEditableSelection(
  options: NonNullable<PromptBridgeMessage["options"]>
): ReplacementResult {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return { converted: false, reason: "no_selection" };
  }

  const editableRoot = findEditableRoot(selection.anchorNode);

  if (!editableRoot) {
    return { converted: false, reason: "selection_not_editable" };
  }

  const selectedText = selection.toString();
  const output = convertSelectedText(selectedText, options);

  if (!output.converted || !output.text) {
    return output;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(output.text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  dispatchInputEvent(editableRoot, output.text);

  return {
    converted: true,
    characterCount: output.text.length
  };
}

function convertSelectedText(
  selectedText: string,
  options: NonNullable<PromptBridgeMessage["options"]>
):
  | { converted: true; text: string }
  | { converted: false; reason: string; text?: undefined } {
  const trimmedText = selectedText.trim();

  if (!trimmedText) {
    return { converted: false, reason: "empty_selection" };
  }

  if (!ARABIC_TEXT_PATTERN.test(trimmedText)) {
    return { converted: false, reason: "no_arabic_text" };
  }

  const result = translatePrompt(trimmedText, {
    mode: options.mode,
    bilingual: options.bilingual,
    redact: options.redact
  });

  return {
    converted: true,
    text: result.output
  };
}

function isTextControl(
  element: Element | null
): element is HTMLInputElement | HTMLTextAreaElement {
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  if (!(element instanceof HTMLInputElement)) {
    return false;
  }

  return [
    "",
    "email",
    "search",
    "tel",
    "text",
    "url"
  ].includes(element.type);
}

function findEditableRoot(node: Node | null): HTMLElement | null {
  const element =
    node instanceof HTMLElement ? node : node?.parentElement ?? null;

  return (
    element?.closest<HTMLElement>(
      '[contenteditable="true"], [contenteditable="plaintext-only"]'
    ) ?? null
  );
}

function dispatchInputEvent(target: EventTarget, text: string): void {
  if (typeof InputEvent === "function") {
    target.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text
      })
    );
    return;
  }

  target.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
}
