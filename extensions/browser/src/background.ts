import { loadBrowserSettings } from "./settings.js";
import type {
  BrowserPromptBridgeOptions,
  PromptBridgeMessage
} from "./types.js";

const MENU_CONVERT = "promptbridge-convert-selection";
const MENU_CONVERT_REDACT = "promptbridge-convert-selection-redact";

declare const chrome: {
  commands?: {
    onCommand: {
      addListener: (listener: (command: string) => void) => void;
    };
  };
  contextMenus: {
    create: (properties: {
      id: string;
      title: string;
      contexts: string[];
    }) => void;
    onClicked: {
      addListener: (
        listener: (info: { menuItemId: string }, tab?: { id?: number }) => void
      ) => void;
    };
    removeAll: (callback?: () => void) => void;
  };
  runtime: {
    lastError?: { message?: string };
    onInstalled: {
      addListener: (listener: () => void) => void;
    };
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
      callback?: (response?: unknown) => void
    ) => void;
  };
};

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

async function sendToActiveTab(options: BrowserPromptBridgeOptions = {}) {
  const settings = await loadBrowserSettings();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;

    if (!tabId) {
      return;
    }

    void sendRawReplaceMessage(tabId, { ...settings, ...options });
  });
}

async function sendReplaceMessage(
  tabId: number,
  overrides: BrowserPromptBridgeOptions = {}
): Promise<void> {
  const settings = await loadBrowserSettings();
  sendRawReplaceMessage(tabId, { ...settings, ...overrides });
}

function sendRawReplaceMessage(
  tabId: number,
  options: BrowserPromptBridgeOptions
): void {
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

function executeContentScript(tabId: number, callback: () => void): void {
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
