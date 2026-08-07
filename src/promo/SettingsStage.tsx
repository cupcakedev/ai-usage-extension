import { BadgeSettingsSection } from '../options/components/BadgeSettingsSection';
import { DisplaySettingsSection } from '../options/components/DisplaySettingsSection';
import { OverlaySettingsSection } from '../options/components/OverlaySettingsSection';
import { ProviderSettingsSection } from '../options/components/ProviderSettingsSection';
import { SETTINGS } from './fixtures';
import '../options/styles.css';

export type SettingsView = 'providers' | 'badge';

const noop = (): void => undefined;

export const SettingsStage = ({ view }: { view: SettingsView }) => (
  <div className="promo-options">
    {view === 'providers' ? (
      <>
        <DisplaySettingsSection popupLayout={SETTINGS.popupLayout} onPopupLayoutChange={noop} />
        <ProviderSettingsSection
          providers={SETTINGS.providers}
          onProviderVisibilityChange={noop}
          onMetricToggle={noop}
        />
      </>
    ) : (
      <>
        <BadgeSettingsSection
          badge={SETTINGS.badge}
          providers={SETTINGS.providers}
          onBadgeModeChange={noop}
          onBadgeMetricChange={noop}
          onBadgeProviderChange={noop}
        />
        <OverlaySettingsSection overlays={SETTINGS.overlays} onOverlayChange={noop} />
      </>
    )}
  </div>
);
