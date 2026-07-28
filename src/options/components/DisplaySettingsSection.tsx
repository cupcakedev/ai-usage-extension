import type { PopupLayout } from '../../shared/types';
import { SettingsSection } from './SettingsSection';

interface DisplaySettingsSectionProps {
  popupLayout: PopupLayout;
  onPopupLayoutChange: (layout: PopupLayout) => void;
}

const LAYOUT_OPTIONS: Array<{ value: PopupLayout; title: string; description: string }> = [
  { value: 'single', title: 'One column', description: 'A full-width card for each provider.' },
  {
    value: 'grid',
    title: 'Two columns',
    description: 'A compact overview with two cards per row.',
  },
];

export const DisplaySettingsSection = ({
  popupLayout,
  onPopupLayoutChange,
}: DisplaySettingsSectionProps) => (
  <SettingsSection
    id="display"
    kicker="Popup"
    title="Display"
    description="Choose how visible provider cards are arranged in the popup."
  >
    <div className="auo-choice-group" role="radiogroup" aria-label="Popup layout">
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
          <span>
            <strong>{title}</strong>
            <small>{description}</small>
          </span>
        </label>
      ))}
    </div>
  </SettingsSection>
);
