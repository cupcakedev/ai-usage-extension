# Chrome Web Store Listing

This file is the canonical source for the Chrome Web Store listing.
Upload the Name, Short Description, Full Description, Category, Language, and
Single Purpose sections to the Web Store dashboard. The Keywords section is an
internal search-intent map: Chrome Web Store has no keyword field, so do not
paste it into the public listing.

> The `store:check` tests in `tests/store.test.js` enforce that every
> section below stays present and within Chrome's character limits.
> Do not rename headings — the tests grep them by exact text.

## Name

Claude & Codex Usage Tracker: Limits

## Short Description

Track Claude, ChatGPT & Codex usage, session limits, and weekly resets in a toolbar badge and on-page overlay. Private.

## Full Description

Monitor Claude, ChatGPT, and Codex account usage from one browser extension. See session limits, weekly capacity, and reset countdowns before a limit interrupts your work.

Use the toolbar badge for a quick status check, open the popup for details, or enable the optional on-page overlay beside the chat input. It is designed for coding, writing, research, and any workflow where knowing the next reset time helps you plan.

Depending on what an AI provider makes available for the signed-in account, the extension can show session, weekly, plan, model, balance, and reset-time details. It needs no API key or separate extension account: it reads usage data from your existing browser session.

Key features:

- Live usage tracking for supported AI accounts
- Session-based (5-hour) and weekly (7-day) limit monitoring when available
- Toolbar badge with your highest current usage percentage
- Optional on-page overlays positioned beside chat inputs
- Live reset countdowns, manual refresh, and automatic background updates every 5 minutes
- Private by design: no external servers, tracking, telemetry, API key, or extension account

Best for developers, students, and professionals who want a clear read on their available AI capacity without manually reopening account settings. Supported providers and the open-source code are documented below.

Source code: https://github.com/cupcakedev/ai-usage-extension

## Category

Productivity

## Language

English

## Keywords

Claude usage tracker, Claude limits, Codex usage tracker, ChatGPT limits, AI
usage tracker, session reset tracker

## Single Purpose

Display the current session and weekly usage limits for the AI coding accounts
the user is already signed in to — Claude (claude.ai), Codex (chatgpt.com),
MiniMax, Kimi Code, Cursor, Xiaomi MiMo, and the GLM (z.ai) and Qwen Coding
Plans — both
in the extension UI and as an overlay on the provider pages.

## Justification Summary

This extension calls only the usage and rate-limit endpoints of the accounts the
user is already signed in to, caches the result in `chrome.storage.local`, and
renders it in the popup and on-page overlay. No prompt, chat, or generation
endpoint is ever called, and nothing leaves the device. Each requested
permission maps to one of those tasks; the full rationale is documented in
[permissions.md](./permissions.md).
