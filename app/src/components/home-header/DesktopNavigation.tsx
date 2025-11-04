import { Group } from '@mantine/core';
import { spacing } from '@/designTokens';
import NavItem, { NavItemSetup } from './NavItem';

interface DesktopNavigationProps {
  navItems: NavItemSetup[];
}

export default function DesktopNavigation({ navItems }: DesktopNavigationProps) {
  return (
    <Group gap={spacing['3xl']} visibleFrom="lg" align="center">
      {navItems.map((item) => (
        <NavItem key={item.label} setup={item} />
      ))}
    </Group>
  );
}
