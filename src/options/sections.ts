import { BadgePercent, Layers3, LayoutDashboard, MonitorCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
    label: 'Layout',
    title: 'Popup layout',
    description: 'Choose how visible provider cards are arranged in the popup.',
    Icon: LayoutDashboard,
  },
  {
    id: 'providers',
    label: 'Providers',
    title: 'Providers',
    description:
      'Hide a card or choose the usage details it can display. Unavailable data stays hidden automatically.',
    Icon: Layers3,
  },
  {
    id: 'badge',
    label: 'Toolbar badge',
    title: 'Badge range',
    description: 'The extension icon changes by 10% ranges based on this source.',
    Icon: BadgePercent,
  },
  {
    id: 'overlays',
    label: 'On-page overlays',
    title: 'On-page overlays',
    description: 'Show the collapsible usage capsule next to the message composer.',
    Icon: MonitorCog,
  },
];

export const SECTION_IDS: string[] = SECTIONS.map((section) => section.id);

export const sectionById = (id: string): SectionDefinition => {
  const section = SECTIONS.find((candidate) => candidate.id === id);
  if (!section) throw new Error(`Unknown settings section: ${id}`);
  return section;
};
