import React from 'react';
import { msg } from '../../shared/i18n';
import type { UsageLimit } from '../../shared/types';
import { formatReset } from '../../shared/utils';
import { ProgressBar } from './ProgressBar';

interface UsageMetricProps {
  label: string;
  limit: UsageLimit;
  now: number;
  showReset?: boolean;
}

/** A labelled progress bar plus its "used / limit · resets" caption. */
export const UsageMetric: React.FC<UsageMetricProps> = ({
  label,
  limit,
  now,
  showReset = true,
}) => {
  const count =
    limit.countLabel ??
    (typeof limit.used === 'number' && typeof limit.limit === 'number' && limit.limit > 0
      ? `${limit.used} / ${limit.limit}`
      : null);

  return (
    <div className="au-metric">
      <ProgressBar label={label} percentage={limit.percentage} />
      {(count !== null || showReset) && (
        <p className="au-meta">
          {count !== null && (
            <>
              <span>{count}</span>
              {showReset && ' · '}
            </>
          )}
          {showReset && msg('resetsLabel', formatReset(limit.resetsAt, now))}
        </p>
      )}
    </div>
  );
};
