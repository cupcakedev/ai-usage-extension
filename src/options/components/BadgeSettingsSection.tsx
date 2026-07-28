import { AlertTriangle, Layers, Target } from 'lucide-react';
import { msg } from '../../shared/i18n';
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
    title: msg('optionsBadgeHighest'),
    description: msg('optionsBadgeHighestDescription'),
    Icon: Layers,
  },
  {
    value: 'provider',
    title: msg('optionsBadgeSelected'),
    description: msg('optionsBadgeSelectedDescription'),
    Icon: Target,
  },
];

/** Shows the actual toolbar icons the background script swaps between. */
const RangeScale = () => (
  <div className="auo-scale">
    <div className="auo-scale__head">
      <span>{msg('optionsBadgeSteps')}</span>
      <em>{msg('optionsBadgeStepsHint')}</em>
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
      <div
        className="auo-choice-group"
        role="radiogroup"
        aria-label={msg('optionsBadgeSourceLabel')}
      >
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
          <span className="auo-field__label">{msg('optionsBadgeWindow')}</span>
          <select
            value={badge.metric}
            onChange={(event) => onBadgeMetricChange(event.target.value as BadgeMetric)}
          >
            <option value="session">{msg('optionsBadgeWindowSession')}</option>
            <option value="weekly">{msg('optionsBadgeWindowWeekly')}</option>
          </select>
        </label>
        <label className={`auo-field ${badge.mode !== 'provider' ? 'auo-field--muted' : ''}`}>
          <span className="auo-field__label">{msg('optionsBadgeProvider')}</span>
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
              {msg('optionsBadgeHiddenWarning')}
            </small>
          )}
        </label>
      </div>

      <RangeScale />
    </div>
  </SettingsSection>
);
