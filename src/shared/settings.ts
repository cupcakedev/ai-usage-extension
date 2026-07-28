import { STORAGE_KEYS } from './constants';
import type {
  ExtensionSettings,
  ProviderDisplaySettings,
  ProviderId,
  ProviderMetric,
} from './types';

export const PROVIDER_IDS: ProviderId[] = ['claude', 'codex', 'minimax', 'kimi', 'cursor', 'mimo'];

export const PROVIDER_METRICS: ProviderMetric[] = [
  'session',
  'weekly',
  'models',
  'reset',
  'plan',
  'summary',
];

const defaultProvider = (): ProviderDisplaySettings => ({
  visible: true,
  metrics: [...PROVIDER_METRICS],
});

export const createDefaultSettings = (): ExtensionSettings => ({
  popupLayout: 'single',
  providers: Object.fromEntries(
    PROVIDER_IDS.map((provider) => [provider, defaultProvider()]),
  ) as ExtensionSettings['providers'],
  badge: {
    mode: 'highest',
    provider: 'claude',
    metric: 'session',
  },
  overlays: {
    claude: true,
    codex: true,
  },
});

const asMetricList = (value: unknown): ProviderMetric[] =>
  Array.isArray(value)
    ? value.filter((metric): metric is ProviderMetric =>
        PROVIDER_METRICS.includes(metric as ProviderMetric),
      )
    : [...PROVIDER_METRICS];

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
          visible: providerValue?.visible !== false,
          metrics: asMetricList(providerValue?.metrics),
        },
      ];
    }),
  ) as ExtensionSettings['providers'];

  return {
    popupLayout: candidate.popupLayout === 'grid' ? 'grid' : 'single',
    providers,
    badge: {
      mode: candidate.badge?.mode === 'provider' ? 'provider' : 'highest',
      provider: PROVIDER_IDS.includes(candidate.badge?.provider as ProviderId)
        ? (candidate.badge?.provider as ProviderId)
        : defaults.badge.provider,
      metric: candidate.badge?.metric === 'weekly' ? 'weekly' : 'session',
    },
    overlays: {
      claude: candidate.overlays?.claude ?? legacyOverlays?.claude ?? defaults.overlays.claude,
      codex: candidate.overlays?.codex ?? legacyOverlays?.codex ?? defaults.overlays.codex,
    },
  };
};

export const readExtensionSettings = async (): Promise<ExtensionSettings> => {
  if (!globalThis.chrome?.storage?.local) {
    return createDefaultSettings();
  }
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.extensionSettings,
    STORAGE_KEYS.claudeOverlayEnabled,
    STORAGE_KEYS.codexOverlayEnabled,
  ]);
  return normalizeSettings(stored[STORAGE_KEYS.extensionSettings], {
    claude: stored[STORAGE_KEYS.claudeOverlayEnabled] !== false,
    codex: stored[STORAGE_KEYS.codexOverlayEnabled] !== false,
  });
};

export const saveExtensionSettings = async (settings: ExtensionSettings): Promise<void> => {
  if (!globalThis.chrome?.storage?.local) {
    return;
  }
  await chrome.storage.local.set({
    [STORAGE_KEYS.extensionSettings]: settings,
    // Preserve these keys for existing overlay instances during the migration.
    [STORAGE_KEYS.claudeOverlayEnabled]: settings.overlays.claude,
    [STORAGE_KEYS.codexOverlayEnabled]: settings.overlays.codex,
  });
};
