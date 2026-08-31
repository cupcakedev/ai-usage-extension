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

export const NOW = Date.now();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const resetsIn = (offsetMs: number): string => new Date(NOW + offsetMs).toISOString();

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

const GLM_USAGE: ExternalProviderUsage = {
  plan: 'Pro',
  session: { percentage: 44, resetsAt: resetsIn(1 * HOUR + 52 * MINUTE) },
  weekly: { percentage: 27, resetsAt: resetsIn(5 * DAY + 9 * HOUR) },
  models: [],
  status: 'ok',
  lastUpdated: NOW - 4 * MINUTE,
};

export interface PromoProvider {
  id: ProviderId;
  title: string;
  iconSrc: string;
  usage: ClaudeUsage | CodexUsage | ExternalProviderUsage;
  metrics: ProviderMetric[];
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
  glm: GLM_USAGE,
};

const METRICS: Record<ProviderId, ProviderMetric[]> = {
  claude: ['session', 'weekly', 'reset'],
  codex: ['session', 'weekly', 'reset'],
  minimax: ['session', 'weekly', 'reset', 'plan'],
  kimi: ['session', 'weekly', 'reset'],
  cursor: ['session', 'reset', 'plan'],
  mimo: ['session', 'reset', 'plan'],
  glm: ['session', 'weekly', 'reset'],
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
