import type { ProviderId } from '@shared/types';
import { COPY } from './copy';

export type ShotId = 'popup' | 'overlay' | 'providers' | 'badge' | 'privacy';

/** Upload order in the Chrome Web Store dashboard (max five screenshots). */
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

/* -------------------------------------------------------------------------- */
/*  Geometry                                                                  */
/* -------------------------------------------------------------------------- */

/** Served from `public/`, so it is referenced by URL rather than imported. */
export const MARK = '/icons/limit-icon-2.0.png';

/** Chrome Web Store artwork sizes. */
export const CANVAS = {
  screenshot: { width: 1280, height: 800 },
  marquee: { width: 1400, height: 560 },
  tile: { width: 440, height: 280 },
} as const;

/** Left copy column of the 1280×800 screenshots. */
export const SCREENSHOT = {
  margin: 94,
  top: 168,
  markSize: 120,
  headlineSize: 84,
  columnWidth: 470,
} as const;

/** The popup mock, sized from its real 360px (grid: 500px) width. */
export const POPUP_STAGE = { scale: 0.96, top: 28, right: 74 } as const;

/** Cards shown in the grid popup — every provider the extension supports. */
export const POPUP_PROVIDERS: ProviderId[] = [
  'claude',
  'codex',
  'minimax',
  'kimi',
  'cursor',
  'mimo',
];

/** The two on-page overlay cards, scaled up from their real 296px width. */
export const OVERLAY_STAGE = {
  scale: 1.6,
  cards: [
    { provider: 'claude' as ProviderId, left: 586, top: 82 },
    { provider: 'codex' as ProviderId, left: 762, top: 384 },
  ],
} as const;

/**
 * Window onto the options page, and onto the closing highlights panel.
 * `height` crops a section list that is longer than the canvas — those get a
 * faded bottom edge so the cut reads as "there is more", not as a broken
 * render. Panels that fit are sized by their content instead.
 */
export const PANEL_STAGE = {
  width: 560,
  right: 76,
  shots: {
    providers: { top: 50, scale: 1.02, height: 700 },
    badge: { top: 36, scale: 0.94 },
    privacy: { top: 98, scale: 1.08 },
  },
} as const;

/**
 * The 440×280 tile is centred: at thumbnail size a single stacked column reads
 * better than a two-column split, and it cannot drift off balance.
 */
export const TILE = {
  margin: 34,
  top: 26,
  markSize: 78,
  headlineSize: 42,
} as const;

/**
 * Left copy column and popup mock of the 1400×560 marquee. The short canvas
 * only fits two cards, so the marquee shows the single-column popup at full
 * size and lets the chips carry the rest of the lineup.
 */
export const MARQUEE = {
  margin: 86,
  top: 96,
  columnWidth: 660,
  markSize: 74,
  headlineSize: 70,
  providers: ['claude', 'codex'] as ProviderId[],
  popup: { scale: 0.9, top: 24, right: 88 },
} as const;
