import { STORAGE_KEYS } from './constants';
import type {
  ExtensionMessage,
  LocaleMessagesResponse,
  RefreshUsageResponse,
  UsageState,
} from './types';

/**
 * Read the last persisted usage snapshot from `chrome.storage.local`.
 * Safe to call from any extension context.
 */
export const readUsageState = async (): Promise<UsageState> => {
  const data = await chrome.storage.local.get(STORAGE_KEYS.usageState);
  return (data[STORAGE_KEYS.usageState] ?? {}) as UsageState;
};

/**
 * Ask the background worker to fetch fresh usage for every provider.
 * Resolves with the new snapshot or throws with a descriptive error.
 */
export const requestUsageRefresh = async (): Promise<UsageState> => {
  const message: ExtensionMessage = { type: 'REFRESH_USAGE' };
  const response = (await chrome.runtime.sendMessage(message)) as RefreshUsageResponse | undefined;

  if (!response) {
    throw new Error('No response from the background worker');
  }

  if (!response.success) {
    throw new Error(response.error);
  }

  return response.data;
};

/**
 * Ask the background worker for the active translation bundle. Content scripts
 * cannot read `_locales` themselves, so the worker fetches it for them.
 * Resolves with `null` when the UI should follow the browser language.
 */
export const requestLocaleMessages = async (): Promise<Record<string, string> | null> => {
  const message: ExtensionMessage = { type: 'GET_LOCALE_MESSAGES' };
  const response = (await chrome.runtime.sendMessage(message)) as
    | LocaleMessagesResponse
    | undefined;

  return response?.success ? response.data : null;
};
