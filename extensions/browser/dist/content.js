"use strict";
(() => {
  // src/formatting/formatOutput.ts
  function formatStructuredPrompt(prompt) {
    const lines = [prompt.task.trim()];
    appendSection(lines, "Context", prompt.context);
    appendSection(lines, "Requirements", prompt.requirements);
    appendSection(lines, "Focus on", prompt.focus);
    appendSection(lines, "Constraints", prompt.constraints);
    appendSection(lines, "Expected output", prompt.expectedOutput);
    appendTechnicalContext(lines, prompt.technicalContext);
    appendSection(lines, "Notes", prompt.notes);
    return lines.join("\n").trim();
  }
  function formatOutput(options) {
    if (!options.bilingual) {
      return options.englishPrompt.trim();
    }
    return [
      "## English prompt",
      "",
      options.englishPrompt.trim(),
      "",
      "## Arabic summary",
      "",
      options.arabicSummary?.trim() ?? "\u062A\u0645 \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0649 Prompt \u0625\u0646\u062C\u0644\u064A\u0632\u064A \u0645\u0646\u0638\u0645."
    ].join("\n");
  }
  function appendSection(lines, title, items) {
    if (!items?.length) {
      return;
    }
    lines.push("", `${title}:`);
    items.forEach((item) => lines.push(`- ${item}`));
  }
  function appendTechnicalContext(lines, technicalContext) {
    if (!technicalContext?.length) {
      return;
    }
    lines.push("", "Preserved technical context:");
    technicalContext.forEach((item) => {
      if (item.includes("\n") || item.trim().startsWith("```")) {
        lines.push("", item.trim(), "");
        return;
      }
      lines.push(`- ${item}`);
    });
  }

  // src/redaction/patterns.ts
  var redactionPatterns = [
    {
      name: "private_key",
      pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
      replacement: "[REDACTED_PRIVATE_KEY]"
    },
    {
      name: "database_url",
      pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'`<>]+/g,
      replacement: "[REDACTED_DATABASE_URL]"
    },
    {
      name: "bearer_token",
      pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/g,
      replacement: "Bearer [REDACTED_SECRET]"
    },
    {
      name: "openai_api_key",
      pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g,
      replacement: "[REDACTED_SECRET]"
    },
    {
      name: "github_token",
      pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
      replacement: "[REDACTED_SECRET]"
    },
    {
      name: "stripe_key",
      pattern: /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
      replacement: "[REDACTED_SECRET]"
    },
    {
      name: "jwt",
      pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      replacement: "[REDACTED_SECRET]"
    },
    {
      name: "env_secret_assignment",
      pattern: /\b([A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASS|DATABASE_URL|DB_URL)\s*=\s*)(["']?)((?!\[REDACTED_)[^"'\s]+)\2/g,
      replacement: (_match, prefix) => `${prefix}[REDACTED_SECRET]`
    },
    {
      name: "generic_secret_assignment",
      pattern: /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|client_secret)(\s*[:=]\s*)(["']?)((?!\[REDACTED_)[^"'\s]+)\3/gi,
      replacement: (_match, key, separator) => `${key}${separator}[REDACTED_SECRET]`
    },
    {
      name: "email",
      pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      replacement: "[REDACTED_EMAIL]"
    },
    {
      name: "phone",
      pattern: /(?<!\w)(?:\+?\d[\d\s().-]{8,}\d)(?!\w)/g,
      replacement: "[REDACTED_PHONE]"
    }
  ];

  // src/redaction/redactSecrets.ts
  function redactSecrets(input) {
    let text = input;
    let redactionCount = 0;
    const redactedPatternNames = /* @__PURE__ */ new Set();
    for (const redactionPattern of redactionPatterns) {
      text = text.replace(redactionPattern.pattern, (...args) => {
        redactionCount += 1;
        redactedPatternNames.add(redactionPattern.name);
        if (typeof redactionPattern.replacement === "function") {
          const [match, ...rest] = args;
          const groups = rest.slice(0, -2).map(String);
          return redactionPattern.replacement(String(match), ...groups);
        }
        return redactionPattern.replacement;
      });
    }
    return {
      text,
      redactionCount,
      redactedPatternNames: [...redactedPatternNames]
    };
  }

  // src/translator/glossary.ts
  var egyptianDeveloperGlossary = [
    {
      arabic: "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645",
      english: "Hello",
      tags: ["friendly"]
    },
    {
      arabic: "\u0645\u0631\u062D\u0628\u0627",
      english: "Hello",
      tags: ["friendly"]
    },
    {
      arabic: "\u0623\u0647\u0644\u0627",
      english: "Hello",
      tags: ["friendly"]
    },
    {
      arabic: "\u0627\u0647\u0644\u0627",
      english: "Hello",
      tags: ["friendly"]
    },
    {
      arabic: "\u0647\u0627\u064A",
      english: "Hi",
      tags: ["friendly"]
    },
    {
      arabic: "\u0647\u0627\u0649",
      english: "Hi",
      tags: ["friendly"]
    },
    {
      arabic: "\u0635\u0628\u0627\u062D \u0627\u0644\u062E\u064A\u0631",
      english: "Good morning",
      tags: ["friendly"]
    },
    {
      arabic: "\u0645\u0633\u0627\u0621 \u0627\u0644\u062E\u064A\u0631",
      english: "Good evening",
      tags: ["friendly"]
    },
    {
      arabic: "\u0634\u0643\u0631\u0627",
      english: "Thank you",
      tags: ["friendly"]
    },
    {
      arabic: "\u0625\u0632\u064A\u0643 \u0639\u0627\u0645\u0644 \u0627\u064A\u0647",
      english: "How are you",
      tags: ["friendly"]
    },
    {
      arabic: "\u0627\u0632\u064A\u0643 \u0639\u0627\u0645\u0644 \u0627\u064A\u0647",
      english: "How are you",
      tags: ["friendly"]
    },
    {
      arabic: "\u0625\u0632\u064A\u0643",
      english: "How are you",
      tags: ["friendly"]
    },
    {
      arabic: "\u0627\u0632\u064A\u0643",
      english: "How are you",
      tags: ["friendly"]
    },
    {
      arabic: "\u0639\u0627\u0645\u0644 \u0627\u064A\u0647",
      english: "How are you",
      tags: ["friendly"]
    },
    {
      arabic: "\u062A\u0645\u0627\u0645",
      english: "Okay",
      tags: ["friendly"]
    },
    {
      arabic: "\u0644\u0648 \u0633\u0645\u062D\u062A",
      english: "please",
      tags: ["general"]
    },
    {
      arabic: "\u0639\u0627\u064A\u0632",
      english: "I want",
      tags: ["general"]
    },
    {
      arabic: "\u0623\u0632\u0648\u062F",
      english: "add",
      tags: ["general"]
    },
    {
      arabic: "\u0627\u0632\u0648\u062F",
      english: "add",
      tags: ["general"]
    },
    {
      arabic: "\u0623\u0636\u064A\u0641",
      english: "add",
      tags: ["general"]
    },
    {
      arabic: "\u0645\u062D\u062A\u0627\u062C",
      english: "I need",
      tags: ["general"]
    },
    {
      arabic: "\u0627\u0639\u0645\u0644",
      english: "create or implement",
      tags: ["general"]
    },
    {
      arabic: "\u062E\u0644\u064A",
      english: "make",
      tags: ["general"]
    },
    {
      arabic: "\u062E\u0644\u064A\u0647",
      english: "make it",
      tags: ["general"]
    },
    {
      arabic: "\u062E\u0644\u064A\u0647\u0627",
      english: "make it",
      tags: ["general"]
    },
    {
      arabic: "\u062F\u0627",
      english: "this",
      tags: ["general"]
    },
    {
      arabic: "\u062F\u0647",
      english: "this",
      tags: ["general"]
    },
    {
      arabic: "\u062F\u064A",
      english: "this",
      tags: ["general"]
    },
    {
      arabic: "\u0641\u064A",
      english: "in",
      tags: ["general"]
    },
    {
      arabic: "\u0645\u0646 \u063A\u064A\u0631",
      english: "without",
      tags: ["general"]
    },
    {
      arabic: "\u0628\u062F\u0648\u0646",
      english: "without",
      tags: ["general"]
    },
    {
      arabic: "\u0645\u0627 \u062A\u063A\u064A\u0631\u0634",
      english: "do not change",
      tags: ["general"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0646\u0638\u0645 \u0648\u0622\u0645\u0646 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "make the code organized, secure, and maintainable",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0646\u0638\u0645 \u0648\u0627\u0645\u0646 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "make the code organized, secure, and maintainable",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0631\u062A\u0628 \u0648\u0622\u0645\u0646 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "make the code organized, secure, and maintainable",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0631\u062A\u0628 \u0648\u0627\u0645\u0646 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "make the code organized, secure, and maintainable",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0646\u0638\u0645 \u0648\u0622\u0645\u0646",
      english: "make the code organized, maintainable, and secure",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0646\u0638\u0645 \u0648\u0627\u0645\u0646",
      english: "make the code organized, maintainable, and secure",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0631\u062A\u0628 \u0648\u0622\u0645\u0646",
      english: "make the code organized, maintainable, and secure",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0631\u062A\u0628 \u0648\u0627\u0645\u0646",
      english: "make the code organized, maintainable, and secure",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0622\u0645\u0646 \u0648\u0646\u0638\u064A\u0641",
      english: "make the code secure, clean, and maintainable",
      tags: ["security", "refactor"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0622\u0645\u0646 \u0648\u0646\u0636\u064A\u0641",
      english: "make the code secure, clean, and maintainable",
      tags: ["security", "refactor"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0627\u0645\u0646 \u0648\u0646\u0638\u064A\u0641",
      english: "make the code secure, clean, and maintainable",
      tags: ["security", "refactor"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0627\u0645\u0646 \u0648\u0646\u0636\u064A\u0641",
      english: "make the code secure, clean, and maintainable",
      tags: ["security", "refactor"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0622\u0645\u0646",
      english: "make the code secure",
      tags: ["security"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0627\u0645\u0646",
      english: "make the code secure",
      tags: ["security"]
    },
    {
      arabic: "\u062E\u0644\u064A\u0647 \u0622\u0645\u0646",
      english: "make it secure",
      tags: ["security"]
    },
    {
      arabic: "\u062E\u0644\u064A\u0647 \u0627\u0645\u0646",
      english: "make it secure",
      tags: ["security"]
    },
    {
      arabic: "\u062E\u0644\u064A\u0647\u0627 \u0622\u0645\u0646\u0629",
      english: "make it secure",
      tags: ["security"]
    },
    {
      arabic: "\u062E\u0644\u064A\u0647\u0627 \u0627\u0645\u0646\u0629",
      english: "make it secure",
      tags: ["security"]
    },
    {
      arabic: "\u062D\u0633\u0646 \u0623\u0645\u0627\u0646 \u0627\u0644\u0643\u0648\u062F",
      english: "improve the code security",
      tags: ["security"]
    },
    {
      arabic: "\u062D\u0633\u0646 \u0627\u0645\u0627\u0646 \u0627\u0644\u0643\u0648\u062F",
      english: "improve the code security",
      tags: ["security"]
    },
    {
      arabic: "\u0627\u0639\u0645\u0644 \u062D\u0645\u0627\u064A\u0629 \u0644\u0644\u0643\u0648\u062F",
      english: "add security protection to the code",
      tags: ["security"]
    },
    {
      arabic: "\u0627\u0644\u0643\u0648\u062F",
      english: "the code",
      tags: ["general"]
    },
    {
      arabic: "\u0645\u0646\u0638\u0645 \u0648\u0622\u0645\u0646 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "organized, secure, and maintainable",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u0645\u0646\u0638\u0645 \u0648\u0627\u0645\u0646 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "organized, secure, and maintainable",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u0645\u0631\u062A\u0628 \u0648\u0622\u0645\u0646 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "organized, secure, and maintainable",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u0645\u0631\u062A\u0628 \u0648\u0627\u0645\u0646 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "organized, secure, and maintainable",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u0645\u0646\u0638\u0645 \u0648\u0622\u0645\u0646",
      english: "organized, maintainable, and secure",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u0645\u0646\u0638\u0645 \u0648\u0627\u0645\u0646",
      english: "organized, maintainable, and secure",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u0645\u0631\u062A\u0628 \u0648\u0622\u0645\u0646",
      english: "organized, maintainable, and secure",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u0645\u0631\u062A\u0628 \u0648\u0627\u0645\u0646",
      english: "organized, maintainable, and secure",
      tags: ["refactor", "security"]
    },
    {
      arabic: "\u0622\u0645\u0646 \u0648\u0646\u0638\u064A\u0641",
      english: "secure, clean, and maintainable",
      tags: ["security", "refactor"]
    },
    {
      arabic: "\u0622\u0645\u0646 \u0648\u0646\u0636\u064A\u0641",
      english: "secure, clean, and maintainable",
      tags: ["security", "refactor"]
    },
    {
      arabic: "\u0627\u0645\u0646 \u0648\u0646\u0638\u064A\u0641",
      english: "secure, clean, and maintainable",
      tags: ["security", "refactor"]
    },
    {
      arabic: "\u0627\u0645\u0646 \u0648\u0646\u0636\u064A\u0641",
      english: "secure, clean, and maintainable",
      tags: ["security", "refactor"]
    },
    {
      arabic: "\u0622\u0645\u0646",
      english: "secure",
      tags: ["security"]
    },
    {
      arabic: "\u0627\u0645\u0646",
      english: "secure",
      tags: ["security"]
    },
    {
      arabic: "\u0623\u0645\u0627\u0646",
      english: "security",
      tags: ["security"]
    },
    {
      arabic: "\u0627\u0645\u0627\u0646",
      english: "security",
      tags: ["security"]
    },
    {
      arabic: "\u0635\u0644\u0627\u062D\u064A\u0627\u062A",
      english: "permissions or authorization",
      tags: ["security"]
    },
    {
      arabic: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A",
      english: "the permissions or authorization rules",
      tags: ["security"]
    },
    {
      arabic: "\u0636\u064A\u0641",
      english: "add",
      tags: ["general"]
    },
    {
      arabic: "\u0632\u0648\u062F",
      english: "add or increase",
      tags: ["general"]
    },
    {
      arabic: "\u0639\u0634\u0627\u0646",
      english: "so that",
      tags: ["general"]
    },
    {
      arabic: "\u064A\u0639\u0631\u0641",
      english: "can see",
      tags: ["general"]
    },
    {
      arabic: "\u0638\u0628\u0637",
      english: "fix, improve, or refactor depending on context",
      tags: ["fix", "refactor"]
    },
    {
      arabic: "\u0638\u0628\u0637\u0644\u064A",
      english: "fix or improve this for me",
      tags: ["fix", "refactor"]
    },
    {
      arabic: "\u062D\u0644 \u0627\u0644\u0645\u0634\u0643\u0644\u0629",
      english: "fix the issue",
      tags: ["fix"]
    },
    {
      arabic: "\u0627\u0644\u0645\u0634\u0643\u0644\u0629",
      english: "the issue",
      tags: ["fix"]
    },
    {
      arabic: "\u0634\u0648\u0641 \u0627\u0644\u0645\u0634\u0643\u0644\u0629",
      english: "investigate the issue",
      tags: ["fix"]
    },
    {
      arabic: "\u0634\u0648\u0641 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u062F\u064A",
      english: "investigate this issue",
      tags: ["fix"]
    },
    {
      arabic: "\u0635\u0644\u062D",
      english: "fix",
      tags: ["fix"]
    },
    {
      arabic: "\u0635\u0644\u062D\u0647\u0627",
      english: "fix it",
      tags: ["fix"]
    },
    {
      arabic: "\u0645\u062A\u0628\u0648\u0638\u0634 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
      english: "preserve the existing design",
      tags: ["design"]
    },
    {
      arabic: "\u0628\u062F\u0648\u0646 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0641\u064A \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
      english: "without changing the design",
      tags: ["design"]
    },
    {
      arabic: "\u0628\u062F\u0648\u0646 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
      english: "without changing the design",
      tags: ["design"]
    },
    {
      arabic: "\u0628\u062F\u0648\u0646 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
      english: "without changing the design",
      tags: ["design"]
    },
    {
      arabic: "\u0646\u0641\u0633 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
      english: "keep the same design",
      tags: ["design"]
    },
    {
      arabic: "\u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
      english: "without changing the design",
      tags: ["design"]
    },
    {
      arabic: "\u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
      english: "the design",
      tags: ["design"]
    },
    {
      arabic: "\u0627\u0644\u062A\u0635\u0645\u064A\u0645",
      english: "the design",
      tags: ["design"]
    },
    {
      arabic: "\u062E\u0644\u064A\u0647\u0627 responsive",
      english: "make it responsive",
      tags: ["responsive"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F responsive",
      english: "make the code responsive",
      tags: ["responsive"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0643\u0644\u0647 responsive",
      english: "make all affected UI responsive",
      tags: ["responsive"]
    },
    {
      arabic: "\u062E\u0644\u064A\u0647 responsive",
      english: "make it responsive",
      tags: ["responsive"]
    },
    {
      arabic: "\u0631\u064A\u0633\u0628\u0648\u0646\u0633\u064A\u0641",
      english: "responsive",
      tags: ["responsive"]
    },
    {
      arabic: "\u0645\u062A\u062C\u0627\u0648\u0628",
      english: "responsive",
      tags: ["responsive"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0623\u0633\u0631\u0639",
      english: "make the code faster",
      tags: ["refactor", "performance"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0627\u0633\u0631\u0639",
      english: "make the code faster",
      tags: ["refactor", "performance"]
    },
    {
      arabic: "\u062D\u0633\u0646 \u0627\u0644\u0623\u062F\u0627\u0621",
      english: "improve performance",
      tags: ["refactor", "performance"]
    },
    {
      arabic: "\u062D\u0633\u0646 \u0627\u0644\u0627\u062F\u0627\u0621",
      english: "improve performance",
      tags: ["refactor", "performance"]
    },
    {
      arabic: "\u0627\u0644\u0623\u062F\u0627\u0621",
      english: "performance",
      tags: ["performance"]
    },
    {
      arabic: "\u0627\u0644\u0627\u062F\u0627\u0621",
      english: "performance",
      tags: ["performance"]
    },
    {
      arabic: "\u0628\u0637\u064A\u0621",
      english: "slow",
      tags: ["performance"]
    },
    {
      arabic: "\u0628\u0637\u0626",
      english: "slow",
      tags: ["performance"]
    },
    {
      arabic: "\u0628\u064A\u0643\u0631\u0627\u0634",
      english: "crashes",
      tags: ["fix", "crash"]
    },
    {
      arabic: "\u0645\u0634 \u0631\u0627\u0636\u064A \u064A\u0634\u062A\u063A\u0644",
      english: "does not work",
      tags: ["fix"]
    },
    {
      arabic: "\u0645\u0634 \u0634\u063A\u0627\u0644",
      english: "does not work",
      tags: ["fix"]
    },
    {
      arabic: "\u0645\u0634 \u0628\u064A\u062D\u0641\u0638",
      english: "does not save",
      tags: ["fix"]
    },
    {
      arabic: "\u0628\u064A\u0637\u0644\u0639 error",
      english: "throws an error",
      tags: ["fix", "error"]
    },
    {
      arabic: "\u0634\u063A\u0627\u0644 \u0639\u0646\u062F\u064A",
      english: "works on my machine",
      tags: ["environment"]
    },
    {
      arabic: "\u0646\u0636\u0641 \u0627\u0644\u0643\u0648\u062F",
      english: "clean up the code",
      tags: ["refactor"]
    },
    {
      arabic: "\u0646\u0638\u0641 \u0627\u0644\u0643\u0648\u062F",
      english: "clean up the code",
      tags: ["refactor"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0646\u0636\u064A\u0641",
      english: "make the code clean and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0646\u0638\u064A\u0641",
      english: "make the code clean and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0646\u0638\u0645",
      english: "make the code organized and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u0643\u0648\u062F \u0645\u0631\u062A\u0628",
      english: "make the code organized and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0631\u062A\u0628 \u0627\u0644\u0643\u0648\u062F",
      english: "organize the code",
      tags: ["refactor"]
    },
    {
      arabic: "\u0627\u0644\u0643\u0648\u062F \u0646\u0636\u064A\u0641",
      english: "clean and maintainable code",
      tags: ["refactor"]
    },
    {
      arabic: "\u0627\u0644\u0643\u0648\u062F \u0646\u0638\u064A\u0641",
      english: "clean and maintainable code",
      tags: ["refactor"]
    },
    {
      arabic: "\u0646\u0636\u064A\u0641",
      english: "clean and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0646\u0638\u064A\u0641",
      english: "clean and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0646\u0638\u064A\u0641\u0629",
      english: "clean and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0646\u0636\u064A\u0641\u0647",
      english: "clean and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      english: "maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0645\u0646\u0638\u0645",
      english: "organized and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0645\u0646\u0638\u0645\u0629",
      english: "organized and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0645\u0631\u062A\u0628",
      english: "organized and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0645\u0631\u062A\u0628\u0629",
      english: "organized and maintainable",
      tags: ["refactor"]
    },
    {
      arabic: "\u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u0644\u0648\u062C\u064A\u0643",
      english: "without changing the business logic",
      tags: ["logic"]
    },
    {
      arabic: "\u062E\u0644\u064A \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0628\u0633\u064A\u0637",
      english: "make the smallest safe change",
      tags: ["small-change"]
    },
    {
      arabic: "\u0631\u0627\u062C\u0639 \u0627\u0644\u0643\u0648\u062F",
      english: "review the code",
      tags: ["review"]
    },
    {
      arabic: "\u0631\u0627\u062C\u0639 \u0627\u0644\u0643\u0648\u062F \u0648\u0634\u0648\u0641 \u0641\u064A\u0647 \u0645\u0634\u0627\u0643\u0644 security",
      english: "review the code and check for security issues",
      tags: ["review", "security"]
    },
    {
      arabic: "\u0631\u0627\u062C\u0639 \u0627\u0644\u0643\u0648\u062F \u0648\u0634\u0648\u0641 \u0641\u064A\u0647 \u0645\u0634\u0627\u0643\u0644",
      english: "review the code and check for issues",
      tags: ["review"]
    },
    {
      arabic: "\u0631\u0627\u062C\u0639",
      english: "review",
      tags: ["review"]
    },
    {
      arabic: "\u0634\u0648\u0641 \u0641\u064A\u0647 \u0645\u0634\u0627\u0643\u0644",
      english: "check for issues",
      tags: ["review"]
    },
    {
      arabic: "\u0641\u064A\u0647 \u0645\u0634\u0627\u0643\u0644",
      english: "there are issues",
      tags: ["review"]
    },
    {
      arabic: "\u0645\u0634\u0627\u0643\u0644",
      english: "issues",
      tags: ["review"]
    },
    {
      arabic: "\u0627\u0641\u062D\u0635",
      english: "inspect",
      tags: ["review"]
    },
    {
      arabic: "\u0627\u0634\u0631\u062D\u0644\u064A",
      english: "explain to me",
      tags: ["explain"]
    },
    {
      arabic: "\u0627\u0634\u0631\u062D\u0644\u064A \u0627\u0644\u0643\u0648\u062F",
      english: "explain the code to me",
      tags: ["explain"]
    },
    {
      arabic: "\u0627\u0634\u0631\u062D \u0627\u0644\u0643\u0648\u062F",
      english: "explain the code",
      tags: ["explain"]
    },
    {
      arabic: "\u0627\u0643\u062A\u0628 tests",
      english: "write tests",
      tags: ["tests"]
    },
    {
      arabic: "\u0627\u0639\u0645\u0644 tests",
      english: "write tests",
      tags: ["tests"]
    },
    {
      arabic: "\u0627\u0643\u062A\u0628 \u062A\u064A\u0633\u062A\u0627\u062A",
      english: "write tests",
      tags: ["tests"]
    },
    {
      arabic: "\u0627\u0639\u0645\u0644 \u062A\u064A\u0633\u062A\u0627\u062A",
      english: "write tests",
      tags: ["tests"]
    },
    {
      arabic: "\u062A\u064A\u0633\u062A\u0627\u062A",
      english: "tests",
      tags: ["tests"]
    },
    {
      arabic: "\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A",
      english: "tests",
      tags: ["tests"]
    },
    {
      arabic: "\u0631\u0633\u0627\u0644\u0629 \u062A\u0631\u062D\u064A\u0628 \u0628\u0633\u064A\u0637\u0629",
      english: "a simple welcome message",
      tags: ["friendly", "business"]
    },
    {
      arabic: "\u0631\u0633\u0627\u0644\u0629 \u062A\u0631\u062D\u064A\u0628",
      english: "welcome message",
      tags: ["friendly", "business"]
    },
    {
      arabic: "\u0628\u0633\u064A\u0637\u0629",
      english: "simple",
      tags: ["general"]
    },
    {
      arabic: "\u0628\u0632\u0646\u0633",
      english: "business",
      tags: ["business"]
    },
    {
      arabic: "\u0628\u064A\u0632\u0646\u0633",
      english: "business",
      tags: ["business"]
    },
    {
      arabic: "\u0645\u0646\u062A\u062C",
      english: "product",
      tags: ["business"]
    },
    {
      arabic: "\u0645\u0634\u0631\u0648\u0639",
      english: "project",
      tags: ["business"]
    },
    {
      arabic: "\u0639\u0645\u064A\u0644",
      english: "customer",
      tags: ["business"]
    },
    {
      arabic: "\u0627\u0644\u0639\u0645\u064A\u0644",
      english: "the customer",
      tags: ["business"]
    },
    {
      arabic: "\u0644\u0644\u0639\u0645\u064A\u0644",
      english: "for the customer",
      tags: ["business"]
    },
    {
      arabic: "\u0644\u0644\u0639\u0645\u064A\u0644",
      english: "customer",
      tags: ["business"]
    },
    {
      arabic: "\u0644\u0644\u0639\u0645\u0644\u0627\u0621",
      english: "for customers",
      tags: ["business"]
    },
    {
      arabic: "\u0644\u0644\u0639\u0645\u0644\u0627\u0621",
      english: "customers",
      tags: ["business"]
    },
    {
      arabic: "\u0639\u0645\u0644\u0627\u0621",
      english: "customers",
      tags: ["business"]
    },
    {
      arabic: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621",
      english: "the customers",
      tags: ["business"]
    },
    {
      arabic: "\u0635\u0641\u062D\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062A",
      english: "orders page",
      tags: ["business"]
    },
    {
      arabic: "\u0635\u0641\u062D\u0629 login",
      english: "login page",
      tags: ["business", "auth"]
    },
    {
      arabic: "\u0635\u0641\u062D\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
      english: "login page",
      tags: ["business", "auth"]
    },
    {
      arabic: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
      english: "login",
      tags: ["business", "auth"]
    },
    {
      arabic: "\u0635\u0641\u062D\u0629",
      english: "page",
      tags: ["business"]
    },
    {
      arabic: "\u0632\u0631\u0627\u0631",
      english: "button",
      tags: ["business"]
    },
    {
      arabic: "\u0641\u0648\u0631\u0645",
      english: "form",
      tags: ["business"]
    },
    {
      arabic: "\u0648\u0627\u062C\u0647\u0629",
      english: "UI",
      tags: ["business"]
    },
    {
      arabic: "\u0627\u0644\u0648\u0627\u062C\u0647\u0629",
      english: "the UI",
      tags: ["business"]
    },
    {
      arabic: "\u0645\u0633\u062A\u062E\u062F\u0645",
      english: "user",
      tags: ["business"]
    },
    {
      arabic: "\u064A\u0648\u0632\u0631",
      english: "user",
      tags: ["business"]
    },
    {
      arabic: "\u0637\u0644\u0628\u0627\u062A",
      english: "orders",
      tags: ["business"]
    },
    {
      arabic: "\u0645\u0628\u064A\u0639\u0627\u062A",
      english: "sales",
      tags: ["business"]
    },
    {
      arabic: "\u0645\u062E\u0632\u0648\u0646",
      english: "inventory",
      tags: ["business"]
    },
    {
      arabic: "\u0634\u062D\u0646",
      english: "shipping",
      tags: ["business"]
    },
    {
      arabic: "\u062D\u0627\u0644\u0629 \u0627\u0644\u0634\u062D\u0646",
      english: "shipping status",
      tags: ["business"]
    },
    {
      arabic: "\u062F\u0641\u0639",
      english: "payment",
      tags: ["business"]
    },
    {
      arabic: "\u0648\u0627\u0644\u062F\u0641\u0639",
      english: "and payment",
      tags: ["business"]
    },
    {
      arabic: "\u062D\u0627\u0644\u0629 \u0627\u0644\u062F\u0641\u0639",
      english: "payment status",
      tags: ["business"]
    },
    {
      arabic: "\u0641\u0627\u062A\u0648\u0631\u0629",
      english: "invoice",
      tags: ["business"]
    },
    {
      arabic: "\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645",
      english: "dashboard",
      tags: ["business"]
    }
  ];
  function mergeGlossaries(customGlossary = []) {
    return [...customGlossary, ...egyptianDeveloperGlossary];
  }
  function findGlossaryMatches(input, glossary = egyptianDeveloperGlossary) {
    const normalizedInput = normalizeForMatching(input);
    const matches = glossary.filter(
      (entry) => matchesPhrase(normalizedInput, normalizeForMatching(entry.arabic))
    );
    return removeCoveredMatches(matches);
  }
  function normalizeDeveloperPhrases(input, glossary = egyptianDeveloperGlossary) {
    const seen = /* @__PURE__ */ new Set();
    return findGlossaryMatches(input, glossary).map((entry) => entry.english).filter((english) => {
      if (seen.has(english)) {
        return false;
      }
      seen.add(english);
      return true;
    });
  }
  function matchesPhrase(input, phrase) {
    if (!phrase.trim()) {
      return false;
    }
    return phrasePattern(phrase).test(input);
  }
  function removeCoveredMatches(matches) {
    return matches.filter((entry) => {
      const entryArabic = normalizeForMatching(entry.arabic);
      return !matches.some((candidate) => {
        const candidateArabic = normalizeForMatching(candidate.arabic);
        return candidateArabic !== entryArabic && candidateArabic.length > entryArabic.length && candidateArabic.includes(entryArabic);
      });
    });
  }
  function replaceGlossaryPhrase(input, phrase, replacement) {
    return input.normalize("NFC").replace(phrasePattern(phrase), (_match, prefix) => {
      return `${prefix}${replacement}`;
    });
  }
  function phrasePattern(phrase) {
    const escapedPhrase = escapeRegExp(phrase.normalize("NFC").trim());
    const boundary = "[^\\p{L}\\p{N}_]";
    const arabicConjunction = "\u0648?";
    return new RegExp(
      `(^|${boundary})${arabicConjunction}${escapedPhrase}(?=$|${boundary})`,
      "giu"
    );
  }
  function normalizeForMatching(input) {
    return input.normalize("NFC").toLowerCase();
  }
  function escapeRegExp(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

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
  var modeTemplates = {
    general: {
      task: "Translate and clarify this request in natural English.",
      requirements: [
        "Preserve the user's intent, tone, and useful details.",
        "Keep the English natural, concise, and actionable.",
        "If the request is business or product related, express it as practical implementation guidance.",
        "Do not invent technical details that were not provided."
      ],
      expectedOutput: ["A natural English version of the user's request."]
    },
    fix: {
      task: "Investigate and fix the reported issue.",
      requirements: [
        "Identify the root cause before making changes.",
        "Make the smallest safe code changes needed to fix the issue.",
        "Keep the existing UI and behavior unchanged unless the fix requires otherwise.",
        "Add or update tests if appropriate.",
        "Run the relevant build or test command after applying the fix.",
        "Summarize what caused the problem and what was changed."
      ]
    },
    refactor: {
      task: "Refactor and improve this code.",
      requirements: [
        "Preserve the existing behavior.",
        "Avoid unnecessary architectural changes.",
        "Keep public APIs stable unless a change is necessary.",
        "Reduce duplication where appropriate.",
        "Explain the main refactoring decisions."
      ]
    },
    review: {
      task: "Review this code and provide actionable feedback.",
      focus: [
        "Correctness.",
        "Edge cases.",
        "Maintainability.",
        "Performance.",
        "Security risks.",
        "Missing tests."
      ],
      constraints: [
        "Do not modify the code yet.",
        "First provide findings with severity and suggested fixes."
      ]
    },
    tests: {
      task: "Add or improve tests for this feature.",
      requirements: [
        "Cover the main success path.",
        "Cover important edge cases.",
        "Avoid brittle tests.",
        "Follow the existing test style in the project.",
        "Run the relevant test command if available."
      ]
    },
    explain: {
      task: "Explain how this code works.",
      requirements: [
        "Use simple language.",
        "Explain the main flow step by step.",
        "Identify the most important functions and files.",
        "Mention any confusing or risky parts.",
        "Provide a short summary at the end."
      ]
    },
    security: {
      task: "Review this code for potential security issues.",
      focus: [
        "Input validation.",
        "Authentication and authorization.",
        "Secrets exposure.",
        "Unsafe shell commands.",
        "Dependency risks.",
        "Injection vulnerabilities.",
        "Data leakage."
      ],
      constraints: [
        "Do not make changes yet.",
        "Provide findings with severity and recommended fixes."
      ]
    }
  };
  function isPromptMode(value) {
    return promptModes.includes(value);
  }

  // src/translator/preserveTechnicalTokens.ts
  var tokenPatterns = [
    {
      kind: "code_block",
      pattern: /```[\s\S]*?```/g
    },
    {
      kind: "inline_code",
      pattern: /`[^`\n]+`/g
    },
    {
      kind: "url",
      pattern: /\bhttps?:\/\/[^\s)>\]}"']+/g
    },
    {
      kind: "stack_trace",
      pattern: /(?:^|\n)(?:\s*at\s+.+\(.+:\d+:\d+\)|\s*at\s+.+:\d+:\d+|(?:TypeError|ReferenceError|SyntaxError|RangeError|Error):[^\n]+)/g
    },
    {
      kind: "file_path",
      pattern: /(?:(?<![\w@])(?:\.{1,2}\/|\/|~\/)|[A-Za-z]:\\)[^\s"'`،]+|(?<!@)\b[\w.-]+\/[\w./-]*[\w.-]+\.[A-Za-z0-9]+\b|\b[\w.-]+\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|css|scss|html|yml|yaml|env|py|go|rs|java|php|rb|cs|sql)\b/g
    },
    {
      kind: "command",
      pattern: /(?:^|\s)((?:npm|pnpm|yarn)\s+(?:run\s+)?[A-Za-z0-9:_-]+(?:\s+--?[A-Za-z0-9:_=-]+)*|(?:npx|node|tsx|tsc|vitest|jest|git|docker|docker-compose|curl|vite|next|prisma|nest)\s+[A-Za-z0-9@/._:=#?&%+-]+(?:\s+[A-Za-z0-9@/._:=#?&%+-]+)*)/g
    },
    {
      kind: "package",
      pattern: /\B@[a-z0-9._-]+\/[a-z0-9._-]+|\b[a-z0-9]+(?:[-.][a-z0-9]+)+\b/g
    },
    {
      kind: "redaction_placeholder",
      pattern: /\[(?:REDACTED_SECRET|REDACTED_PRIVATE_KEY|REDACTED_DATABASE_URL|REDACTED_EMAIL|REDACTED_PHONE)\]/g
    },
    {
      kind: "environment_variable",
      pattern: /\b[A-Z][A-Z0-9_]{2,}\b/g
    }
  ];
  function preserveTechnicalTokens(input) {
    const ranges = collectTokenRanges(input);
    const tokens = [];
    let text = "";
    let cursor = 0;
    ranges.forEach((range, index) => {
      const placeholder = `__PB_TOKEN_${index}__`;
      text += input.slice(cursor, range.start);
      text += placeholder;
      cursor = range.end;
      tokens.push({
        placeholder,
        value: range.value,
        kind: range.kind,
        start: range.start,
        end: range.end
      });
    });
    text += input.slice(cursor);
    return { text, tokens };
  }
  function collectTokenRanges(input) {
    const ranges = [];
    for (const tokenPattern of tokenPatterns) {
      for (const match of input.matchAll(tokenPattern.pattern)) {
        const rawValue = match[1] ?? match[0];
        const start = match.index ?? 0;
        const offset = match[1] ? match[0].indexOf(match[1]) : 0;
        const adjustedStart = start + Math.max(offset, 0);
        const adjustedEnd = adjustedStart + rawValue.length;
        if (!rawValue.trim()) {
          continue;
        }
        if (ranges.some((range) => overlaps(range, adjustedStart, adjustedEnd))) {
          continue;
        }
        ranges.push({
          value: rawValue,
          kind: tokenPattern.kind,
          start: adjustedStart,
          end: adjustedEnd
        });
      }
    }
    return ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  }
  function overlaps(range, start, end) {
    return start < range.end && end > range.start;
  }

  // src/translator/translatePrompt.ts
  function translatePrompt(input, options = {}) {
    const redaction = options.redact ? redactSecrets(input) : { text: input, redactionCount: 0, redactedPatternNames: [] };
    const sourceText = redaction.text.normalize("NFC");
    const preserved = preserveTechnicalTokens(sourceText);
    const glossary = mergeGlossaries(options.glossary);
    const signals = detectSignals(sourceText);
    const mode = options.mode ?? inferMode(sourceText, signals, glossary);
    const structuredPrompt = buildStructuredPrompt(
      mode,
      signals,
      sourceText,
      preserved.tokens,
      glossary
    );
    if (redaction.redactionCount > 0) {
      structuredPrompt.notes = [
        ...structuredPrompt.notes ?? [],
        "Sensitive values were redacted before this prompt was generated."
      ];
    }
    const englishPrompt = formatStructuredPrompt(structuredPrompt);
    const arabicSummary = options.bilingual ? buildArabicSummary(mode, signals, redaction.redactionCount) : void 0;
    const output = formatOutput({
      englishPrompt,
      bilingual: options.bilingual,
      arabicSummary
    });
    return {
      mode,
      englishPrompt,
      arabicSummary,
      output,
      redactionCount: redaction.redactionCount,
      preservedTokens: preserved.tokens
    };
  }
  function inferMode(text, signals, glossary) {
    const glossaryMatches = findGlossaryMatches(text, glossary);
    const tags = new Set(glossaryMatches.flatMap((match) => match.tags));
    if (signals.selectedFragment) {
      return "general";
    }
    if (signals.security || tags.has("security")) {
      return "security";
    }
    if (signals.simpleExplanation || tags.has("explain")) {
      return "explain";
    }
    if (signals.tests || tags.has("tests")) {
      return "tests";
    }
    if (signals.reviewFeedback) {
      return "review";
    }
    if (signals.review || tags.has("review")) {
      return "review";
    }
    if (signals.responsive || signals.cleanCode || signals.organizedCode || signals.preserveDesign || signals.preserveLogic || tags.has("refactor")) {
      return "refactor";
    }
    if (signals.friendlyOnly || signals.business || signals.generalRequest || tags.has("friendly") || tags.has("business") || tags.has("general") || signals.hasArabic) {
      return "general";
    }
    return "fix";
  }
  function buildStructuredPrompt(mode, signals, text, tokens, glossary) {
    const friendlyTranslation = translateFriendlyOnlyMessage(text);
    const naturalTranslation = translateNaturalMessage(text, glossary);
    if (mode === "general" && signals.friendlyOnly && friendlyTranslation) {
      return { task: friendlyTranslation };
    }
    if (mode === "general" && naturalTranslation) {
      return { task: naturalTranslation };
    }
    const template = modeTemplates[mode];
    const prompt = {
      task: buildTask(mode, signals, template),
      context: contextFromInput(text, signals, glossary),
      requirements: unique([
        ...modeRequirements(mode, template, signals),
        ...signalRequirements(mode, signals)
      ]),
      focus: template.focus,
      constraints: unique([
        ...modeConstraints(mode, template, signals),
        ...signalConstraints(mode, signals)
      ]),
      expectedOutput: expectedOutputForMode(mode, signals),
      technicalContext: technicalContextFromTokens(tokens)
    };
    if (!prompt.requirements?.length) {
      delete prompt.requirements;
    }
    if (!prompt.context?.length) {
      delete prompt.context;
    }
    if (!prompt.constraints?.length) {
      delete prompt.constraints;
    }
    if (!prompt.expectedOutput?.length) {
      delete prompt.expectedOutput;
    }
    return prompt;
  }
  function contextFromInput(text, signals, glossary) {
    const approximateRequest = approximateEnglishRequest(text, glossary);
    const handledTranslation = translateReviewFeedbackRequest(text) ?? translateCodeQualityRequest(text);
    const phraseContext = handledTranslation ? [] : normalizeDeveloperPhrases(text, glossary).filter(
      (phrase) => !approximateRequest?.includes(phrase)
    );
    const context = approximateRequest ? [`Natural English interpretation: ${approximateRequest}`, ...phraseContext] : [...phraseContext];
    if (signals.buildError) {
      context.push("The user is likely reporting a build failure.");
    }
    if (signals.saveReload) {
      context.push("The user is reporting that a save action reloads the page.");
    }
    if (signals.crash) {
      context.push("The user is reporting a crash or hang.");
    }
    if (signals.business) {
      context.push("The request includes business or product workflow context.");
    }
    if (signals.friendly && !signals.friendlyOnly) {
      context.push("The user included a friendly greeting or casual tone.");
    }
    return unique(context);
  }
  function buildTask(mode, signals, template) {
    if (mode === "general") {
      if (signals.business) {
        return "Turn this Arabic business or product request into a clear English implementation prompt.";
      }
      return "Translate and clarify this Arabic request in natural English.";
    }
    if (mode === "fix") {
      if (signals.buildError) {
        return "Investigate and fix the build error in this project.";
      }
      if (signals.saveReload) {
        return "Investigate and fix the bug where clicking Save reloads the page and does not persist the data.";
      }
      if (signals.crash) {
        return "Investigate and fix the crash in this code or project.";
      }
      if (signals.error) {
        return "Investigate and fix the reported error.";
      }
    }
    if (mode === "review" && signals.reviewFeedback) {
      return "Review the completed work and provide actionable feedback.";
    }
    if (mode === "refactor" && signals.responsive) {
      return "Refactor this code to make it responsive.";
    }
    if (mode === "refactor" && signals.performance) {
      return "Improve this code's performance while preserving its behavior.";
    }
    if (mode === "refactor" && signals.cleanCode) {
      return "Organize and clean up this code while preserving its behavior.";
    }
    if (mode === "refactor" && signals.organizedCode) {
      return "Organize this code and improve its maintainability while preserving behavior.";
    }
    if (mode === "explain" && signals.simpleExplanation) {
      return "Explain how this code works in simple language.";
    }
    if (mode === "security") {
      if (signals.securityHardening) {
        if (signals.organizedCode) {
          return "Improve this code to make it secure, organized, and maintainable.";
        }
        if (signals.cleanCode) {
          return "Improve this code to make it secure, clean, and maintainable.";
        }
        return "Improve this code to make it more secure.";
      }
      return "Review this code for potential security issues.";
    }
    return template.task;
  }
  function modeRequirements(mode, template, signals) {
    if (mode === "review" && signals.reviewFeedback) {
      return [
        "Assess whether the completed work is correct, maintainable, and aligned with the likely request.",
        "Call out concrete issues, risks, and missing tests.",
        "Mention what looks good when it is useful.",
        "Suggest practical next improvements.",
        "Do not modify the code yet."
      ];
    }
    if (mode === "refactor" && signals.responsive) {
      return [
        "Make the affected UI responsive across common screen sizes.",
        "Preserve the existing behavior.",
        "Avoid changing public APIs unless necessary.",
        "Make the smallest safe changes.",
        "Explain what was changed and why."
      ];
    }
    if (mode === "refactor" && signals.performance) {
      return [
        "Identify the likely performance bottleneck before changing code.",
        "Make targeted improvements that preserve existing behavior.",
        "Avoid broad rewrites unless they are necessary for the performance fix.",
        "Keep public APIs stable unless a change is required.",
        "Run the relevant build, test, or profiling command when available.",
        "Explain what improved and how it was verified."
      ];
    }
    if (mode === "refactor" && signals.cleanCode) {
      return [
        "Improve readability, structure, and maintainability.",
        "Preserve the existing behavior.",
        "Avoid changing public APIs unless necessary.",
        "Avoid broad rewrites or unrelated refactors.",
        "Keep the smallest clear improvement that satisfies the request.",
        "Explain what was cleaned up or reorganized."
      ];
    }
    if (mode === "refactor" && signals.organizedCode) {
      return [
        "Improve the code organization and structure.",
        "Preserve the existing behavior.",
        "Avoid changing public APIs unless necessary.",
        "Avoid broad rewrites or unrelated refactors.",
        "Keep the smallest clear improvement that satisfies the request.",
        "Explain what was reorganized and why."
      ];
    }
    if (mode === "security" && signals.securityHardening) {
      const requirements = [
        "Identify the security risks that are relevant to the provided code or request.",
        "Make the smallest safe changes needed to improve security.",
        "Preserve existing behavior and public APIs unless a security fix requires otherwise.",
        "Avoid broad rewrites or unrelated refactors.",
        "Add or update tests if the security change affects behavior.",
        "Run the relevant build, test, or security check when available.",
        "Explain what was hardened and why."
      ];
      if (signals.cleanCode || signals.organizedCode) {
        requirements.splice(
          3,
          0,
          "Improve readability, structure, and maintainability without changing behavior."
        );
      }
      return requirements;
    }
    return template.requirements ?? [];
  }
  function modeConstraints(mode, template, signals) {
    if (mode === "security" && signals.securityHardening) {
      return [];
    }
    return template.constraints ?? [];
  }
  function signalRequirements(mode, signals) {
    const requirements = [];
    if (signals.preserveDesign) {
      requirements.push("Preserve the existing visual design.");
    }
    if (signals.preserveLogic) {
      requirements.push("Do not change the existing business logic.");
    }
    if (signals.noDeletion) {
      requirements.push("Do not remove existing content or fields unless explicitly required.");
    }
    if (signals.smallSafeChange && mode !== "refactor") {
      requirements.push("Make the smallest safe change that solves the request.");
    }
    if (signals.buildError && mode !== "fix") {
      requirements.push("Run the relevant build command after applying the fix.");
    }
    if (signals.tests && mode !== "tests") {
      requirements.push("Add or update tests if the change affects behavior.");
    }
    if (signals.urgent) {
      requirements.push("Prioritize the main blocking issue first.");
    }
    if (signals.business) {
      requirements.push(
        "Preserve any business entities, workflows, and product constraints mentioned by the user."
      );
    }
    if (mode === "general" && signals.implementation) {
      requirements.push("Express the request as a concise implementation prompt.");
    }
    return requirements;
  }
  function signalConstraints(mode, signals) {
    const constraints = [];
    if (signals.preserveDesign && mode !== "review" && mode !== "security") {
      constraints.push("Do not redesign the UI.");
    }
    if (signals.preserveLogic) {
      constraints.push("Avoid broad rewrites or unrelated refactors.");
    }
    return constraints;
  }
  function expectedOutputForMode(mode, signals) {
    if (mode === "general") {
      return [
        "A natural English version of the request.",
        "A concise actionable prompt when the request is product or implementation related."
      ];
    }
    if (mode === "security" && signals.securityHardening) {
      return [
        "A concise summary of the security changes.",
        "The risks addressed by the changes.",
        "What was verified."
      ];
    }
    if (mode === "review" && signals.reviewFeedback) {
      return [
        "High-signal feedback on what works and what needs attention.",
        "Findings ordered by impact.",
        "Concrete next steps."
      ];
    }
    if (mode === "review" || mode === "security") {
      return [
        "List findings ordered by severity.",
        "Include the reason each issue matters.",
        "Suggest concrete fixes."
      ];
    }
    if (mode === "explain") {
      return [
        "A clear explanation.",
        "Important files, functions, or flow details.",
        "A short summary."
      ];
    }
    return ["A concise summary of what changed and what was verified."];
  }
  function detectSignals(text) {
    const normalized = text.toLowerCase();
    const security = containsAny(normalized, [
      "security",
      "secure",
      "secure it",
      "secure the code",
      "make it secure",
      "make the code secure",
      "harden",
      "hardening",
      "\u062D\u0645\u0627\u064A\u0629",
      "\u0623\u0645\u0627\u0646",
      "\u0627\u0645\u0627\u0646",
      "\u0627\u0644\u0623\u0645\u0627\u0646",
      "\u0627\u0644\u0627\u0645\u0627\u0646",
      "\u0628\u0627\u0644\u0623\u0645\u0627\u0646",
      "\u0628\u0627\u0644\u0627\u0645\u0627\u0646",
      "\u0627\u0647\u062A\u0645 \u0628\u0627\u0644\u0623\u0645\u0627\u0646",
      "\u0627\u0647\u062A\u0645 \u0628\u0627\u0644\u0627\u0645\u0627\u0646",
      "\u0623\u0645\u0646",
      "\u0627\u0645\u0646",
      "\u0622\u0645\u0646",
      "\u0622\u0645\u0646\u0629",
      "\u0627\u0645\u0646\u0629",
      "\u062B\u063A\u0631\u0629",
      "\u062B\u063A\u0631\u0627\u062A",
      "vulnerability",
      "vulnerabilities"
    ]);
    const securityHardening = security && containsAny(normalized, [
      "\u062E\u0644\u064A",
      "\u062E\u0644\u0651\u064A",
      "\u062E\u0644\u064A\u0647",
      "\u062E\u0644\u064A\u0647\u0627",
      "\u0627\u062C\u0639\u0644",
      "\u0627\u0639\u0645\u0644",
      "\u062D\u0633\u0646",
      "\u062D\u0633\u0651\u0646",
      "\u0632\u0648\u062F",
      "\u0636\u064A\u0641",
      "\u0635\u0644\u062D",
      "\u0627\u0647\u062A\u0645",
      "make",
      "improve",
      "secure it",
      "secure the code",
      "make it secure",
      "make this secure",
      "make the code secure",
      "harden"
    ]) && !containsAny(normalized, [
      "\u0631\u0627\u062C\u0639 \u0628\u0633",
      "review only",
      "do not change",
      "without changing",
      "\u0645\u062A\u0639\u062F\u0644\u0634",
      "\u0645\u0646 \u063A\u064A\u0631 \u062A\u0639\u062F\u064A\u0644"
    ]);
    const organizedCode = containsAny(normalized, [
      "organized",
      "organization",
      "structure",
      "structured",
      "\u0645\u0646\u0638\u0645",
      "\u0645\u0646\u0638\u0645\u0629",
      "\u0645\u0631\u062A\u0628",
      "\u0645\u0631\u062A\u0628\u0629",
      "\u0631\u062A\u0628"
    ]);
    const cleanCode = containsAny(normalized, [
      "clean",
      "clean code",
      "maintainable",
      "maintainability",
      "\u0646\u0636\u064A\u0641",
      "\u0646\u0638\u064A\u0641",
      "\u0646\u0638\u064A\u0641\u0629",
      "\u0646\u0636\u064A\u0641\u0647",
      "\u0646\u0636\u0641",
      "\u0646\u0638\u0641",
      "\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629"
    ]);
    const friendly = containsAny(normalized, [
      "\u0647\u0627\u064A",
      "\u0647\u0627\u0649",
      "\u0645\u0631\u062D\u0628\u0627",
      "\u0623\u0647\u0644\u0627",
      "\u0627\u0647\u0644\u0627",
      "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645",
      "\u0627\u0632\u064A\u0643",
      "\u0625\u0632\u064A\u0643",
      "\u0639\u0627\u0645\u0644 \u0627\u064A\u0647",
      "\u0635\u0628\u0627\u062D \u0627\u0644\u062E\u064A\u0631",
      "\u0645\u0633\u0627\u0621 \u0627\u0644\u062E\u064A\u0631",
      "\u0634\u0643\u0631\u0627"
    ]);
    const friendlyOnly = isFriendlyOnlyMessage(normalized);
    const business = containsAny(normalized, [
      "business",
      "product",
      "\u0628\u0632\u0646\u0633",
      "\u0628\u064A\u0632\u0646\u0633",
      "\u0645\u0646\u062A\u062C",
      "\u0645\u0634\u0631\u0648\u0639",
      "\u0639\u0645\u064A\u0644",
      "\u0639\u0645\u0644\u0627\u0621",
      "\u0637\u0644\u0628\u0627\u062A",
      "\u0627\u0648\u0631\u062F\u0631",
      "\u0623\u0648\u0631\u062F\u0631",
      "order",
      "orders",
      "\u0645\u0628\u064A\u0639\u0627\u062A",
      "sales",
      "\u0645\u062E\u0632\u0648\u0646",
      "inventory",
      "\u0641\u0627\u062A\u0648\u0631\u0629",
      "invoice",
      "checkout",
      "\u062F\u0641\u0639",
      "payment",
      "\u0634\u062D\u0646",
      "shipping",
      "store",
      "\u0645\u062A\u062C\u0631",
      "\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645",
      "dashboard",
      "\u0635\u0641\u062D\u0629",
      "\u0632\u0631\u0627\u0631",
      "\u0641\u0648\u0631\u0645",
      "\u0648\u0627\u062C\u0647\u0629",
      "login",
      "auth"
    ]);
    const generalRequest = containsAny(normalized, [
      "\u0639\u0627\u064A\u0632",
      "\u0645\u062D\u062A\u0627\u062C",
      "\u0644\u0648 \u0633\u0645\u062D\u062A",
      "\u0627\u0639\u0645\u0644",
      "\u0623\u0632\u0648\u062F",
      "\u0627\u0632\u0648\u062F",
      "\u0623\u0636\u064A\u0641",
      "\u0636\u064A\u0641",
      "\u0632\u0648\u062F",
      "\u0627\u0647\u062A\u0645",
      "\u0638\u0628\u0637",
      "\u0638\u0628\u0637\u0644\u064A",
      "\u0627\u0636\u0628\u0637",
      "\u062E\u0644\u064A",
      "\u0627\u0643\u062A\u0628",
      "\u062D\u0648\u0651\u0644",
      "\u062D\u0648\u0644",
      "translate",
      "convert"
    ]);
    const responsive = containsAny(normalized, [
      "responsive",
      "\u0631\u064A\u0633\u0628\u0648\u0646\u0633\u064A\u0641",
      "\u0645\u062A\u062C\u0627\u0648\u0628",
      "\u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644",
      "\u0645\u0648\u0628\u0627\u064A\u0644",
      "mobile"
    ]);
    const performance = containsAny(normalized, [
      "performance",
      "faster",
      "slow",
      "optimize",
      "\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0623\u062F\u0627\u0621",
      "\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0627\u062F\u0627\u0621",
      "\u0627\u0644\u0623\u062F\u0627\u0621",
      "\u0627\u0644\u0627\u062F\u0627\u0621",
      "\u0623\u0633\u0631\u0639",
      "\u0627\u0633\u0631\u0639",
      "\u0628\u0637\u064A\u0621",
      "\u0628\u0637\u0626"
    ]);
    const simpleExplanation = containsAny(normalized, [
      "\u0627\u0634\u0631\u062D",
      "\u0627\u0634\u0631\u062D\u0644\u064A",
      "\u0628\u0628\u0633\u0627\u0637\u0629",
      "explain",
      "simple"
    ]);
    const tests = containsAny(normalized, [
      "test",
      "tests",
      "\u0627\u062E\u062A\u0628\u0627\u0631",
      "\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A",
      "\u062A\u064A\u0633\u062A",
      "\u062A\u064A\u0633\u062A\u0627\u062A",
      "vitest",
      "jest"
    ]);
    const reviewFeedback = Boolean(translateReviewFeedbackRequest(normalized));
    const review = reviewFeedback || containsAny(normalized, [
      "\u0631\u0627\u062C\u0639",
      "\u0627\u0641\u062D\u0635",
      "review",
      "code review",
      "\u0634\u0648\u0641 \u0641\u064A\u0647 \u0645\u0634\u0627\u0643\u0644"
    ]);
    const buildError = containsAny(normalized, [
      "build error",
      "\u0628\u064A\u0644\u062F error",
      "\u062E\u0637\u0623 build",
      "\u0645\u0634\u0643\u0644\u0629 build",
      "npm run build"
    ]);
    const error = containsAny(normalized, [
      "error",
      "bug",
      "\u0645\u0634\u0643\u0644\u0629",
      "\u063A\u0644\u0637",
      "\u0645\u0634 \u0634\u063A\u0627\u0644",
      "\u0645\u0634 \u0631\u0627\u0636\u064A \u064A\u0634\u062A\u063A\u0644",
      "\u0628\u064A\u0637\u0644\u0639"
    ]);
    const crash = containsAny(normalized, ["crash", "\u0628\u064A\u0643\u0631\u0627\u0634", "\u0628\u064A\u0647\u0646\u062C", "hang"]);
    const implementation = containsAny(normalized, [
      "\u0646\u0641\u0630",
      "\u0637\u0628\u0651\u0642",
      "\u0637\u0628\u0642",
      "\u0627\u0628\u0646\u064A",
      "\u0627\u0639\u0645\u0644",
      "\u0636\u064A\u0641",
      "\u0632\u0648\u062F",
      "\u0627\u0647\u062A\u0645",
      "implement",
      "build",
      "add",
      "create"
    ]);
    const codingIntent = business || responsive || performance || security || cleanCode || organizedCode || simpleExplanation || tests || review || buildError || error || crash || implementation || containsAny(normalized, [
      "\u0627\u0644\u0643\u0648\u062F",
      "\u0643\u0648\u062F",
      "code",
      "api",
      "function",
      "component",
      "database",
      "db",
      "frontend",
      "backend",
      "ui",
      "ux"
    ]);
    const selectedFragment = hasArabicText(normalized) && !generalRequest && !implementation && !review && !tests && !simpleExplanation && !buildError && !error && !crash && wordCount(normalized) <= 5;
    return {
      hasArabic: hasArabicText(normalized),
      friendly,
      friendlyOnly,
      business,
      generalRequest,
      selectedFragment,
      codingIntent,
      cleanCode,
      organizedCode,
      responsive,
      performance,
      implementation,
      preserveDesign: containsAny(normalized, [
        "\u0628\u062F\u0648\u0646 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0641\u064A \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
        "\u0628\u062F\u0648\u0646 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
        "\u0628\u062F\u0648\u0646 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
        "\u0628\u062F\u0648\u0646 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062A\u0635\u0645\u064A\u0645",
        "\u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
        "\u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u062A\u0635\u0645\u064A\u0645",
        "\u0645\u0646 \u063A\u064A\u0631 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
        "\u0645\u0646 \u063A\u064A\u0631 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062A\u0635\u0645\u064A\u0645",
        "\u0645\u062A\u063A\u064A\u0631\u0634 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
        "\u0645\u062A\u063A\u064A\u0631\u0634 \u0634\u0643\u0644",
        "\u0645\u062A\u0628\u0648\u0638\u0634 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
        "\u0645\u062A\u0628\u0648\u0638\u0634 \u0627\u0644\u062A\u0635\u0645\u064A\u0645",
        "\u0646\u0641\u0633 \u0627\u0644\u062F\u064A\u0632\u0627\u064A\u0646",
        "\u0646\u0641\u0633 \u0627\u0644\u062A\u0635\u0645\u064A\u0645",
        "preserve design",
        "without changing the design"
      ]),
      preserveLogic: containsAny(normalized, [
        "\u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u0644\u0648\u062C\u064A\u0643",
        "\u0645\u062A\u063A\u064A\u0631\u0634 \u0627\u0644\u0644\u0648\u062C\u064A\u0643",
        "\u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644 logic",
        "business logic",
        "without changing the logic"
      ]),
      smallSafeChange: containsAny(normalized, [
        "\u062E\u0644\u064A \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0628\u0633\u064A\u0637",
        "\u062A\u0639\u062F\u064A\u0644 \u0628\u0633\u064A\u0637",
        "\u0628\u0623\u0642\u0644 \u062A\u0639\u062F\u064A\u0644",
        "\u0627\u0642\u0644 \u062A\u0639\u062F\u064A\u0644",
        "smallest safe",
        "safe change"
      ]),
      buildError,
      error,
      crash,
      saveReload: containsAny(normalized, [
        "save",
        "\u062D\u0641\u0638"
      ]) && containsAny(normalized, ["reload", "refresh", "\u0631\u064A\u0644\u0648\u062F", "\u0628\u062A\u0639\u0645\u0644 reload"]),
      security,
      securityHardening,
      simpleExplanation,
      tests,
      review,
      reviewFeedback,
      noDeletion: containsAny(normalized, [
        "\u0645\u062A\u062D\u0630\u0641\u0634",
        "\u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u062D\u0630\u0641",
        "\u0628\u062F\u0648\u0646 \u0645\u0627 \u062A\u062D\u0630\u0641",
        "do not remove",
        "without removing"
      ]),
      urgent: containsAny(normalized, [
        "\u0636\u0631\u0648\u0631\u064A",
        "\u0628\u0633\u0631\u0639\u0629",
        "urgent",
        "asap",
        "\u0645\u0647\u0645"
      ])
    };
  }
  function buildArabicSummary(mode, signals, redactionCount) {
    const summaries = {
      general: "\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0643\u0644\u0627\u0645 \u0627\u0644\u0639\u0631\u0628\u064A \u0625\u0644\u0649 \u0625\u0646\u062C\u0644\u064A\u0632\u064A \u0637\u0628\u064A\u0639\u064A \u0648\u0648\u0627\u0636\u062D \u0645\u0639 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0645\u0639\u0646\u0649 \u0648\u0627\u0644\u0646\u0628\u0631\u0629 \u0648\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0647\u0645\u0629.",
      fix: "\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0641\u062D\u0635 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u060C \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0633\u0628\u0628 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u060C \u0625\u0635\u0644\u0627\u062D\u0647\u0627 \u0628\u0623\u0642\u0644 \u062A\u0639\u062F\u064A\u0644 \u0622\u0645\u0646\u060C \u0648\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0623\u0648 build \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0628\u0639\u062F \u0627\u0644\u0625\u0635\u0644\u0627\u062D.",
      refactor: "\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0643\u0648\u062F \u0648\u062A\u0646\u0638\u064A\u0645\u0647 \u0645\u0639 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0633\u0644\u0648\u0643 \u0627\u0644\u062D\u0627\u0644\u064A \u0648\u062A\u062C\u0646\u0628 \u0623\u064A \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u063A\u064A\u0631 \u0636\u0631\u0648\u0631\u064A\u0629.",
      review: "\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0643\u0648\u062F \u0648\u0625\u062E\u0631\u0627\u062C \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0639\u0645\u0644\u064A\u0629 \u0645\u0631\u062A\u0628\u0629 \u062D\u0633\u0628 \u0627\u0644\u062E\u0637\u0648\u0631\u0629 \u0628\u062F\u0648\u0646 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0643\u0648\u062F \u0645\u0628\u0627\u0634\u0631\u0629.",
      tests: "\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0625\u0636\u0627\u0641\u0629 \u0623\u0648 \u062A\u062D\u0633\u064A\u0646 tests \u062A\u063A\u0637\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0648\u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0647\u0645\u0629 \u0628\u062F\u0648\u0646 \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0647\u0634\u0629.",
      explain: "\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0634\u0631\u062D \u0627\u0644\u0643\u0648\u062F \u0628\u0644\u063A\u0629 \u0628\u0633\u064A\u0637\u0629\u060C \u062E\u0637\u0648\u0629 \u0628\u062E\u0637\u0648\u0629\u060C \u0645\u0639 \u062A\u0648\u0636\u064A\u062D \u0623\u0647\u0645 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0623\u0648 \u0627\u0644\u062F\u0648\u0627\u0644 \u0648\u0646\u0642\u0627\u0637 \u0627\u0644\u062D\u0630\u0631.",
      security: "\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0643\u0648\u062F \u0645\u0646 \u0646\u0627\u062D\u064A\u0629 security \u0648\u0625\u062E\u0631\u0627\u062C findings \u0648\u0627\u0636\u062D\u0629 \u0628\u0627\u0644\u062E\u0637\u0648\u0631\u0629 \u0648\u0627\u0644\u062D\u0644\u0648\u0644 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629."
    };
    const details = [summaries[mode]];
    if (mode === "security" && signals.securityHardening) {
      details[0] = "\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062A\u062D\u0633\u064A\u0646 \u0623\u0645\u0627\u0646 \u0627\u0644\u0643\u0648\u062F \u0628\u0623\u0642\u0644 \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u0622\u0645\u0646\u0629 \u0645\u0645\u0643\u0646\u0629\u060C \u0645\u0639 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0633\u0644\u0648\u0643 \u0627\u0644\u062D\u0627\u0644\u064A \u0648\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628.";
    }
    if (signals.responsive) {
      details.push("\u0643\u0645\u0627\u0646 \u0644\u0627\u0632\u0645 \u0646\u062E\u0644\u064A \u0627\u0644\u0648\u0627\u062C\u0647\u0629 responsive.");
    }
    if (signals.preserveDesign) {
      details.push("\u0644\u0627\u0632\u0645 \u0646\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0646\u0641\u0633 \u0634\u0643\u0644 \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u062D\u0627\u0644\u064A.");
    }
    if (signals.preserveLogic) {
      details.push("\u0644\u0627\u0632\u0645 \u0646\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0646\u0641\u0633 business logic.");
    }
    if (redactionCount > 0) {
      details.push("\u062A\u0645 \u0625\u062E\u0641\u0627\u0621 secrets \u062D\u0633\u0627\u0633\u0629 \u0642\u0628\u0644 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0640 prompt.");
    }
    return details.join(" ");
  }
  function technicalContextFromTokens(tokens) {
    const seen = /* @__PURE__ */ new Set();
    const values = [];
    for (const token of tokens) {
      if (seen.has(token.value)) {
        continue;
      }
      seen.add(token.value);
      values.push(token.value);
    }
    return values;
  }
  function containsAny(input, values) {
    return values.some((value) => input.includes(value.toLowerCase()));
  }
  function hasArabicText(input) {
    return /[\u0600-\u06ff]/.test(input);
  }
  function wordCount(input) {
    return input.trim().split(/\s+/).filter(Boolean).length;
  }
  function isFriendlyOnlyMessage(input) {
    const normalized = normalizeFriendlyText(input);
    const friendlyPhrases = [
      "\u0647\u0627\u064A",
      "\u0647\u0627\u0649",
      "\u0645\u0631\u062D\u0628\u0627",
      "\u0623\u0647\u0644\u0627",
      "\u0627\u0647\u0644\u0627",
      "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645",
      "\u0635\u0628\u0627\u062D \u0627\u0644\u062E\u064A\u0631",
      "\u0645\u0633\u0627\u0621 \u0627\u0644\u062E\u064A\u0631",
      "\u0634\u0643\u0631\u0627",
      "\u0627\u0632\u064A\u0643",
      "\u0625\u0632\u064A\u0643",
      "\u0639\u0627\u0645\u0644 \u0627\u064A\u0647",
      "\u0625\u0632\u064A\u0643 \u0639\u0627\u0645\u0644 \u0627\u064A\u0647",
      "\u0627\u0632\u064A\u0643 \u0639\u0627\u0645\u0644 \u0627\u064A\u0647",
      "\u062A\u0645\u0627\u0645"
    ];
    return friendlyPhrases.includes(normalized);
  }
  function translateFriendlyOnlyMessage(input) {
    switch (normalizeFriendlyText(input)) {
      case "\u0647\u0627\u064A":
      case "\u0647\u0627\u0649":
        return "Hi.";
      case "\u0645\u0631\u062D\u0628\u0627":
      case "\u0623\u0647\u0644\u0627":
      case "\u0627\u0647\u0644\u0627":
      case "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645":
        return "Hello.";
      case "\u0635\u0628\u0627\u062D \u0627\u0644\u062E\u064A\u0631":
        return "Good morning.";
      case "\u0645\u0633\u0627\u0621 \u0627\u0644\u062E\u064A\u0631":
        return "Good evening.";
      case "\u0634\u0643\u0631\u0627":
        return "Thank you.";
      case "\u0627\u0632\u064A\u0643":
      case "\u0625\u0632\u064A\u0643":
      case "\u0639\u0627\u0645\u0644 \u0627\u064A\u0647":
      case "\u0625\u0632\u064A\u0643 \u0639\u0627\u0645\u0644 \u0627\u064A\u0647":
      case "\u0627\u0632\u064A\u0643 \u0639\u0627\u0645\u0644 \u0627\u064A\u0647":
        return "How are you?";
      case "\u062A\u0645\u0627\u0645":
        return "Okay.";
      default:
        return void 0;
    }
  }
  function normalizeFriendlyText(input) {
    return input.trim().replace(/[؟?!.,،؛:]+/g, "").replace(/\s+/g, " ").toLowerCase();
  }
  function approximateEnglishRequest(text, glossary) {
    if (!hasArabicText(text)) {
      return void 0;
    }
    const reviewFeedbackTranslation = translateReviewFeedbackRequest(text);
    if (reviewFeedbackTranslation) {
      return reviewFeedbackTranslation;
    }
    const codeQualityTranslation = translateCodeQualityRequest(text);
    if (codeQualityTranslation) {
      return codeQualityTranslation;
    }
    const matches = findGlossaryMatches(text, glossary).sort(
      (left, right) => right.arabic.length - left.arabic.length
    );
    if (!matches.length) {
      return void 0;
    }
    let translated = text.trim();
    for (const entry of matches) {
      translated = replaceGlossaryPhrase(translated, entry.arabic, entry.english);
    }
    translated = translated.replace(/[،؛]/g, ",").replace(/\s+/g, " ").trim();
    return translated === text.trim() ? void 0 : translated;
  }
  function translateReviewFeedbackRequest(text) {
    const normalized = normalizeArabicIntentText(text);
    const asksForOpinion = containsAny(normalized, [
      "\u0627\u064A\u0647 \u0631\u0627\u064A\u0643",
      "\u0627\u064A \u0631\u0627\u064A\u0643",
      "\u0631\u0627\u064A\u0643 \u0627\u064A\u0647",
      "\u0642\u0648\u0644 \u0631\u0627\u064A\u0643",
      "\u0642\u0648\u0644\u064A \u0631\u0627\u064A\u0643",
      "\u0642\u0648\u0644\u0644\u064A \u0631\u0627\u064A\u0643",
      "\u0627\u062F\u064A\u0646\u064A \u0631\u0627\u064A\u0643",
      "\u0639\u0627\u064A\u0632 \u0631\u0627\u064A\u0643",
      "what do you think",
      "give me feedback",
      "feedback"
    ]);
    if (!asksForOpinion) {
      return void 0;
    }
    const mentionsCompletedWork = containsAny(normalized, [
      "\u0627\u0644\u0634\u063A\u0644 \u0627\u0644\u0645\u0639\u0645\u0648\u0644",
      "\u0627\u0644\u0634\u063A\u0644 \u0627\u0644\u0644\u064A \u0645\u0639\u0645\u0648\u0644",
      "\u0627\u0644\u0634\u063A\u0644 \u0627\u0644\u064A \u0645\u0639\u0645\u0648\u0644",
      "\u0627\u0644\u0634\u063A\u0644 \u0627\u0644\u0644\u064A \u0627\u062A\u0639\u0645\u0644",
      "\u0627\u0644\u0634\u063A\u0644 \u0627\u0644\u064A \u0627\u062A\u0639\u0645\u0644",
      "\u0627\u0644\u0634\u063A\u0644 \u0627\u0644\u0645\u062A\u0639\u0645\u0644",
      "\u0627\u0644\u0634\u063A\u0644 \u062F\u0647",
      "\u0627\u0644\u0634\u063A\u0644 \u062F\u0627",
      "\u0627\u0644\u0634\u063A\u0644",
      "\u0627\u0644\u0644\u064A \u0627\u062A\u0639\u0645\u0644",
      "\u0627\u0644\u064A \u0627\u062A\u0639\u0645\u0644",
      "\u0627\u0644\u0645\u0639\u0645\u0648\u0644",
      "\u0627\u0644\u062A\u0646\u0641\u064A\u0630",
      "\u0627\u0644\u0644\u064A \u0646\u0641\u0630\u062A\u0647",
      "\u0627\u0644\u064A \u0646\u0641\u0630\u062A\u0647",
      "completed work",
      "done work",
      "implementation"
    ]);
    const mentionsCode = containsAny(normalized, [
      "\u0627\u0644\u0643\u0648\u062F",
      "\u0643\u0648\u062F",
      "code",
      "pull request",
      "pr",
      "branch",
      "\u0628\u0631\u0646\u0634"
    ]);
    if (mentionsCompletedWork) {
      return "review the completed work and provide feedback";
    }
    if (mentionsCode) {
      return "review this code and provide feedback";
    }
    return void 0;
  }
  function normalizeArabicIntentText(input) {
    return input.normalize("NFC").toLowerCase().replace(/[\u064b-\u065f\u0670]/g, "").replace(/[إأآٱ]/g, "\u0627").replace(/ؤ/g, "\u0648").replace(/ئ/g, "\u064A").replace(/ى/g, "\u064A").replace(/ة/g, "\u0647").replace(/\u0640/g, "").replace(/[؟?!.,،؛:]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function translateCodeQualityRequest(text) {
    const normalized = text.normalize("NFC").toLowerCase();
    if (containsAny(normalized, [
      "\u0631\u0627\u062C\u0639",
      "\u0627\u0641\u062D\u0635",
      "review",
      "code review",
      "\u0634\u0648\u0641 \u0641\u064A\u0647 \u0645\u0634\u0627\u0643\u0644",
      "\u0645\u0634\u0627\u0643\u0644 security",
      "security issues"
    ])) {
      return void 0;
    }
    const attributes = codeQualityAttributes(normalized);
    if (!attributes.length) {
      return void 0;
    }
    const isRequest = containsAny(normalized, [
      "\u0627\u0644\u0643\u0648\u062F",
      "\u0643\u0648\u062F",
      "code",
      "\u062E\u0644\u064A",
      "\u062E\u0644\u0651\u064A",
      "\u062E\u0644\u064A\u0647",
      "\u0627\u062C\u0639\u0644",
      "\u0627\u0639\u0645\u0644",
      "\u0627\u0647\u062A\u0645",
      "\u062D\u0633\u0646",
      "\u062D\u0633\u0651\u0646",
      "\u0638\u0628\u0637",
      "\u0638\u0628\u0637\u0644\u064A",
      "make",
      "improve"
    ]);
    const labels = formatCodeQualityLabels(attributes);
    if (isRequest) {
      return `make the code ${labels}`;
    }
    return labels;
  }
  function codeQualityAttributes(input) {
    const attributes = [];
    addCodeQualityAttribute(attributes, input, "organized", "organized", [
      "organized",
      "organization",
      "structured",
      "structure",
      "\u0645\u0646\u0638\u0645",
      "\u0645\u0646\u0638\u0645\u0629",
      "\u0645\u0631\u062A\u0628",
      "\u0645\u0631\u062A\u0628\u0629",
      "\u0631\u062A\u0628"
    ]);
    addCodeQualityAttribute(attributes, input, "clean", "clean", [
      "clean",
      "clean code",
      "\u0646\u0638\u064A\u0641",
      "\u0646\u0636\u064A\u0641\u0629",
      "\u0646\u0638\u064A\u0641\u0629",
      "\u0646\u0636\u064A\u0641",
      "\u0646\u0636\u064A\u0641\u0647",
      "\u0646\u0636\u0641",
      "\u0646\u0638\u0641"
    ]);
    addCodeQualityAttribute(attributes, input, "secure", "secure", [
      "secure",
      "security",
      "harden",
      "hardening",
      "\u0622\u0645\u0646",
      "\u0627\u0645\u0646",
      "\u0622\u0645\u0646\u0629",
      "\u0627\u0645\u0646\u0629",
      "\u0623\u0645\u0627\u0646",
      "\u0627\u0645\u0627\u0646",
      "\u0627\u0644\u0623\u0645\u0627\u0646",
      "\u0627\u0644\u0627\u0645\u0627\u0646",
      "\u0628\u0627\u0644\u0623\u0645\u0627\u0646",
      "\u0628\u0627\u0644\u0627\u0645\u0627\u0646",
      "\u062D\u0645\u0627\u064A\u0629"
    ]);
    addCodeQualityAttribute(attributes, input, "maintainable", "maintainable", [
      "maintainable",
      "maintainability",
      "\u0642\u0627\u0628\u0644 \u0644\u0644\u0635\u064A\u0627\u0646\u0629",
      "\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0635\u064A\u0627\u0646\u0629"
    ]);
    if ((attributes.some((attribute) => attribute.key === "organized") || attributes.some((attribute) => attribute.key === "clean")) && !attributes.some((attribute) => attribute.key === "maintainable")) {
      const anchor = attributes.find((attribute) => attribute.key === "organized") ?? attributes.find((attribute) => attribute.key === "clean");
      attributes.push({
        key: "maintainable",
        label: "maintainable",
        index: (anchor?.index ?? 0) + 0.1
      });
    }
    return attributes.sort((left, right) => left.index - right.index);
  }
  function addCodeQualityAttribute(attributes, input, key, label, aliases) {
    if (attributes.some((attribute) => attribute.key === key)) {
      return;
    }
    const index = firstIndexOfAny(input, aliases);
    if (index === -1) {
      return;
    }
    attributes.push({ key, label, index });
  }
  function firstIndexOfAny(input, values) {
    const indexes = values.map((value) => input.indexOf(value.toLowerCase())).filter((index) => index !== -1);
    return indexes.length ? Math.min(...indexes) : -1;
  }
  function formatCodeQualityLabels(attributes) {
    return formatEnglishList(attributes.map((attribute) => attribute.label));
  }
  function formatEnglishList(values) {
    const uniqueValues = unique(values);
    if (uniqueValues.length <= 1) {
      return uniqueValues[0] ?? "";
    }
    if (uniqueValues.length === 2) {
      return `${uniqueValues[0]} and ${uniqueValues[1]}`;
    }
    return `${uniqueValues.slice(0, -1).join(", ")}, and ${uniqueValues.at(-1)}`;
  }
  function translateNaturalMessage(text, glossary) {
    const translated = approximateEnglishRequest(text, glossary);
    if (!translated) {
      return void 0;
    }
    return sentenceCase(cleanApproximateTranslation(translated));
  }
  function cleanApproximateTranslation(input) {
    return input.replace(/\s+,/g, ",").replace(/\s+\./g, ".").replace(/\s+/g, " ").trim();
  }
  function sentenceCase(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      return trimmed;
    }
    return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
  }
  function unique(values) {
    return values.filter((value, index, array) => array.indexOf(value) === index);
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

  // extensions/browser/src/siteAdapters.ts
  var COMMON_PROMPT_SELECTORS = [
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
  var SITE_PROMPT_SELECTORS = [
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
  function getPromptFieldSelectors(hostname) {
    const siteSelectors = matchingAdapters(hostname).flatMap(
      (adapter) => adapter.selectors
    );
    return unique2([...siteSelectors, ...COMMON_PROMPT_SELECTORS]);
  }
  function hasPromptFieldAdapter(hostname) {
    return matchingAdapters(hostname).length > 0;
  }
  function matchingAdapters(hostname) {
    const normalizedHostname = hostname.toLowerCase().replace(/^www\./, "");
    return SITE_PROMPT_SELECTORS.filter(
      (adapter) => adapter.hosts.some(
        (host) => normalizedHostname === host || normalizedHostname.endsWith(`.${host}`)
      )
    );
  }
  function unique2(values) {
    return [...new Set(values)];
  }

  // extensions/browser/src/content.ts
  var ARABIC_TEXT_PATTERN = /[\u0600-\u06FF]/;
  var readyKey = "__promptbridgeArabicContentReady";
  var floatingButtonId = "promptbridge-arabic-floating-convert";
  var browserWindow = window;
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
  function replaceActiveSelection(options) {
    const normalizedOptions = normalizeOptions(options);
    const activeElement = document.activeElement;
    if (isTextControl(activeElement)) {
      return replaceTextControlSelection(activeElement, normalizedOptions);
    }
    const selection = window.getSelection();
    const editableRoot = selection ? findEditableRoot(selection.anchorNode) ?? findEditableRoot(selection.focusNode) : null;
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
  function replaceTextControlSelection(element, options) {
    let selectionStart = element.selectionStart;
    let selectionEnd = element.selectionEnd;
    if (selectionStart === null || selectionEnd === null || selectionStart === selectionEnd) {
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
  function replaceContentEditableSelection(editableRoot, selection, options) {
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
  function replaceWholeContentEditable(editableRoot, options) {
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
  function convertSelectedText(selectedText, options) {
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
  function normalizeOptions(options) {
    return {
      ...options,
      fallbackToFocusedField: options.fallbackToFocusedField ?? true
    };
  }
  function isTextControl(element) {
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
  function findEditableRoot(node) {
    const element = node instanceof HTMLElement ? node : node?.parentElement ?? null;
    return element?.closest(
      '[contenteditable="true"], [contenteditable="plaintext-only"]'
    ) ?? null;
  }
  function findBestEditableTarget(activeElement) {
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
  function safeQuerySelectorAll(selector) {
    try {
      return [...document.querySelectorAll(selector)];
    } catch {
      return [];
    }
  }
  function toEditableTarget(element) {
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
  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }
  function getEditableText(element) {
    return element.innerText || element.textContent || "";
  }
  function replaceRangeWithText(range, selection, text) {
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
  function textToNodes(text) {
    return text.split("\n").flatMap((line, index) => {
      const nodes = [];
      if (index > 0) {
        nodes.push(document.createElement("br"));
      }
      nodes.push(document.createTextNode(line));
      return nodes;
    });
  }
  function dispatchInputEvent(target, text) {
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
  function installFloatingConvertButton() {
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
  async function convertFromFloatingButton(button) {
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
  function updateFloatingButton(button) {
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
  function hideFloatingButton(button) {
    button.style.display = "none";
    button.disabled = false;
    button.textContent = "Convert";
  }
  function findFloatingButtonPlacement() {
    const activeElement = document.activeElement;
    if (isTextControl(activeElement)) {
      const selectedText = textControlSelectedText(activeElement);
      if (selectedText && ARABIC_TEXT_PATTERN.test(selectedText)) {
        const rect2 = activeElement.getBoundingClientRect();
        return {
          top: rect2.top,
          left: rect2.right - 82
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
    const editableRoot = findEditableRoot(selection.anchorNode) ?? findEditableRoot(selection.focusNode);
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
  function textControlSelectedText(element) {
    const selectionStart = element.selectionStart;
    const selectionEnd = element.selectionEnd;
    if (selectionStart === null || selectionEnd === null || selectionStart === selectionEnd) {
      return null;
    }
    return element.value.slice(selectionStart, selectionEnd);
  }
})();
//# sourceMappingURL=content.js.map
