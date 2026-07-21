import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCodexUsage } from '../src/background/services/UsageService';
import type { CodexUsage } from '../src/shared/types';
import { getUsageWindows } from '../src/shared/usageWindows';

const RESET_AT = 1_800_000_000;

const rateWindow = (usedPercent: number, durationSeconds?: number) => ({
  used_percent: usedPercent,
  ...(durationSeconds === undefined ? {} : { limit_window_seconds: durationSeconds }),
  reset_at: RESET_AT,
});

describe('Codex usage windows', () => {
  it('renders a weekly-only primary window as weekly and does not invent a session limit', () => {
    const usage = buildCodexUsage({
      rate_limit: {
        primary_window: rateWindow(76, 7 * 24 * 60 * 60),
        secondary_window: null,
      },
      rate_limit_reset_credits: { available_count: 1 },
    });

    assert.ok(usage);
    assert.deepEqual(
      usage.windows.map(({ label, limit }) => ({
        label,
        percentage: limit.percentage,
        resetsAt: limit.resetsAt,
      })),
      [
        {
          label: 'Weekly · 7d',
          percentage: 76,
          resetsAt: new Date(RESET_AT * 1000).toISOString(),
        },
      ],
    );
    assert.equal(usage.availableResets, 1);
    assert.equal(usage.session, undefined);
    assert.equal(usage.weekly, undefined);
  });

  it('classifies and orders windows by duration even when the server positions are reversed', () => {
    const usage = buildCodexUsage({
      rate_limit: {
        primary_window: rateWindow(76, 7 * 24 * 60 * 60),
        secondary_window: rateWindow(100, 5 * 60 * 60),
      },
    });

    assert.ok(usage);
    assert.deepEqual(
      usage.windows.map(({ label, limit }) => [label, limit.percentage]),
      [
        ['Session · 5h', 100],
        ['Weekly · 7d', 76],
      ],
    );
    assert.equal(usage.status, 'critical');
  });

  it('supports generalized daily, monthly, and annual periods', () => {
    const usage = buildCodexUsage({
      rate_limit: {
        primary_window: rateWindow(30, 30 * 24 * 60 * 60),
        secondary_window: rateWindow(20, 24 * 60 * 60),
      },
      additional_rate_limits: [
        {
          name: 'annual_allowance',
          rate_limit: {
            primary_window: rateWindow(10, 365 * 24 * 60 * 60),
          },
        },
      ],
    });

    assert.ok(usage);
    assert.deepEqual(
      usage.windows.map(({ label }) => label),
      ['Daily · 1d', 'Monthly · 30d'],
    );
    assert.deepEqual(
      usage.models.map(({ label }) => label),
      ['Annual Allowance · 1y'],
    );
  });

  it('uses a generic label for missing or unsupported durations', () => {
    const usage = buildCodexUsage({
      rate_limit: {
        primary_window: rateWindow(25),
        secondary_window: rateWindow(40, 2 * 60 * 60),
      },
    });

    assert.ok(usage);
    assert.deepEqual(
      usage.windows.map(({ label, limit }) => [label, limit.percentage]),
      [
        ['Usage limit', 25],
        ['Secondary usage limit', 40],
      ],
    );
  });

  it('keeps pre-upgrade stored Codex snapshots readable until refresh', () => {
    const legacy = {
      session: { percentage: 15, resetsAt: null },
      weekly: { percentage: 65, resetsAt: null },
      models: [],
      availableResets: null,
      status: 'ok',
      lastUpdated: 0,
    } as unknown as CodexUsage;

    assert.deepEqual(
      getUsageWindows(legacy).map(({ label, limit }) => [label, limit.percentage]),
      [
        ['Session · 5h', 15],
        ['Weekly · 7d', 65],
      ],
    );
  });
});
