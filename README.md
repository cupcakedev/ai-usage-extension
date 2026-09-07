# AI Usage Tracker: Claude, Codex, Kimi, Cursor, GLM, Qwen

[![CI](https://github.com/cupcakedev/ai-usage-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/cupcakedev/ai-usage-extension/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A Chrome extension (Manifest V3) that tracks usage limits from **Claude**, **Codex**,
**MiniMax**, **Kimi Code**, **Cursor**, **Xiaomi MiMo**, the **GLM Coding Plan**
(z.ai), and the **Qwen Coding Plan** (Qwen Cloud), using your existing browser
sessions. It surfaces the data in a popup, an on-page overlay, and the toolbar
badge.

## Features

- **Live limits** for Claude, Codex, MiniMax, Kimi Code, Cursor, Xiaomi MiMo, and the
  GLM and Qwen Coding Plans: percentage used, raw counts, and time to reset when
  exposed by the provider.
- **Toolbar badge** showing your highest current usage at a glance.
- **On-page overlay** on `claude.ai` — a collapsible capsule rendered in a Shadow DOM,
  so it never clashes with the host page's styles.
- **Background refresh** every 5 minutes via `chrome.alarms`, plus on-demand refresh.
- **Private by design**: usage is read from your own authenticated browser sessions.
  No external servers, no extension accounts, no tracking.

## Install

The extension is not distributed through npm. For normal use, install a packaged
release from the GitHub releases page or load a local build in Chrome.

To load a local build:

```bash
corepack enable
pnpm install
pnpm build
```

Then:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` directory.
4. Sign in to the providers you want to track, then open the popup and refresh.

## Architecture

The extension is split into isolated contexts that communicate through a typed
messaging layer:

```text
src/
  background/   # Service worker: scheduling, fetching, badge updates
    services/   # UsageService — fetches & parses provider APIs
  content/      # claude.ai overlay (React in Shadow DOM) + z.ai token bridge
  sidepanel/    # Popup UI (React)
    components/ # Presentational components
    hooks/      # useUsageData — owns the popup's data lifecycle
  shared/       # Cross-context layer — no context-specific imports
    constants  # Storage keys, alarm name, thresholds
    hooks      # Framework hooks shared by popup & overlay (useNow)
    messaging  # Typed message helpers (readUsageState, requestUsageRefresh)
    types      # Domain & messaging types
    utils      # clampPercent, getUsageTone, formatReset, formatRelativeTime
```

**Data flow:** the background worker fetches usage, writes a `UsageState` snapshot to
`chrome.storage.local`, and updates the badge. The popup and overlay read that
snapshot and subscribe to `chrome.storage.onChanged`, so every surface stays in sync.

**Localization:** every user-visible string goes through `msg()`
(`src/shared/i18n.ts`), which reads `public/_locales/<locale>/messages.json`.
All 53 Chrome Web Store languages are translated and the release tests enforce
that they expose the same keys. The one exception is the overlay's "LIMITS"
side tab, which stays in English everywhere by design.

Settings carry a `language` preference: `auto` follows the browser, anything
else loads that `_locales` bundle at startup and feeds it to `msg()` through
`setLocaleMessages`. Because several modules build label tables with `msg()` at
import time, the popup and options entry points apply the language *before*
importing their app; the content script gets the same bundle from the service
worker (`GET_LOCALE_MESSAGES`), which cannot be fetched from a page context.

## Getting Started

### Requirements

- Node.js 20 or newer
- pnpm 9.15.0 via Corepack
- Chrome or another Chromium browser that supports Manifest V3 extensions

### Install dependencies

```bash
corepack enable
pnpm install
```

### Develop

```bash
pnpm dev
```

Builds to `dist/` and watches for changes.

### Verify

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

## Scripts

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `pnpm dev`           | Build and watch for development.              |
| `pnpm bump`          | Bump `package.json` and `manifest.json` patch versions. |
| `pnpm build`         | Type-check, then produce a production build.  |
| `pnpm release`       | Test, build, and package `dist/` into `release/*.zip`. |
| `pnpm typecheck`     | Run `tsc` with no emit.                       |
| `pnpm test`          | Run release-gate checks for store metadata.   |
| `pnpm lint`          | Lint `src/` with ESLint.                      |
| `pnpm format`        | Format `src/` with Prettier.                  |
| `pnpm promo`         | Render the store artwork into `store/<locale>/promo/`. |
| `pnpm promo:dev`     | Preview the store artwork in the browser.     |

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md)
before opening a larger change.

## Security

Please do not open public issues for suspected vulnerabilities. Follow
[SECURITY.md](./SECURITY.md) instead.

## License

MIT
