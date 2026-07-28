export type UsageStatus = 'ok' | 'warning' | 'critical';

export type ProviderId = 'claude' | 'codex' | 'minimax' | 'kimi' | 'cursor' | 'mimo';

export interface UsageLimit {
  percentage: number;
  resetsAt: string | null;
  used?: number;
  limit?: number;
}

export interface ModelUsage {
  id: string;
  label: string;
  limit: UsageLimit;
}

export interface ClaudeUsage {
  plan: string;
  session: UsageLimit;
  weekly: UsageLimit;
  models: ModelUsage[];
  status: UsageStatus;
  lastUpdated: number;
  raw?: Record<string, unknown>;
}

export interface CodexUsage {
  session: UsageLimit;
  weekly: UsageLimit;
  models: ModelUsage[];
  availableResets: number | null;
  status: UsageStatus;
  lastUpdated: number;
  raw?: Record<string, unknown>;
}

/** Shared snapshot shape for providers added after the original Claude/Codex pair. */
export interface ExternalProviderUsage {
  plan?: string;
  session: UsageLimit;
  weekly: UsageLimit;
  models: ModelUsage[];
  status: UsageStatus;
  lastUpdated: number;
  /** Human-readable balance or account detail when the provider has no second quota window. */
  summary?: string;
  raw?: Record<string, unknown>;
}

export type MiniMaxUsage = ExternalProviderUsage;
export type KimiUsage = ExternalProviderUsage;
export type CursorUsage = ExternalProviderUsage;
export type MiMoUsage = ExternalProviderUsage;

export interface UsageState {
  claude?: ClaudeUsage;
  codex?: CodexUsage;
  minimax?: MiniMaxUsage;
  kimi?: KimiUsage;
  cursor?: CursorUsage;
  mimo?: MiMoUsage;
}

export type PopupLayout = 'single' | 'grid';
export type ProviderMetric =
  | 'session'
  | 'weekly'
  | 'models'
  | 'reset'
  | 'availableResets'
  | 'plan'
  | 'summary';
export type BadgeMode = 'highest' | 'provider';
export type BadgeMetric = 'session' | 'weekly';

export interface ProviderDisplaySettings {
  visible: boolean;
  metrics: ProviderMetric[];
}

export interface ExtensionSettings {
  popupLayout: PopupLayout;
  providers: Record<ProviderId, ProviderDisplaySettings>;
  badge: {
    mode: BadgeMode;
    provider: ProviderId;
    metric: BadgeMetric;
  };
  overlays: {
    claude: boolean;
    codex: boolean;
  };
}

/* -------------------------------------------------------------------------- */
/*  Messaging protocol                                                        */
/* -------------------------------------------------------------------------- */

/** Messages sent to the background service worker. */
export type ExtensionMessage = { type: 'REFRESH_USAGE' };

/** Response returned by the background worker for a given message. */
export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Typed response for the `REFRESH_USAGE` message. */
export type RefreshUsageResponse = MessageResponse<UsageState>;
