import type { PromptMode } from "../../../src/translator/modes.js";

const MENU_CONVERT = "promptbridge-convert-selection";
const MENU_CONVERT_REDACT = "promptbridge-convert-selection-redact";

interface PromptBridgeMessage {
  type: "PROMPTBRIDGE_REPLACE_SELECTION";
  options?: {
    mode?: PromptMode;
    bilingual?: boolean;
    redact?: boolean;
  };
}

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
      title: "Convert selected Arabic prompt",
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
    sendReplaceMessage(tab.id, { redact: false });
  }

  if (info.menuItemId === MENU_CONVERT_REDACT && tab?.id) {
    sendReplaceMessage(tab.id, { redact: true });
  }
});

chrome.commands?.onCommand.addListener((command) => {
  if (command !== "replace-selection") {
    return;
  }

  sendToActiveTab({ redact: false });
});

function sendToActiveTab(options: NonNullable<PromptBridgeMessage["options"]>) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;

    if (!tabId) {
      return;
    }

    sendReplaceMessage(tabId, options);
  });
}

function sendReplaceMessage(
  tabId: number,
  options: NonNullable<PromptBridgeMessage["options"]>
) {
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
}
