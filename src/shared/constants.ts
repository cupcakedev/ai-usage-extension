/**
 * Single source of truth for keys and identifiers shared across every
 * extension context (background, content script, sidepanel/popup, welcome).
 */

export const STORAGE_KEYS = {
  /** Persisted `UsageState` snapshot. */
  usageState: 'ai_usage_state',
  /** Cached Claude organization id used to build the usage endpoint. */
  claudeOrgId: 'claude_org_id',
  glmToken: 'glm_token',
  /** Whether the on-page overlay is shown on claude.ai. */
  claudeOverlayEnabled: 'claude_overlay_enabled',
  /** Whether the on-page overlay is collapsed into its side tab. */
  claudeOverlayCollapsed: 'claude_overlay_collapsed',
  codexOverlayEnabled: 'codex_overlay_enabled',
  codexOverlayCollapsed: 'codex_overlay_collapsed',
  glmApiKey: 'glm_api_key',
  /** User-configurable display, badge, and overlay preferences. */
  extensionSettings: 'ai_usage_settings',
  /** Anonymous, locally generated id attached to manual problem reports. */
  distinctId: 'ai_usage_distinct_id',
} as const;

/** Name of the recurring alarm that refreshes usage in the background. */
export const REFRESH_ALARM = 'refreshUsage';

/** How often the background worker re-fetches usage, in minutes. */
export const REFRESH_INTERVAL_MINUTES = 5;

/** Percentage thresholds that drive the ok / warning / critical tone. */
export const USAGE_THRESHOLDS = {
  warning: 75,
  critical: 92,
} as const;

export const POSTHOG_PROJECT_TOKEN = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();

export const POSTHOG_HOST = (
  import.meta.env.VITE_POSTHOG_HOST?.trim() || 'https://eu.i.posthog.com'
).replace(/\/$/, '');

export const GITHUB_REPO_URL = 'https://github.com/cupcakedev/ai-usage-extension';

export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues/new`;

export const REPORT_MAX_LENGTH = 1000;
