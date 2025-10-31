import { IconChevronDown } from '@tabler/icons-react';
import { Anchor, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface NavLink {
  label: string;
  path?: string;
}

interface DesktopNavigationProps {
  navLinks: NavLink[];
  aboutLinks: NavLink[];
  onNavClick: (path?: string) => void;
}

export default function DesktopNavigation({
  navLinks,
  aboutLinks,
  onNavClick,
}: DesktopNavigationProps) {
  return (
    <Group gap={spacing['3xl']} visibleFrom="lg">
      <Menu shadow="md" width={200} zIndex={1001} position="bottom" offset={10}>
        <Menu.Target>
          <UnstyledButton>
            <Group gap={4}>
              <Text
                c={colors.text.inverse}
                fw={typography.fontWeight.medium}
                size="md"
                style={{ fontFamily: typography.fontFamily.primary }}
              >
                About
              </Text>
              <IconChevronDown size={16} color={colors.text.inverse} />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {aboutLinks.map((link) => (
            <Menu.Item key={link.label} onClick={() => onNavClick(link.path)}>
              {link.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      {navLinks.map((link) => (
        <Anchor
          key={link.label}
          c={colors.text.inverse}
          variant="subtle"
          td="none"
          fw={typography.fontWeight.medium}
          size="md"
          style={{ fontFamily: typography.fontFamily.primary }}
          onClick={() => onNavClick(link.path)}
        >
          {link.label}
        </Anchor>
      ))}
    </Group>
  );
}
