import { msg } from './i18n';
import type { ClaudeUsage, CodexUsage, ModelUsage } from './types';

export type ProviderUsage = ClaudeUsage | CodexUsage;

/**
 * Return the provider-level limits shown in the popup, overlay, and badge.
 *
 * Codex windows are dynamic because the backend can return one or more periods
 * in either the primary or secondary slot. The legacy fallback keeps snapshots
 * written by earlier extension versions readable until the next refresh.
 */
export const getUsageWindows = (usage: ProviderUsage): ModelUsage[] => {
  if ('plan' in usage) {
    return [
      { id: 'session', label: msg('sessionLimit'), limit: usage.session },
      { id: 'weekly', label: msg('weeklyLimit'), limit: usage.weekly },
    ];
  }

  if (Array.isArray(usage.windows)) {
    return usage.windows;
  }

  const legacy: ModelUsage[] = [];
  if (usage.session) {
    legacy.push({ id: 'legacy-session', label: msg('sessionLimit'), limit: usage.session });
  }
  if (usage.weekly) {
    legacy.push({ id: 'legacy-weekly', label: msg('weeklyLimit'), limit: usage.weekly });
  }
  return legacy;
};

export const highestUsageWindow = (usage: ProviderUsage): ModelUsage | null => {
  const windows = getUsageWindows(usage);
  if (windows.length === 0) return null;

  return windows.reduce((highest, current) =>
    current.limit.percentage > highest.limit.percentage ? current : highest,
  );
};
