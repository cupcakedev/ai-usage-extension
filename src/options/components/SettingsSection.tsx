import type { ReactNode } from 'react';

interface SettingsSectionProps {
  id: string;
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
}

export const SettingsSection = ({
  id,
  kicker,
  title,
  description,
  children,
}: SettingsSectionProps) => (
  <section id={id} className="auo-section" aria-labelledby={`${id}-title`}>
    <div className="auo-section__intro">
      <p className="auo-kicker">{kicker}</p>
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{description}</p>
    </div>
    {children}
  </section>
);
