import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createDefaultSettings,
  readExtensionSettings,
  saveExtensionSettings,
} from '../../shared/settings';
import type { ExtensionSettings } from '../../shared/types';

export type SaveState = 'loading' | 'saved' | 'error';
export type SettingsUpdater = (settings: ExtensionSettings) => ExtensionSettings;

interface UseOptionsSettingsResult {
  settings: ExtensionSettings | null;
  saveState: SaveState;
  updateSettings: (updater: SettingsUpdater) => void;
  resetSettings: () => void;
}

/** Owns local optimistic state and serializes writes to chrome.storage.local. */
export const useOptionsSettings = (): UseOptionsSettingsResult => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const settingsRef = useRef<ExtensionSettings | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;

    void readExtensionSettings()
      .then((next) => {
        if (!active) return;
        settingsRef.current = next;
        setSettings(next);
        setSaveState('saved');
      })
      .catch(() => {
        if (active) setSaveState('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const enqueueSave = useCallback((next: ExtensionSettings): void => {
    setSaveState('loading');
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await saveExtensionSettings(next);
        setSaveState('saved');
      })
      .catch(() => {
        setSaveState('error');
      });
  }, []);

  const updateSettings = useCallback(
    (updater: SettingsUpdater): void => {
      const current = settingsRef.current;
      if (!current) return;
      const next = updater(current);
      settingsRef.current = next;
      setSettings(next);
      enqueueSave(next);
    },
    [enqueueSave],
  );

  const resetSettings = useCallback((): void => {
    const next = createDefaultSettings();
    settingsRef.current = next;
    setSettings(next);
    enqueueSave(next);
  }, [enqueueSave]);

  return { settings, saveState, updateSettings, resetSettings };
};
