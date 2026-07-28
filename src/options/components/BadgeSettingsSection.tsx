import { AlertTriangle, Layers, Target } from 'lucide-react';
import { PROVIDER_IDS } from '../../shared/settings';
import type { BadgeMetric, BadgeMode, ExtensionSettings, ProviderId } from '../../shared/types';
import { BADGE_RANGE_ICONS, PROVIDER_DETAILS } from '../config';
import { SettingsSection } from './SettingsSection';

interface BadgeSettingsSectionProps {
  badge: ExtensionSettings['badge'];
  providers: ExtensionSettings['providers'];
  onBadgeModeChange: (mode: BadgeMode) => void;
  onBadgeMetricChange: (metric: BadgeMetric) => void;
  onBadgeProviderChange: (provider: ProviderId) => void;
}

const MODE_OPTIONS: Array<{
  value: BadgeMode;
  title: string;
  description: string;
  Icon: typeof Layers;
}> = [
  {
    value: 'highest',
    title: 'Highest of visible providers',
    description: 'Use the largest current percentage among shown provider cards.',
    Icon: Layers,
  },
  {
    value: 'provider',
    title: 'Selected provider',
    description: 'Use one provider regardless of the popup visibility of other cards.',
    Icon: Target,
  },
];

/** Shows the actual toolbar icons the background script swaps between. */
const RangeScale = () => (
  <div className="auo-scale">
    <div className="auo-scale__head">
      <span>Toolbar icon steps</span>
      <em>rounded down to the nearest 10%</em>
    </div>
    <div className="auo-scale__steps">
      {BADGE_RANGE_ICONS.map(({ range, src }) => (
        <span className="auo-scale__step" key={range}>
          <img src={src} alt="" width={30} height={30} />
          <em>{range}%</em>
        </span>
      ))}
    </div>
  </div>
);

export const BadgeSettingsSection = ({
  badge,
  providers,
  onBadgeModeChange,
  onBadgeMetricChange,
  onBadgeProviderChange,
}: BadgeSettingsSectionProps) => (
  <SettingsSection id="badge">
    <div className="auo-fieldset">
      <div className="auo-choice-group" role="radiogroup" aria-label="Badge source">
        {MODE_OPTIONS.map(({ value, title, description, Icon }) => (
          <label
            className={`auo-choice auo-choice--compact ${
              badge.mode === value ? 'auo-choice--selected' : ''
            }`}
            key={value}
          >
            <input
              type="radio"
              name="badge-mode"
              checked={badge.mode === value}
              onChange={() => onBadgeModeChange(value)}
            />
            <span className="auo-choice__glyph" aria-hidden="true">
              <Icon size={15} strokeWidth={1.9} />
            </span>
            <span className="auo-choice__text">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
          </label>
        ))}
      </div>

      <div className="auo-select-grid">
        <label className="auo-field">
          <span className="auo-field__label">Usage window</span>
          <select
            value={badge.metric}
            onChange={(event) => onBadgeMetricChange(event.target.value as BadgeMetric)}
          >
            <option value="session">Session</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        <label className={`auo-field ${badge.mode !== 'provider' ? 'auo-field--muted' : ''}`}>
          <span className="auo-field__label">Provider</span>
          <select
            disabled={badge.mode !== 'provider'}
            value={badge.provider}
            onChange={(event) => onBadgeProviderChange(event.target.value as ProviderId)}
          >
            {PROVIDER_IDS.map((provider) => (
              <option key={provider} value={provider}>
                {PROVIDER_DETAILS[provider].name}
              </option>
            ))}
          </select>
          {badge.mode === 'provider' && !providers[badge.provider].visible && (
            <small className="auo-warning">
              <AlertTriangle size={12} strokeWidth={2} aria-hidden="true" />
              This provider is hidden in the popup, but its badge range remains active.
            </small>
          )}
        </label>
      </div>

      <RangeScale />
    </div>
  </SettingsSection>
);
