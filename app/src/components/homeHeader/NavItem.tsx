/**
 * NavItem - Editorial Navigation Element
 *
 * Refined navigation items with elegant hover states and smooth transitions.
 * Features subtle underline animation on hover.
 */

import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface DropdownItem {
  label: string;
  onClick: () => void;
}

export interface NavItemSetup {
  label: string;
  onClick: () => void;
  hasDropdown: boolean;
  dropdownItems?: DropdownItem[];
}

interface NavItemProps {
  setup: NavItemSetup;
}

/**
 * Reusable navigation item component
 * Can be either a simple link or a dropdown menu
 */
export default function NavItem({ setup }: NavItemProps) {
  const { label, onClick, hasDropdown, dropdownItems } = setup;
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = {
    color: colors.white,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.wide,
    cursor: 'pointer',
    position: 'relative' as const,
    paddingBottom: '2px',
  };

  const underlineStyles = {
    content: '""',
    position: 'absolute' as const,
    bottom: '-2px',
    left: 0,
    height: '2px',
    backgroundColor: colors.accent[400],
    transition: 'width 200ms ease-out',
    width: isHovered ? '100%' : '0%',
  };

  if (hasDropdown && dropdownItems) {
    return (
      <Menu
        shadow="lg"
        width={200}
        zIndex={1001}
        position="bottom-start"
        offset={12}
        styles={{
          dropdown: {
            backgroundColor: colors.white,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.lg,
            padding: spacing.sm,
            boxShadow: spacing.shadow.lg,
          },
          item: {
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: spacing.radius.md,
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.primary,
            transition: 'all 150ms ease',
            '&:hover': {
              backgroundColor: colors.primary[50],
              color: colors.primary[700],
            },
          },
        }}
      >
        <Menu.Target>
          <UnstyledButton
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={baseStyles}
          >
            <Group gap={6} align="center">
              <Text
                inherit
                style={{
                  position: 'relative',
                }}
              >
                {label}
                <span style={underlineStyles} />
              </Text>
              <IconChevronDown
                size={16}
                color={colors.white}
                style={{
                  transition: 'transform 200ms ease',
                  transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)',
                  opacity: 0.8,
                }}
              />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {dropdownItems.map((item) => (
            <Menu.Item key={item.label} onClick={item.onClick}>
              {item.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={baseStyles}
    >
      <Text
        inherit
        style={{
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {label}
        <span style={underlineStyles} />
      </Text>
    </UnstyledButton>
  );
}
