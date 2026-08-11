import { RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { msg } from '../shared/i18n';
import { BadgeSettingsSection } from './components/BadgeSettingsSection';
import { DisplaySettingsSection } from './components/DisplaySettingsSection';
import { LanguageSettingsSection } from './components/LanguageSettingsSection';
import { OptionsHeader } from './components/OptionsHeader';
import { OptionsNavigation } from './components/OptionsNavigation';
import { OverlaySettingsSection } from './components/OverlaySettingsSection';
import { ProviderSettingsSection } from './components/ProviderSettingsSection';
import { useActiveSection } from './hooks/useActiveSection';
import { useOptionsSettings } from './hooks/useOptionsSettings';
import { SECTION_IDS } from './sections';
import {
  withBadgeMetric,
  withBadgeMode,
  withBadgeProvider,
  withLanguage,
  withOverlayEnabled,
  withPopupLayout,
  withProviderVisibility,
  withToggledProviderMetric,
} from './settingsMutations';

export const OptionsApp = () => {
  const { settings, saveState, updateSettings, resetSettings } = useOptionsSettings();
  const contentRef = useRef<HTMLDivElement>(null);
  const { activeId, setActiveId } = useActiveSection(contentRef, SECTION_IDS, Boolean(settings));
  const [resetArmed, setResetArmed] = useState(false);

  if (!settings) {
    return (
      <main className="auo-loading">
        <span className="auo-loading__pulse" aria-hidden="true" />
        {msg('optionsLoading')}
      </main>
    );
  }

  /** Scrolls only the settings column — a native `#id` jump would move the whole shell. */
  const scrollToSection = (id: string): void => {
    const container = contentRef.current;
    const target = document.getElementById(id);
    if (!container || !target) return;

    setActiveId(id);
    const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top - 2;
    // Behaviour is left to the element's CSS scroll-behavior so reduced-motion wins.
    container.scrollTo({ top: container.scrollTop + offset });
  };

  const handleReset = (): void => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    resetSettings();
    setResetArmed(false);
  };

  return (
    <main className="auo-shell">
      <a
        className="auo-skip"
        href="#settings-content"
        onClick={(event) => {
          event.preventDefault();
          contentRef.current?.focus();
        }}
      >
        {msg('optionsSkip')}
      </a>
      <OptionsHeader saveState={saveState} />

      <div className="auo-layout">
        <OptionsNavigation activeId={activeId} onNavigate={scrollToSection} />
        <div id="settings-content" className="auo-content" ref={contentRef} tabIndex={-1}>
          <LanguageSettingsSection
            language={settings.language}
            onLanguageChange={(language) =>
              updateSettings((current) => withLanguage(current, language))
            }
          />
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
            <div className="auo-footer__copy">
              <strong>{msg('optionsResetTitle')}</strong>
              <span>{msg('optionsResetDescription')}</span>
            </div>
            <button
              type="button"
              className={`auo-reset ${resetArmed ? 'auo-reset--armed' : ''}`}
              onClick={handleReset}
              onBlur={() => setResetArmed(false)}
            >
              <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
              {resetArmed ? msg('optionsResetConfirm') : msg('optionsResetAction')}
            </button>
          </footer>
        </div>
      </div>
    </main>
  );
};
