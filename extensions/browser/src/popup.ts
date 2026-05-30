import {
  loadBrowserSettings,
  saveBrowserSettings,
  type BrowserSettings
} from "./settings.js";
import type { PromptBridgeMessage } from "./types.js";

declare const chrome: {
  runtime: {
    lastError?: { message?: string };
  };
  scripting: {
    executeScript: (
      injection: {
        target: { tabId: number };
        files: string[];
      },
      callback?: () => void
    ) => void;
  };
  tabs: {
    query: (
      queryInfo: { active: boolean; currentWindow: boolean },
      callback: (tabs: Array<{ id?: number }>) => void
    ) => void;
    sendMessage: (
      tabId: number,
      message: PromptBridgeMessage,
      callback?: (response?: {
        converted?: boolean;
        reason?: string;
        characterCount?: number;
      }) => void
    ) => void;
  };
};

const form = document.querySelector<HTMLFormElement>("#promptbridge-form");
const statusElement = document.querySelector<HTMLElement>("#status");
const modeSelect = document.querySelector<HTMLSelectElement>("#mode");
const redactInput = document.querySelector<HTMLInputElement>("#redact");
const bilingualInput = document.querySelector<HTMLInputElement>("#bilingual");
const fallbackInput =
  document.querySelector<HTMLInputElement>("#fallback-to-field");

void loadSettingsIntoForm();

for (const input of [modeSelect, redactInput, bilingualInput, fallbackInput]) {
  input?.addEventListener("change", () => {
    void saveBrowserSettings(readSettingsFromForm());
  });
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const settings = readSettingsFromForm();

  await saveBrowserSettings(settings);
  sendToActiveTab(settings);
});

function sendToActiveTab(options: NonNullable<PromptBridgeMessage["options"]>) {
  setStatus("Converting selected text...");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;

    if (!tabId) {
      setStatus("No active tab found.");
      return;
    }

    executeContentScript(tabId, () => {
      chrome.tabs.sendMessage(
        tabId,
        {
          type: "PROMPTBRIDGE_REPLACE_SELECTION",
          options
        },
        (response) => {
          const error = chrome.runtime.lastError;

          if (error?.message) {
            setStatus("This page is not ready for PromptBridge yet.");
            return;
          }

          if (response?.converted) {
            setStatus("Converted and replaced selected text.");
            return;
          }

          setStatus(reasonToMessage(response?.reason));
        }
      );
    });
  });
}

function executeContentScript(tabId: number, callback: () => void): void {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      files: ["dist/content.js"]
    },
    () => {
      if (chrome.runtime.lastError) {
        setStatus("This page does not allow extension editing.");
        return;
      }

      callback();
    }
  );
}

async function loadSettingsIntoForm(): Promise<void> {
  const settings = await loadBrowserSettings();

  if (modeSelect) {
    modeSelect.value = settings.mode ?? "";
  }

  if (redactInput) {
    redactInput.checked = settings.redact;
  }

  if (bilingualInput) {
    bilingualInput.checked = settings.bilingual;
  }

  if (fallbackInput) {
    fallbackInput.checked = settings.fallbackToFocusedField;
  }
}

function readSettingsFromForm(): BrowserSettings {
  const selectedMode = modeSelect?.value;

  return {
    mode: selectedMode ? (selectedMode as BrowserSettings["mode"]) : undefined,
    redact: Boolean(redactInput?.checked),
    bilingual: Boolean(bilingualInput?.checked),
    fallbackToFocusedField: Boolean(fallbackInput?.checked)
  };
}

function setStatus(message: string): void {
  if (statusElement) {
    statusElement.textContent = message;
  }
}

function reasonToMessage(reason?: string): string {
  switch (reason) {
    case "empty_selection":
    case "no_selection":
      return "Select Arabic prompt text first.";
    case "no_arabic_text":
      return "Selection does not contain Arabic text.";
    case "selection_not_editable":
      return "Select text inside an editable prompt box.";
    default:
      return "Could not convert the selection.";
  }
}
