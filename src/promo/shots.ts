import type { ProviderId } from '@shared/types';
import { COPY } from './copy';

export type ShotId = 'popup' | 'overlay' | 'providers' | 'badge' | 'privacy';

export const SHOT_ORDER: ShotId[] = ['popup', 'overlay', 'providers', 'badge', 'privacy'];

export interface Shot {
  eyebrow: string;
  sub: readonly string[];
}

export const SHOTS: Record<ShotId, Shot> = {
  popup: COPY.shots.popup,
  overlay: COPY.shots.overlay,
  providers: COPY.shots.providers,
  badge: COPY.shots.badge,
  privacy: COPY.shots.privacy,
};

export const MARK = '/icons/limit-icon-2.0.png';

export const CANVAS = {
  screenshot: { width: 1280, height: 800 },
  marquee: { width: 1400, height: 560 },
  tile: { width: 440, height: 280 },
} as const;

export const SCREENSHOT = {
  margin: 94,
  top: 168,
  markSize: 120,
  headlineSize: 84,
  columnWidth: 470,
} as const;

export const POPUP_STAGE = { scale: 0.96, top: 28, right: 74 } as const;

export const POPUP_PROVIDERS: ProviderId[] = [
  'claude',
  'codex',
  'minimax',
  'kimi',
  'cursor',
  'mimo',
];

export const OVERLAY_STAGE = {
  scale: 1.6,
  cards: [
    { provider: 'claude' as ProviderId, left: 586, top: 82 },
    { provider: 'codex' as ProviderId, left: 762, top: 384 },
  ],
} as const;

export const PANEL_STAGE = {
  width: 560,
  right: 76,
  shots: {
    providers: { top: 50, scale: 1.02, height: 700 },
    badge: { top: 36, scale: 0.94, height: 785 },
    privacy: { top: 98, scale: 1.08 },
  },
} as const;

export const TILE = {
  margin: 34,
  top: 26,
  markSize: 78,
  headlineSize: 42,
} as const;

export const MARQUEE = {
  margin: 86,
  top: 96,
  columnWidth: 660,
  markSize: 74,
  headlineSize: 70,
  providers: ['claude', 'codex'] as ProviderId[],
  popup: { scale: 0.9, top: 24, right: 88 },
} as const;
