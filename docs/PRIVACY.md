# PromptBridge Arabic Privacy Policy

Last updated: May 30, 2026

PromptBridge Arabic is local-first developer tooling for converting Arabic or Egyptian Arabic coding prompts into structured English prompts.

## Data collection

PromptBridge Arabic does not collect, sell, share, or transmit user data.

The CLI, browser extension, Raycast helper, and VS Code-compatible extension run deterministic prompt conversion locally on the user's device. They do not call external AI services, analytics services, or remote translation APIs.

## Browser extension behavior

The browser extension only accesses editable text when the user triggers PromptBridge through the popup, context menu, or keyboard shortcut.

When triggered, the extension may read selected text or the currently focused editable prompt field, convert it locally, and replace it in the page. The selected or focused text is not sent to PromptBridge maintainers or any third party.

The browser extension stores only local preferences, such as the selected prompt mode, whether bilingual output is enabled, whether secret redaction is enabled, and whether focused-field fallback is enabled.

## IDE extension behavior

The VS Code-compatible extension reads selected text or user-entered prompt text only when the user runs a PromptBridge command. Conversion happens locally inside the extension host.

## Secret redaction

PromptBridge Arabic can redact common secret patterns when the user enables redaction. Redaction is optional and local.

## Contact

For privacy or security reports, use the repository security policy:

https://github.com/ZiadEldesoky/promptbridge-arabic/security/policy
