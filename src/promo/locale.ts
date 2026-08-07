export const LOCALES = ['en', 'de', 'es', 'fr', 'hi', 'it', 'ja', 'pt_BR', 'ru', 'zh_CN'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

const requested = new URLSearchParams(window.location.search).get('locale');

export const LOCALE: Locale = (LOCALES as readonly string[]).includes(requested ?? '')
  ? (requested as Locale)
  : DEFAULT_LOCALE;
