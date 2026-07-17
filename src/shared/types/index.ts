export type UsageStatus = 'ok' | 'warning' | 'critical';

export type ProviderId = 'claude' | 'codex';

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

export interface UsageState {
  claude?: ClaudeUsage;
  codex?: CodexUsage;
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
