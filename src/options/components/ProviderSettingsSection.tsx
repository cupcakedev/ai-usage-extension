import { Check, EyeOff } from 'lucide-react';
import { PROVIDER_IDS, PROVIDER_SUPPORTED_METRICS } from '../../shared/settings';
import type { ExtensionSettings, ProviderId, ProviderMetric } from '../../shared/types';
import { metricLabel, PROVIDER_DETAILS } from '../config';
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
}: ProviderSettingsSectionProps) => {
  const visibleCount = PROVIDER_IDS.filter((provider) => providers[provider].visible).length;

  return (
    <SettingsSection
      id="providers"
      aside={
        <span className="auo-counter">
          <strong>{visibleCount}</strong> of {PROVIDER_IDS.length} shown
        </span>
      }
    >
      <div className="auo-provider-list">
        {PROVIDER_IDS.map((provider) => {
          const providerSettings = providers[provider];
          const details = PROVIDER_DETAILS[provider];
          const supported = PROVIDER_SUPPORTED_METRICS[provider];
          return (
            <section
              className={`auo-provider ${providerSettings.visible ? '' : 'auo-provider--off'}`}
              key={provider}
              aria-labelledby={`${provider}-title`}
            >
              <div className="auo-provider__head">
                <div className="auo-provider__identity">
                  <span className="auo-provider__avatar">
                    <img src={details.icon} alt="" />
                  </span>
                  <span className="auo-provider__naming">
                    <h3 id={`${provider}-title`}>{details.name}</h3>
                    <small>
                      {providerSettings.visible ? (
                        `${providerSettings.metrics.length} of ${supported.length} details`
                      ) : (
                        <>
                          <EyeOff size={11} strokeWidth={2} aria-hidden="true" />
                          Hidden in popup
                        </>
                      )}
                    </small>
                  </span>
                </div>
                <Switch
                  checked={providerSettings.visible}
                  label={`Show ${details.name} in popup`}
                  onChange={(visible) => onProviderVisibilityChange(provider, visible)}
                />
              </div>

              <fieldset className="auo-metrics" disabled={!providerSettings.visible}>
                <legend className="auo-sr-only">{details.name} usage details</legend>
                {supported.map((metric) => (
                  <label className="auo-chip" key={metric}>
                    <input
                      type="checkbox"
                      checked={providerSettings.metrics.includes(metric)}
                      onChange={() => onMetricToggle(provider, metric)}
                    />
                    <span className="auo-chip__mark" aria-hidden="true">
                      <Check size={10} strokeWidth={3.2} />
                    </span>
                    <span>{metricLabel(provider, metric)}</span>
                  </label>
                ))}
              </fieldset>
            </section>
          );
        })}
      </div>
    </SettingsSection>
  );
};
