import claudeBrandAsset from '../assets/brands/claude-anthropic.jpg';
import codexBrandAsset from '../assets/brands/codex-openai.jpg';
import cursorBrandAsset from '../assets/brands/cursor.webp';
import kimiBrandAsset from '../assets/brands/kimi.webp';
import minimaxBrandAsset from '../assets/brands/minimax.webp';
import mimoBrandAsset from '../assets/brands/xiaomimimo.webp';
import type { ProviderId, ProviderMetric } from '../shared/types';

export const PROVIDER_DETAILS: Record<ProviderId, { name: string; icon: string }> = {
  claude: { name: 'Claude', icon: claudeBrandAsset },
  codex: { name: 'Codex', icon: codexBrandAsset },
  minimax: { name: 'MiniMax', icon: minimaxBrandAsset },
  kimi: { name: 'Kimi Code', icon: kimiBrandAsset },
  cursor: { name: 'Cursor', icon: cursorBrandAsset },
  mimo: { name: 'Xiaomi MiMo', icon: mimoBrandAsset },
};

/** Resolves a file shipped in the extension root (icons/…) from an extension page. */
export const extensionAsset = (path: string): string =>
  globalThis.chrome?.runtime?.getURL?.(path) ?? `/${path}`;

export const APP_ICON = extensionAsset('icons/icon-128.png');

/** The exact toolbar icons the background script swaps between, in 10% steps. */
export const BADGE_RANGE_ICONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((range) => ({
  range,
  src: extensionAsset(`icons/badges/range-${range}.png`),
}));

const PROVIDER_METRIC_LABELS: Record<ProviderMetric, string> = {
  session: 'Session usage',
  weekly: 'Weekly usage',
  models: 'Model breakdown',
  reset: 'Reset time',
  plan: 'Plan',
  summary: 'Balance / summary',
};

/** Providers whose card labels this window differently in the popup. */
const METRIC_LABEL_OVERRIDES: Partial<Record<ProviderId, Partial<Record<ProviderMetric, string>>>> =
  {
    cursor: { session: 'Plan usage' },
    mimo: { session: 'Token plan', summary: 'Balance' },
  };

export const metricLabel = (provider: ProviderId, metric: ProviderMetric): string =>
  METRIC_LABEL_OVERRIDES[provider]?.[metric] ?? PROVIDER_METRIC_LABELS[metric];
