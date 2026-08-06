import { STORAGE_KEYS } from '../../shared/constants';
import {
  ClaudeUsage,
  CodexUsage,
  CursorUsage,
  KimiUsage,
  MiniMaxUsage,
  MiMoUsage,
  ModelUsage,
  UsageLimit,
  UsageState,
} from '../../shared/types';
import { clampPercent, getUsageTone, isLimitAvailable } from '../../shared/utils';

const ENDPOINTS = {
  claudeOrgs: 'https://claude.ai/api/organizations',
  claudeUsage: (orgId: string) => `https://claude.ai/api/organizations/${orgId}/usage`,
  codexSession: 'https://chatgpt.com/api/auth/session',
  codexUsage: 'https://chatgpt.com/backend-api/wham/usage',
  miniMaxUsage: 'https://platform.minimax.io/backend/account/token_plan/remains_percent',
  kimiUsage: 'https://www.kimi.com/apiv2/kimi.gateway.billing.v1.BillingService/GetUsages',
  cursorUsage: 'https://cursor.com/api/usage-summary',
  mimoBalance: 'https://platform.xiaomimimo.com/api/v1/balance',
  mimoPlanDetail: 'https://platform.xiaomimimo.com/api/v1/tokenPlan/detail',
  mimoPlanUsage: 'https://platform.xiaomimimo.com/api/v1/tokenPlan/usage',
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

const readNumeric = (value: unknown): number | null => {
  const numeric = readNumber(value);
  if (numeric !== null) return numeric;
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readPercent = (value: unknown): number | null => {
  const numeric = readNumeric(value);
  if (numeric !== null) return numeric;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.trim().replace(/%$/, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const readBoolean = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null);

const asJson = (value: unknown): Json | null => (isObject(value) ? value : null);

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const epochToIso = (value: unknown): string | null => {
  const epoch = readNumeric(value);
  if (epoch === null || epoch <= 0) return null;
  return new Date(epoch > 10_000_000_000 ? epoch : epoch * 1000).toISOString();
};

const percentFromUsedLimit = (used: number | null, limit: number | null): number | null => {
  if (used === null || limit === null || limit <= 0) return null;
  return (used / limit) * 100;
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

const unavailableLimit = (): UsageLimit => ({ percentage: 0, resetsAt: null, available: false });

const finalize = <T extends { session: UsageLimit; weekly: UsageLimit }>(payload: T) => ({
  ...payload,
  status: getUsageTone(
    Math.max(
      0,
      ...[payload.session, payload.weekly].filter(isLimitAvailable).map((l) => l.percentage),
    ),
  ),
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

const CODEX_SESSION_MAX_SECONDS = 24 * 60 * 60;

type CodexWindowKind = 'session' | 'weekly';

const CODEX_WINDOW_SLOTS = [
  ['primary_window', 'session'],
  ['secondary_window', 'weekly'],
] as const satisfies readonly (readonly [string, CodexWindowKind])[];

const codexWindowKind = (window: Json, fallback: CodexWindowKind): CodexWindowKind => {
  const seconds = readNumber(window.limit_window_seconds);
  if (seconds === null || seconds <= 0) return fallback;
  return seconds <= CODEX_SESSION_MAX_SECONDS ? 'session' : 'weekly';
};

const codexWindowTag = (window: Json, kind: CodexWindowKind): string => {
  const seconds = readNumber(window.limit_window_seconds);
  if (seconds === null || seconds <= 0) return kind === 'session' ? '5h' : '7d';
  const hours = Math.max(1, Math.round(seconds / 3600));
  return hours >= 48 ? `${Math.round(hours / 24)}d` : `${hours}h`;
};

const codexRateLimitWindows = (id: string, label: string, entry: Json): ModelUsage[] => {
  const windows: ModelUsage[] = [];
  for (const [slot, fallback] of CODEX_WINDOW_SLOTS) {
    const window = entry[slot];
    if (!isObject(window)) continue;
    const tag = codexWindowTag(window, codexWindowKind(window, fallback));
    windows.push({
      id: `${id}:${tag}`,
      label: `${label} · ${tag}`,
      limit: codexWindowFrom(window),
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

const codexAvailableResets = (raw: Json): number | null => {
  const resetCredits = raw.rate_limit_reset_credits;
  if (!isObject(resetCredits)) return null;
  return readNumber(resetCredits.available_count);
};

const codexWindows = (rate: Json | null): { session: UsageLimit; weekly: UsageLimit } => {
  const windows = { session: unavailableLimit(), weekly: unavailableLimit() };
  for (const [slot, fallback] of CODEX_WINDOW_SLOTS) {
    const window = rate?.[slot];
    if (!isObject(window)) continue;
    windows[codexWindowKind(window, fallback)] = codexWindowFrom(window);
  }
  return windows;
};

const buildCodexUsage = (raw: Json | null): CodexUsage | null => {
  if (!raw) return null;
  const rate = isObject(raw.rate_limit) ? raw.rate_limit : null;

  return {
    ...finalize(codexWindows(rate)),
    models: codexModelBreakdown(raw),
    availableResets: codexAvailableResets(raw),
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

/* -------------------- Browser-session providers -------------------- */

const minimaxLimit = (row: Json, period: 'interval' | 'weekly'): UsageLimit => {
  const prefix = period === 'interval' ? 'current_interval' : 'current_weekly';
  const total = readNumeric(row[`${prefix}_total_count`]);
  const usedCount = readNumeric(row[`${prefix}_used_count`]);
  const remaining = readNumeric(row[`${prefix}_remains_count`] ?? row[`${prefix}_usage_count`]);
  const usableTotal = total !== null && total > 0 ? total : null;
  const usableUsed = usedCount !== null && usedCount >= 0 ? usedCount : null;
  const inferredUsed =
    usableTotal !== null && remaining !== null && remaining >= 0
      ? Math.max(0, usableTotal - remaining)
      : null;
  const used = usableUsed ?? inferredUsed;
  const percentage =
    readPercent(row[`${prefix}_used_percent`]) ??
    (readPercent(row[`${prefix}_remaining_percent`]) !== null
      ? 100 - (readPercent(row[`${prefix}_remaining_percent`]) ?? 0)
      : percentFromUsedLimit(used, usableTotal));
  const resetField = period === 'interval' ? 'end_time' : 'weekly_end_time';
  return {
    ...buildLimit(percentage, epochToIso(row[resetField])),
    ...(used !== null ? { used } : {}),
    ...(usableTotal !== null ? { limit: usableTotal } : {}),
  };
};

const buildMiniMaxUsage = (raw: Json | null): MiniMaxUsage | null => {
  if (!raw) return null;
  const payload = asJson(raw.data) ?? raw;
  const modelRemains = asArray(payload.model_remains);
  const models: ModelUsage[] = [];

  modelRemains.forEach((entry, index) => {
    const row = asJson(entry);
    if (!row) return;
    const name = readString(row.model_name) ?? `Model ${index + 1}`;
    // The Token Plan page exposes a dormant video lane alongside the active general quota.
    // It is not part of the coding-plan usage the extension reports.
    if (name.toLowerCase() === 'video') return;
    const session = minimaxLimit(row, 'interval');
    models.push({ id: `minimax:${index}:session`, label: `${name} · Session`, limit: session });

    if (
      readPercent(row.current_weekly_used_percent) !== null ||
      readPercent(row.current_weekly_remaining_percent) !== null ||
      (readNumeric(row.current_weekly_total_count) ?? 0) > 0
    ) {
      models.push({
        id: `minimax:${index}:weekly`,
        label: `${name} · Weekly`,
        limit: minimaxLimit(row, 'weekly'),
      });
    }
  });

  const services = asArray(payload.services);
  services.forEach((entry, index) => {
    const row = asJson(entry);
    if (!row) return;
    const label = readString(row.service_type) ?? `Service ${index + 1}`;
    const window = readString(row.window_type) ?? 'Usage';
    const limit = readNumeric(row.limit);
    const used = readNumeric(row.usage);
    models.push({
      id: `minimax:service:${index}`,
      label: `${label} · ${window}`,
      limit: {
        ...buildLimit(readNumeric(row.percent) ?? percentFromUsedLimit(used, limit), null),
        ...(used !== null ? { used } : {}),
        ...(limit !== null ? { limit } : {}),
      },
    });
  });

  const session = models.find((model) => model.id.endsWith(':session'))?.limit ?? models[0]?.limit;
  const weekly = models.find((model) => model.id.endsWith(':weekly'))?.limit ?? buildLimit(0, null);
  if (!session) return null;

  return {
    plan:
      firstString(
        payload.current_subscribe_title,
        payload.plan_name,
        payload.combo_title,
        payload.current_plan_title,
      ) ?? 'Token Plan',
    ...finalize({ session, weekly }),
    models: models.filter((model) => model.limit !== session && model.limit !== weekly),
    raw,
  };
};

const kimiDetailLimit = (value: unknown): UsageLimit => {
  const detail = asJson(value);
  if (!detail) return buildLimit(0, null);
  const used = readNumeric(detail.used);
  const limit = readNumeric(detail.limit);
  return {
    ...buildLimit(percentFromUsedLimit(used, limit), readString(detail.resetTime)),
    ...(used !== null ? { used } : {}),
    ...(limit !== null ? { limit } : {}),
  };
};

const buildKimiUsage = (raw: Json | null): KimiUsage | null => {
  if (!raw) return null;
  const usage = asArray(raw.usages)
    .map(asJson)
    .find((entry) => entry?.scope === 'FEATURE_CODING');
  if (!usage) return null;

  const weekly = kimiDetailLimit(usage.detail);
  const limits = asArray(usage.limits)
    .map(asJson)
    .filter((entry): entry is Json => entry !== null);
  const rateLimit = limits[0] ? kimiDetailLimit(limits[0].detail) : null;
  return {
    ...finalize({ session: rateLimit ?? weekly, weekly }),
    models: [],
    raw,
  };
};

const cursorUsageWindow = (value: unknown, resetsAt: string | null): UsageLimit | null => {
  const usage = asJson(value);
  if (!usage || readBoolean(usage.enabled) === false) return null;
  const used = readNumeric(usage.used);
  const limit = readNumeric(usage.limit);
  const percentage =
    [usage.totalPercentUsed, usage.autoPercentUsed, usage.apiPercentUsed]
      .map(readNumeric)
      .find((value): value is number => value !== null) ?? percentFromUsedLimit(used, limit);
  if (percentage === null && used === null) return null;
  return {
    ...buildLimit(percentage, resetsAt),
    ...(used !== null ? { used } : {}),
    ...(limit !== null ? { limit } : {}),
  };
};

const buildCursorUsage = (raw: Json | null): CursorUsage | null => {
  if (!raw) return null;
  const individual = asJson(raw.individualUsage);
  const team = asJson(raw.teamUsage);
  const resetsAt = readString(raw.billingCycleEnd);
  const candidates: Array<[string, unknown]> = [
    ['Plan', individual?.plan],
    ['Personal cap', individual?.overall],
    ['Team pool', team?.pooled],
    ['On-demand', individual?.onDemand],
    ['Team on-demand', team?.onDemand],
  ];
  const models = candidates.flatMap(([label, value]) => {
    const limit = cursorUsageWindow(value, resetsAt);
    return limit ? [{ id: `cursor:${label.toLowerCase().replace(/ /g, '-')}`, label, limit }] : [];
  });
  const session = models[0]?.limit;
  if (!session) return null;

  return {
    plan: readString(raw.membershipType) ?? undefined,
    ...finalize({ session, weekly: buildLimit(0, resetsAt) }),
    models: models.slice(1),
    raw,
  };
};

const mimoBalanceSummary = (raw: Json): string | undefined => {
  const data = asJson(raw.data);
  if (!data) return undefined;
  const balance = readString(data.balance);
  const currency = readString(data.currency);
  if (!balance || !currency) return undefined;
  const parts = [`Balance · ${balance} ${currency}`];
  const cash = readString(data.cashBalance);
  const gift = readString(data.giftBalance);
  if (cash || gift) parts.push(`Paid ${cash ?? '0'} · Granted ${gift ?? '0'}`);
  return parts.join(' · ');
};

const buildMiMoUsage = (
  balance: Json | null,
  detail: Json | null,
  usage: Json | null,
): MiMoUsage | null => {
  if (!balance || readNumeric(balance.code) !== 0) return null;
  const plan = asJson(detail?.data);
  const monthUsage = asJson(asJson(usage?.data)?.monthUsage);
  const item = asArray(monthUsage?.items)
    .map(asJson)
    .find((entry) => entry !== null);
  const used = item ? readNumeric(item.used) : null;
  const limit = item ? readNumeric(item.limit) : null;
  const session: UsageLimit = {
    ...buildLimit(
      readNumeric(monthUsage?.percent) ?? percentFromUsedLimit(used, limit),
      readString(plan?.currentPeriodEnd),
    ),
    ...(used !== null ? { used } : {}),
    ...(limit !== null ? { limit } : {}),
  };
  return {
    plan: readString(plan?.planCode) ?? undefined,
    ...finalize({ session, weekly: buildLimit(0, null) }),
    models: [],
    summary: mimoBalanceSummary(balance),
    raw: balance,
  };
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
    const [claude, codex, minimax, kimi, cursor, mimo] = await Promise.all([
      this.fetchClaudeUsage().catch(() => null),
      this.fetchCodexUsage().catch(() => null),
      this.fetchMiniMaxUsage().catch(() => null),
      this.fetchKimiUsage().catch(() => null),
      this.fetchCursorUsage().catch(() => null),
      this.fetchMiMoUsage().catch(() => null),
    ]);

    const next = await this.getUsageState();
    if (claude) next.claude = claude;
    if (codex) next.codex = codex;
    if (minimax) next.minimax = minimax;
    if (kimi) next.kimi = kimi;
    if (cursor) next.cursor = cursor;
    if (mimo) next.mimo = mimo;

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

  static async fetchMiniMaxUsage(): Promise<MiniMaxUsage | null> {
    const globalResult = await fetchJson(ENDPOINTS.miniMaxUsage);
    const result = globalResult.ok
      ? globalResult
      : await fetchJson('https://platform.minimaxi.com/backend/account/token_plan/remains_percent');
    if (!result.ok) return null;
    return buildMiniMaxUsage(result.data);
  }

  static async fetchKimiUsage(): Promise<KimiUsage | null> {
    const cookie = await chrome.cookies.get({ url: 'https://www.kimi.com', name: 'kimi-auth' });
    const token = readString(cookie?.value);
    if (!token) return null;

    const result = await fetchJson(ENDPOINTS.kimiUsage, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
        'X-Language': 'en-US',
        'X-Msh-Platform': 'web',
        'R-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      body: JSON.stringify({ scope: ['FEATURE_CODING'] }),
    });
    if (!result.ok) return null;
    return buildKimiUsage(result.data);
  }

  static async fetchCursorUsage(): Promise<CursorUsage | null> {
    const result = await fetchJson(ENDPOINTS.cursorUsage);
    if (!result.ok) return null;
    return buildCursorUsage(result.data);
  }

  static async fetchMiMoUsage(): Promise<MiMoUsage | null> {
    const [balance, detail, usage] = await Promise.all([
      fetchJson(ENDPOINTS.mimoBalance, { headers: { 'X-Timezone': 'UTC' } }),
      fetchJson(ENDPOINTS.mimoPlanDetail, { headers: { 'X-Timezone': 'UTC' } }),
      fetchJson(ENDPOINTS.mimoPlanUsage, { headers: { 'X-Timezone': 'UTC' } }),
    ]);
    if (!balance.ok) return null;
    return buildMiMoUsage(
      balance.data,
      detail.ok ? detail.data : null,
      usage.ok ? usage.data : null,
    );
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
