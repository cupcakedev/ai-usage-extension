import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import claudeBrandAsset from '../assets/brands/claude-anthropic.jpg?inline';
import codexBrandAsset from '../assets/brands/codex-openai.jpg?inline';
import limitBrandAsset from '../../public/icons/limit-icon-2.0.png?inline';
import { STORAGE_KEYS } from '../shared/constants';
import { useNow } from '../shared/hooks/useNow';
import { msg } from '../shared/i18n';
import { requestUsageRefresh } from '../shared/messaging';
import type { UsageLimit, UsageState } from '../shared/types';
import { formatRelativeTime, formatReset, getUsageTone } from '../shared/utils';
import { getUsageWindows, type ProviderUsage } from '../shared/usageWindows';

const HOST_ID = 'ai-usage-claude-overlay-host';

const nextReset = (usage: ProviderUsage, now: number): string => {
  const upcoming = getUsageWindows(usage)
    .map((window) => window.limit.resetsAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value) && value > now)
    .sort((a, b) => a - b)[0];

  return upcoming ? formatReset(new Date(upcoming).toISOString(), now) : msg('timeUnknown');
};

interface OverlayMetricProps {
  label: string;
  limit: UsageLimit;
  now: number;
}

const OverlayMetric: React.FC<OverlayMetricProps> = ({ label, limit, now }) => {
  const percent = useMemo(() => Math.round(limit.percentage), [limit.percentage]);
  const percentLabel = msg('percentUsed', String(percent));
  const hasCount =
    typeof limit.used === 'number' && typeof limit.limit === 'number' && limit.limit > 0;

  return (
    <div className="aiu-group">
      <div className="aiu-row">
        <span className="aiu-label">{label}</span>
        <span className="aiu-value">{percentLabel}</span>
      </div>
      <div
        className={`aiu-meter aiu-meter--${getUsageTone(percent)}`}
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuetext={percentLabel}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="aiu-meter__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="aiu-meta">
        {hasCount && (
          <>
            <span>
              {limit.used} / {limit.limit}
            </span>
            {' · '}
          </>
        )}
        {msg('resetsLabel', formatReset(limit.resetsAt, now))}
      </div>
    </div>
  );
};

const isClaude = window.location.hostname.includes('claude.ai');
const enabledKey = isClaude ? STORAGE_KEYS.claudeOverlayEnabled : STORAGE_KEYS.codexOverlayEnabled;
const collapsedKey = isClaude
  ? STORAGE_KEYS.claudeOverlayCollapsed
  : STORAGE_KEYS.codexOverlayCollapsed;
const usageField = isClaude ? 'claude' : 'codex';
const brandAsset = isClaude ? claudeBrandAsset : codexBrandAsset;
const title = isClaude ? 'Claude' : 'Codex';
const inputSelector = isClaude
  ? '#chat-input-file-upload-onpage, #chat-input-file-upload-epitaxy, [data-surface="prompt"], [data-testid="chat-input"]'
  : '#prompt-textarea, [data-testid="composer-footer-actions"], [data-testid="chat-input"]';

const UsageOverlay: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [usage, setUsage] = useState<ProviderUsage | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const now = useNow(60_000);

  useEffect(() => {
    const checkElement = (): void => {
      setHasInput(document.querySelector(inputSelector) !== null);
    };

    checkElement();

    const observer = new MutationObserver(checkElement);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const hydrate = async (): Promise<void> => {
      const snapshot = await chrome.storage.local.get([
        STORAGE_KEYS.usageState,
        enabledKey,
        collapsedKey,
      ]);

      if (!active) {
        return;
      }

      const usageState = (snapshot[STORAGE_KEYS.usageState] ?? {}) as UsageState;
      setUsage(usageState[usageField] ?? null);
      setEnabled(snapshot[enabledKey] !== false);
      setCollapsed(snapshot[collapsedKey] !== false);
      setIsLoading(false);
    };

    void hydrate();

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName !== 'local') {
        return;
      }

      if (changes[STORAGE_KEYS.usageState]) {
        const next = (changes[STORAGE_KEYS.usageState].newValue ?? {}) as UsageState;
        setUsage(next[usageField] ?? null);
      }

      if (changes[enabledKey]) {
        setEnabled(changes[enabledKey].newValue !== false);
      }

      if (changes[collapsedKey]) {
        setCollapsed(changes[collapsedKey].newValue !== false);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const runRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await requestUsageRefresh();
    } catch (error) {
      console.debug('Failed to refresh usage limits from overlay', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void requestUsageRefresh().catch((error) => {
      console.debug('Failed to refresh usage limits from overlay', error);
    });
  }, []);

  const toggleCollapsed = useCallback((): void => {
    setCollapsed((prev) => {
      const next = !prev;
      void chrome.storage.local.set({ [collapsedKey]: next });
      return next;
    });
  }, []);

  if (!enabled || !hasInput) {
    return null;
  }

  return (
    <div className="aiu-root">
      <div className={`aiu-wrap ${collapsed ? 'aiu-wrap--collapsed' : ''}`}>
        <button
          type="button"
          className="aiu-tab"
          onClick={toggleCollapsed}
          title={collapsed ? msg('showLimits') : msg('hideLimits')}
          aria-label={collapsed ? msg('showLimits') : msg('hideLimits')}
          aria-expanded={!collapsed}
        >
          <img className="aiu-tab-icon" src={limitBrandAsset} alt="" />
          <span className="aiu-tab-label">{msg('limitsTab')}</span>
        </button>

        <div className="aiu-card">
          <div className="aiu-header">
            <img className="aiu-brand" src={brandAsset} alt="" />
            <div className="aiu-heading">
              <p className="aiu-title">{title}</p>
              <p className="aiu-subtitle">
                {isRefreshing
                  ? msg('refreshing')
                  : usage
                    ? `${msg('updated', formatRelativeTime(usage.lastUpdated, now))} · ${msg('nextResetLabel', nextReset(usage, now))}`
                    : msg('waitingForSnapshot')}
              </p>
            </div>
            <button
              type="button"
              className={`aiu-btn-refresh ${isRefreshing ? 'aiu-btn-refresh--spin' : ''}`}
              onClick={runRefresh}
              disabled={isRefreshing}
              title={msg('refreshUsageLimits')}
              aria-label={msg('refreshUsageLimits')}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="aiu-icon-refresh"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <polyline points="21 3 21 8 16 8" />
              </svg>
            </button>
          </div>

          {usage ? (
            <>
              {getUsageWindows(usage).map((window) => (
                <OverlayMetric
                  key={window.id}
                  label={window.label}
                  limit={window.limit}
                  now={now}
                />
              ))}
            </>
          ) : isLoading || isRefreshing ? (
            <div className="aiu-loader" aria-hidden="true">
              <div className="aiu-loader__line aiu-loader__line--w80" />
              <div className="aiu-loader__bar" />
              <div className="aiu-loader__line aiu-loader__line--w60" />
            </div>
          ) : (
            <div className="aiu-empty">{msg('emptyOverlay')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

let hostRef: HTMLDivElement | null = null;
let rootRef: ReturnType<typeof createRoot> | null = null;

const attachHost = (): void => {
  const target = document.documentElement;
  if (!target) {
    setTimeout(attachHost, 50);
    return;
  }

  if (hostRef && hostRef.isConnected) {
    return;
  }

  const existing = document.getElementById(HOST_ID) as HTMLDivElement | null;
  if (existing) {
    hostRef = existing;
    if (!rootRef) {
      rootRef = createRoot(existing);
      rootRef.render(<UsageOverlay />);
    }
    return;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  target.appendChild(host);
  hostRef = host;

  if (rootRef) {
    rootRef.unmount();
  }
  rootRef = createRoot(host);
  rootRef.render(<UsageOverlay />);
};

const mount = (): void => {
  attachHost();

  const watcher = new MutationObserver(() => {
    if (!hostRef || !hostRef.isConnected) {
      attachHost();
    }
  });
  watcher.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
