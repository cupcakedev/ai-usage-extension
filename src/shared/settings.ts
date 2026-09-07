import { STORAGE_KEYS } from './constants';
import { normalizeLanguage } from './locales';
import type {
  ExtensionSettings,
  OverlayProviderId,
  ProviderDisplaySettings,
  ProviderId,
  ProviderMetric,
} from './types';

export const OVERLAY_PROVIDER_IDS: OverlayProviderId[] = ['claude', 'codex'];

export const OVERLAY_DEFAULTS: Record<OverlayProviderId, boolean> = {
  claude: true,
  codex: true,
};

export const OVERLAY_STORAGE_KEYS: Record<
  OverlayProviderId,
  { enabled: string; collapsed: string }
> = {
  claude: {
    enabled: STORAGE_KEYS.claudeOverlayEnabled,
    collapsed: STORAGE_KEYS.claudeOverlayCollapsed,
  },
  codex: {
    enabled: STORAGE_KEYS.codexOverlayEnabled,
    collapsed: STORAGE_KEYS.codexOverlayCollapsed,
  },
};

export const PROVIDER_IDS: ProviderId[] = [
  'claude',
  'codex',
  'minimax',
  'kimi',
  'cursor',
  'mimo',
  'glm',
  'qwen',
];

/**
 * What each provider can actually put on its popup card, derived from the snapshots the
 * background collectors build and the render rules in ProviderCard:
 * - `weekly` needs a second quota window — Cursor and MiMo only expose a single one.
 * - `models` needs a non-empty breakdown — Kimi and MiMo always report an empty list.
 * - `plan` is a footnote skipped for Claude, whose snapshot pins the plan to 'unknown',
 *   and Codex, whose snapshot has no plan field at all.
 * - `summary` is the balance footnote only MiMo produces.
 * Metrics outside this list would be dead toggles, so they are neither offered nor stored.
 */
export const PROVIDER_SUPPORTED_METRICS: Record<ProviderId, ProviderMetric[]> = {
  claude: ['session', 'weekly', 'models', 'reset'],
  codex: ['session', 'weekly', 'models', 'reset', 'availableResets'],
  minimax: ['session', 'weekly', 'models', 'reset', 'plan'],
  kimi: ['session', 'weekly', 'reset'],
  cursor: ['session', 'models', 'reset', 'plan', 'summary'],
  mimo: ['session', 'reset', 'plan', 'summary'],
  glm: ['session', 'weekly', 'models', 'reset', 'plan'],
  qwen: ['session', 'weekly', 'reset', 'plan'],
};

const PROVIDER_DEFAULTS: Record<ProviderId, ProviderDisplaySettings> = {
  claude: { visible: true, metrics: ['session', 'weekly', 'reset'] },
  codex: { visible: true, metrics: ['weekly', 'reset', 'availableResets'] },
  minimax: { visible: false, metrics: ['session', 'weekly', 'models', 'reset'] },
  kimi: { visible: false, metrics: ['session', 'weekly', 'reset'] },
  cursor: { visible: false, metrics: ['session', 'reset', 'summary'] },
  mimo: { visible: false, metrics: ['session'] },
  glm: { visible: false, metrics: ['session', 'weekly', 'reset'] },
  qwen: { visible: false, metrics: ['session', 'weekly', 'reset'] },
};

const defaultProvider = (provider: ProviderId): ProviderDisplaySettings => ({
  visible: PROVIDER_DEFAULTS[provider].visible,
  metrics: [...PROVIDER_DEFAULTS[provider].metrics],
});

export const createDefaultSettings = (): ExtensionSettings => ({
  language: 'auto',
  popupLayout: 'single',
  providers: Object.fromEntries(
    PROVIDER_IDS.map((provider) => [provider, defaultProvider(provider)]),
  ) as ExtensionSettings['providers'],
  badge: {
    mode: 'highest',
    provider: 'claude',
    metric: 'session',
  },
  overlays: { ...OVERLAY_DEFAULTS },
});

/** Keeps only metrics the provider can render, so stored lists never carry dead toggles. */
const asMetricList = (value: unknown, provider: ProviderId): ProviderMetric[] => {
  const supported = PROVIDER_SUPPORTED_METRICS[provider];
  return Array.isArray(value)
    ? value.filter((metric): metric is ProviderMetric =>
        supported.includes(metric as ProviderMetric),
      )
    : [...PROVIDER_DEFAULTS[provider].metrics];
};

export const normalizeSettings = (
  value: unknown,
  legacyOverlays?: Partial<ExtensionSettings['overlays']>,
): ExtensionSettings => {
  const defaults = createDefaultSettings();
  if (!value || typeof value !== 'object') {
    return {
      ...defaults,
      overlays: { ...defaults.overlays, ...legacyOverlays },
    };
  }

  const candidate = value as Partial<ExtensionSettings>;
  const providers = Object.fromEntries(
    PROVIDER_IDS.map((provider) => {
      const providerValue = candidate.providers?.[provider];
      return [
        provider,
        {
          visible: providerValue
            ? providerValue.visible !== false
            : defaults.providers[provider].visible,
          metrics: asMetricList(providerValue?.metrics, provider),
        },
      ];
    }),
  ) as ExtensionSettings['providers'];

  return {
    language: normalizeLanguage(candidate.language),
    popupLayout: candidate.popupLayout === 'grid' ? 'grid' : 'single',
    providers,
    badge: {
      mode: candidate.badge?.mode === 'provider' ? 'provider' : 'highest',
      provider: PROVIDER_IDS.includes(candidate.badge?.provider as ProviderId)
        ? (candidate.badge?.provider as ProviderId)
        : defaults.badge.provider,
      metric: candidate.badge?.metric === 'weekly' ? 'weekly' : 'session',
    },
    overlays: Object.fromEntries(
      OVERLAY_PROVIDER_IDS.map((provider) => [
        provider,
        candidate.overlays?.[provider] ?? legacyOverlays?.[provider] ?? defaults.overlays[provider],
      ]),
    ) as ExtensionSettings['overlays'],
  };
};

export const readExtensionSettings = async (): Promise<ExtensionSettings> => {
  if (!globalThis.chrome?.storage?.local) {
    return createDefaultSettings();
  }
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.extensionSettings,
    ...OVERLAY_PROVIDER_IDS.map((provider) => OVERLAY_STORAGE_KEYS[provider].enabled),
  ]);
  const legacyOverlays = Object.fromEntries(
    OVERLAY_PROVIDER_IDS.flatMap((provider) => {
      const value = stored[OVERLAY_STORAGE_KEYS[provider].enabled];
      return value === undefined ? [] : [[provider, value !== false]];
    }),
  ) as Partial<ExtensionSettings['overlays']>;
  return normalizeSettings(stored[STORAGE_KEYS.extensionSettings], legacyOverlays);
};

export const saveExtensionSettings = async (settings: ExtensionSettings): Promise<void> => {
  if (!globalThis.chrome?.storage?.local) {
    return;
  }
  await chrome.storage.local.set({
    [STORAGE_KEYS.extensionSettings]: settings,
    ...Object.fromEntries(
      OVERLAY_PROVIDER_IDS.map((provider) => [
        OVERLAY_STORAGE_KEYS[provider].enabled,
        settings.overlays[provider],
      ]),
    ),
  });
};
