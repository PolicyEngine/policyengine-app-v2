import { IconChevronDown, IconHomeFilled } from '@tabler/icons-react';
import { Anchor, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

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
  const countryId = useCurrentCountry();

  return (
    <Group gap={spacing['3xl']} visibleFrom="lg" align="center">
      <UnstyledButton
        onClick={() => onNavClick(`https://policyengine.org/${countryId}`)}
        aria-label="Home"
        h={18} // UnstyledButton automatically expands height to fill; we don't want that to ensure icon is correct size & position
        style={{ lineHeight: 1, aspectRatio: '1 / 1' }}
      >
        <IconHomeFilled size={18} color={colors.text.inverse} />
      </UnstyledButton>

      <Menu shadow="md" width={200} zIndex={1001} position="bottom" offset={10}>
        <Menu.Target>
          <UnstyledButton>
            <Group gap={4} align="center">
              <Text
                c={colors.text.inverse}
                fw={typography.fontWeight.medium}
                size="18px"
                style={{ fontFamily: typography.fontFamily.primary }}
              >
                About
              </Text>
              <IconChevronDown size={18} color={colors.text.inverse} />
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
          size="18px"
          style={{ fontFamily: typography.fontFamily.primary }}
          onClick={() => onNavClick(link.path)}
        >
          {link.label}
        </Anchor>
      ))}
    </Group>
  );
}
