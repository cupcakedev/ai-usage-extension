import { STORAGE_KEYS } from '../../shared/constants';
import {
  ClaudeUsage,
  CodexUsage,
  CursorUsage,
  GlmUsage,
  KimiUsage,
  MiniMaxUsage,
  MiMoUsage,
  ModelUsage,
  QwenUsage,
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
  miniMaxUsageCn: 'https://platform.minimaxi.com/backend/account/token_plan/remains_percent',
  kimiUsage: 'https://www.kimi.com/apiv2/kimi.gateway.billing.v1.BillingService/GetUsages',
  cursorUsage: 'https://cursor.com/api/usage-summary',
  mimoBalance: 'https://platform.xiaomimimo.com/api/v1/balance',
  mimoPlanDetail: 'https://platform.xiaomimimo.com/api/v1/tokenPlan/detail',
  mimoPlanUsage: 'https://platform.xiaomimimo.com/api/v1/tokenPlan/usage',
  glmQuota: 'https://api.z.ai/api/monitor/usage/quota/limit',
  glmQuotaCn: 'https://open.bigmodel.cn/api/monitor/usage/quota/limit',
} as const;

const QWEN_REGIONS = [
  {
    console: 'https://home.qwencloud.com',
    gateway: 'https://cs-data.qwencloud.com/data/api.json',
    action: 'IntlBroadScopeAspnGateway',
    region: 'ap-southeast-1',
    consoleSite: 'QWENCLOUD',
    commodityCode: 'sfm_tokenplansolo_public_intl',
  },
  {
    console: 'https://platform-home.qianwenai.com',
    gateway: 'https://cs-data.qianwenai.com/data/api.json',
    action: 'BroadScopeAspnGateway',
    region: 'cn-beijing',
    consoleSite: 'QIANWENAI',
    commodityCode: 'sfm_tokenplansolo_public_cn',
  },
] as const;

type QwenRegion = (typeof QWEN_REGIONS)[number];

const QWEN_APIS = {
  subscription: 'zeldaHttp.apikeyMgr./tokenplan/personal/api/v2/subscription',
  usage: 'zeldaHttp.apikeyMgr./tokenplan/personal/api/v2/usage',
  quotaConfig: 'zeldaHttp.apikeyMgr./tokenplan/personal/api/v2/quota-config',
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

const toIso = (milliseconds: number): string | null => {
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const epochToIso = (value: unknown): string | null => {
  const epoch = readNumeric(value);
  if (epoch === null || epoch <= 0) return null;
  return toIso(epoch > 10_000_000_000 ? epoch : epoch * 1000);
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
  if (!isObject(window)) return unavailableLimit();
  const utilization = readNumber(window.utilization);
  if (utilization === null) return unavailableLimit();
  return buildLimit(utilization, readString(window.resets_at));
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

  const session = claudeWindowFrom(raw.five_hour);
  const weekly = claudeWindowFrom(raw.seven_day);
  const models = claudeModelBreakdown(raw);
  if (!isLimitAvailable(session) && !isLimitAvailable(weekly) && !models.length) return null;

  return {
    plan: 'unknown',
    ...finalize({ session, weekly }),
    models,
    raw,
  };
};

const claudeOrgCapabilities = (entry: Json): string[] =>
  asArray(entry.capabilities)
    .map((value) => readString(value)?.toLowerCase())
    .filter((value): value is string => value !== undefined && value !== null);

const resolveOrgFromList = (orgs: unknown): string | null => {
  const entries = asArray(orgs).filter((entry): entry is Json => isObject(entry));
  if (!entries.length) return null;

  const withChat = entries.find((entry) => claudeOrgCapabilities(entry).includes('chat'));
  const notApiOnly = entries.find((entry) => {
    const caps = claudeOrgCapabilities(entry);
    return caps.length !== 1 || caps[0] !== 'api';
  });

  return readString((withChat ?? notApiOnly ?? entries[0]).uuid);
};

/* -------------------- Codex -------------------- */

type CodexSessionInfo = { accessToken: string; accountId: string | null };

const codexResetTimestamp = (window: Json): string | null => {
  const epochSeconds = readNumber(window.reset_at);
  if (epochSeconds !== null) {
    return toIso(epochSeconds * 1000);
  }

  const afterSeconds = readNumber(window.reset_after_seconds);
  if (afterSeconds !== null) {
    return toIso(Date.now() + afterSeconds * 1000);
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
      const rateLimit = asJson(entry.rate_limit);
      if (!rateLimit) return;
      const label = humanizeSlug(
        firstString(entry.limit_name, entry.metered_feature) ?? `limit_${index + 1}`,
      );
      models.push(...codexRateLimitWindows(`additional[${index}]`, label, rateLimit));
    });
  } else if (isObject(additional)) {
    for (const [name, entry] of Object.entries(additional)) {
      if (!isObject(entry)) continue;
      const rateLimit = asJson(entry.rate_limit) ?? entry;
      models.push(...codexRateLimitWindows(`additional.${name}`, humanizeSlug(name), rateLimit));
    }
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
  const remainsField = period === 'interval' ? 'remains_time' : 'weekly_remains_time';
  const remainsSeconds = readNumeric(row[remainsField]);
  const resetsAt =
    epochToIso(row[resetField]) ??
    (remainsSeconds !== null && remainsSeconds > 0
      ? toIso(Date.now() + remainsSeconds * 1000)
      : null);
  return {
    ...buildLimit(percentage, resetsAt),
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
  const weekly = models.find((model) => model.id.endsWith(':weekly'))?.limit ?? unavailableLimit();
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
  if (!detail) return unavailableLimit();
  const used = readNumeric(detail.used);
  const limit = readNumeric(detail.limit);
  const percentage = percentFromUsedLimit(used, limit);
  if (percentage === null) return unavailableLimit();
  return {
    ...buildLimit(
      percentage,
      firstString(detail.resetTime, detail.resetAt, detail.reset_time, detail.reset_at),
    ),
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
  const rateLimit = limits[0] ? kimiDetailLimit(limits[0].detail) : unavailableLimit();
  if (!isLimitAvailable(rateLimit) && !isLimitAvailable(weekly)) return null;

  return {
    ...finalize({ session: rateLimit, weekly }),
    models: [],
    raw,
  };
};

const cursorDollars = (cents: number): string =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const cursorCountLabel = (used: number | null, limit: number | null): string | null => {
  if (used === null) return null;
  return limit !== null && limit > 0
    ? `${cursorDollars(used)} / ${cursorDollars(limit)}`
    : cursorDollars(used);
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

  const countLabel = cursorCountLabel(used, limit);
  return {
    ...buildLimit(percentage, resetsAt),
    ...(countLabel !== null ? { countLabel } : {}),
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
    ...finalize({ session, weekly: unavailableLimit() }),
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
  const percentage = readNumeric(monthUsage?.percent) ?? percentFromUsedLimit(used, limit);
  const summary = mimoBalanceSummary(balance);
  if (percentage === null && !summary) return null;

  const session: UsageLimit =
    percentage === null
      ? unavailableLimit()
      : {
          ...buildLimit(percentage, readString(plan?.currentPeriodEnd)),
          ...(used !== null ? { used } : {}),
          ...(limit !== null ? { limit } : {}),
        };
  return {
    plan: readString(plan?.planCode) ?? undefined,
    ...finalize({ session, weekly: unavailableLimit() }),
    models: [],
    summary,
    raw: balance,
  };
};

const GLM_UNIT_MINUTES: Record<number, number> = { 1: 1440, 3: 60, 5: 1, 6: 10080 };

const GLM_QUOTA_TYPES = ['TOKENS_LIMIT', 'CREDIT_LIMIT'];

const GLM_MONTHLY_MINUTES = 30 * 24 * 60;

interface GlmFetch {
  usage: GlmUsage | null;
  rejected: boolean;
}

interface GlmLimit {
  type: string;
  windowMinutes: number | null;
  limit: UsageLimit;
}

const glmWindowTag = (windowMinutes: number | null): string | null => {
  if (windowMinutes === null || windowMinutes <= 0) return null;
  if (windowMinutes >= 2880) return `${Math.round(windowMinutes / 1440)}d`;
  if (windowMinutes >= 60) return `${Math.round(windowMinutes / 60)}h`;
  return `${windowMinutes}m`;
};

const glmLimitFrom = (entry: Json): GlmLimit | null => {
  const type = readString(entry.type);
  if (!type) return null;

  const total = readNumber(entry.usage);
  const remaining = readNumber(entry.remaining);
  const current = readNumber(entry.currentValue);
  const hasTotal = total !== null && total > 0;
  const used = hasTotal && remaining !== null ? Math.max(total - remaining, current ?? 0) : current;
  const percentage =
    hasTotal && used !== null
      ? percentFromUsedLimit(Math.min(Math.max(used, 0), total), total)
      : readNumber(entry.percentage);

  const unit = readNumber(entry.unit);
  const count = readNumber(entry.number);
  const unitMinutes = unit === null ? undefined : GLM_UNIT_MINUTES[unit];
  const windowMinutes =
    type === 'TIME_LIMIT' && unit === 5 && count === 1
      ? GLM_MONTHLY_MINUTES
      : unitMinutes && count !== null && count > 0
        ? count * unitMinutes
        : null;

  return {
    type,
    windowMinutes,
    limit: {
      ...buildLimit(percentage, epochToIso(entry.nextResetTime)),
      ...(used !== null ? { used } : {}),
      ...(hasTotal ? { limit: total } : {}),
    },
  };
};

const glmModelLabel = (entry: GlmLimit): string => {
  const tag = glmWindowTag(entry.windowMinutes);
  const name = entry.type === 'TIME_LIMIT' ? 'MCP' : 'Quota';
  return tag ? `${name} · ${tag}` : name;
};

const buildGlmUsage = (raw: Json | null): GlmUsage | null => {
  if (!raw) return null;
  const payload = asJson(raw.data);
  if (readBoolean(raw.success) !== true || readNumber(raw.code) !== 200 || !payload) return null;

  const limits = asArray(payload.limits)
    .map(asJson)
    .filter((entry): entry is Json => entry !== null)
    .map(glmLimitFrom)
    .filter((entry): entry is GlmLimit => entry !== null);

  const quotas = limits
    .filter((entry) => GLM_QUOTA_TYPES.includes(entry.type))
    .sort(
      (a, b) =>
        (a.windowMinutes ?? Number.MAX_SAFE_INTEGER) - (b.windowMinutes ?? Number.MAX_SAFE_INTEGER),
    );
  if (!quotas.length) return null;

  const session = quotas[0];
  const weekly = quotas.length > 1 ? quotas[quotas.length - 1] : null;
  const extras = [
    ...quotas.slice(1, weekly ? -1 : undefined),
    ...limits.filter((entry) => !GLM_QUOTA_TYPES.includes(entry.type)),
  ];

  const plan = firstString(
    payload.planName,
    payload.plan,
    payload.plan_type,
    payload.packageName,
    payload.level,
  );

  return {
    ...(plan ? { plan } : {}),
    ...finalize({ session: session.limit, weekly: weekly?.limit ?? unavailableLimit() }),
    models: extras.map((entry, index) => ({
      id: `glm:${entry.type.toLowerCase()}:${index}`,
      label: glmModelLabel(entry),
      limit: entry.limit,
    })),
    raw,
  };
};

const isoFromUnknown = (value: unknown): string | null => {
  const fromEpoch = epochToIso(value);
  if (fromEpoch) return fromEpoch;
  const text = readString(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
};

const qwenRatioPercent = (value: unknown): number | null => {
  const ratio = readNumeric(value);
  return ratio === null ? null : ratio * 100;
};

const qwenWindow = (
  percent: number | null,
  resetsAt: unknown,
  total: number | null,
): UsageLimit => {
  if (percent === null) return unavailableLimit();
  const hasTotal = total !== null && total > 0;
  return {
    ...buildLimit(percent, isoFromUnknown(resetsAt)),
    ...(hasTotal ? { used: Math.round((percent / 100) * total), limit: total } : {}),
  };
};

const buildQwenUsage = (
  usage: Json | null,
  subscription: Json | null,
  quotaConfig: Json | null,
): QwenUsage | null => {
  if (!usage) return null;

  const session = qwenRatioPercent(usage.per5HourPercentage);
  const weekly = qwenRatioPercent(usage.per1WeekPercentage);
  if (session === null && weekly === null) return null;

  const specCode = readString(subscription?.specCode);
  const quota = specCode && quotaConfig ? asJson(quotaConfig[specCode]) : null;

  return {
    ...(specCode ? { plan: humanizeSlug(specCode) } : {}),
    ...finalize({
      session: qwenWindow(
        session,
        usage.per5HourResetTime,
        quota ? readNumeric(quota.five_hour ?? quota.fiveHour) : null,
      ),
      weekly: qwenWindow(weekly, usage.per1WeekResetTime, quota ? readNumeric(quota.weekly) : null),
    }),
    models: [],
    raw: usage,
  };
};

/* -------------------- HTTP -------------------- */

const isChallengeResponse = (headers: Headers): boolean =>
  headers.get('cf-mitigated') !== null ||
  (headers.get('content-type') ?? '').toLowerCase().includes('text/html');

const fetchJson = async (
  url: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: Json } | { ok: false; status: number; challenged: boolean }> => {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers ?? {}) },
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      challenged: isChallengeResponse(response.headers),
    };
  }

  const payload = (await response.json()) as unknown;
  return { ok: true, data: (isObject(payload) ? payload : { value: payload }) as Json };
};

const qwenGatewayCall = async (
  region: QwenRegion,
  api: string,
  data: Json,
  secToken: string,
): Promise<Json | null> => {
  const body = new URLSearchParams({
    product: 'sfm_bailian',
    action: region.action,
    sec_token: secToken,
    region: region.region,
    params: JSON.stringify({
      Api: api,
      Data: {
        ...data,
        cornerstoneParam: {
          domain: new URL(region.console).hostname,
          consoleSite: region.consoleSite,
          console: 'ONE_CONSOLE',
          xsp_lang: 'en-US',
          protocol: 'V2',
          productCode: 'p_efm',
        },
      },
    }),
  });

  const url = `${region.gateway}?product=sfm_bailian&action=${region.action}&api=${encodeURIComponent(api)}`;
  const result = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }).catch(() => null);
  if (!result?.ok) return null;

  const envelope = result.data;
  if (readString(envelope.code) !== '200' && readBoolean(envelope.successResponse) !== true) {
    return null;
  }

  const payload = asJson(envelope.data);
  return payload && readBoolean(payload.success) !== false ? payload : null;
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
    const [claude, codex, minimax, kimi, cursor, mimo, glm, qwen] = await Promise.all([
      this.fetchClaudeUsage().catch(() => null),
      this.fetchCodexUsage().catch(() => null),
      this.fetchMiniMaxUsage().catch(() => null),
      this.fetchKimiUsage().catch(() => null),
      this.fetchCursorUsage().catch(() => null),
      this.fetchMiMoUsage().catch(() => null),
      this.fetchGlmUsage().catch(() => ({ usage: null, rejected: false })),
      this.fetchQwenUsage().catch(() => null),
    ]);

    const next = await this.getUsageState();
    if (claude) next.claude = claude;
    if (codex) next.codex = codex;
    if (minimax) next.minimax = minimax;
    if (kimi) next.kimi = kimi;
    if (cursor) next.cursor = cursor;
    if (mimo) next.mimo = mimo;
    if (glm.usage) next.glm = glm.usage;
    if (qwen) next.qwen = qwen;

    const issues = { ...next.issues };
    if (glm.rejected) issues.glm = 'auth';
    else delete issues.glm;
    if (Object.keys(issues).length) next.issues = issues;
    else delete next.issues;

    await this.saveUsageState(next);
    return next;
  }

  static async fetchClaudeUsage(): Promise<ClaudeUsage | null> {
    const orgId = await this.resolveClaudeOrgId();
    if (!orgId) return null;

    const result = await fetchJson(ENDPOINTS.claudeUsage(orgId));
    if (!result.ok) {
      const rejectedByClaude = result.status === 401 || result.status === 403;
      if (rejectedByClaude && !result.challenged) {
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
    for (const endpoint of [ENDPOINTS.miniMaxUsage, ENDPOINTS.miniMaxUsageCn]) {
      const result = await fetchJson(endpoint).catch(() => null);
      if (result?.ok) return buildMiniMaxUsage(result.data);
    }
    return null;
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

  static async fetchGlmUsage(): Promise<GlmFetch> {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.glmApiKey, STORAGE_KEYS.glmToken]);
    const apiKey = readString(stored[STORAGE_KEYS.glmApiKey]);
    const sessionToken = readString(stored[STORAGE_KEYS.glmToken]);

    const credentials = apiKey
      ? [`Bearer ${apiKey}`, apiKey]
      : sessionToken
        ? [`Bearer ${sessionToken}`]
        : [];
    if (!credentials.length) return { usage: null, rejected: false };

    let rejected = false;
    for (const endpoint of [ENDPOINTS.glmQuota, ENDPOINTS.glmQuotaCn]) {
      for (const authorization of credentials) {
        const result = await fetchJson(endpoint, {
          headers: { Authorization: authorization, 'Accept-Language': 'en-US,en' },
        }).catch(() => null);
        if (!result) continue;
        if (!result.ok) {
          rejected ||= result.status === 401 || result.status === 403;
          continue;
        }

        const usage = buildGlmUsage(result.data);
        if (usage) return { usage, rejected: false };
        rejected ||= readBoolean(result.data.success) === false;
      }
    }
    return { usage: null, rejected };
  }

  static async fetchQwenUsage(): Promise<QwenUsage | null> {
    for (const region of QWEN_REGIONS) {
      const secToken = await this.fetchQwenSecToken(region);
      if (!secToken) continue;

      const usage = await qwenGatewayCall(region, QWEN_APIS.usage, {}, secToken);
      if (!usage) continue;

      const [subscription, quotaConfig] = await Promise.all([
        qwenGatewayCall(
          region,
          QWEN_APIS.subscription,
          { commodityCode: region.commodityCode },
          secToken,
        ),
        qwenGatewayCall(region, QWEN_APIS.quotaConfig, {}, secToken),
      ]);

      const built = buildQwenUsage(usage, subscription, quotaConfig);
      if (built) return built;
    }
    return null;
  }

  private static async fetchQwenSecToken(region: QwenRegion): Promise<string | null> {
    const result = await fetchJson(`${region.console}/tool/user/info.json`).catch(() => null);
    if (!result?.ok) return null;
    return readString(asJson(result.data.data)?.secToken);
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
