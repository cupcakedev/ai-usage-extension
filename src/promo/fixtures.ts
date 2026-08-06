import { msg } from '@shared/i18n';
import { createDefaultSettings, PROVIDER_IDS } from '@shared/settings';
import type {
  ClaudeUsage,
  CodexUsage,
  ExtensionSettings,
  ExternalProviderUsage,
  ProviderId,
  ProviderMetric,
} from '@shared/types';
import { PROVIDER_DETAILS } from '../options/config';

/**
 * Mock usage shown in the artwork. Never render real account data here — the
 * store listing would leak personal usage (see store/promo/README.md).
 *
 * The clock is frozen once per page load so a capture never straddles a minute
 * boundary and every render of the same shot is byte-identical.
 */
export const NOW = Date.now();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const resetsIn = (offsetMs: number): string => new Date(NOW + offsetMs).toISOString();

/** Providers that report a single quota window leave the second one unavailable. */
const NO_SECOND_WINDOW = { percentage: 0, resetsAt: null, available: false };

const CLAUDE_USAGE: ClaudeUsage = {
  plan: 'unknown',
  session: { percentage: 40, resetsAt: resetsIn(77 * MINUTE) },
  weekly: { percentage: 47, resetsAt: resetsIn(15 * HOUR + 47 * MINUTE) },
  models: [],
  status: 'ok',
  lastUpdated: NOW - 3 * MINUTE,
};

const CODEX_USAGE: CodexUsage = {
  session: { percentage: 25, resetsAt: resetsIn(83 * MINUTE) },
  weekly: { percentage: 4, resetsAt: resetsIn(6 * DAY + 20 * HOUR) },
  models: [],
  availableResets: null,
  status: 'ok',
  lastUpdated: NOW - 3 * MINUTE,
};

const MINIMAX_USAGE: ExternalProviderUsage = {
  plan: 'Pro',
  session: { percentage: 62, resetsAt: resetsIn(2 * HOUR + 9 * MINUTE) },
  weekly: { percentage: 38, resetsAt: resetsIn(3 * DAY + 4 * HOUR) },
  models: [],
  status: 'ok',
  lastUpdated: NOW - 4 * MINUTE,
};

const KIMI_USAGE: ExternalProviderUsage = {
  session: { percentage: 18, resetsAt: resetsIn(3 * HOUR + 5 * MINUTE) },
  weekly: { percentage: 55, resetsAt: resetsIn(4 * DAY + 2 * HOUR) },
  models: [],
  status: 'ok',
  lastUpdated: NOW - 2 * MINUTE,
};

const CURSOR_USAGE: ExternalProviderUsage = {
  plan: 'Pro',
  session: { percentage: 81, resetsAt: resetsIn(11 * DAY + 6 * HOUR) },
  weekly: NO_SECOND_WINDOW,
  models: [],
  status: 'warning',
  lastUpdated: NOW - 6 * MINUTE,
};

const MIMO_USAGE: ExternalProviderUsage = {
  plan: 'Free',
  session: { percentage: 31, resetsAt: resetsIn(9 * HOUR + 24 * MINUTE) },
  weekly: NO_SECOND_WINDOW,
  models: [],
  status: 'ok',
  lastUpdated: NOW - 5 * MINUTE,
};

export interface PromoProvider {
  id: ProviderId;
  title: string;
  iconSrc: string;
  usage: ClaudeUsage | CodexUsage | ExternalProviderUsage;
  metrics: ProviderMetric[];
  /** Cursor and MiMo label their single window differently, exactly as the popup does. */
  primaryLabel?: string;
  secondaryLabel?: string;
}

const USAGE: Record<ProviderId, PromoProvider['usage']> = {
  claude: CLAUDE_USAGE,
  codex: CODEX_USAGE,
  minimax: MINIMAX_USAGE,
  kimi: KIMI_USAGE,
  cursor: CURSOR_USAGE,
  mimo: MIMO_USAGE,
};

/** What each card shows in the artwork — its richest useful combination. */
const METRICS: Record<ProviderId, ProviderMetric[]> = {
  claude: ['session', 'weekly', 'reset'],
  codex: ['session', 'weekly', 'reset'],
  minimax: ['session', 'weekly', 'reset', 'plan'],
  kimi: ['session', 'weekly', 'reset'],
  cursor: ['session', 'reset', 'plan'],
  mimo: ['session', 'reset', 'plan'],
};

const LABEL_OVERRIDES: Partial<
  Record<ProviderId, Pick<PromoProvider, 'primaryLabel' | 'secondaryLabel'>>
> = {
  cursor: { primaryLabel: msg('planUsage'), secondaryLabel: '' },
  mimo: { primaryLabel: msg('tokenPlan'), secondaryLabel: '' },
};

export const PROVIDERS: PromoProvider[] = PROVIDER_IDS.map((id) => ({
  id,
  title: PROVIDER_DETAILS[id].name,
  iconSrc: PROVIDER_DETAILS[id].icon,
  usage: USAGE[id],
  metrics: METRICS[id],
  ...LABEL_OVERRIDES[id],
}));

export const providerById = (id: ProviderId): PromoProvider => {
  const provider = PROVIDERS.find((candidate) => candidate.id === id);
  if (!provider) throw new Error(`Unknown promo provider: ${id}`);
  return provider;
};

/**
 * Settings as the artwork shows them: everything switched on, so the options
 * shots demonstrate the full set of cards, toggles, and detail chips.
 */
export const SETTINGS: ExtensionSettings = (() => {
  const defaults = createDefaultSettings();
  return {
    ...defaults,
    popupLayout: 'grid',
    providers: Object.fromEntries(
      PROVIDER_IDS.map((id) => [id, { visible: true, metrics: METRICS[id] }]),
    ) as ExtensionSettings['providers'],
  };
})();
