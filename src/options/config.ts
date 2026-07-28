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

export const PROVIDER_METRIC_LABELS: Record<ProviderMetric, string> = {
  session: 'Session usage',
  weekly: 'Weekly usage',
  models: 'Model breakdown',
  reset: 'Reset time',
  plan: 'Plan',
  summary: 'Balance / summary',
};
