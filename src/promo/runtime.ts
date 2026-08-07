import type { Locale } from './locale';

type LocaleMessages = Record<string, { message: string }>;

export const loadMessages = async (locale: Locale): Promise<LocaleMessages> => {
  const response = await fetch(`/_locales/${locale}/messages.json`);
  if (!response.ok) {
    throw new Error(`Missing translations for "${locale}"`);
  }
  return (await response.json()) as LocaleMessages;
};

export const installRuntimeStub = (messages: LocaleMessages): void => {
  (globalThis as { chrome?: unknown }).chrome = {
    i18n: {
      getMessage: (name: string, substitutions?: string | string[]): string => {
        const template = messages[name]?.message;
        if (!template) return '';

        const values = Array.isArray(substitutions)
          ? substitutions
          : substitutions
            ? [substitutions]
            : [];

        return values.reduce(
          (text, value, index) => text.split(`$${index + 1}`).join(value),
          template,
        );
      },
    },
    runtime: {
      getURL: (path: string) => `/${path}`,
    },
  };
};
