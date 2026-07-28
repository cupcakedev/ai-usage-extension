import { Check } from 'lucide-react';
import { msg } from '../../shared/i18n';
import type { PopupLayout } from '../../shared/types';
import { SettingsSection } from './SettingsSection';

interface DisplaySettingsSectionProps {
  popupLayout: PopupLayout;
  onPopupLayoutChange: (layout: PopupLayout) => void;
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
  </SettingsSection>
);
