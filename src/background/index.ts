import {
  REFRESH_ALARM,
  REFRESH_INTERVAL_MINUTES,
  STORAGE_KEYS,
  UNINSTALL_FORM_URL,
} from '../shared/constants';
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
import { track } from './services/analytics';
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

const refreshAfterInFlight = async (): Promise<void> => {
  await refreshInFlight?.catch(() => undefined);
  await refreshUsage();
};

if (UNINSTALL_FORM_URL) {
  void Promise.resolve(chrome.runtime.setUninstallURL(UNINSTALL_FORM_URL)).catch(() => undefined);
}

const languageReady = applyStoredLanguage().catch(() => undefined);

void languageReady
  .then(() => UsageService.getUsageState())
  .then(async (state) => {
    if (hasStartedRefresh) return;
    await queueBadgeUpdate(state).catch(() => undefined);
    if (!hasStartedRefresh) await refreshUsage();
  })
  .catch(() => undefined);

// Alarms can disappear across browser restarts or extension disable/enable.
// Check on every worker start without postponing an existing alarm.
void chrome.alarms
  .get(REFRESH_ALARM)
  .then(async (alarm) => {
    if (!alarm || alarm.periodInMinutes !== REFRESH_INTERVAL_MINUTES) {
      await chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_INTERVAL_MINUTES });
    }
  })
  .catch(() => undefined);

chrome.runtime.onInstalled.addListener((details) => {
  void refreshUsage().catch(() => undefined);

  if (details.reason === 'install') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('src/welcome.html') });
  }
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
  if (areaName === 'local' && changes[STORAGE_KEYS.usageState]) {
    void queueBadgeUpdate((changes[STORAGE_KEYS.usageState].newValue ?? {}) as UsageState).catch(
      () => undefined,
    );
  }

  if (areaName === 'local' && changes[STORAGE_KEYS.glmApiKey]) {
    void refreshAfterInFlight().catch(() => undefined);
  }

  if (areaName === 'local' && changes[STORAGE_KEYS.extensionSettings]) {
    void applyStoredLanguage()
      .catch(() => undefined)
      .then(() => UsageService.getUsageState())
      .then(queueBadgeUpdate)
      .catch(() => undefined);
  }
});

const storeGlmToken = async (token: string): Promise<void> => {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.glmToken);
  if (stored[STORAGE_KEYS.glmToken] === token) return;

  await chrome.storage.local.set({ [STORAGE_KEYS.glmToken]: token });
  await refreshAfterInFlight();
};

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

    if (message?.type === 'TRACK') {
      track(message.event, message.properties, message.context)
        .then((sent) =>
          sent
            ? sendResponse({ success: true, data: null })
            : sendResponse({ success: false, error: 'analytics_unavailable' }),
        )
        .catch(() => sendResponse({ success: false, error: 'analytics_unavailable' }));

      return true;
    }

    if (message?.type === 'SET_GLM_TOKEN') {
      const token = typeof message.token === 'string' ? message.token.trim() : '';
      if (token) void storeGlmToken(token).catch(() => undefined);
      sendResponse({ success: true, data: null });

      return undefined;
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
