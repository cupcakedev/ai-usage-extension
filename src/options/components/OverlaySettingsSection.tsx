import type { ExtensionSettings } from '../../shared/types';
import { PROVIDER_DETAILS } from '../config';
import { SettingsSection } from './SettingsSection';
import { Switch } from './Switch';

interface OverlaySettingsSectionProps {
  overlays: ExtensionSettings['overlays'];
  onOverlayChange: (provider: 'claude' | 'codex', enabled: boolean) => void;
}

export const OverlaySettingsSection = ({
  overlays,
  onOverlayChange,
}: OverlaySettingsSectionProps) => (
  <SettingsSection
    id="overlays"
    kicker="Supported sites"
    title="On-page overlays"
    description="Show the collapsible usage capsule next to the message composer."
  >
    <div className="auo-overlay-list">
      {(['claude', 'codex'] as const).map((provider) => {
        const details = PROVIDER_DETAILS[provider];
        return (
          <div className="auo-overlay-row" key={provider}>
            <div className="auo-provider__identity">
              <img src={details.icon} alt="" />
              <span>{details.name}</span>
            </div>
            <Switch
              checked={overlays[provider]}
              label={`Enable ${details.name} on-page overlay`}
              onChange={(enabled) => onOverlayChange(provider, enabled)}
            />
          </div>
        );
      })}
    </div>
  </SettingsSection>
);
