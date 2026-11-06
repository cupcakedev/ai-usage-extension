import type { ProviderId } from './types';

export const PROVIDER_ORIGINS: Partial<Record<ProviderId, string[]>> = {
  opencode: ['https://opencode.ai/*'],
};

export const hasProviderAccess = async (provider: ProviderId): Promise<boolean> => {
  const origins = PROVIDER_ORIGINS[provider];
  if (!origins) return true;
  return chrome.permissions.contains({ origins }).catch(() => false);
};

export const requestProviderAccess = async (provider: ProviderId): Promise<boolean> => {
  const origins = PROVIDER_ORIGINS[provider];
  if (!origins) return true;
  return chrome.permissions.request({ origins }).catch(() => false);
};
