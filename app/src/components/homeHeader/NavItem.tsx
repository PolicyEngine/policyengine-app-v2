import { IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Anchor, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { colors, typography } from '@/designTokens';

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface NavItemSetup {
  label: string;
  onClick?: () => void;
  href?: string;
  hasDropdown: boolean;
  dropdownItems?: DropdownItem[];
}

interface NavItemProps {
  setup: NavItemSetup;
}

const linkStyles = {
  color: colors.text.inverse,
  fontWeight: typography.fontWeight.medium,
  fontSize: '18px',
  fontFamily: typography.fontFamily.primary,
  textDecoration: 'none',
};

/**
 * Check if href is a relative path (internal) vs absolute URL (external).
 * Type guard that narrows href to string when true.
 */
function isInternalHref(href: string | undefined): href is string {
  return !!href && href.startsWith('/');
}

/**
 * Reusable navigation item component.
 * Can be either a simple link or a dropdown menu.
 *
 * Automatically uses React Router's Link for relative paths (SPA navigation)
 * and standard <a> tags for absolute URLs (cross-app navigation).
 */
export default function NavItem({ setup }: NavItemProps) {
  const { label, onClick, href, hasDropdown, dropdownItems } = setup;

  if (hasDropdown && dropdownItems) {
    return (
      <Menu shadow="md" width={200} zIndex={1001} position="bottom" offset={10}>
        <Menu.Target>
          <UnstyledButton onClick={onClick}>
            <Group gap={4} align="center">
              <Text
                c={colors.text.inverse}
                fw={typography.fontWeight.medium}
                size="18px"
                style={{ fontFamily: typography.fontFamily.primary }}
              >
                {label}
              </Text>
              <IconChevronDown size={18} color={colors.text.inverse} />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {dropdownItems.map((item) =>
            item.href ? (
              isInternalHref(item.href) ? (
                <Menu.Item key={item.label} component={Link} to={item.href}>
                  {item.label}
                </Menu.Item>
              ) : (
                <Menu.Item key={item.label} component="a" href={item.href}>
                  {item.label}
                </Menu.Item>
              )
            ) : (
              <Menu.Item key={item.label} onClick={item.onClick}>
                {item.label}
              </Menu.Item>
            )
          )}
        </Menu.Dropdown>
      </Menu>
    );
  }

  // Relative paths use React Router's Link for SPA behavior
  if (isInternalHref(href)) {
    return (
      <Link to={href} style={linkStyles}>
        {label}
      </Link>
    );
  }

  // Absolute URLs use standard anchor tag
  return (
    <Anchor
      c={colors.text.inverse}
      variant="subtle"
      td="none"
      fw={typography.fontWeight.medium}
      size="18px"
      style={{ fontFamily: typography.fontFamily.primary }}
      href={href}
      onClick={href ? undefined : onClick}
    >
      {label}
    </Anchor>
  );
}
