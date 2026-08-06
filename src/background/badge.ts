import { msg } from '../shared/i18n';
import { readExtensionSettings } from '../shared/settings';
import type { BadgeMetric, ExtensionSettings, ProviderId, UsageState } from '../shared/types';
import { clampPercent, isLimitAvailable } from '../shared/utils';

const iconPath = (range: number): string => `icons/badges/range-${range}.png`;

const ICON_SIZES = [16, 32, 48, 128] as const;
type IconSize = (typeof ICON_SIZES)[number];
type ActionIconData = Record<IconSize, ImageData>;

const loadIconData = async (range: number, size: IconSize): Promise<[IconSize, ImageData]> => {
  const response = await fetch(chrome.runtime.getURL(iconPath(range)));
  if (!response.ok) {
    throw new Error(`Unable to load badge icon for ${range}%`);
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

const actionIconData = async (range: number): Promise<ActionIconData> =>
  Object.fromEntries(
    await Promise.all(ICON_SIZES.map((size) => loadIconData(range, size))),
  ) as ActionIconData;

const setActionIcon = async (range: number): Promise<void> => {
  await chrome.action.setIcon({ imageData: await actionIconData(range) });
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
};
const METRIC_LABEL: Record<BadgeMetric, string> = {
  session: msg('sessionLimit'),
  weekly: msg('weeklyLimit'),
};

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
      : (['claude', 'codex', 'minimax', 'kimi', 'cursor', 'mimo'] as const).filter(
          (provider) => settings.providers[provider].visible,
        );

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
        `${PROVIDER_TITLE[provider]} · ${METRIC_LABEL[metric]} ${percent}%`,
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
  const summary = summarizeUsage(state, await readExtensionSettings());
  if (!summary) {
    await resetBadge();
    return;
  }

  await Promise.all([
    setActionIcon(iconRange(summary.percent)),
    chrome.action.setBadgeText({ text: '' }),
    chrome.action.setTitle({ title: summary.tooltip }),
  ]);
};
