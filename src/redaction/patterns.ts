export interface RedactionPattern {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
}

export const redactionPatterns: RedactionPattern[] = [
  {
    name: "private_key",
    pattern:
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    replacement: "[REDACTED_PRIVATE_KEY]"
  },
  {
    name: "database_url",
    pattern:
      /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'`<>]+/g,
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
    pattern:
      /\b([A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASS|DATABASE_URL|DB_URL)\s*=\s*)(["']?)((?!\[REDACTED_)[^"'\s]+)\2/g,
    replacement: (_match, prefix: string) => `${prefix}[REDACTED_SECRET]`
  },
  {
    name: "generic_secret_assignment",
    pattern:
      /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|client_secret)(\s*[:=]\s*)(["']?)((?!\[REDACTED_)[^"'\s]+)\3/gi,
    replacement: (_match, key: string, separator: string) =>
      `${key}${separator}[REDACTED_SECRET]`
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
