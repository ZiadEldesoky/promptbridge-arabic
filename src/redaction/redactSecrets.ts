import { redactionPatterns } from "./patterns.js";

export interface RedactSecretsResult {
  text: string;
  redactionCount: number;
  redactedPatternNames: string[];
}

export function redactSecrets(input: string): RedactSecretsResult {
  let text = input;
  let redactionCount = 0;
  const redactedPatternNames = new Set<string>();

  for (const redactionPattern of redactionPatterns) {
    text = text.replace(redactionPattern.pattern, (...args: unknown[]) => {
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
