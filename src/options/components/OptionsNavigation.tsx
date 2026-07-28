import { Zap } from 'lucide-react';
import { msg } from '../../shared/i18n';
import { SECTIONS } from '../sections';

interface OptionsNavigationProps {
  activeId: string;
  /** Scrolls the settings column; native hash jumps would scroll the page shell instead. */
  onNavigate: (id: string) => void;
}

export const OptionsNavigation = ({ activeId, onNavigate }: OptionsNavigationProps) => (
  <div className="auo-sidebar">
    <nav className="auo-nav" aria-label={msg('optionsNavLabel')}>
      {SECTIONS.map(({ id, label, Icon }) => {
        const active = id === activeId;
        return (
          <a
            className={`auo-nav__item ${active ? 'auo-nav__item--active' : ''}`}
            href={`#${id}`}
            key={id}
            aria-current={active ? 'true' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(id);
            }}
          >
            <span className="auo-nav__icon">
              <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
            </span>
            {label}
          </a>
        );
      })}
    </nav>

    <p className="auo-sidebar__hint">
      <Zap size={13} strokeWidth={1.9} aria-hidden="true" />
      {msg('optionsInstantHint')}
    </p>
  </div>
);
