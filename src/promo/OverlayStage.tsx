import { RefreshCw } from 'lucide-react';
import { msg } from '@shared/i18n';
import type { UsageLimit } from '@shared/types';
import { formatRelativeTime, formatReset, getUsageTone, clampPercent } from '@shared/utils';
import { NOW, providerById } from './fixtures';
import { MARK, OVERLAY_STAGE } from './shots';
import '../content/styles/overlay.css';

/** Same minimal shape the content script works with. */
interface OverlayUsage {
  session: UsageLimit;
  weekly: UsageLimit;
  lastUpdated: number;
}

/** Soonest of the two windows — the same summary the content script shows. */
const nextReset = (usage: OverlayUsage, now: number): string => {
  const upcoming = [usage.session.resetsAt, usage.weekly.resetsAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => value > now)
    .sort((a, b) => a - b)[0];

  return upcoming ? formatReset(new Date(upcoming).toISOString(), now) : msg('timeUnknown');
};

const Metric = ({ label, limit, now }: { label: string; limit: UsageLimit; now: number }) => {
  const percent = clampPercent(limit.percentage);

  return (
    <div className="aiu-group">
      <div className="aiu-row">
        <span className="aiu-label">{label}</span>
        <span className="aiu-value">{percent}%</span>
      </div>
      <div className={`aiu-meter aiu-meter--${getUsageTone(percent)}`}>
        <div className="aiu-meter__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="aiu-meta">{msg('resetsLabel', formatReset(limit.resetsAt, now))}</div>
    </div>
  );
};

/**
 * Mirrors the expanded on-page overlay from `src/content/index.tsx`, minus the
 * storage plumbing. It reuses `overlay.css`, so the artwork inherits any
 * styling change made to the real capsule.
 */
const OverlayCard = ({
  title,
  iconSrc,
  usage,
}: {
  title: string;
  iconSrc: string;
  usage: OverlayUsage;
}) => (
  <div className="aiu-wrap">
    <span className="aiu-tab">
      <img className="aiu-tab-icon" src={MARK} alt="" />
      <span className="aiu-tab-label">{msg('limitsTab')}</span>
    </span>

    <div className="aiu-card">
      <div className="aiu-header">
        <img className="aiu-brand" src={iconSrc} alt="" />
        <div className="aiu-heading">
          <p className="aiu-title">{title}</p>
          <p className="aiu-subtitle">
            {`${msg('updated', formatRelativeTime(usage.lastUpdated, NOW))} · ${msg(
              'nextResetLabel',
              nextReset(usage, NOW),
            )}`}
          </p>
        </div>
        <span className="aiu-btn-refresh">
          <RefreshCw className="aiu-icon-refresh" aria-hidden="true" strokeWidth={1.5} />
        </span>
      </div>

      <Metric label={msg('sessionLimit')} limit={usage.session} now={NOW} />
      <Metric label={msg('weeklyLimit')} limit={usage.weekly} now={NOW} />
    </div>
  </div>
);

/** Two overlapping overlay capsules, the way they stack on a real chat page. */
export const OverlayStage = () => (
  <div className="aiu-root promo-overlays">
    {OVERLAY_STAGE.cards.map((card, index) => {
      const provider = providerById(card.provider);

      return (
        <div
          key={card.provider}
          className="promo-overlays__card"
          style={{
            left: card.left,
            top: card.top,
            zIndex: index + 1,
            transform: `scale(${OVERLAY_STAGE.scale})`,
          }}
        >
          <OverlayCard
            title={provider.title}
            iconSrc={provider.iconSrc}
            usage={{ ...provider.usage, lastUpdated: NOW }}
          />
        </div>
      );
    })}
  </div>
);
