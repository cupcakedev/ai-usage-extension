import React from 'react';
import { msg } from '../../shared/i18n';
import type {
  ClaudeUsage,
  CodexUsage,
  ExternalProviderUsage,
  ProviderIssue,
  ProviderLink,
  ProviderMetric,
} from '../../shared/types';
import { formatRelativeTime, isLimitAvailable } from '../../shared/utils';
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
  emptyHintLink?: ProviderLink;
  issue?: ProviderIssue;
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

const EmptyHint: React.FC<{ hint: string; link?: ProviderLink }> = ({ hint, link }) => {
  const start = link ? hint.indexOf(link.host) : -1;
  if (!link || start === -1) {
    return <p className="au-empty">{hint}</p>;
  }

  return (
    <p className="au-empty">
      {hint.slice(0, start)}
      <a className="au-empty__link" href={link.url} target="_blank" rel="noreferrer">
        {link.host}
      </a>
      {hint.slice(start + link.host.length)}
    </p>
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
  emptyHintLink,
  issue,
  primaryLabel = msg('sessionLimit'),
  secondaryLabel = msg('weeklyLimit'),
  footer,
  metrics = ['session', 'weekly', 'models', 'reset', 'availableResets', 'plan', 'summary'],
}) => {
  const shows = (metric: ProviderMetric): boolean => metrics.includes(metric);
  const showsSession = shows('session') && isLimitAvailable(usage?.session);
  const showsWeekly = shows('weekly') && Boolean(secondaryLabel) && isLimitAvailable(usage?.weekly);
  const showsModels = shows('models') && Boolean(usage?.models.length);
  const showsPlan = shows('plan') && Boolean(usage && 'plan' in usage && usage.plan !== 'unknown');
  const showsResets =
    shows('availableResets') &&
    Boolean(usage && 'availableResets' in usage && usage.availableResets !== null);
  const showsSummary = shows('summary') && Boolean(usage && 'summary' in usage && usage.summary);
  const hasVisibleMetric =
    showsSession || showsWeekly || showsModels || showsPlan || showsResets || showsSummary;
  const subtitle = loading
    ? msg('loadingSnapshot')
    : usage
      ? msg('updated', formatRelativeTime(usage.lastUpdated, now))
      : issue === 'auth'
        ? msg('sessionExpired')
        : msg('notConnected');

  return (
    <UsageCard title={title} subtitle={subtitle} iconSrc={iconSrc} iconAlt={iconAlt}>
      {loading ? (
        <Skeleton />
      ) : usage && hasVisibleMetric ? (
        <>
          {showsSession && (
            <UsageMetric
              label={primaryLabel}
              limit={usage.session}
              now={now}
              showReset={shows('reset')}
            />
          )}
          {showsWeekly && (
            <UsageMetric
              label={secondaryLabel}
              limit={usage.weekly}
              now={now}
              showReset={shows('reset')}
            />
          )}
          {showsModels && <ModelBreakdown usage={usage} now={now} showReset={shows('reset')} />}
          {showsPlan && 'plan' in usage && (
            <p className="au-footnote">{msg('planLabel', usage.plan)}</p>
          )}
          {showsResets && 'availableResets' in usage && (
            <p className="au-footnote">
              {msg('availableResetsLabel', String(usage.availableResets))}
            </p>
          )}
          {showsSummary && 'summary' in usage && <p className="au-footnote">{usage.summary}</p>}
        </>
      ) : usage && !metrics.length ? (
        <p className="au-empty">No metrics selected.</p>
      ) : (
        <EmptyHint hint={emptyHint} link={emptyHintLink} />
      )}
      {footer}
    </UsageCard>
  );
};
