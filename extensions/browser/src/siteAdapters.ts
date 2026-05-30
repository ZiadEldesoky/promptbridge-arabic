const COMMON_PROMPT_SELECTORS = [
  "textarea",
  'input[type="text"]',
  'input[type="search"]',
  '[contenteditable="true"][role="textbox"]',
  '[contenteditable="plaintext-only"][role="textbox"]',
  '[role="textbox"][contenteditable="true"]',
  '[role="textbox"][contenteditable="plaintext-only"]',
  '[data-lexical-editor="true"][contenteditable="true"]',
  '.ProseMirror[contenteditable="true"]'
];

const SITE_PROMPT_SELECTORS: Array<{
  hosts: string[];
  selectors: string[];
}> = [
  {
    hosts: ["chatgpt.com", "chat.openai.com"],
    selectors: [
      "#prompt-textarea",
      '[data-testid="prompt-textarea"]',
      'textarea[name="prompt-textarea"]'
    ]
  },
  {
    hosts: ["claude.ai"],
    selectors: [
      '.ProseMirror[contenteditable="true"]',
      '[contenteditable="true"][aria-label*="Claude" i]',
      '[contenteditable="true"][aria-label*="message" i]'
    ]
  },
  {
    hosts: ["gemini.google.com", "bard.google.com"],
    selectors: [
      "rich-textarea [contenteditable='true']",
      '[contenteditable="true"][aria-label*="prompt" i]',
      '[contenteditable="true"][aria-label*="message" i]'
    ]
  },
  {
    hosts: ["cursor.com", "www.cursor.com"],
    selectors: [
      'textarea[aria-label*="prompt" i]',
      '[contenteditable="true"][aria-label*="prompt" i]'
    ]
  }
];

export function getPromptFieldSelectors(hostname: string): string[] {
  const siteSelectors = matchingAdapters(hostname).flatMap(
    (adapter) => adapter.selectors
  );

  return unique([...siteSelectors, ...COMMON_PROMPT_SELECTORS]);
}

export function hasPromptFieldAdapter(hostname: string): boolean {
  return matchingAdapters(hostname).length > 0;
}

function matchingAdapters(hostname: string) {
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, "");

  return SITE_PROMPT_SELECTORS.filter((adapter) =>
    adapter.hosts.some(
      (host) =>
        normalizedHostname === host || normalizedHostname.endsWith(`.${host}`)
    )
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
