import type { ExtensionMessage } from '../shared/types';

const TOKEN_KEYS = ['z-ai-open-platform-token-production', 'z-ai-website-token'];

const PUBLISH_DELAYS_MS = [0, 1_000, 3_000, 10_000, 30_000];

let lastPublished: string | null = null;

const readToken = (): string | null => {
  for (const key of TOKEN_KEYS) {
    try {
      const value = window.localStorage.getItem(key)?.trim();
      if (value) return value;
    } catch {
      return null;
    }
  }
  return null;
};

const publishToken = (): void => {
  const token = readToken();
  if (!token || token === lastPublished) return;

  lastPublished = token;
  const message: ExtensionMessage = { type: 'SET_GLM_TOKEN', token };
  try {
    void chrome.runtime.sendMessage(message).catch(() => {
      lastPublished = null;
    });
  } catch {
    lastPublished = null;
  }
};

for (const delay of PUBLISH_DELAYS_MS) {
  window.setTimeout(publishToken, delay);
}

window.addEventListener('storage', publishToken);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') publishToken();
});
