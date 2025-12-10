import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Group, Text, Tooltip, UnstyledButton } from '@mantine/core';

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
  const textColor = disabled
    ? 'rgba(255, 255, 255, 0.3)'
    : isActive
      ? '#4FD1C5'
      : 'rgba(255, 255, 255, 0.7)';
  const iconColor = disabled
    ? 'rgba(255, 255, 255, 0.3)'
    : isActive
      ? '#4FD1C5'
      : 'rgba(255, 255, 255, 0.5)';

  const content = (
    <Group gap={20} wrap="nowrap">
      <Icon size={20} stroke={1.5} color={iconColor} />
      <Text size="sm" fw={isActive ? 500 : 400} c={textColor} style={{ flex: 1 }}>
        {label}
      </Text>
      {external && <IconExternalLink size={14} stroke={1.5} color={iconColor} />}
    </Group>
  );

  const buttonStyles = {
    display: 'block',
    width: '100%',
    borderRadius: 6,
    padding: '8px 12px',
    backgroundColor: isActive ? 'rgba(79, 209, 197, 0.1)' : 'transparent',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: disabled ? 'transparent' : 'rgba(79, 209, 197, 0.1)',
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
