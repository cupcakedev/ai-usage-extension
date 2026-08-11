export interface UiLocale {
  id: string;
  label: string;
}

export const UI_LOCALES: UiLocale[] = [
  { id: 'en', label: 'English' },
  { id: 'en_GB', label: 'English (UK)' },
  { id: 'am', label: 'አማርኛ' },
  { id: 'ar', label: 'العربية' },
  { id: 'bg', label: 'Български' },
  { id: 'bn', label: 'বাংলা' },
  { id: 'ca', label: 'Català' },
  { id: 'cs', label: 'Čeština' },
  { id: 'da', label: 'Dansk' },
  { id: 'de', label: 'Deutsch' },
  { id: 'el', label: 'Ελληνικά' },
  { id: 'es', label: 'Español' },
  { id: 'es_419', label: 'Español (Latinoamérica)' },
  { id: 'et', label: 'Eesti' },
  { id: 'fa', label: 'فارسی' },
  { id: 'fi', label: 'Suomi' },
  { id: 'fil', label: 'Filipino' },
  { id: 'fr', label: 'Français' },
  { id: 'gu', label: 'ગુજરાતી' },
  { id: 'he', label: 'עברית' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'hr', label: 'Hrvatski' },
  { id: 'hu', label: 'Magyar' },
  { id: 'id', label: 'Bahasa Indonesia' },
  { id: 'it', label: 'Italiano' },
  { id: 'ja', label: '日本語' },
  { id: 'kn', label: 'ಕನ್ನಡ' },
  { id: 'ko', label: '한국어' },
  { id: 'lt', label: 'Lietuvių' },
  { id: 'lv', label: 'Latviešu' },
  { id: 'ml', label: 'മലയാളം' },
  { id: 'mr', label: 'मराठी' },
  { id: 'ms', label: 'Bahasa Melayu' },
  { id: 'nl', label: 'Nederlands' },
  { id: 'no', label: 'Norsk' },
  { id: 'pl', label: 'Polski' },
  { id: 'pt_BR', label: 'Português (Brasil)' },
  { id: 'pt_PT', label: 'Português (Portugal)' },
  { id: 'ro', label: 'Română' },
  { id: 'ru', label: 'Русский' },
  { id: 'sk', label: 'Slovenčina' },
  { id: 'sl', label: 'Slovenščina' },
  { id: 'sr', label: 'Српски' },
  { id: 'sv', label: 'Svenska' },
  { id: 'sw', label: 'Kiswahili' },
  { id: 'ta', label: 'தமிழ்' },
  { id: 'te', label: 'తెలుగు' },
  { id: 'th', label: 'ไทย' },
  { id: 'tr', label: 'Türkçe' },
  { id: 'uk', label: 'Українська' },
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'zh_CN', label: '简体中文' },
  { id: 'zh_TW', label: '繁體中文' },
];

export const UI_LOCALE_IDS: string[] = UI_LOCALES.map((locale) => locale.id);

/** `auto` follows the browser UI language, exactly as Chrome does by default. */
export type LanguagePreference = 'auto' | string;

export const isSupportedLocale = (value: unknown): boolean =>
  typeof value === 'string' && UI_LOCALE_IDS.includes(value);

export const normalizeLanguage = (value: unknown): LanguagePreference =>
  isSupportedLocale(value) ? (value as string) : 'auto';

type RawMessages = Record<string, { message: string }>;

/** Reads a shipped `_locales` bundle so the UI can render a non-browser language. */
export const loadLocaleMessages = async (locale: string): Promise<Record<string, string>> => {
  const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Missing translations for "${locale}"`);
  }

  const raw = (await response.json()) as RawMessages;
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value.message]));
};
