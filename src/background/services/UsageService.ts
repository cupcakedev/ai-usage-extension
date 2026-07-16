import { STORAGE_KEYS } from '../../shared/constants';
import { ClaudeUsage, CodexUsage, ModelUsage, UsageLimit, UsageState } from '../../shared/types';
import { clampPercent, getUsageTone } from '../../shared/utils';

const ENDPOINTS = {
  claudeOrgs: 'https://claude.ai/api/organizations',
  claudeUsage: (orgId: string) => `https://claude.ai/api/organizations/${orgId}/usage`,
  codexSession: 'https://chatgpt.com/api/auth/session',
  codexUsage: 'https://chatgpt.com/backend-api/wham/usage',
} as const;

const JSON_HEADERS = { Accept: 'application/json' } as const;

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  return value.length > 0 ? value : null;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
};

const firstString = (...candidates: unknown[]): string | null => {
  for (const c of candidates) {
    const s = readString(c);
    if (s) return s;
  }
  return null;
};

const buildLimit = (percent: number | null, resetsAt: string | null): UsageLimit => ({
  percentage: clampPercent(percent ?? 0),
  resetsAt,
});

const finalize = <T extends { session: UsageLimit; weekly: UsageLimit }>(payload: T) => ({
  ...payload,
  status: getUsageTone(Math.max(payload.session.percentage, payload.weekly.percentage)),
  lastUpdated: Date.now(),
});

const humanizeSlug = (slug: string): string =>
  slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) =>
      word.toLowerCase() === 'gpt' ? 'GPT' : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');

/* -------------------- Claude -------------------- */

const claudeWindowFrom = (window: unknown): UsageLimit => {
  if (!isObject(window)) return buildLimit(0, null);
  return buildLimit(readNumber(window.utilization), readString(window.resets_at));
};

const claudeModelBreakdown = (raw: Json): ModelUsage[] => {
  if (!Array.isArray(raw.limits)) return [];

  return raw.limits.reduce<ModelUsage[]>((models, entry, index) => {
    if (!isObject(entry)) return models;

    const scope = isObject(entry.scope) ? entry.scope : null;
    const model = scope && isObject(scope.model) ? scope.model : null;
    const displayName = model ? readString(model.display_name) : null;
    if (!displayName) return models;

    const tag = entry.group === 'session' ? '5h' : '7d';
    models.push({
      id: `${readString(entry.kind) ?? 'scoped'}-${index}`,
      label: `${displayName} · ${tag}`,
      limit: buildLimit(readNumber(entry.percent), readString(entry.resets_at)),
    });
    return models;
  }, []);
};

const buildClaudeUsage = (raw: Json | null): ClaudeUsage | null => {
  if (!raw) return null;

  return {
    plan: 'unknown',
    ...finalize({
      session: claudeWindowFrom(raw.five_hour),
      weekly: claudeWindowFrom(raw.seven_day),
    }),
    models: claudeModelBreakdown(raw),
    raw,
  };
};

const resolveOrgFromList = (orgs: unknown): string | null => {
  if (!Array.isArray(orgs) || orgs.length === 0) return null;

  for (const entry of orgs) {
    if (!isObject(entry)) continue;
    const caps = Array.isArray(entry.capabilities) ? entry.capabilities : [];
    if (caps.includes('api')) continue;
    const id = readString(entry.uuid);
    if (id) return id;
  }

  const first = isObject(orgs[0]) ? readString(orgs[0].uuid) : null;
  return first;
};

/* -------------------- Codex -------------------- */

type CodexSessionInfo = { accessToken: string; accountId: string | null };

const codexResetTimestamp = (window: Json): string | null => {
  const epochSeconds = readNumber(window.reset_at);
  if (epochSeconds !== null) {
    return new Date(epochSeconds * 1000).toISOString();
  }

  const afterSeconds = readNumber(window.reset_after_seconds);
  if (afterSeconds !== null) {
    return new Date(Date.now() + afterSeconds * 1000).toISOString();
  }

  return null;
};

const codexWindowFrom = (window: unknown): UsageLimit => {
  if (!isObject(window)) return buildLimit(0, null);
  return buildLimit(readNumber(window.used_percent), codexResetTimestamp(window));
};

const codexRateLimitWindows = (id: string, label: string, entry: Json): ModelUsage[] => {
  const windows: ModelUsage[] = [];
  if (isObject(entry.primary_window)) {
    windows.push({
      id: `${id}:5h`,
      label: `${label} · 5h`,
      limit: codexWindowFrom(entry.primary_window),
    });
  }
  if (isObject(entry.secondary_window)) {
    windows.push({
      id: `${id}:7d`,
      label: `${label} · 7d`,
      limit: codexWindowFrom(entry.secondary_window),
    });
  }
  return windows;
};

const codexModelBreakdown = (raw: Json): ModelUsage[] => {
  const models: ModelUsage[] = [];
  const additional = raw.additional_rate_limits;

  if (Array.isArray(additional)) {
    additional.forEach((entry, index) => {
      if (!isObject(entry)) return;
      const label = humanizeSlug(
        firstString(entry.model, entry.name, entry.label) ?? `limit_${index + 1}`,
      );
      models.push(...codexRateLimitWindows(`additional[${index}]`, label, entry));
    });
  } else if (isObject(additional)) {
    for (const [name, entry] of Object.entries(additional)) {
      if (!isObject(entry)) continue;
      models.push(...codexRateLimitWindows(`additional.${name}`, humanizeSlug(name), entry));
    }
  }

  if (isObject(raw.code_review_rate_limit)) {
    models.push(...codexRateLimitWindows('code_review', 'Code review', raw.code_review_rate_limit));
  }

  return models;
};

const buildCodexUsage = (raw: Json | null): CodexUsage | null => {
  if (!raw) return null;
  const rate = isObject(raw.rate_limit) ? raw.rate_limit : null;

  return {
    ...finalize({
      session: codexWindowFrom(rate?.primary_window),
      weekly: codexWindowFrom(rate?.secondary_window),
    }),
    models: codexModelBreakdown(raw),
    raw,
  };
};

const accountIdFromSession = (session: Json): string | null => {
  const direct = firstString(
    session.account_id,
    session.accountId,
    session.active_account_id,
    session.activeAccountId,
  );
  if (direct) return direct;

  if (isObject(session.user)) {
    const fromUser = firstString(
      session.user.account_id,
      session.user.accountId,
      session.user.default_account_id,
    );
    if (fromUser) return fromUser;
  }

  if (Array.isArray(session.accounts)) {
    for (const entry of session.accounts) {
      if (!isObject(entry)) continue;
      const id = firstString(entry.account_id, entry.id, entry.uuid);
      if (id) return id;
    }
  }

  return null;
};

/* -------------------- HTTP -------------------- */

const fetchJson = async (
  url: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: Json } | { ok: false; status: number }> => {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers ?? {}) },
  });

  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  const payload = (await response.json()) as unknown;
  return { ok: true, data: (isObject(payload) ? payload : { value: payload }) as Json };
};

const fetchJsonRaw = async (url: string, init?: RequestInit): Promise<unknown> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: JSON_HEADERS,
    ...init,
  });
  if (!response.ok) return null;
  return response.json();
};

/* -------------------- Service -------------------- */

export class UsageService {
  static async getUsageState(): Promise<UsageState> {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.usageState);
    return (stored[STORAGE_KEYS.usageState] ?? {}) as UsageState;
  }

  static async saveUsageState(state: UsageState): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.usageState]: state });
  }

  static async refreshAllUsage(): Promise<UsageState> {
    const [claude, codex] = await Promise.all([
      this.fetchClaudeUsage().catch(() => null),
      this.fetchCodexUsage().catch(() => null),
    ]);

    const next = await this.getUsageState();
    if (claude) next.claude = claude;
    if (codex) next.codex = codex;

    await this.saveUsageState(next);
    return next;
  }

  static async fetchClaudeUsage(): Promise<ClaudeUsage | null> {
    const orgId = await this.resolveClaudeOrgId();
    if (!orgId) return null;

    const result = await fetchJson(ENDPOINTS.claudeUsage(orgId));
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) {
        await chrome.storage.local.remove(STORAGE_KEYS.claudeOrgId);
      }
      return null;
    }

    return buildClaudeUsage(result.data);
  }

  static async fetchCodexUsage(): Promise<CodexUsage | null> {
    const session = await this.fetchCodexSession();
    if (!session) return null;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.accessToken}`,
    };
    if (session.accountId) {
      headers['ChatGPT-Account-Id'] = session.accountId;
    }

    const result = await fetchJson(ENDPOINTS.codexUsage, { headers });
    if (!result.ok) return null;

    return buildCodexUsage(result.data);
  }

  private static async fetchCodexSession(): Promise<CodexSessionInfo | null> {
    const payload = await fetchJsonRaw(ENDPOINTS.codexSession);
    if (!isObject(payload)) return null;

    const accessToken = readString(payload.accessToken);
    if (!accessToken) return null;

    return { accessToken, accountId: accountIdFromSession(payload) };
  }

  private static async resolveClaudeOrgId(): Promise<string | null> {
    const cached = await chrome.storage.local.get(STORAGE_KEYS.claudeOrgId);
    const stored = readString(cached[STORAGE_KEYS.claudeOrgId]);
    if (stored) return stored;

    const fromCookie = await this.claudeOrgFromCookie();
    if (fromCookie) {
      await chrome.storage.local.set({ [STORAGE_KEYS.claudeOrgId]: fromCookie });
      return fromCookie;
    }

    const orgs = await fetchJsonRaw(ENDPOINTS.claudeOrgs);
    const fromApi = resolveOrgFromList(orgs);
    if (fromApi) {
      await chrome.storage.local.set({ [STORAGE_KEYS.claudeOrgId]: fromApi });
    }
    return fromApi;
  }

  private static async claudeOrgFromCookie(): Promise<string | null> {
    try {
      const cookie = await chrome.cookies.get({
        url: 'https://claude.ai',
        name: 'lastActiveOrg',
      });
      const value = cookie?.value;
      return value ? decodeURIComponent(value) : null;
    } catch {
      return null;
    }
  }
}
