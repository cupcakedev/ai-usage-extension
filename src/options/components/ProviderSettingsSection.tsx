import { PROVIDER_IDS, PROVIDER_METRICS } from '../../shared/settings';
import type { ExtensionSettings, ProviderId, ProviderMetric } from '../../shared/types';
import { PROVIDER_DETAILS, PROVIDER_METRIC_LABELS } from '../config';
import { SettingsSection } from './SettingsSection';
import { Switch } from './Switch';

interface ProviderSettingsSectionProps {
  providers: ExtensionSettings['providers'];
  onProviderVisibilityChange: (provider: ProviderId, visible: boolean) => void;
  onMetricToggle: (provider: ProviderId, metric: ProviderMetric) => void;
}

export const ProviderSettingsSection = ({
  providers,
  onProviderVisibilityChange,
  onMetricToggle,
}: ProviderSettingsSectionProps) => (
  <SettingsSection
    id="providers"
    kicker="Popup content"
    title="Providers"
    description="Hide a card or choose the usage details it can display. Unavailable data stays hidden automatically."
  >
    <div className="auo-provider-list">
      {PROVIDER_IDS.map((provider) => {
        const providerSettings = providers[provider];
        const details = PROVIDER_DETAILS[provider];
        return (
          <section className="auo-provider" key={provider} aria-labelledby={`${provider}-title`}>
            <div className="auo-provider__head">
              <div className="auo-provider__identity">
                <img src={details.icon} alt="" />
                <h3 id={`${provider}-title`}>{details.name}</h3>
              </div>
              <div className="auo-provider__visibility">
                <span>Show in popup</span>
                <Switch
                  checked={providerSettings.visible}
                  label={`Show ${details.name} in popup`}
                  onChange={(visible) => onProviderVisibilityChange(provider, visible)}
                />
              </div>
            </div>
            <fieldset className="auo-metrics" disabled={!providerSettings.visible}>
              <div className="auo-metrics__items">
                {PROVIDER_METRICS.map((metric) => (
                  <label className="auo-check" key={metric}>
                    <input
                      type="checkbox"
                      checked={providerSettings.metrics.includes(metric)}
                      onChange={() => onMetricToggle(provider, metric)}
                    />
                    <span>{PROVIDER_METRIC_LABELS[metric]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        );
      })}
    </div>
  </SettingsSection>
);
