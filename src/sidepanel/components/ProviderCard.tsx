import React from 'react';
import { msg } from '../../shared/i18n';
import type {
  ClaudeUsage,
  CodexUsage,
  ExternalProviderUsage,
  ProviderMetric,
} from '../../shared/types';
import { formatRelativeTime } from '../../shared/utils';
import { UsageCard } from './UsageCard';
import { UsageMetric } from './UsageMetric';

type ProviderUsage = ClaudeUsage | CodexUsage | ExternalProviderUsage;

interface ProviderCardProps {
  title: string;
  iconSrc?: string;
  iconAlt?: string;
  usage?: ProviderUsage;
  loading: boolean;
  now: number;
  /** Hint shown when the provider has no snapshot yet. */
  emptyHint: string;
  /** Labels vary because some providers expose a billing or token-plan window rather than 5h/7d quotas. */
  primaryLabel?: string;
  secondaryLabel?: string;
  /** Optional content pinned to the bottom of the card (e.g. a setting). */
  footer?: React.ReactNode;
  metrics?: ProviderMetric[];
}

const Skeleton: React.FC = () => (
  <div className="au-loader" aria-hidden="true">
    <div className="au-loader__line au-loader__line--w80" />
    <div className="au-loader__bar" />
    <div className="au-loader__line au-loader__line--w60" />
  </div>
);

const ModelBreakdown: React.FC<{ usage: ProviderUsage; now: number; showReset: boolean }> = ({
  usage,
  now,
  showReset,
}) => {
  if (!usage.models.length) {
    return null;
  }

  return (
    <div className="au-breakdown">
      {usage.models.map((model) => (
        <UsageMetric
          key={model.id}
          label={model.label}
          limit={model.limit}
          now={now}
          showReset={showReset}
        />
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
  primaryLabel = msg('sessionLimit'),
  secondaryLabel = msg('weeklyLimit'),
  footer,
  metrics = ['session', 'weekly', 'models', 'reset', 'plan', 'summary'],
}) => {
  const shows = (metric: ProviderMetric): boolean => metrics.includes(metric);
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
          {shows('session') && (
            <UsageMetric
              label={primaryLabel}
              limit={usage.session}
              now={now}
              showReset={shows('reset')}
            />
          )}
          {shows('weekly') && secondaryLabel && (
            <UsageMetric
              label={secondaryLabel}
              limit={usage.weekly}
              now={now}
              showReset={shows('reset')}
            />
          )}
          {shows('models') && <ModelBreakdown usage={usage} now={now} showReset={shows('reset')} />}
          {shows('plan') && 'plan' in usage && usage.plan !== 'unknown' && (
            <p className="au-footnote">{msg('planLabel', usage.plan)}</p>
          )}
          {shows('reset') && 'availableResets' in usage && usage.availableResets !== null && (
            <p className="au-footnote">
              {msg('availableResetsLabel', String(usage.availableResets))}
            </p>
          )}
          {shows('summary') && 'summary' in usage && usage.summary && (
            <p className="au-footnote">{usage.summary}</p>
          )}
          {!metrics.length && <p className="au-empty">No metrics selected.</p>}
        </>
      ) : (
        <p className="au-empty">{emptyHint}</p>
      )}
      {footer}
    </UsageCard>
  );
};
