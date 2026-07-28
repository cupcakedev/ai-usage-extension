import { RotateCcw } from 'lucide-react';
import { BadgeSettingsSection } from './components/BadgeSettingsSection';
import { DisplaySettingsSection } from './components/DisplaySettingsSection';
import { OptionsHeader } from './components/OptionsHeader';
import { OptionsNavigation } from './components/OptionsNavigation';
import { OverlaySettingsSection } from './components/OverlaySettingsSection';
import { ProviderSettingsSection } from './components/ProviderSettingsSection';
import { useOptionsSettings } from './hooks/useOptionsSettings';
import {
  withBadgeMetric,
  withBadgeMode,
  withBadgeProvider,
  withOverlayEnabled,
  withPopupLayout,
  withProviderVisibility,
  withToggledProviderMetric,
} from './settingsMutations';

export const OptionsApp = () => {
  const { settings, saveState, updateSettings, resetSettings } = useOptionsSettings();

  if (!settings) {
    return <main className="auo-loading">Loading settings…</main>;
  }

  return (
    <main className="auo-shell">
      <a className="auo-skip" href="#settings-content">
        Skip to settings
      </a>
      <OptionsHeader saveState={saveState} />

      <div className="auo-layout">
        <OptionsNavigation />
        <div id="settings-content" className="auo-content">
          <DisplaySettingsSection
            popupLayout={settings.popupLayout}
            onPopupLayoutChange={(layout) =>
              updateSettings((current) => withPopupLayout(current, layout))
            }
          />
          <ProviderSettingsSection
            providers={settings.providers}
            onProviderVisibilityChange={(provider, visible) =>
              updateSettings((current) => withProviderVisibility(current, provider, visible))
            }
            onMetricToggle={(provider, metric) =>
              updateSettings((current) => withToggledProviderMetric(current, provider, metric))
            }
          />
          <BadgeSettingsSection
            badge={settings.badge}
            providers={settings.providers}
            onBadgeModeChange={(mode) => updateSettings((current) => withBadgeMode(current, mode))}
            onBadgeMetricChange={(metric) =>
              updateSettings((current) => withBadgeMetric(current, metric))
            }
            onBadgeProviderChange={(provider) =>
              updateSettings((current) => withBadgeProvider(current, provider))
            }
          />
          <OverlaySettingsSection
            overlays={settings.overlays}
            onOverlayChange={(provider, enabled) =>
              updateSettings((current) => withOverlayEnabled(current, provider, enabled))
            }
          />

          <footer className="auo-footer">
            <button type="button" className="auo-reset" onClick={resetSettings}>
              <RotateCcw size={15} aria-hidden="true" />
              Reset defaults
            </button>
            <span>Changes apply immediately.</span>
          </footer>
        </div>
      </div>
    </main>
  );
};
