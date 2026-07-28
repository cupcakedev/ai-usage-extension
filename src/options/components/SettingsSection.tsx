import type { ReactNode } from 'react';
import { sectionById } from '../sections';

interface SettingsSectionProps {
  id: string;
  /** Optional trailing element rendered on the right of the section header. */
  aside?: ReactNode;
  children: ReactNode;
}

/** Panel wrapper; its copy and icon come from the shared section registry. */
export const SettingsSection = ({ id, aside, children }: SettingsSectionProps) => {
  const { title, description, Icon } = sectionById(id);

  return (
    <section id={id} className="auo-section" aria-labelledby={`${id}-title`}>
      <div className="auo-section__head">
        <span className="auo-section__glyph" aria-hidden="true">
          <Icon size={16} strokeWidth={1.9} />
        </span>
        <div className="auo-section__intro">
          <h2 id={`${id}-title`}>{title}</h2>
          <p className="auo-section__description">{description}</p>
        </div>
        {aside && <div className="auo-section__aside">{aside}</div>}
      </div>
      <div className="auo-section__body">{children}</div>
    </section>
  );
};
