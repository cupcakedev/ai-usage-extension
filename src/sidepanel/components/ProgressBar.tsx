import React from 'react';
import type { PercentageDisplay } from '../../shared/types';
import { clampPercent, formatUsagePercent, getUsageTone } from '../../shared/utils';

interface ProgressBarProps {
  percentage: number;
  label: string;
  percentageDisplay?: PercentageDisplay;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  percentageDisplay = 'used',
}) => {
  const value = clampPercent(percentage);
  const displayedValue = percentageDisplay === 'remaining' ? 100 - value : value;
  const tone = getUsageTone(value);

  return (
    <div className="au-progress">
      <div className="au-progress__row">
        <span className="au-progress__label">{label}</span>
        <span className="au-progress__value">{formatUsagePercent(value, percentageDisplay)}</span>
      </div>
      <div
        className={`au-meter au-meter--${tone}`}
        role="progressbar"
        aria-label={label}
        aria-valuenow={displayedValue}
        aria-valuetext={formatUsagePercent(value, percentageDisplay)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="au-meter__fill" style={{ width: `${displayedValue}%` }} />
      </div>
    </div>
  );
};
