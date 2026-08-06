import type { CSSProperties, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { COPY } from './copy';
import { PROVIDERS } from './fixtures';
import { HighlightsStage } from './HighlightsStage';
import { OverlayStage } from './OverlayStage';
import { PopupStage } from './PopupStage';
import { SettingsStage } from './SettingsStage';
import {
  CANVAS,
  MARK,
  MARQUEE,
  PANEL_STAGE,
  POPUP_PROVIDERS,
  POPUP_STAGE,
  SCREENSHOT,
  SHOTS,
  TILE,
  type ShotId,
} from './shots';
import '@sidepanel/styles/global.css';
import './promo.css';

const params = new URLSearchParams(window.location.search);
const format = params.get('format') ?? 'screenshot';
const shotId = (params.get('shot') ?? 'popup') as ShotId;
const shot = SHOTS[shotId] ?? SHOTS.popup;

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Shared backdrop: near-black, a corner bloom, and one very large faint circle
 * whose edge sweeps through the canvas. Both accents are sized off the frame
 * width so every format gets the same curve at a different crop.
 */
const Frame = ({
  width,
  height,
  center,
  children,
}: {
  width: number;
  height: number;
  /** Moves the bloom behind a centred composition instead of the copy column. */
  center?: boolean;
  children: ReactNode;
}) => (
  <div className={`promo-frame ${center ? 'promo-frame--center' : ''}`} style={{ width, height }}>
    <div
      className="promo-frame__arc"
      style={{ left: width * 0.277, top: -width * 2.5, width: width * 4.06, height: width * 4.06 }}
      aria-hidden="true"
    />
    <div className="promo-frame__bloom" aria-hidden="true" />
    {children}
  </div>
);

const BrandMark = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <div className="promo-mark" style={{ width: size, height: size, ...style }} aria-hidden="true">
    <img src={MARK} alt="" width={size} height={size} />
  </div>
);

/** Names what a given screenshot is showing, above the shared headline. */
const Eyebrow = ({ children }: { children: string }) => (
  <p className="promo-eyebrow">
    <span aria-hidden="true" />
    {children}
  </p>
);

/**
 * The wordmark, one line per entry, shrunk to fit if the copy ever outgrows
 * its column. `data-fit` carries the intended size for {@link fitHeadlines}.
 */
const Headline = ({ size, lines = COPY.headline }: { size: number; lines?: readonly string[] }) => (
  <h1 className="promo-headline" data-fit={size} style={{ fontSize: size }}>
    {lines.map((line) => (
      <span key={line}>{line}</span>
    ))}
  </h1>
);

function fitHeadlines(): void {
  document.querySelectorAll<HTMLElement>('[data-fit]').forEach((element) => {
    const base = Number(element.dataset.fit);
    element.style.fontSize = `${base}px`;
    const widest = Math.max(
      ...Array.from(element.children).map((child) => (child as HTMLElement).scrollWidth),
    );
    if (widest > element.clientWidth) {
      element.style.fontSize = `${Math.floor(base * (element.clientWidth / widest))}px`;
    }
  });
}

const Sub = ({ lines, size }: { lines: readonly string[]; size: number }) => (
  <p className="promo-sub" style={{ fontSize: size }}>
    {lines.map((line) => (
      <span key={line}>{line}</span>
    ))}
  </p>
);

/** Every supported provider: brand icon plus wordmark, or icons alone. */
const ProviderChips = ({ variant }: { variant: 'labels' | 'icons' }) => (
  <div className={`promo-chips promo-chips--${variant}`}>
    {PROVIDERS.map((provider) => (
      <span className="promo-chip" key={provider.id}>
        <img src={provider.iconSrc} alt={variant === 'icons' ? provider.title : ''} />
        {variant === 'labels' && provider.title}
      </span>
    ))}
  </div>
);

/** Framed panel for the stages that are not the popup itself. */
const Window = ({
  shot,
  children,
}: {
  shot: keyof typeof PANEL_STAGE.shots;
  children: ReactNode;
}) => {
  const { top, scale, height } = {
    height: undefined as number | undefined,
    ...PANEL_STAGE.shots[shot],
  };

  return (
    <div
      className={`promo-window ${height ? 'promo-window--fade' : ''}`}
      style={{
        width: PANEL_STAGE.width,
        height,
        top,
        right: PANEL_STAGE.right,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Formats                                                                   */
/* -------------------------------------------------------------------------- */

const Stage = () => {
  switch (shotId) {
    case 'overlay':
      return <OverlayStage />;
    case 'providers':
      return (
        <Window shot="providers">
          <SettingsStage view="providers" />
        </Window>
      );
    case 'badge':
      return (
        <Window shot="badge">
          <SettingsStage view="badge" />
        </Window>
      );
    case 'privacy':
      return (
        <Window shot="privacy">
          <HighlightsStage />
        </Window>
      );
    default:
      return (
        <div
          className="promo-stage promo-stage--popup promo-stage--grid"
          style={{
            top: POPUP_STAGE.top,
            right: POPUP_STAGE.right,
            transform: `scale(${POPUP_STAGE.scale})`,
          }}
        >
          <PopupStage layout="grid" providers={POPUP_PROVIDERS} />
        </div>
      );
  }
};

const Screenshot = () => (
  <Frame width={CANVAS.screenshot.width} height={CANVAS.screenshot.height}>
    <Stage />

    <div
      className="promo-copy"
      style={{ left: SCREENSHOT.margin, top: SCREENSHOT.top, width: SCREENSHOT.columnWidth }}
    >
      <BrandMark size={SCREENSHOT.markSize} />
      <div style={{ marginTop: 30 }}>
        <Eyebrow>{shot.eyebrow}</Eyebrow>
      </div>
      <div style={{ marginTop: 16 }}>
        <Headline size={SCREENSHOT.headlineSize} />
      </div>
      <div style={{ marginTop: 30 }}>
        <Sub lines={shot.sub} size={21} />
      </div>
    </div>
  </Frame>
);

const Marquee = () => (
  <Frame width={CANVAS.marquee.width} height={CANVAS.marquee.height}>
    <div
      className="promo-stage promo-stage--popup"
      style={{
        top: MARQUEE.popup.top,
        right: MARQUEE.popup.right,
        transform: `scale(${MARQUEE.popup.scale})`,
      }}
    >
      <PopupStage layout="single" providers={MARQUEE.providers} />
    </div>

    <div
      className="promo-copy"
      style={{ left: MARQUEE.margin, top: MARQUEE.top, width: MARQUEE.columnWidth }}
    >
      <div className="promo-lockup">
        <BrandMark size={MARQUEE.markSize} />
        <Headline size={MARQUEE.headlineSize} />
      </div>
      <div style={{ marginTop: 26 }}>
        <Sub lines={COPY.marquee.sub} size={19} />
      </div>
      <div style={{ marginTop: 26 }}>
        <ProviderChips variant="labels" />
      </div>
    </div>
  </Frame>
);

const Tile = () => (
  <Frame width={CANVAS.tile.width} height={CANVAS.tile.height} center>
    <div
      className="promo-copy promo-copy--center"
      style={{ left: TILE.margin, right: TILE.margin, top: TILE.top }}
    >
      <BrandMark size={TILE.markSize} style={{ margin: '0 auto' }} />
      <div style={{ marginTop: 18 }}>
        <Headline size={TILE.headlineSize} lines={[COPY.brand]} />
      </div>
      <div style={{ marginTop: 12 }}>
        <Sub lines={[COPY.tile.sub]} size={14} />
      </div>
      <div style={{ marginTop: 20 }}>
        <ProviderChips variant="icons" />
      </div>
    </div>
  </Frame>
);

/* -------------------------------------------------------------------------- */
/*  Render                                                                    */
/* -------------------------------------------------------------------------- */

const container = document.getElementById('promo');

if (container) {
  const root = createRoot(container);
  if (format === 'marquee') root.render(<Marquee />);
  else if (format === 'tile') root.render(<Tile />);
  else root.render(<Screenshot />);
}

window.setTimeout(fitHeadlines, 60);
