import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../shared/constants';
import { msg } from '../../shared/i18n';
import { readUsageState, requestUsageRefresh } from '../../shared/messaging';
import { readExtensionSettings } from '../../shared/settings';
import type { ExtensionSettings, UsageState } from '../../shared/types';

export interface UsageData {
  usage: UsageState;
  settings: ExtensionSettings | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useUsageData = (): UsageData => {
  const [usage, setUsage] = useState<UsageState>({});
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const hydrate = async (): Promise<void> => {
      const [state, preferences] = await Promise.all([readUsageState(), readExtensionSettings()]);

      if (!active) {
        return;
      }

      setUsage(state);
      setSettings(preferences);
      setRefreshing(true);
      try {
        const next = await requestUsageRefresh();
        if (active) setUsage(next);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : msg('refreshFailed'));
      } finally {
        if (active) {
          setRefreshing(false);
          setLoading(false);
        }
      }
    };

    void hydrate().catch((cause: unknown) => {
      if (active) {
        setError(cause instanceof Error ? cause.message : msg('refreshFailed'));
        setLoading(false);
      }
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName !== 'local') {
        return;
      }

      if (changes[STORAGE_KEYS.usageState]) {
        setUsage((changes[STORAGE_KEYS.usageState].newValue ?? {}) as UsageState);
      }

      if (changes[STORAGE_KEYS.extensionSettings]) {
        void readExtensionSettings().then((next) => {
          if (active) setSettings(next);
        });
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    setError(null);
    try {
      setUsage(await requestUsageRefresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : msg('refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    usage,
    settings,
    loading,
    refreshing,
    error,
    refresh,
  };
};
