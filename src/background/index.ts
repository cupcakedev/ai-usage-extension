import { REFRESH_ALARM, REFRESH_INTERVAL_MINUTES, STORAGE_KEYS } from '../shared/constants';
import { applyStoredLanguage } from '../shared/language';
import { loadLocaleMessages } from '../shared/locales';
import { readExtensionSettings } from '../shared/settings';
import type {
  ExtensionMessage,
  LocaleMessagesResponse,
  RefreshUsageResponse,
  UsageState,
} from '../shared/types';
import { updateBadge } from './badge';
import { UsageService } from './services/UsageService';

let hasStartedRefresh = false;
let refreshInFlight: Promise<UsageState> | null = null;
let badgeUpdateQueue: Promise<void> = Promise.resolve();

const queueBadgeUpdate = (state: UsageState): Promise<void> => {
  badgeUpdateQueue = badgeUpdateQueue.catch(() => undefined).then(() => updateBadge(state));
  return badgeUpdateQueue;
};

const refreshUsage = (): Promise<UsageState> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  hasStartedRefresh = true;
  refreshInFlight = UsageService.refreshAllUsage()
    .then(async (state) => {
      await queueBadgeUpdate(state);
      return state;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

const languageReady = applyStoredLanguage().catch(() => undefined);

void languageReady
  .then(() => UsageService.getUsageState())
  .then((state) => (hasStartedRefresh ? undefined : queueBadgeUpdate(state)))
  .catch(() => undefined);

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_INTERVAL_MINUTES });
  void refreshUsage().catch(() => undefined);
});

chrome.runtime.onStartup.addListener(() => {
  void refreshUsage().catch(() => undefined);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REFRESH_ALARM) {
    void refreshUsage().catch(() => undefined);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEYS.extensionSettings]) {
    void applyStoredLanguage()
      .catch(() => undefined)
      .then(() => UsageService.getUsageState())
      .then(queueBadgeUpdate)
      .catch(() => undefined);
  }
});

const collectLocaleMessages = async (): Promise<Record<string, string> | null> => {
  const { language } = await readExtensionSettings();
  return language === 'auto' ? null : loadLocaleMessages(language);
};

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: RefreshUsageResponse | LocaleMessagesResponse) => void,
  ) => {
    if (message?.type === 'GET_LOCALE_MESSAGES') {
      collectLocaleMessages()
        .then((data) => sendResponse({ success: true, data }))
        .catch(() => sendResponse({ success: true, data: null }));

      return true;
    }

    if (message?.type !== 'REFRESH_USAGE') {
      return undefined;
    }

    refreshUsage()
      .then((state) => sendResponse({ success: true, data: state }))
      .catch((error: unknown) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'refresh_failed',
        });
      });

    return true;
  },
);
