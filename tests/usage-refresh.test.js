import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript, deferred, flush, event } from './helpers/load-typescript.js';

const sample = (percentage) => ({
  session: { percentage, resetsAt: null },
  weekly: { percentage: 0, resetsAt: null },
  models: [],
  status: 'ok',
  lastUpdated: 123,
});
const providers = ['Claude', 'Codex', 'MiniMax', 'Kimi', 'Cursor', 'MiMo', 'Qwen'];

function serviceHarness(initial = {}, globals = {}) {
  let stored = structuredClone(initial);
  const writes = [];
  const chrome = {
    storage: {
      local: {
        get: async () => ({ ai_usage_state: structuredClone(stored) }),
        set: async (value) => {
          stored = structuredClone(value.ai_usage_state);
          writes.push(stored);
        },
      },
    },
  };
  const { UsageService } = loadTypeScript('src/background/services/UsageService.ts', {
    globals: { chrome, ...globals },
  });
  return { UsageService, writes, read: () => stored, chrome };
}

function stubProviders(service) {
  for (const name of providers) service[`fetch${name}Usage`] = async () => null;
  service.fetchGlmUsage = async () => ({ usage: null, rejected: false });
}

describe('provider refresh', () => {
  it('publishes every ready provider while another is pending, without losing cached data', async () => {
    const cached = sample(12);
    const { UsageService, read } = serviceHarness({ kimi: cached });
    stubProviders(UsageService);
    const slow = deferred();
    UsageService.fetchQwenUsage = () => slow.promise;
    for (const name of providers.filter((name) => !['Qwen', 'Kimi'].includes(name))) {
      UsageService[`fetch${name}Usage`] = async () => sample(34);
    }
    UsageService.fetchGlmUsage = async () => ({ usage: sample(34), rejected: false });
    UsageService.fetchKimiUsage = async () => {
      throw new Error('offline');
    };
    let complete = false;
    const refresh = UsageService.refreshAllUsage().then((state) => {
      complete = true;
      return state;
    });
    await flush();
    assert.equal(complete, false);
    for (const id of ['claude', 'codex', 'minimax', 'cursor', 'mimo', 'glm']) {
      assert.equal(read()[id].session.percentage, 34, id);
    }
    assert.deepEqual(read().kimi, cached);
    slow.resolve(sample(56));
    const result = await refresh;
    assert.deepEqual(structuredClone(result), read());
    assert.equal(read().qwen.session.percentage, 56);
  });

  it('serializes storage writes even when providers finish together', async () => {
    const { UsageService, chrome, read } = serviceHarness();
    stubProviders(UsageService);
    UsageService.fetchClaudeUsage = async () => sample(10);
    UsageService.fetchMiMoUsage = async () => sample(20);
    const firstWrite = deferred();
    const save = chrome.storage.local.set;
    let concurrent = 0;
    let peak = 0;
    chrome.storage.local.set = async (value) => {
      concurrent++;
      peak = Math.max(peak, concurrent);
      const snapshot = structuredClone(value);
      await firstWrite.promise;
      await save(snapshot);
      concurrent--;
    };
    const refresh = UsageService.refreshAllUsage();
    await flush();
    assert.equal(peak, 1);
    firstWrite.resolve();
    await refresh;
    assert.equal(peak, 1);
    assert.equal(read().claude.session.percentage, 10);
    assert.equal(read().mimo.session.percentage, 20);
  });

  it('waits for pending providers after a storage error and allows later writes', async () => {
    const { UsageService, chrome, read } = serviceHarness();
    stubProviders(UsageService);
    const slow = deferred();
    UsageService.fetchQwenUsage = () => slow.promise;
    UsageService.fetchMiMoUsage = async () => sample(15);
    const save = chrome.storage.local.set;
    let failed = false;
    chrome.storage.local.set = async (value) => {
      if (!failed) {
        failed = true;
        throw new Error('storage unavailable');
      }
      return save(value);
    };
    let settled = false;
    const refresh = UsageService.refreshAllUsage().finally(() => {
      settled = true;
    });
    const rejection = assert.rejects(refresh, /storage unavailable/);
    await flush();
    assert.equal(settled, false);
    slow.resolve(sample(25));
    await rejection;
    assert.equal(read().qwen.session.percentage, 25);
    assert.equal(read().mimo.session.percentage, 15);
  });

  it('updates GLM authentication issues without discarding other providers', async () => {
    const { UsageService, read } = serviceHarness({ mimo: sample(5), issues: { kimi: 'auth' } });
    stubProviders(UsageService);
    UsageService.fetchGlmUsage = async () => ({ usage: null, rejected: true });
    await UsageService.refreshAllUsage();
    assert.deepEqual(read().issues, { kimi: 'auth', glm: 'auth' });
    UsageService.fetchGlmUsage = async () => ({ usage: sample(6), rejected: false });
    await UsageService.refreshAllUsage();
    assert.deepEqual(read().issues, { kimi: 'auth' });
    assert.equal(read().mimo.session.percentage, 5);
    assert.equal(read().glm.session.percentage, 6);
  });

  it('bounds both JSON and session requests and recovers on the next attempt', async () => {
    const signals = [];
    const controllers = [];
    const { UsageService } = serviceHarness(
      {},
      {
        AbortSignal: {
          timeout: (ms) => {
            assert.equal(ms, 10_000);
            const controller = new AbortController();
            controllers.push(controller);
            return controller.signal;
          },
        },
        fetch: async (_url, init) => {
          signals.push(init.signal);
          assert.equal(init.credentials, 'include');
          return new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => reject(new Error('timeout')));
          });
        },
      },
    );
    const cursor = assert.rejects(UsageService.fetchCursorUsage(), /timeout/);
    const codex = assert.rejects(UsageService.fetchCodexUsage(), /timeout/);
    assert.equal(signals.length, 2);
    controllers.forEach((controller) => controller.abort());
    await Promise.all([cursor, codex]);
    const retry = assert.rejects(UsageService.fetchCursorUsage(), /timeout/);
    assert.equal(signals[2].aborted, false);
    controllers[2].abort();
    await retry;
  });

  it('fetches fresh usage and session credentials even when HTTP responses were cached', async () => {
    let current = 12;
    const cached = new Map();
    const tokens = [];
    const { UsageService } = serviceHarness(
      {},
      {
        fetch: async (url, init) => {
          const isSession = url.endsWith('/api/auth/session');
          if (!isSession) tokens.push(init.headers.Authorization);
          const fresh = isSession
            ? { accessToken: `token-${current}` }
            : {
                rate_limit: {
                  primary_window: { used_percent: current, limit_window_seconds: 18000 },
                },
              };
          const payload = init.cache === 'no-store' ? fresh : (cached.get(url) ?? fresh);
          cached.set(url, payload);
          return { ok: true, json: async () => payload };
        },
      },
    );

    assert.equal((await UsageService.fetchCodexUsage()).session.percentage, 12);
    current = 63;
    assert.equal((await UsageService.fetchCodexUsage()).session.percentage, 63);
    assert.deepEqual(tokens, ['Bearer token-12', 'Bearer token-63']);
  });
});

function workerHarness(alarm) {
  const calls = { refresh: 0, create: [], badges: [] };
  const pending = deferred();
  const chrome = {
    runtime: {
      onInstalled: event(),
      onStartup: event(),
      onMessage: event(),
      getURL: (path) => path,
    },
    alarms: {
      onAlarm: event(),
      get: async () => alarm,
      create: async (...args) => calls.create.push(args),
    },
    storage: { onChanged: event() },
    tabs: { create: async () => {} },
  };
  loadTypeScript('src/background/index.ts', {
    globals: { chrome },
    mocks: {
      '../shared/language': { applyStoredLanguage: async () => {} },
      '../shared/locales': { loadLocaleMessages: async () => ({}) },
      '../shared/settings': { readExtensionSettings: async () => ({ language: 'auto' }) },
      './badge': { updateBadge: async (state) => calls.badges.push(state) },
      './services/analytics': { track: async () => true },
      './services/UsageService': {
        UsageService: {
          getUsageState: async () => ({}),
          refreshAllUsage: () => {
            calls.refresh++;
            return pending.promise;
          },
        },
      },
    },
  });
  return { chrome, calls, pending };
}

describe('worker startup and refresh scheduling', () => {
  it('refreshes and restores a missing alarm without install/startup events (re-enable)', async () => {
    const { calls, pending } = workerHarness(undefined);
    await flush();
    assert.equal(calls.refresh, 1);
    assert.equal(calls.create.length, 1);
    assert.equal(calls.create[0][0], 'refreshUsage');
    assert.equal(calls.create[0][1].periodInMinutes, 5);
    pending.resolve({});
    await flush();
  });

  it('preserves an existing alarm and shares a running refresh across all triggers', async () => {
    const { chrome, calls, pending } = workerHarness({ name: 'refreshUsage', periodInMinutes: 5 });
    await flush();
    chrome.runtime.onStartup.emit();
    chrome.runtime.onInstalled.emit({ reason: 'update' });
    chrome.alarms.onAlarm.emit({ name: 'refreshUsage' });
    const response = deferred();
    chrome.runtime.onMessage.emit({ type: 'REFRESH_USAGE' }, {}, response.resolve);
    assert.equal(calls.refresh, 1);
    assert.equal(calls.create.length, 0);
    pending.resolve({ mimo: sample(7) });
    assert.equal((await response.promise).data.mimo.session.percentage, 7);
  });

  it('updates the badge from partial snapshots before the refresh completes', async () => {
    const { chrome, calls, pending } = workerHarness({ name: 'refreshUsage', periodInMinutes: 5 });
    await flush();
    chrome.storage.onChanged.emit({ ai_usage_state: { newValue: { mimo: sample(8) } } }, 'local');
    await flush();
    assert.equal(calls.badges.at(-1).mimo.session.percentage, 8);
    pending.resolve({});
    await flush();
  });

  for (const periodInMinutes of [undefined, 180]) {
    it(`repairs an alarm with period ${periodInMinutes}`, async () => {
      const { calls, pending } = workerHarness({ name: 'refreshUsage', periodInMinutes });
      await flush();
      assert.equal(calls.create.length, 1);
      assert.equal(calls.create[0][0], 'refreshUsage');
      assert.equal(calls.create[0][1].periodInMinutes, 5);
      pending.resolve({});
      await flush();
    });
  }

  it('allows the next alarm to retry after a failed refresh', async () => {
    const { chrome, calls, pending } = workerHarness({ name: 'refreshUsage', periodInMinutes: 5 });
    await flush();
    pending.reject(new Error('offline'));
    await flush();
    chrome.alarms.onAlarm.emit({ name: 'unrelated' });
    assert.equal(calls.refresh, 1);
    chrome.alarms.onAlarm.emit({ name: 'refreshUsage' });
    assert.equal(calls.refresh, 2);
    await flush();
  });
});

function popupHarness(initial = {}) {
  const states = [];
  let cleanup;
  let refreshCalls = 0;
  const pending = deferred();
  const changes = event();
  const { useUsageData } = loadTypeScript('src/sidepanel/hooks/useUsageData.ts', {
    globals: { chrome: { storage: { onChanged: changes } } },
    mocks: {
      react: {
        useState: (value) => {
          const index = states.length;
          states.push(value);
          return [
            value,
            (next) => {
              states[index] = next;
            },
          ];
        },
        useEffect: (effect) => {
          cleanup = effect();
        },
        useCallback: (callback) => callback,
      },
      '../../shared/i18n': { msg: (key) => key },
      '../../shared/settings': { readExtensionSettings: async () => ({ providers: {} }) },
      '../../shared/messaging': {
        readUsageState: async () => initial,
        requestUsageRefresh: () => {
          refreshCalls++;
          return pending.promise;
        },
      },
    },
  });
  useUsageData();
  return { states, pending, changes, cleanup: () => cleanup(), calls: () => refreshCalls };
}

describe('popup hydration', () => {
  it('automatically refreshes, shows cache immediately, and receives partial snapshots', async () => {
    const cache = { mimo: sample(1) };
    const { states, pending, changes, calls, cleanup } = popupHarness(cache);
    await flush();
    assert.equal(calls(), 1);
    assert.equal(states[0], cache);
    assert.equal(states[2], true); // initial fetch still loading
    assert.equal(states[3], true); // refresh button spinning
    const partial = { ...cache, cursor: sample(2) };
    changes.emit({ ai_usage_state: { newValue: partial } }, 'local');
    assert.equal(states[0], partial);
    pending.resolve(partial);
    await flush();
    assert.equal(states[2], false);
    assert.equal(states[3], false);
    cleanup();
  });

  it('leaves loading and retains cached data when the refresh fails', async () => {
    const cache = { mimo: sample(1) };
    const { states, pending, cleanup } = popupHarness(cache);
    await flush();
    pending.reject('offline');
    await flush();
    assert.equal(states[0], cache);
    assert.equal(states[2], false);
    assert.equal(states[3], false);
    assert.equal(states[4], 'refreshFailed');
    cleanup();
  });

  it('ignores responses after the popup closes', async () => {
    const { states, pending, cleanup } = popupHarness();
    await flush();
    cleanup();
    const before = [...states];
    pending.resolve({ mimo: sample(9) });
    await flush();
    assert.deepEqual(states, before);
  });
});
