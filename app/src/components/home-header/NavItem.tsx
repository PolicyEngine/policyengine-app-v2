import { IconChevronDown } from '@tabler/icons-react';
import { Anchor, Group, Menu, Text, UnstyledButton } from '@mantine/core';
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
    <Anchor
      c={colors.text.inverse}
      variant="subtle"
      td="none"
      fw={typography.fontWeight.medium}
      size="18px"
      style={{ fontFamily: typography.fontFamily.primary }}
      onClick={onClick}
    >
      {label}
    </Anchor>
  );
}
