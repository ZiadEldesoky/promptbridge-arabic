# Changelog

All notable changes to PromptBridge Arabic are documented here.

## v0.11.8

- Added deterministic support for Arabic completed-work feedback prompts such as "إيه رأيك في الشغل اللي معمول دا".
- Auto mode now turns these phrases into a focused review prompt instead of a generic translation template.
- General mode now keeps the same intent as a concise natural English request: "Review the completed work and provide feedback".

## v0.11.7

- Added a local deterministic code-quality parser for longer Arabic prompts.
- Longer prompts such as "خلي الكود منظم وقابل للصيانة واهتم بالأمان بتاعه" now translate without duplicated words or Arabic leftovers.
- Reduced duplicate context lines when quality attributes are parsed from the same selected prompt.

## v0.11.6

- Added deterministic support for maintainability phrases such as "قابل للصيانة".
- Full prompts such as "خلي الكود منظم وآمن وقابل للصيانة" now translate without Arabic leftovers.
- Added tests for maintainability fragments and combined organized/security/maintainability prompts.

## v0.11.5

- Added deterministic support for combined organized-and-secure prompts such as "خلي الكود منظم وآمن".
- Normalized Arabic Unicode before matching glossary phrases, including decomposed forms such as "وآمن".
- Updated organized/security prompt shaping so handled output does not leave Arabic fragments in context.

## v0.11.4

- Added deterministic support for organized-code phrases such as "خلي الكود منظم".
- Full selected prompts now produce practical refactor guidance for organized, maintainable code.
- Short selected fragments such as "منظم" now translate as "Organized and maintainable" instead of expanding into a meta-prompt.

## v0.11.3

- Improved deterministic handling for compound code-quality phrases such as "خلي الكود آمن ونظيف".
- Full selected prompts now produce practical secure, clean, and maintainable coding-agent guidance.
- Short selected fragments such as "آمن ونظيف" now stay as fragment translations, so replacing part of a longer prompt does not expand into a full task.

## v0.11.2

- Fixed local macOS menu bar helper builds to prefer an available Apple Development signing identity instead of ad-hoc-only signing.
- This keeps the app's Accessibility permission stable across local rebuilds because macOS no longer keys the helper only by a changing cdhash.
- Kept explicit `general` mode as direct translation when PromptBridge understands the Arabic text, avoiding meta-prompts such as "Translate and clarify..." in selected-text workflows.

## v0.11.1

- Improved deterministic Arabic intent handling for short selected prompts such as "خلي الكود آمن" so they generate actionable security hardening prompts instead of generic fix templates.
- Added performance-oriented prompt handling for short requests such as "خلي الكود أسرع".
- Expanded the Egyptian Arabic glossary with common friendly, security, performance, testing, review, UI, auth, and business phrases.
- Improved glossary matching for Arabic conjunctions attached to phrases, such as "وخليه" and "والعميل".
- Kept non-coding selected Arabic text as natural English translation when no coding intent is detected.

## v0.11.0

- Added experimental Windows and Linux support for `promptbridge replace-selection` using platform copy/paste automation.
- Extended the VS Code-compatible focused input replacement command beyond macOS, with Windows PowerShell automation and Linux `xdotool` / `wtype` support.
- Added Windows AutoHotkey and PowerShell helper scripts for global shortcut workflows.
- Added a Linux shortcut helper script and platform requirements documentation.
- Updated platform support docs to clarify what is cross-platform today and what still needs native tray helpers.

## v0.10.2

- Added a `general` prompt mode for friendly Arabic text and business/product requests that should not be forced into code-only templates.
- Expanded the deterministic glossary with common friendly phrases and business workflow terms such as customers, orders, shipping, payment, invoices, inventory, and dashboards.
- Improved design-preservation detection for Egyptian Arabic variants such as "بدون ما تغير في الديزاين".
- Fixed a macOS helper crash caused by Swift regular-expression initialization during Arabic detection.
- Installed the macOS helper as a stable app bundle name so Accessibility permissions do not change every release.
- Made selected-text reading prefer copy/paste fallback before Accessibility for better compatibility with Notes and custom IDE prompt boxes.
- Prevented macOS from automatically terminating the menu bar helper while it is running.

## v0.10.1

- Fixed macOS menu bar helper visibility by switching from a text-only `PB` item to a template status icon.
- Added a first-run notice so users can find the menu bar icon after launch.
- Switched the macOS helper to an explicit AppKit launcher to keep the app delegate alive reliably.

## v0.10.0

- Added an experimental native macOS menu bar helper for selected Arabic prompt replacement.
- Added auto-replace mode that can convert the currently selected Arabic text while the helper is enabled.
- Added macOS release packaging for the menu bar helper app.

## v0.9.4

- Made focused IDE input replacement more reliable on macOS by reading and writing the native pasteboard directly.
- Added clipboard polling after copy so custom chat inputs have time to publish the selected text.
- Improved the focused selection warning when the selected Arabic text cannot be read from the active input.

## v0.9.3

- Fixed VS Code-compatible extension activation for focused input replacement by removing the bundled Node clipboard package from the extension runtime.
- Kept focused IDE chat input replacement on macOS using VS Code clipboard APIs plus system copy/paste.

## v0.9.2

- Added a VS Code-compatible editor shortcut for converting selected Arabic text.
- Added an editor right-click menu item for selected text conversion.
- Added a macOS-focused selection replacement command for IDE chat inputs and other focused text boxes.
- Documented IDE chat input behavior and clipboard fallback.

## v0.9.1

- Added marketplace-ready PNG icons for the browser and VS Code-compatible extensions.
- Updated the browser extension to inject its conversion script only after user action.
- Added a public privacy policy for extension marketplace submissions.
- Expanded Chrome Web Store, VS Code Marketplace, and Open VSX listing documentation.

## v0.9.0

- Added a VS Code-compatible extension for converting Arabic prompt text inside editors.
- Added IDE commands for converting selected text, copying converted input, and inserting converted input.
- Added IDE settings for mode, bilingual output, and secret redaction.
- Added VS Code extension build and VSIX packaging scripts.
- Added CI coverage for VS Code extension typecheck, build, and packaging.
- Added publishing documentation for Chrome Web Store, VS Code Marketplace, and Open VSX.

## v0.8.0

- Committed the built browser extension bundle so users can load `extensions/browser` directly without running a build.
- Added `npm run package:browser` and `npm run release:browser` to create a ready-to-download browser extension zip.
- Added a tag-based GitHub Actions workflow that packages the browser extension and uploads the zip to the GitHub Release.
- Added CI checks to ensure the committed browser extension bundle stays in sync with source changes.
- Added tests that verify the load-unpacked extension bundle exists.

## v0.7.0

- Added persistent browser extension settings through local browser storage.
- Added saved defaults for mode, bilingual output, redaction, and focused-field fallback.
- Updated browser context menu and keyboard shortcut flows to use saved settings.
- Added site-aware prompt field selectors for ChatGPT, Claude, Gemini, Cursor web tools, and generic editable prompt boxes.
- Added fallback conversion for the focused prompt box when no text is selected.
- Added tests for browser settings normalization and site adapter selectors.
- Added browser extension TypeScript checking in CI.

## v0.6.0

- Added a browser extension prototype for replacing selected Arabic prompt text inside editable web AI prompt boxes.
- Added browser popup controls for mode selection, bilingual output, and optional secret redaction.
- Added browser context menu actions for normal conversion and conversion with redaction.
- Added a Raycast script command for macOS GUI selected-text replacement.
- Added `npm run build:browser` and CI coverage for the browser extension bundle.
- Updated integration-level documentation for CLI, clipboard, desktop GUI, and browser GUI workflows.

## v0.5.0

- Added `promptbridge run <agentCommand> [...args]` to convert Arabic prompt arguments before running CLI coding agents.
- Added shell wrapper examples for Codex, Claude, Gemini, and Cursor-style agent commands.
- Added integration-level documentation explaining what is possible with CLI, clipboard, shortcuts, wrappers, and future direct app integrations.
- Added tests for agent argument preparation.

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
