import { msg } from '../../shared/i18n';
import type { ExtensionSettings, RefreshMode } from '../../shared/types';
import { SettingsSection } from './SettingsSection';

interface RefreshSettingsSectionProps {
  refresh: ExtensionSettings['refresh'];
  onModeChange: (mode: RefreshMode) => void;
  onIntervalChange: (minutes: number) => void;
}

export const RefreshSettingsSection = ({
  refresh,
  onModeChange,
  onIntervalChange,
}: RefreshSettingsSectionProps) => (
  <SettingsSection id="refresh">
    <div className="auo-select-grid">
      <label className="auo-field">
        <span className="auo-field__label">{msg('optionsRefreshTitle')}</span>
        <select
          value={refresh.mode}
          onChange={(event) => onModeChange(event.target.value as RefreshMode)}
        >
          <option value="auto">{msg('optionsRefreshAuto')}</option>
          <option value="manual">{msg('optionsRefreshManual')}</option>
        </select>
      </label>
      <label className="auo-field">
        <span className="auo-field__label">{msg('optionsRefreshInterval')}</span>
        <input
          key={refresh.intervalMinutes}
          type="number"
          min="1"
          step="any"
          required
          defaultValue={refresh.intervalMinutes}
          disabled={refresh.mode === 'manual'}
          onBlur={(event) => {
            const input = event.currentTarget;
            if (input.reportValidity()) onIntervalChange(input.valueAsNumber);
            else input.value = String(refresh.intervalMinutes);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      </label>
    </div>
  </SettingsSection>
);
