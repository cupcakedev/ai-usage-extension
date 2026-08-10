export const LOCALES = [
  'en',
  'am',
  'ar',
  'bg',
  'bn',
  'ca',
  'cs',
  'da',
  'de',
  'el',
  'en_GB',
  'es',
  'es_419',
  'et',
  'fa',
  'fi',
  'fil',
  'fr',
  'gu',
  'he',
  'hi',
  'hr',
  'hu',
  'id',
  'it',
  'ja',
  'kn',
  'ko',
  'lt',
  'lv',
  'ml',
  'mr',
  'ms',
  'nl',
  'no',
  'pl',
  'pt_BR',
  'pt_PT',
  'ro',
  'ru',
  'sk',
  'sl',
  'sr',
  'sv',
  'sw',
  'ta',
  'te',
  'th',
  'tr',
  'uk',
  'vi',
  'zh_CN',
  'zh_TW',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const RTL_LOCALES = new Set<Locale>(['ar', 'fa', 'he']);

const requested = new URLSearchParams(window.location.search).get('locale');

export const LOCALE: Locale = (LOCALES as readonly string[]).includes(requested ?? '')
  ? (requested as Locale)
  : DEFAULT_LOCALE;

export const DIR: 'rtl' | 'ltr' = RTL_LOCALES.has(LOCALE) ? 'rtl' : 'ltr';
