const FALLBACK_MESSAGES: Record<string, string> = {
  appName: 'AI Usage Tracker: Claude & Codex Limits',
  appShortName: 'AI Usage Tracker',
  appDescription:
    'Track Claude and ChatGPT (Codex) session and weekly usage limits in a popup, toolbar badge, and on-page overlay. Privacy-first, no setup.',
  popupTitle: 'Usage',
  refreshUsage: 'Refresh usage',
  refreshUsageLimits: 'Refresh usage limits',
  refreshErrorPrefix: 'Couldn’t refresh',
  refreshFailed: 'Refresh failed',
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
  emptyClaude: 'No data yet. Open claude.ai while signed in, then refresh.',
  emptyCodex: 'No data yet. Open chatgpt.com while signed in, then refresh.',
  emptyMiniMax: 'No data yet. Open platform.minimax.io while signed in, then refresh.',
  emptyKimi: 'No data yet. Open kimi.com/code while signed in, then refresh.',
  emptyCursor: 'No data yet. Open cursor.com while signed in, then refresh.',
  emptyMiMo: 'No data yet. Open platform.xiaomimimo.com while signed in, then refresh.',
  planUsage: 'Plan usage',
  tokenPlan: 'Token plan',
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
  optionsSaved: 'All changes saved',
  optionsSaving: 'Saving…',
  optionsSaveError: 'Could not save',
  optionsSkip: 'Skip to settings',
  optionsLoading: 'Loading settings…',
  optionsNavLabel: 'Settings sections',
  optionsNavLayout: 'Layout',
  optionsNavProviders: 'Providers',
  optionsNavBadge: 'Toolbar badge',
  optionsNavOverlays: 'On-page overlays',
  optionsLayoutTitle: 'Popup layout',
  optionsLayoutDescription: 'Choose how visible provider cards are arranged in the popup.',
  optionsLayoutSingle: 'One column',
  optionsLayoutSingleDescription: 'A full-width card for each provider.',
  optionsLayoutGrid: 'Two columns',
  optionsLayoutGridDescription: 'A compact overview with two cards per row.',
  optionsProvidersTitle: 'Providers',
  optionsProvidersDescription:
    'Hide a card or choose the usage details it can display. Unavailable data stays hidden automatically.',
  optionsProvidersShown: '$1 of $2 shown',
  optionsProviderDetails: '$1 of $2 details',
  optionsProviderHidden: 'Hidden in popup',
  optionsProviderToggleLabel: 'Show $1 in popup',
  optionsProviderDetailsLegend: '$1 usage details',
  optionsMetricSession: 'Session usage',
  optionsMetricWeekly: 'Weekly usage',
  optionsMetricModels: 'Model breakdown',
  optionsMetricReset: 'Reset time',
  optionsMetricAvailableResets: 'Available resets',
  optionsMetricPlan: 'Plan',
  optionsMetricSummary: 'Balance / summary',
  optionsMetricBalance: 'Balance',
  optionsBadgeTitle: 'Badge range',
  optionsBadgeDescription: 'The extension icon changes by 10% ranges based on this source.',
  optionsBadgeSourceLabel: 'Badge source',
  optionsBadgeHighest: 'Highest of visible providers',
  optionsBadgeHighestDescription: 'Use the largest current percentage among shown provider cards.',
  optionsBadgeSelected: 'Selected provider',
  optionsBadgeSelectedDescription:
    'Use one provider regardless of the popup visibility of other cards.',
  optionsBadgeWindow: 'Usage window',
  optionsBadgeWindowSession: 'Session',
  optionsBadgeWindowWeekly: 'Weekly',
  optionsBadgeProvider: 'Provider',
  optionsBadgeHiddenWarning:
    'This provider is hidden in the popup, but its badge range remains active.',
  optionsBadgeSteps: 'Toolbar icon steps',
  optionsBadgeStepsHint: 'rounded down to the nearest 10%',
  optionsOverlaysTitle: 'On-page overlays',
  optionsOverlaysDescription: 'Show the collapsible usage capsule next to the message composer.',
  optionsOverlayToggleLabel: 'Enable $1 on-page overlay',
  optionsResetTitle: 'Reset to defaults',
  optionsResetDescription: 'Restores every preference on this page. This cannot be undone.',
  optionsResetAction: 'Reset defaults',
  optionsResetConfirm: 'Click again to confirm',
  optionsTitle: 'AI Usage Tracker settings',
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
