import { Group } from '@mantine/core';
import { spacing } from '../../tokens';
import { NavItem } from './NavItem';
import { NavItemSetup } from './types';

interface DesktopNavigationProps {
  navItems: NavItemSetup[];
}

export function DesktopNavigation({ navItems }: DesktopNavigationProps) {
  return (
    <Group gap={spacing['3xl']} visibleFrom="lg" align="center">
      {navItems.map((item) => (
        <NavItem key={item.label} setup={item} />
      ))}
    </Group>
  );
}
