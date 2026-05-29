# Config and custom glossary

```bash
promptbridge "راجع الصلاحيات في middleware.ts" --config ./promptbridge.config.json
```

Config file:

```json
{
  "defaultMode": "fix",
  "defaultOutput": "english",
  "redactSecrets": true,
  "glossaryPath": "./promptbridge.glossary.json"
}
```

Glossary file:

```json
[
  {
    "arabic": "راجع الصلاحيات",
    "english": "review authorization rules",
    "tags": ["security"]
  }
]
```
