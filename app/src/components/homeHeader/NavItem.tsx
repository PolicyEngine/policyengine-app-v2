import { IconChevronDown } from '@tabler/icons-react';
import { Anchor, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { typography } from '@/designTokens';

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

  const textColor = 'rgba(255, 255, 255, 0.9)';
  const hoverColor = '#4FD1C5';

  if (hasDropdown && dropdownItems) {
    return (
      <Menu shadow="md" width={200} zIndex={1001} position="bottom" offset={10}>
        <Menu.Target>
          <UnstyledButton
            onClick={onClick}
            style={{
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const text = e.currentTarget.querySelector('span');
              const icon = e.currentTarget.querySelector('svg');
              if (text) (text as HTMLElement).style.color = hoverColor;
              if (icon) (icon as SVGElement).style.color = hoverColor;
            }}
            onMouseLeave={(e) => {
              const text = e.currentTarget.querySelector('span');
              const icon = e.currentTarget.querySelector('svg');
              if (text) (text as HTMLElement).style.color = textColor;
              if (icon) (icon as SVGElement).style.color = textColor;
            }}
          >
            <Group gap={4} align="center">
              <Text
                component="span"
                c={textColor}
                fw={typography.fontWeight.medium}
                size="18px"
                style={{
                  fontFamily: typography.fontFamily.primary,
                  transition: 'color 0.2s ease',
                }}
              >
                {label}
              </Text>
              <IconChevronDown
                size={18}
                color={textColor}
                style={{ transition: 'color 0.2s ease' }}
              />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown
          style={{
            background: 'rgba(13, 43, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(79, 209, 197, 0.2)',
          }}
        >
          {dropdownItems.map((item) => (
            <Menu.Item
              key={item.label}
              onClick={item.onClick}
              style={{
                color: textColor,
                fontFamily: typography.fontFamily.primary,
              }}
            >
              {item.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Anchor
      c={textColor}
      variant="subtle"
      td="none"
      fw={typography.fontWeight.medium}
      size="18px"
      style={{
        fontFamily: typography.fontFamily.primary,
        transition: 'color 0.2s ease',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = textColor;
      }}
    >
      {label}
    </Anchor>
  );
}
