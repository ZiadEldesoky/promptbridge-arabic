# Changelog

All notable changes to PromptBridge Arabic are documented here.

## v0.4.0

- Added `promptbridge replace-selection` for macOS selected-text replacement workflows.
- Added tests for selected-text replacement through injectable clipboard and shortcut functions.
- Documented Raycast/global-shortcut style workflows for replacing selected Arabic text in any app.

## v0.3.0

- Added `promptbridge watch` to monitor the clipboard and convert copied Arabic prompts automatically.
- Added `promptbridge watch --once` for one-shot clipboard conversion, suitable for global shortcuts and launchers.
- Exported clipboard watch utilities from the package entry point.
- Added tests for Arabic detection and clipboard conversion behavior.

## v0.2.2

- Removed submission-specific wording and documents from the repository.
- Kept OSS project polish focused on public usefulness, contribution workflow, and package readiness.

## v0.2.1

- Added OSS readiness polish: CI, issue templates, PR template, contribution guide, security policy, changelog, and code of conduct.
- Added README badges and terminal-style demo image.
- Added launch checklist.
- Added release notes documentation.
- Added package metadata for repository, bugs, homepage, and additional keywords.

## v0.2.0

- Added optional config loading from `.promptbridge.json`, `promptbridge.config.json`, and `~/.promptbridge/config.json`.
- Added `--config <path>` for explicit config files.
- Added custom glossary loading through `glossaryPath`.
- Added support for array-style and object-style glossary files.
- Added config and custom glossary tests.
- Added example config and glossary files.
- Exported config loader types from the package entry point.

## v0.1.0

- Added the initial `promptbridge` CLI.
- Added deterministic Arabic/Egyptian Arabic prompt rewriting.
- Added prompt modes: `fix`, `refactor`, `review`, `tests`, `explain`, and `security`.
- Added clipboard output support.
- Added bilingual output support.
- Added optional secret redaction.
- Added technical-token preservation for code blocks, file paths, commands, package names, URLs, stack traces, and environment variables.
- Added Vitest test coverage and README examples.
