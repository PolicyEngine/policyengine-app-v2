import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Group, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { colors } from '../../designTokens';

interface SidebarNavItemProps {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  isActive?: boolean;
  external?: boolean;
  disabled?: boolean;
}

export default function SidebarNavItem({
  label,
  icon: Icon,
  path,
  isActive,
  external,
  disabled,
}: SidebarNavItemProps) {
  const content = (
    <Group gap={20} wrap="nowrap">
      <Icon
        size={20}
        stroke={1.5}
        color={disabled ? colors.gray[400] : isActive ? colors.gray[700] : colors.text.secondary}
      />
      <Text
        size="sm"
        fw={isActive ? 500 : 400}
        c={disabled ? colors.gray[400] : isActive ? colors.gray[900] : colors.gray[700]}
        style={{ flex: 1 }}
      >
        {label}
      </Text>
      {external && (
        <IconExternalLink
          size={14}
          stroke={1.5}
          color={disabled ? colors.gray[400] : colors.text.secondary}
        />
      )}
    </Group>
  );

  const buttonStyles = {
    display: 'block',
    width: '100%',
    borderRadius: 6,
    padding: '8px 12px',
    backgroundColor: isActive ? colors.gray[50] : 'transparent',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    '&:hover': {
      backgroundColor: disabled ? 'transparent' : colors.gray[50],
    },
  };

  if (disabled) {
    return (
      <Tooltip label="Under development" position="right" withArrow style={{ padding: '8px' }}>
        <UnstyledButton style={buttonStyles} onClick={(e) => e.preventDefault()}>
          {content}
        </UnstyledButton>
      </Tooltip>
    );
  }

  if (external) {
    return (
      <UnstyledButton
        component="a"
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        style={buttonStyles}
      >
        {content}
      </UnstyledButton>
    );
  }

  return (
    <UnstyledButton component={Link} to={path} style={buttonStyles}>
      {content}
    </UnstyledButton>
  );
}
