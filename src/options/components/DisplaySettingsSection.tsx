import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';
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
  width: string;
  cards: number;
}> = [
  {
    value: 'single',
    title: msg('optionsLayoutSingle'),
    description: msg('optionsLayoutSingleDescription'),
    width: msg('optionsLayoutSingleWidth'),
    cards: 3,
  },
  {
    value: 'grid',
    title: msg('optionsLayoutGrid'),
    description: msg('optionsLayoutGridDescription'),
    width: msg('optionsLayoutGridWidth'),
    cards: 4,
  },
];

/** Miniature of the popup so the layout choice can be judged at a glance. */
const LayoutPreview = ({ layout, cards }: { layout: PopupLayout; cards: number }) => (
  <span className={`auo-preview auo-preview--${layout}`} aria-hidden="true">
    <span className="auo-preview__bar">
      <i />
      <i />
    </span>
    <span className="auo-preview__cards">
      {Array.from({ length: cards }, (_, index) => (
        <span className="auo-preview__card" key={index}>
          <span className="auo-preview__dot" />
          <span className="auo-preview__lines">
            <i />
            <i />
          </span>
          <span
            className="auo-preview__meter"
            style={{ '--fill-width': `${72 - index * 17}%` } as CSSProperties}
          />
        </span>
      ))}
    </span>
  </span>
);

export const DisplaySettingsSection = ({
  popupLayout,
  onPopupLayoutChange,
}: DisplaySettingsSectionProps) => (
  <SettingsSection id="display">
    <div className="auo-choice-group" role="radiogroup" aria-label={msg('optionsLayoutTitle')}>
      {LAYOUT_OPTIONS.map(({ value, title, description, width, cards }) => (
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
          <LayoutPreview layout={value} cards={cards} />
          <span className="auo-choice__text">
            <strong>
              {title}
              <span className="auo-choice__mark" aria-hidden="true">
                <Check size={11} strokeWidth={3} />
              </span>
            </strong>
            <small>{description}</small>
            <em>{width}</em>
          </span>
        </label>
      ))}
    </div>
  </SettingsSection>
);
