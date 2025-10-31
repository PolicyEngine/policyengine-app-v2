import { Anchor, Group } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface NavLink {
  label: string;
  path?: string;
}

interface DesktopNavigationProps {
  navLinks: NavLink[];
  onNavClick: (path?: string) => void;
}

export default function DesktopNavigation({
  navLinks,
  onNavClick,
}: DesktopNavigationProps) {
  return (
    <Group gap={spacing['3xl']} visibleFrom="lg">
      {navLinks.map((link) => (
        <Anchor
          key={link.label}
          c={colors.text.inverse}
          variant="subtle"
          td="none"
          fw={typography.fontWeight.medium}
          size="md"
          onClick={() => onNavClick(link.path)}
        >
          {link.label}
        </Anchor>
      ))}
    </Group>
  );
}
