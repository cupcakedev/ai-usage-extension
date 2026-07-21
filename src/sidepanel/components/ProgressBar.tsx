import React from 'react';
import { msg } from '../../shared/i18n';
import { clampPercent, getUsageTone } from '../../shared/utils';

interface ProgressBarProps {
  percentage: number;
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, label }) => {
  const value = clampPercent(percentage);
  const tone = getUsageTone(value);
  const valueLabel = msg('percentUsed', String(value));

  return (
    <div className="au-progress">
      <div className="au-progress__row">
        <span className="au-progress__label">{label}</span>
        <span className="au-progress__value">{valueLabel}</span>
      </div>
      <div
        className={`au-meter au-meter--${tone}`}
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuetext={valueLabel}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="au-meter__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};
