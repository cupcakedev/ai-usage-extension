import { Check } from 'lucide-react';
import { msg } from '../../shared/i18n';
import type { PercentageDisplay, PopupLayout } from '../../shared/types';
import { SettingsSection } from './SettingsSection';

interface DisplaySettingsSectionProps {
  popupLayout: PopupLayout;
  onPopupLayoutChange: (layout: PopupLayout) => void;
  percentageDisplay: PercentageDisplay;
  onPercentageDisplayChange: (display: PercentageDisplay) => void;
}

const LAYOUT_OPTIONS: Array<{
  value: PopupLayout;
  title: string;
  description: string;
}> = [
  {
    value: 'single',
    title: msg('optionsLayoutSingle'),
    description: msg('optionsLayoutSingleDescription'),
  },
  {
    value: 'grid',
    title: msg('optionsLayoutGrid'),
    description: msg('optionsLayoutGridDescription'),
  },
];

export const DisplaySettingsSection = ({
  popupLayout,
  onPopupLayoutChange,
  percentageDisplay,
  onPercentageDisplayChange,
}: DisplaySettingsSectionProps) => (
  <SettingsSection id="display">
    <div className="auo-choice-group" role="radiogroup" aria-label={msg('optionsLayoutTitle')}>
      {LAYOUT_OPTIONS.map(({ value, title, description }) => (
        <label
          className={`auo-choice ${popupLayout === value ? 'auo-choice--selected' : ''}`}
          key={value}
        >
          <input
            type="radio"
            name="popup-layout"
            value={value}
            checked={popupLayout === value}
            onChange={() => onPopupLayoutChange(value)}
          />
          <span className="auo-choice__text">
            <strong>
              {title}
              <span className="auo-choice__mark" aria-hidden="true">
                <Check size={11} strokeWidth={3} />
              </span>
            </strong>
            <small>{description}</small>
          </span>
        </label>
      ))}
    </div>
    <label className="auo-field auo-percentage-field">
      <span className="auo-field__label">{msg('optionsPercentageTitle')}</span>
      <select
        value={percentageDisplay}
        onChange={(event) => onPercentageDisplayChange(event.target.value as PercentageDisplay)}
      >
        <option value="used">
          {msg('optionsPercentageUsed')} — {msg('percentageUsed', '13')}
        </option>
        <option value="remaining">
          {msg('optionsPercentageRemaining')} — {msg('percentageRemaining', '87')}
        </option>
      </select>
    </label>
  </SettingsSection>
);
