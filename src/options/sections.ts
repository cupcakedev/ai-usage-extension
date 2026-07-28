import { BadgePercent, Layers3, LayoutDashboard, MonitorCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { msg } from '../shared/i18n';

export interface SectionDefinition {
  id: string;
  label: string;
  title: string;
  description: string;
  Icon: LucideIcon;
}

/** Single source of truth for the side navigation and the section headers it links to. */
export const SECTIONS: SectionDefinition[] = [
  {
    id: 'display',
    label: msg('optionsNavLayout'),
    title: msg('optionsLayoutTitle'),
    description: msg('optionsLayoutDescription'),
    Icon: LayoutDashboard,
  },
  {
    id: 'providers',
    label: msg('optionsNavProviders'),
    title: msg('optionsProvidersTitle'),
    description: msg('optionsProvidersDescription'),
    Icon: Layers3,
  },
  {
    id: 'badge',
    label: msg('optionsNavBadge'),
    title: msg('optionsBadgeTitle'),
    description: msg('optionsBadgeDescription'),
    Icon: BadgePercent,
  },
  {
    id: 'overlays',
    label: msg('optionsNavOverlays'),
    title: msg('optionsOverlaysTitle'),
    description: msg('optionsOverlaysDescription'),
    Icon: MonitorCog,
  },
];

export const SECTION_IDS: string[] = SECTIONS.map((section) => section.id);

export const sectionById = (id: string): SectionDefinition => {
  const section = SECTIONS.find((candidate) => candidate.id === id);
  if (!section) throw new Error(`Unknown settings section: ${id}`);
  return section;
};
