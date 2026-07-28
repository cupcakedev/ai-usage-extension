# Chrome Web Store Listing

This file is the canonical source for the Chrome Web Store listing.
Everything below is uploaded to the Web Store dashboard as-is.

> The `store:check` tests in `tests/store.test.js` enforce that every
> section below stays present and within Chrome's character limits.
> Do not rename headings — the tests grep them by exact text.

## Name

AI Usage Tracker: Claude & Codex Limits

## Short Description

Track Claude and ChatGPT (Codex) session & weekly usage limits at a glance in a popup and on-page overlay. Privacy-first, no setup.

## Full Description

AI Usage Tracker: Claude & Codex Limits is a browser extension for people who want a clearer, more predictable AI assistant experience. Track your message limits, view real-time countdowns, and display unobtrusive usage meters directly on provider pages so you can focus on your work without hitting sudden limits.

Whether you use Claude and ChatGPT for coding, writing, research, or deep problem-solving, AI Usage Tracker helps reduce the friction of hitting limit blocks and gives you direct control over how your capacity is monitored. You choose where the overlay appears and how you track your limits.

AI Usage Tracker also supports Kimi, MiniMax, Cursor, and Xiaomi MiMo. Depending on each provider's account data, it can surface session, weekly, plan, model, balance, and reset-time details. No API key or separate login is required: the extension reads only from the browser's already authenticated provider sessions.

Key features:

- Real-time limit tracking for Claude (claude.ai) and ChatGPT/Codex (chatgpt.com)
- At-a-glance toolbar badge showing your highest current usage percentage
- Contextual on-page overlays positioned right next to chat inputs
- Collapsible capsule widget in Shadow DOM to prevent host page style clashes
- Session-based (5-hour) and weekly (7-day) capacity monitoring
- Live countdowns showing precisely when your limits will reset
- On-demand refresh button and automatic background syncing every 5 minutes
- 100% private: reads directly from your own authenticated browser sessions

Why users choose AI Usage Tracker:
- Fast, automated usage polling without manual page reloading
- Cleaner UI that integrates seamlessly with AI chat interfaces
- Better pacing for heavy coding, learning, or writing sessions
- Safe by design with no external servers, no tracking, and no telemetry
- Simple side-panel controls with quick enable/disable options

Great for:
- Developers and power users who use Claude Code or ChatGPT limits heavily
- Plus, Pro, and Team plan subscribers who want a clear read on their quotas
- Professionals and students who want to avoid interrupting their deep work flow
- Anyone tired of hitting "you've reached your limit" with no prior warning

Source code: https://github.com/cupcakedev/ai-usage-extension

## Category

Productivity

## Language

English

## Keywords

claude usage, claude limits, claude rate limit tracker, codex usage, chatgpt
limits, chatgpt rate limit, ai usage tracker, claude session reset, claude
weekly limit, codex weekly cap, anthropic usage monitor, openai usage monitor,
claude pro tracker, chatgpt plus tracker, claude code usage

## Single Purpose

Display the current session and weekly usage limits for the signed-in user's
Claude (claude.ai) and Codex (chatgpt.com) accounts, both in the extension UI
and as an overlay on the provider pages.

## Justification Summary

This extension calls only the rate-limit endpoints of the user's already
signed-in Claude and Codex accounts, caches the result in `chrome.storage.local`,
and renders it in the popup and on-page overlay. Each requested permission maps
to one of those tasks; the full rationale is documented in
[permissions.md](./permissions.md).
