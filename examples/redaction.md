# Secret redaction

```bash
promptbridge "استخدم sk-abcdefghijklmnopqrstuvwxyz123456 في src/api.ts" --redact
```

Expected style:

```text
Investigate and fix the reported issue.

Preserved technical context:
- [REDACTED_SECRET]
- src/api.ts

Notes:
- Sensitive values were redacted before this prompt was generated.
```
