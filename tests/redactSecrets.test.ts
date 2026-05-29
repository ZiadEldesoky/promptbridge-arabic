import { describe, expect, it } from "vitest";
import { redactSecrets } from "../src/redaction/redactSecrets.js";

describe("redactSecrets", () => {
  it("redacts common API keys and bearer tokens", () => {
    const result = redactSecrets(
      "OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456\nAuthorization: Bearer abcdefghijklmnopqrstuvwxyz"
    );

    expect(result.text).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
    expect(result.text).not.toContain("Bearer abcdefghijklmnopqrstuvwxyz");
    expect(result.text).toContain("[REDACTED_SECRET]");
    expect(result.redactionCount).toBeGreaterThanOrEqual(2);
  });

  it("redacts database urls", () => {
    const result = redactSecrets(
      "DATABASE_URL=postgresql://user:pass@localhost:5432/app"
    );

    expect(result.text).toBe("DATABASE_URL=[REDACTED_DATABASE_URL]");
  });

  it("does not redact an already-redacted placeholder again", () => {
    const result = redactSecrets("DATABASE_URL=[REDACTED_DATABASE_URL]");

    expect(result.text).toBe("DATABASE_URL=[REDACTED_DATABASE_URL]");
    expect(result.redactionCount).toBe(0);
  });

  it("redacts emails and phone numbers", () => {
    const result = redactSecrets(
      "كلم ziad@example.com أو +20 100 123 4567"
    );

    expect(result.text).toContain("[REDACTED_EMAIL]");
    expect(result.text).toContain("[REDACTED_PHONE]");
  });

  it("redacts private keys", () => {
    const result = redactSecrets(`-----BEGIN PRIVATE KEY-----
abc123
-----END PRIVATE KEY-----`);

    expect(result.text).toBe("[REDACTED_PRIVATE_KEY]");
  });
});
