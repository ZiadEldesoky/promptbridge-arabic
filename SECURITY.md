# Security Policy

## Supported versions

Security fixes currently target the latest released version.

## Reporting a vulnerability

Please report security issues through GitHub Security Advisories when available, or by opening an issue with minimal reproduction details and without posting live secrets.

## Privacy model

PromptBridge Arabic v0.x is local-only:

- It does not call external AI services.
- It does not require API keys.
- It does not send prompts to OpenAI, Codex, or any other provider.
- Secret redaction only runs when `--redact` or `redactSecrets` config is enabled.

## Redaction scope

Current redaction covers common patterns such as API keys, bearer tokens, GitHub tokens, Stripe keys, OpenAI-style keys, database URLs, private keys, emails, phone numbers, and secret-like environment assignments.

Redaction is a best-effort safety feature. Do not paste production secrets into any tool unless necessary.
