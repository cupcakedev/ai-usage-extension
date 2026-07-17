import React from 'react';
import { msg } from '../../shared/i18n';
import type { ClaudeUsage, CodexUsage } from '../../shared/types';
import { formatRelativeTime } from '../../shared/utils';
import { UsageCard } from './UsageCard';
import { UsageMetric } from './UsageMetric';

type ProviderUsage = ClaudeUsage | CodexUsage;

interface ProviderCardProps {
  title: string;
  iconSrc: string;
  iconAlt: string;
  usage?: ProviderUsage;
  loading: boolean;
  now: number;
  /** Hint shown when the provider has no snapshot yet. */
  emptyHint: string;
  /** Optional content pinned to the bottom of the card (e.g. a setting). */
  footer?: React.ReactNode;
}

const Skeleton: React.FC = () => (
  <div className="au-loader" aria-hidden="true">
    <div className="au-loader__line au-loader__line--w80" />
    <div className="au-loader__bar" />
    <div className="au-loader__line au-loader__line--w60" />
  </div>
);

const ModelBreakdown: React.FC<{ usage: ProviderUsage; now: number }> = ({ usage, now }) => {
  if (!usage.models.length) {
    return null;
  }

  return (
    <div className="au-breakdown">
      {usage.models.map((model) => (
        <UsageMetric key={model.id} label={model.label} limit={model.limit} now={now} />
      ))}
    </div>
  );
};

/** Renders one provider's usage, handling loading / empty / data states. */
export const ProviderCard: React.FC<ProviderCardProps> = ({
  title,
  iconSrc,
  iconAlt,
  usage,
  loading,
  now,
  emptyHint,
  footer,
}) => {
  const subtitle = loading
    ? msg('loadingSnapshot')
    : usage
      ? msg('updated', formatRelativeTime(usage.lastUpdated, now))
      : msg('notConnected');

  return (
    <UsageCard title={title} subtitle={subtitle} iconSrc={iconSrc} iconAlt={iconAlt}>
      {loading ? (
        <Skeleton />
      ) : usage ? (
        <>
          <UsageMetric label={msg('sessionLimit')} limit={usage.session} now={now} />
          <UsageMetric label={msg('weeklyLimit')} limit={usage.weekly} now={now} />
          <ModelBreakdown usage={usage} now={now} />
          {'plan' in usage && usage.plan !== 'unknown' && (
            <p className="au-footnote">{msg('planLabel', usage.plan)}</p>
          )}
          {'availableResets' in usage && usage.availableResets !== null && (
            <p className="au-footnote">
              {msg('availableResetsLabel', String(usage.availableResets))}
            </p>
          )}
        </>
      ) : (
        <p className="au-empty">{emptyHint}</p>
      )}
      {footer}
    </UsageCard>
  );
};
