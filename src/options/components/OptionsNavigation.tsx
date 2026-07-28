import { BadgePercent, Layers3, LayoutDashboard, MonitorCog } from 'lucide-react';

const NAVIGATION_ITEMS = [
  { href: '#display', label: 'Display', Icon: LayoutDashboard },
  { href: '#providers', label: 'Providers', Icon: Layers3 },
  { href: '#badge', label: 'Toolbar badge', Icon: BadgePercent },
  { href: '#overlays', label: 'On-page overlays', Icon: MonitorCog },
] as const;

export const OptionsNavigation = () => (
  <nav className="auo-nav" aria-label="Settings sections">
    {NAVIGATION_ITEMS.map(({ href, label, Icon }) => (
      <a href={href} key={href}>
        <Icon size={15} aria-hidden="true" />
        {label}
      </a>
    ))}
  </nav>
);
