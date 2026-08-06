/**
 * Marketing copy for the store artwork. English only — the renders are shared
 * across every Chrome Web Store locale.
 *
 * Strings that also exist inside the extension UI (panel title, metric labels,
 * section headings, "resets …") are NOT duplicated here: those come from
 * `msg()` and the shipped components, so the artwork can never advertise
 * wording the product does not use.
 */
export const COPY = {
  brand: 'AI Usage Tracker',
  /** Two lines so the headline breaks the same way at every size. */
  headline: ['AI Usage', 'Tracker'] as [string, string],
  panelEyebrow: 'AI Capacity',
  overlaysToggle: 'On-Page Overlays',

  /** One slide per store screenshot, in upload order. */
  shots: {
    popup: {
      eyebrow: 'One popup',
      sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'and Xiaomi MiMo, all on one screen.'],
    },
    overlay: {
      eyebrow: 'On-page overlay',
      sub: ['Session and weekly limits right next', 'to the chat input on Claude and ChatGPT.'],
    },
    providers: {
      eyebrow: 'Your setup',
      sub: ['Choose providers, layout, and exactly', 'which details each card shows.'],
    },
    badge: {
      eyebrow: 'Badge & overlays',
      sub: ['The toolbar icon follows your highest', 'usage in 10% steps — no popup needed.'],
    },
    privacy: {
      eyebrow: 'No setup',
      sub: ['No API keys, no logins, no servers.', 'Everything stays in your browser.'],
    },
  },

  marquee: {
    sub: [
      'Six providers, one popup: session & weekly limits,',
      'toolbar badge, on-page overlays, and full control.',
    ],
  },

  tile: {
    sub: 'Six providers. One popup.',
  },

  /** Closing slide — three claims that hold for every provider. */
  highlights: {
    title: 'Six providers, zero setup',
    items: [
      {
        title: 'No API keys, no extra logins',
        body: 'Reads the sessions your browser is already signed in to.',
      },
      {
        title: 'Nothing leaves your browser',
        body: 'No servers, no accounts, no telemetry — all data stays local.',
      },
      {
        title: 'Refreshes itself every 5 minutes',
        body: 'Background sync keeps the popup, badge, and overlays current.',
      },
    ],
  },
} as const;

/** Where each provider's usage is read from — shown on the closing slide. */
export const PROVIDER_HOSTS: Record<string, string> = {
  claude: 'claude.ai',
  codex: 'chatgpt.com',
  minimax: 'platform.minimax.io',
  kimi: 'kimi.com',
  cursor: 'cursor.com',
  mimo: 'platform.xiaomimimo.com',
};
