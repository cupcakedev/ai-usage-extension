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
  const hasCount =
    typeof limit.used === 'number' && typeof limit.limit === 'number' && limit.limit > 0;

  return (
    <div className="au-metric">
      <ProgressBar label={label} percentage={limit.percentage} />
      {(hasCount || showReset) && (
        <p className="au-meta">
          {hasCount && (
            <>
              <span>
                {limit.used} / {limit.limit}
              </span>
              {showReset && ' · '}
            </>
          )}
          {showReset && msg('resetsLabel', formatReset(limit.resetsAt, now))}
        </p>
      )}
    </div>
  );
};
