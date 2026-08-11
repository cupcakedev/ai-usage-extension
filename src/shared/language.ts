import { STORAGE_KEYS } from './constants';
import { setLocaleMessages } from './i18n';
import { loadLocaleMessages, normalizeLanguage, type LanguagePreference } from './locales';
import { readExtensionSettings } from './settings';

/** Extension pages and the service worker can read `_locales` directly. */
export const applyLanguage = async (language: LanguagePreference): Promise<void> => {
  if (language === 'auto') {
    setLocaleMessages(null);
    return;
  }

  try {
    setLocaleMessages(await loadLocaleMessages(language));
  } catch {
    setLocaleMessages(null);
  }
};

/**
 * Applies the stored language and resolves once the UI can render. Entry points
 * must await this before importing anything that calls `msg()` at module scope.
 */
export const applyStoredLanguage = async (): Promise<LanguagePreference> => {
  const { language } = await readExtensionSettings();
  await applyLanguage(language);
  return language;
};

/** Calls back whenever the language preference itself changes. */
export const watchLanguage = (onChange: (language: LanguagePreference) => void): (() => void) => {
  if (!globalThis.chrome?.storage?.onChanged) {
    return () => undefined;
  }

  const languageOf = (value: unknown): LanguagePreference =>
    normalizeLanguage((value as { language?: unknown } | undefined)?.language);

  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void => {
    const change = changes[STORAGE_KEYS.extensionSettings];
    if (areaName !== 'local' || !change) {
      return;
    }

    const next = languageOf(change.newValue);
    if (next === languageOf(change.oldValue)) {
      return;
    }

    onChange(next);
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};
