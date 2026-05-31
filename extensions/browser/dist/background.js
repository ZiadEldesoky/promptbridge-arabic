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

  // extensions/browser/src/background.ts
  var MENU_CONVERT = "promptbridge-convert-selection";
  var MENU_CONVERT_REDACT = "promptbridge-convert-selection-redact";
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_CONVERT,
        title: "Convert Arabic prompt with saved settings",
        contexts: ["editable", "selection"]
      });
      chrome.contextMenus.create({
        id: MENU_CONVERT_REDACT,
        title: "Convert selected Arabic prompt and redact secrets",
        contexts: ["editable", "selection"]
      });
    });
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_CONVERT && tab?.id) {
      void sendReplaceMessage(tab.id);
    }
    if (info.menuItemId === MENU_CONVERT_REDACT && tab?.id) {
      void sendReplaceMessage(tab.id, { redact: true });
    }
  });
  chrome.commands?.onCommand.addListener((command) => {
    if (command !== "replace-selection") {
      return;
    }
    void sendToActiveTab();
  });
  async function sendToActiveTab(options = {}) {
    const settings = await loadBrowserSettings();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        return;
      }
      void sendRawReplaceMessage(tabId, { ...settings, ...options });
    });
  }
  async function sendReplaceMessage(tabId, overrides = {}) {
    const settings = await loadBrowserSettings();
    sendRawReplaceMessage(tabId, { ...settings, ...overrides });
  }
  function sendRawReplaceMessage(tabId, options) {
    executeContentScript(tabId, () => {
      chrome.tabs.sendMessage(
        tabId,
        {
          type: "PROMPTBRIDGE_REPLACE_SELECTION",
          options
        },
        () => {
          void chrome.runtime.lastError;
        }
      );
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
          return;
        }
        callback();
      }
    );
  }
})();
//# sourceMappingURL=background.js.map
