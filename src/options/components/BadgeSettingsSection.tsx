import { PROVIDER_IDS } from '../../shared/settings';
import type { BadgeMetric, BadgeMode, ExtensionSettings, ProviderId } from '../../shared/types';
import { PROVIDER_DETAILS } from '../config';
import { SettingsSection } from './SettingsSection';

interface BadgeSettingsSectionProps {
  badge: ExtensionSettings['badge'];
  providers: ExtensionSettings['providers'];
  onBadgeModeChange: (mode: BadgeMode) => void;
  onBadgeMetricChange: (metric: BadgeMetric) => void;
  onBadgeProviderChange: (provider: ProviderId) => void;
}

export const BadgeSettingsSection = ({
  badge,
  providers,
  onBadgeModeChange,
  onBadgeMetricChange,
  onBadgeProviderChange,
}: BadgeSettingsSectionProps) => (
  <SettingsSection
    id="badge"
    kicker="Toolbar"
    title="Badge range"
    description="The extension icon changes by 10% ranges based on this source."
  >
    <div className="auo-fieldset">
      <div className="auo-radio-row" role="radiogroup" aria-label="Badge source">
        <label className="auo-radio">
          <input
            type="radio"
            checked={badge.mode === 'highest'}
            onChange={() => onBadgeModeChange('highest')}
          />
          <span>
            <strong>Highest of visible providers</strong>
            <small>Use the largest current percentage among shown provider cards.</small>
          </span>
        </label>
        <label className="auo-radio">
          <input
            type="radio"
            checked={badge.mode === 'provider'}
            onChange={() => onBadgeModeChange('provider')}
          />
          <span>
            <strong>Selected provider</strong>
            <small>Use one provider regardless of the popup visibility of other cards.</small>
          </span>
        </label>
      </div>
      <div className="auo-select-grid">
        <label>
          Usage window
          <select
            value={badge.metric}
            onChange={(event) => onBadgeMetricChange(event.target.value as BadgeMetric)}
          >
            <option value="session">Session</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        <label>
          Provider
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
              This provider is hidden in the popup, but its badge range remains active.
            </small>
          )}
        </label>
      </div>
    </div>
  </SettingsSection>
);
