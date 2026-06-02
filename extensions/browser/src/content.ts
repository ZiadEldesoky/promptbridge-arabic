import { translatePrompt } from "../../../src/translator/translatePrompt.js";
import { loadBrowserSettings } from "./settings.js";
import {
  getPromptFieldSelectors,
  hasPromptFieldAdapter
} from "./siteAdapters.js";
import type {
  BrowserPromptBridgeOptions,
  PromptBridgeMessage,
  ReplacementResult
} from "./types.js";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF]/;

interface NormalizedReplacementOptions extends BrowserPromptBridgeOptions {
  fallbackToFocusedField: boolean;
}

type EditableTarget =
  | {
      kind: "text_control";
      element: HTMLInputElement | HTMLTextAreaElement;
    }
  | {
      kind: "contenteditable";
      element: HTMLElement;
    };

const readyKey = "__promptbridgeArabicContentReady";
const floatingButtonId = "promptbridge-arabic-floating-convert";
const browserWindow = window as Window & {
  __promptbridgeArabicContentReady?: boolean;
};

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

if (!browserWindow[readyKey]) {
  browserWindow[readyKey] = true;

  chrome?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
    if (message.type !== "PROMPTBRIDGE_REPLACE_SELECTION") {
      return false;
    }

    sendResponse(replaceActiveSelection(message.options ?? {}));
    return false;
  });

  installFloatingConvertButton();
}

function replaceActiveSelection(
  options: NonNullable<PromptBridgeMessage["options"]>
): ReplacementResult {
  const normalizedOptions = normalizeOptions(options);
  const activeElement = document.activeElement;

  if (isTextControl(activeElement)) {
    return replaceTextControlSelection(activeElement, normalizedOptions);
  }

  const selection = window.getSelection();
  const editableRoot = selection
    ? findEditableRoot(selection.anchorNode) ??
      findEditableRoot(selection.focusNode)
    : null;

  if (selection && editableRoot && !selection.isCollapsed) {
    return replaceContentEditableSelection(
      editableRoot,
      selection,
      normalizedOptions
    );
  }

  if (!normalizedOptions.fallbackToFocusedField) {
    return { converted: false, reason: "no_selection" };
  }

  const fallbackTarget = findBestEditableTarget(activeElement);

  if (!fallbackTarget) {
    return { converted: false, reason: "no_editable_target" };
  }

  if (fallbackTarget.kind === "text_control") {
    return replaceTextControlSelection(
      fallbackTarget.element,
      normalizedOptions
    );
  }

  return replaceWholeContentEditable(fallbackTarget.element, normalizedOptions);
}

function replaceTextControlSelection(
  element: HTMLInputElement | HTMLTextAreaElement,
  options: NormalizedReplacementOptions
): ReplacementResult {
  let selectionStart = element.selectionStart;
  let selectionEnd = element.selectionEnd;

  if (
    selectionStart === null ||
    selectionEnd === null ||
    selectionStart === selectionEnd
  ) {
    if (!options.fallbackToFocusedField) {
      return { converted: false, reason: "no_selection" };
    }

    selectionStart = 0;
    selectionEnd = element.value.length;
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
  editableRoot: HTMLElement,
  selection: Selection,
  options: NormalizedReplacementOptions
): ReplacementResult {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return { converted: false, reason: "no_selection" };
  }

  const selectedText = selection.toString();
  const output = convertSelectedText(selectedText, options);

  if (!output.converted || !output.text) {
    return output;
  }

  const range = selection.getRangeAt(0);
  replaceRangeWithText(range, selection, output.text);

  dispatchInputEvent(editableRoot, output.text);

  return {
    converted: true,
    characterCount: output.text.length
  };
}

function replaceWholeContentEditable(
  editableRoot: HTMLElement,
  options: NormalizedReplacementOptions
): ReplacementResult {
  const selectedText = getEditableText(editableRoot);
  const output = convertSelectedText(selectedText, options);

  if (!output.converted || !output.text) {
    return output;
  }

  editableRoot.focus();

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editableRoot);

  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
    replaceRangeWithText(range, selection, output.text);
  } else {
    editableRoot.replaceChildren(document.createTextNode(output.text));
  }

  dispatchInputEvent(editableRoot, output.text);

  return {
    converted: true,
    characterCount: output.text.length
  };
}

function convertSelectedText(
  selectedText: string,
  options: BrowserPromptBridgeOptions
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

function normalizeOptions(
  options: BrowserPromptBridgeOptions
): NormalizedReplacementOptions {
  return {
    ...options,
    fallbackToFocusedField: options.fallbackToFocusedField ?? true
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

function findBestEditableTarget(
  activeElement: Element | null
): EditableTarget | null {
  if (isTextControl(activeElement)) {
    return {
      kind: "text_control",
      element: activeElement
    };
  }

  const focusedEditableRoot = findEditableRoot(activeElement);

  if (focusedEditableRoot) {
    return {
      kind: "contenteditable",
      element: focusedEditableRoot
    };
  }

  if (!hasPromptFieldAdapter(window.location.hostname)) {
    return null;
  }

  const selectors = getPromptFieldSelectors(window.location.hostname);

  for (const selector of selectors) {
    for (const element of safeQuerySelectorAll(selector)) {
      const target = toEditableTarget(element);

      if (target && isVisible(element)) {
        return target;
      }
    }
  }

  return null;
}

function safeQuerySelectorAll(selector: string): Element[] {
  try {
    return [...document.querySelectorAll(selector)];
  } catch {
    return [];
  }
}

function toEditableTarget(element: Element): EditableTarget | null {
  if (isTextControl(element)) {
    return {
      kind: "text_control",
      element
    };
  }

  const editableRoot = findEditableRoot(element);

  if (!editableRoot) {
    return null;
  }

  return {
    kind: "contenteditable",
    element: editableRoot
  };
}

function isVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
}

function getEditableText(element: HTMLElement): string {
  return element.innerText || element.textContent || "";
}

function replaceRangeWithText(
  range: Range,
  selection: Selection,
  text: string
): void {
  const nodes = textToNodes(text);
  const fragment = document.createDocumentFragment();

  nodes.forEach((node) => fragment.append(node));
  range.deleteContents();
  range.insertNode(fragment);

  const lastNode = nodes[nodes.length - 1];

  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function textToNodes(text: string): Node[] {
  return text.split("\n").flatMap((line, index) => {
    const nodes: Node[] = [];

    if (index > 0) {
      nodes.push(document.createElement("br"));
    }

    nodes.push(document.createTextNode(line));
    return nodes;
  });
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

function installFloatingConvertButton(): void {
  const button = document.createElement("button");
  button.id = floatingButtonId;
  button.type = "button";
  button.tabIndex = -1;
  button.textContent = "Convert";
  button.setAttribute("aria-label", "Convert Arabic prompt with PromptBridge");
  button.style.cssText = [
    "position:fixed",
    "z-index:2147483647",
    "display:none",
    "min-width:72px",
    "height:32px",
    "padding:0 12px",
    "border:0",
    "border-radius:8px",
    "background:#2563eb",
    "color:#ffffff",
    "font:600 13px/32px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    "box-shadow:0 8px 24px rgba(15,23,42,.28)",
    "cursor:pointer"
  ].join(";");

  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  button.addEventListener("click", () => {
    void convertFromFloatingButton(button);
  });

  document.documentElement.append(button);

  const scheduleUpdate = () => {
    window.setTimeout(() => {
      updateFloatingButton(button);
    }, 0);
  };

  document.addEventListener("selectionchange", scheduleUpdate);
  document.addEventListener("mouseup", scheduleUpdate);
  document.addEventListener("keyup", scheduleUpdate);
  document.addEventListener("focusin", scheduleUpdate);
  document.addEventListener("input", scheduleUpdate);
  window.addEventListener("scroll", scheduleUpdate, true);
  window.addEventListener("resize", scheduleUpdate);
}

async function convertFromFloatingButton(button: HTMLButtonElement): Promise<void> {
  const originalLabel = button.textContent ?? "Convert";
  button.disabled = true;
  button.textContent = "Converting";

  try {
    const settings = await loadBrowserSettings();
    const result = replaceActiveSelection(settings);

    if (result.converted) {
      button.textContent = "Converted";
      window.setTimeout(() => {
        hideFloatingButton(button);
      }, 700);
      return;
    }

    button.textContent = "No Arabic";
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.disabled = false;
      updateFloatingButton(button);
    }, 900);
  } catch {
    button.textContent = "Failed";
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.disabled = false;
      updateFloatingButton(button);
    }, 900);
  }
}

function updateFloatingButton(button: HTMLButtonElement): void {
  if (button.disabled) {
    return;
  }

  const placement = findFloatingButtonPlacement();

  if (!placement) {
    hideFloatingButton(button);
    return;
  }

  const top = Math.max(placement.top - 42, 8);
  const left = Math.min(
    Math.max(placement.left, 8),
    window.innerWidth - 88
  );

  button.style.top = `${top}px`;
  button.style.left = `${left}px`;
  button.style.display = "block";
}

function hideFloatingButton(button: HTMLButtonElement): void {
  button.style.display = "none";
  button.disabled = false;
  button.textContent = "Convert";
}

function findFloatingButtonPlacement(): { top: number; left: number } | null {
  const activeElement = document.activeElement;

  if (isTextControl(activeElement)) {
    const selectedText = textControlSelectedText(activeElement);

    if (selectedText && ARABIC_TEXT_PATTERN.test(selectedText)) {
      const rect = activeElement.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.right - 82
      };
    }
  }

  const selection = window.getSelection();

  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  if (!ARABIC_TEXT_PATTERN.test(selection.toString())) {
    return null;
  }

  const editableRoot =
    findEditableRoot(selection.anchorNode) ?? findEditableRoot(selection.focusNode);

  if (!editableRoot) {
    return null;
  }

  const rangeRect = selection.getRangeAt(0).getBoundingClientRect();
  const rootRect = editableRoot.getBoundingClientRect();
  const rect = rangeRect.width > 0 && rangeRect.height > 0 ? rangeRect : rootRect;

  return {
    top: rect.top,
    left: rect.right - 82
  };
}

function textControlSelectedText(
  element: HTMLInputElement | HTMLTextAreaElement
): string | null {
  const selectionStart = element.selectionStart;
  const selectionEnd = element.selectionEnd;

  if (
    selectionStart === null ||
    selectionEnd === null ||
    selectionStart === selectionEnd
  ) {
    return null;
  }

  return element.value.slice(selectionStart, selectionEnd);
}
