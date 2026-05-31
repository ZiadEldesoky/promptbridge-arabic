"use strict";
(() => {
  // src/translator/modes.ts
  var promptModes = [
    "general",
    "fix",
    "refactor",
    "review",
    "tests",
    "explain",
    "security"
  ];
  function isPromptMode(value) {
    return promptModes.includes(value);
  }

  // extensions/browser/src/settings.ts
  var STORAGE_KEY = "promptbridgeBrowserSettings";
  var DEFAULT_BROWSER_SETTINGS = {
    bilingual: false,
    redact: false,
    fallbackToFocusedField: true
  };
  async function loadBrowserSettings() {
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
  async function saveBrowserSettings(settings) {
    if (!chrome?.storage?.sync) {
      return;
    }
    const normalizedSettings = normalizeBrowserSettings(settings);
    await new Promise((resolve) => {
      chrome.storage?.sync?.set({ [STORAGE_KEY]: normalizedSettings }, () => {
        resolve();
      });
    });
  }
  function normalizeBrowserSettings(value) {
    if (!isRecord(value)) {
      return { ...DEFAULT_BROWSER_SETTINGS };
    }
    const mode = typeof value.mode === "string" && isPromptMode(value.mode) ? value.mode : void 0;
    return {
      ...DEFAULT_BROWSER_SETTINGS,
      mode,
      bilingual: typeof value.bilingual === "boolean" ? value.bilingual : DEFAULT_BROWSER_SETTINGS.bilingual,
      redact: typeof value.redact === "boolean" ? value.redact : DEFAULT_BROWSER_SETTINGS.redact,
      fallbackToFocusedField: typeof value.fallbackToFocusedField === "boolean" ? value.fallbackToFocusedField : DEFAULT_BROWSER_SETTINGS.fallbackToFocusedField
    };
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null;
  }

  // extensions/browser/src/popup.ts
  var form = document.querySelector("#promptbridge-form");
  var statusElement = document.querySelector("#status");
  var modeSelect = document.querySelector("#mode");
  var redactInput = document.querySelector("#redact");
  var bilingualInput = document.querySelector("#bilingual");
  var fallbackInput = document.querySelector("#fallback-to-field");
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
  function sendToActiveTab(options) {
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
  function executeContentScript(tabId, callback) {
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
  async function loadSettingsIntoForm() {
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
  function readSettingsFromForm() {
    const selectedMode = modeSelect?.value;
    return {
      mode: selectedMode ? selectedMode : void 0,
      redact: Boolean(redactInput?.checked),
      bilingual: Boolean(bilingualInput?.checked),
      fallbackToFocusedField: Boolean(fallbackInput?.checked)
    };
  }
  function setStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }
  function reasonToMessage(reason) {
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
})();
//# sourceMappingURL=popup.js.map
