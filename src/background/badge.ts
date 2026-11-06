import { msg } from '../shared/i18n';
import { readExtensionSettings } from '../shared/settings';
import type {
  BadgeMetric,
  ExtensionSettings,
  PercentageDisplay,
  ProviderId,
  UsageState,
} from '../shared/types';
import { badgeIconPath, clampPercent, formatUsagePercent, isLimitAvailable } from '../shared/utils';

const ICON_SIZES = [16, 32, 48, 128] as const;
type IconSize = (typeof ICON_SIZES)[number];
type ActionIconData = Record<IconSize, ImageData>;

const loadIconData = async (path: string, size: IconSize): Promise<[IconSize, ImageData]> => {
  const response = await fetch(chrome.runtime.getURL(path));
  if (!response.ok) {
    throw new Error(`Unable to load badge icon ${path}`);
  }

  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to render badge icon');
  }

  const bitmap = await createImageBitmap(await response.blob());
  try {
    context.drawImage(bitmap, 0, 0, size, size);
    return [size, context.getImageData(0, 0, size, size)];
  } finally {
    bitmap.close();
  }
};

const actionIconData = async (path: string): Promise<ActionIconData> =>
  Object.fromEntries(
    await Promise.all(ICON_SIZES.map((size) => loadIconData(path, size))),
  ) as ActionIconData;

const setActionIcon = async (range: number, display?: PercentageDisplay): Promise<void> => {
  await chrome.action.setIcon({ imageData: await actionIconData(badgeIconPath(range, display)) });
};

const iconRange = (percent: number): number => {
  const clamped = clampPercent(percent);
  return Math.max(10, Math.floor(clamped / 10) * 10);
};

const PROVIDER_TITLE: Record<ProviderId, string> = {
  claude: 'Claude',
  codex: 'Codex',
  minimax: 'MiniMax',
  kimi: 'Kimi',
  cursor: 'Cursor',
  mimo: 'MiMo',
  glm: 'GLM',
  qwen: 'Qwen',
  opencode: 'OpenCode',
};
/** Read lazily so a language change is picked up without a worker restart. */
const metricLabel = (metric: BadgeMetric): string =>
  metric === 'session' ? msg('sessionLimit') : msg('weeklyLimit');

interface UsageSummary {
  percent: number;
  tooltip: string;
}

/** Providers without the chosen window (e.g. Codex has no 5h quota) report the other one. */
const badgeMetricFor = (
  usage: UsageState[ProviderId],
  preferred: BadgeMetric,
): BadgeMetric | null => {
  if (!usage) return null;
  const fallback: BadgeMetric = preferred === 'session' ? 'weekly' : 'session';
  if (isLimitAvailable(usage[preferred])) return preferred;
  return isLimitAvailable(usage[fallback]) ? fallback : null;
};

const summarizeUsage = (state: UsageState, settings: ExtensionSettings): UsageSummary | null => {
  const providers =
    settings.badge.mode === 'provider'
      ? [settings.badge.provider]
      : (
          [
            'claude',
            'codex',
            'minimax',
            'kimi',
            'cursor',
            'mimo',
            'glm',
            'qwen',
            'opencode',
          ] as const
        ).filter((provider) => settings.providers[provider].visible);

  const rows = providers.flatMap((provider) => {
    const usage = state[provider];
    const metric = badgeMetricFor(usage, settings.badge.metric);
    if (!usage || !metric) return [];
    return [{ provider, metric, percent: clampPercent(usage[metric].percentage) }];
  });

  if (rows.length === 0) {
    return null;
  }

  const tooltip = [
    msg('appShortName'),
    ...rows.map(
      ({ provider, metric, percent }) =>
        `${PROVIDER_TITLE[provider]} · ${metricLabel(metric)} ${formatUsagePercent(percent, settings.percentageDisplay)}`,
    ),
  ].join('\n');

  return { percent: Math.max(...rows.map(({ percent }) => percent)), tooltip };
};

const resetBadge = async (): Promise<void> => {
  await Promise.all([
    setActionIcon(10),
    chrome.action.setBadgeText({ text: '' }),
    chrome.action.setTitle({ title: msg('appShortName') }),
  ]);
};

export const updateBadge = async (state: UsageState): Promise<void> => {
  const settings = await readExtensionSettings();
  const summary = summarizeUsage(state, settings);
  if (!summary) {
    await resetBadge();
    return;
  }

  await Promise.all([
    setActionIcon(iconRange(summary.percent), settings.percentageDisplay),
    chrome.action.setBadgeText({ text: '' }),
    chrome.action.setTitle({ title: summary.tooltip }),
  ]);
};
