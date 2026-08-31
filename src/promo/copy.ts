import { DEFAULT_LOCALE, LOCALE } from './locale';

export interface PromoCopy {
  panelEyebrow: string;
  shots: Record<'popup' | 'overlay' | 'providers' | 'badge' | 'privacy', ShotCopy>;
  marquee: { sub: [string, string] };
  tile: { sub: string };
  highlights: {
    title: string;
    items: Array<{ title: string; body: string }>;
  };
}

interface ShotCopy {
  eyebrow: string;
  sub: [string, string];
}

export const BRAND = 'AI Usage Tracker';

export const HEADLINE: [string, string] = ['AI Usage', 'Tracker'];

export const PROVIDER_HOSTS: Record<string, string> = {
  claude: 'claude.ai',
  codex: 'chatgpt.com',
  minimax: 'platform.minimax.io',
  kimi: 'kimi.com',
  cursor: 'cursor.com',
  mimo: 'platform.xiaomimimo.com',
  glm: 'z.ai',
};

const TRANSLATIONS = import.meta.glob<PromoCopy>('./copy/*.json', {
  eager: true,
  import: 'default',
});

export const COPY: PromoCopy =
  TRANSLATIONS[`./copy/${LOCALE}.json`] ?? TRANSLATIONS[`./copy/${DEFAULT_LOCALE}.json`];
