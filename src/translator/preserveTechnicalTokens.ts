export type TechnicalTokenKind =
  | "code_block"
  | "inline_code"
  | "url"
  | "file_path"
  | "command"
  | "stack_trace"
  | "package"
  | "environment_variable"
  | "redaction_placeholder";

export interface PreservedTechnicalToken {
  placeholder: string;
  value: string;
  kind: TechnicalTokenKind;
  start: number;
  end: number;
}

interface TokenPattern {
  kind: TechnicalTokenKind;
  pattern: RegExp;
}

interface TokenRange {
  value: string;
  kind: TechnicalTokenKind;
  start: number;
  end: number;
}

const tokenPatterns: TokenPattern[] = [
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
    pattern:
      /(?:^|\n)(?:\s*at\s+.+\(.+:\d+:\d+\)|\s*at\s+.+:\d+:\d+|(?:TypeError|ReferenceError|SyntaxError|RangeError|Error):[^\n]+)/g
  },
  {
    kind: "file_path",
    pattern:
      /(?:(?<![\w@])(?:\.{1,2}\/|\/|~\/)|[A-Za-z]:\\)[^\s"'`،]+|(?<!@)\b[\w.-]+\/[\w./-]*[\w.-]+\.[A-Za-z0-9]+\b|\b[\w.-]+\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|css|scss|html|yml|yaml|env|py|go|rs|java|php|rb|cs|sql)\b/g
  },
  {
    kind: "command",
    pattern:
      /(?:^|\s)((?:npm|pnpm|yarn)\s+(?:run\s+)?[A-Za-z0-9:_-]+(?:\s+--?[A-Za-z0-9:_=-]+)*|(?:npx|node|tsx|tsc|vitest|jest|git|docker|docker-compose|curl|vite|next|prisma|nest)\s+[A-Za-z0-9@/._:=#?&%+-]+(?:\s+[A-Za-z0-9@/._:=#?&%+-]+)*)/g
  },
  {
    kind: "package",
    pattern: /\B@[a-z0-9._-]+\/[a-z0-9._-]+|\b[a-z0-9]+(?:[-.][a-z0-9]+)+\b/g
  },
  {
    kind: "redaction_placeholder",
    pattern:
      /\[(?:REDACTED_SECRET|REDACTED_PRIVATE_KEY|REDACTED_DATABASE_URL|REDACTED_EMAIL|REDACTED_PHONE)\]/g
  },
  {
    kind: "environment_variable",
    pattern: /\b[A-Z][A-Z0-9_]{2,}\b/g
  }
];

export interface PreserveTechnicalTokensResult {
  text: string;
  tokens: PreservedTechnicalToken[];
}

export function preserveTechnicalTokens(
  input: string
): PreserveTechnicalTokensResult {
  const ranges = collectTokenRanges(input);
  const tokens: PreservedTechnicalToken[] = [];
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

export function restoreTechnicalTokens(
  input: string,
  tokens: PreservedTechnicalToken[]
): string {
  return tokens.reduce(
    (text, token) => text.split(token.placeholder).join(token.value),
    input
  );
}

function collectTokenRanges(input: string): TokenRange[] {
  const ranges: TokenRange[] = [];

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

function overlaps(range: TokenRange, start: number, end: number): boolean {
  return start < range.end && end > range.start;
}
