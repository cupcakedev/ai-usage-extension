import { msg } from '../../shared/i18n';
import { UI_LOCALES, type LanguagePreference } from '../../shared/locales';
import { SettingsSection } from './SettingsSection';

interface LanguageSettingsSectionProps {
  language: LanguagePreference;
  onLanguageChange: (language: LanguagePreference) => void;
}

export const LanguageSettingsSection = ({
  language,
  onLanguageChange,
}: LanguageSettingsSectionProps) => (
  <SettingsSection id="language">
    <div className="auo-select-grid">
      <div className="auo-field">
        <select
          aria-label={msg('optionsLanguageTitle')}
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          <option value="auto">{msg('optionsLanguageAuto')}</option>
          {UI_LOCALES.map((locale) => (
            <option key={locale.id} value={locale.id}>
              {locale.label}
            </option>
          ))}
        </select>
        <small className="auo-field__hint">{msg('optionsLanguageHint')}</small>
      </div>
    </div>
  </SettingsSection>
);
