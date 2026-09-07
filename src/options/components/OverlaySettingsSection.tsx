import { msg } from '../../shared/i18n';
import { OVERLAY_PROVIDER_IDS } from '../../shared/settings';
import type { ExtensionSettings, OverlayProviderId } from '../../shared/types';
import { PROVIDER_DETAILS } from '../config';
import { SettingsSection } from './SettingsSection';
import { Switch } from './Switch';

interface OverlaySettingsSectionProps {
  overlays: ExtensionSettings['overlays'];
  onOverlayChange: (provider: OverlayProviderId, enabled: boolean) => void;
}

const OVERLAY_HOSTS: Record<OverlayProviderId, string> = {
  claude: 'claude.ai',
  codex: 'chatgpt.com',
};

export const OverlaySettingsSection = ({
  overlays,
  onOverlayChange,
}: OverlaySettingsSectionProps) => (
  <SettingsSection id="overlays">
    <div className="auo-overlay-list">
      {OVERLAY_PROVIDER_IDS.map((provider) => {
        const details = PROVIDER_DETAILS[provider];
        return (
          <div
            className={`auo-overlay-row ${overlays[provider] ? '' : 'auo-overlay-row--off'}`}
            key={provider}
          >
            <div className="auo-provider__identity">
              <span className="auo-provider__avatar">
                <img src={details.icon} alt="" />
              </span>
              <span className="auo-provider__naming">
                <h3>{details.name}</h3>
                <small>{OVERLAY_HOSTS[provider]}</small>
              </span>
            </div>
            <Switch
              checked={overlays[provider]}
              label={msg('optionsOverlayToggleLabel', details.name)}
              onChange={(enabled) => onOverlayChange(provider, enabled)}
            />
          </div>
        );
      })}
    </div>
  </SettingsSection>
);
