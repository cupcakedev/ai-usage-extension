import { BadgeSettingsSection } from '../options/components/BadgeSettingsSection';
import { DisplaySettingsSection } from '../options/components/DisplaySettingsSection';
import { OverlaySettingsSection } from '../options/components/OverlaySettingsSection';
import { ProviderSettingsSection } from '../options/components/ProviderSettingsSection';
import { SETTINGS } from './fixtures';
import '../options/styles.css';

/** Which slice of the options page a shot puts on stage. */
export type SettingsView = 'providers' | 'badge';

const noop = (): void => undefined;

/**
 * A window onto the real options page. The sections are the shipped components
 * driven by {@link SETTINGS}, so the artwork can never advertise a setting that
 * no longer exists; `promo.css` fades the bottom edge where content runs on.
 */
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
