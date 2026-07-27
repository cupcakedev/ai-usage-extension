const FALLBACK_MESSAGES: Record<string, string> = {
  appName: 'AI Usage Tracker: Claude & Codex Limits',
  appShortName: 'AI Usage Tracker',
  appDescription:
    'Track Claude and ChatGPT (Codex) session and weekly usage limits in a popup, toolbar badge, and on-page overlay. Privacy-first, no setup.',
  popupEyebrow: 'AI Capacity',
  popupTitle: 'Usage',
  refreshUsage: 'Refresh usage',
  refreshUsageLimits: 'Refresh usage limits',
  refreshErrorPrefix: 'Couldn’t refresh',
  refreshFailed: 'Refresh failed',
  overlayToggleLabel: 'On-page overlays',
  availableResetsLabel: 'Available resets · $1',
  loadingSnapshot: 'loading snapshot',
  notConnected: 'not connected',
  updated: 'updated $1',
  refreshing: 'refreshing...',
  waitingForSnapshot: 'waiting for snapshot',
  sessionLimit: 'Session · 5h',
  weeklyLimit: 'Weekly · 7d',
  planLabel: 'Plan · $1',
  resetsLabel: 'resets $1',
  nextResetLabel: 'resets $1',
  showLimits: 'Show limits',
  hideLimits: 'Hide limits',
  limitsTab: 'LIMITS',
  emptyClaude: 'No data yet. Open claude.ai while signed in, then refresh.',
  emptyCodex: 'No data yet. Open chatgpt.com while signed in, then refresh.',
  emptyMiniMax: 'No data yet. Open the MiniMax plan page while signed in, then refresh.',
  emptyKimi: 'No data yet. Open kimi.com/code while signed in, then refresh.',
  emptyCursor: 'No data yet. Open cursor.com while signed in, then refresh.',
  emptyMiMo: 'No data yet. Open Xiaomi MiMo while signed in, then refresh.',
  planUsage: 'Plan usage',
  tokenPlan: 'Token plan',
  billingPeriod: 'Billing period',
  emptyOverlay: 'No data yet. Open the popup and refresh.',
  sourceCode: 'Source code',
  github: 'GitHub',
  timeUnknown: 'unknown',
  timeNow: 'now',
  timeJustNow: 'just now',
  timeAgo: '$1 ago',
  timeDayShort: 'd',
  timeHourShort: 'h',
  timeMinuteShort: 'm',
};

export const msg = (name: string, substitutions?: string | string[]): string => {
  const value = globalThis.chrome?.i18n?.getMessage(name, substitutions);
  if (value) {
    return value;
  }

  const fallback = FALLBACK_MESSAGES[name] ?? name;
  const values = Array.isArray(substitutions)
    ? substitutions
    : substitutions
      ? [substitutions]
      : [];

  return values.reduce(
    (text, substitution, index) => text.split(`$${index + 1}`).join(substitution),
    fallback,
  );
};
