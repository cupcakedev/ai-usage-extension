import type {
  BadgeMetric,
  BadgeMode,
  ExtensionSettings,
  PopupLayout,
  ProviderId,
  ProviderMetric,
} from '../shared/types';

export const withPopupLayout = (
  settings: ExtensionSettings,
  popupLayout: PopupLayout,
): ExtensionSettings => ({ ...settings, popupLayout });

export const withProviderVisibility = (
  settings: ExtensionSettings,
  provider: ProviderId,
  visible: boolean,
): ExtensionSettings => ({
  ...settings,
  providers: {
    ...settings.providers,
    [provider]: { ...settings.providers[provider], visible },
  },
});

export const withToggledProviderMetric = (
  settings: ExtensionSettings,
  provider: ProviderId,
  metric: ProviderMetric,
): ExtensionSettings => {
  const metrics = settings.providers[provider].metrics;
  const nextMetrics = metrics.includes(metric)
    ? metrics.filter((value) => value !== metric)
    : [...metrics, metric];

  return {
    ...settings,
    providers: {
      ...settings.providers,
      [provider]: { ...settings.providers[provider], metrics: nextMetrics },
    },
  };
};

export const withBadgeMode = (settings: ExtensionSettings, mode: BadgeMode): ExtensionSettings => ({
  ...settings,
  badge: { ...settings.badge, mode },
});

export const withBadgeMetric = (
  settings: ExtensionSettings,
  metric: BadgeMetric,
): ExtensionSettings => ({
  ...settings,
  badge: { ...settings.badge, metric },
});

export const withBadgeProvider = (
  settings: ExtensionSettings,
  provider: ProviderId,
): ExtensionSettings => ({
  ...settings,
  badge: { ...settings.badge, provider },
});

export const withOverlayEnabled = (
  settings: ExtensionSettings,
  provider: 'claude' | 'codex',
  enabled: boolean,
): ExtensionSettings => ({
  ...settings,
  overlays: { ...settings.overlays, [provider]: enabled },
});
