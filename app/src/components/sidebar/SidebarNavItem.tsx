import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Group, Text, UnstyledButton } from '@mantine/core';

interface SidebarNavItemProps {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  isActive?: boolean;
  external?: boolean;
}

export default function SidebarNavItem({
  label,
  icon: Icon,
  path,
  isActive,
  external,
}: SidebarNavItemProps) {
  const content = (
    <Group gap={20} wrap="nowrap">
      <Icon size={20} stroke={1.5} color={isActive ? '#344054' : '#667085'} />
      <Text
        size="sm"
        fw={isActive ? 500 : 400}
        c={isActive ? '#101828' : '#344054'}
        style={{ flex: 1 }}
      >
        {label}
      </Text>
      {external && <IconExternalLink size={14} stroke={1.5} color="#667085" />}
    </Group>
  );

  const buttonStyles = {
    display: 'block',
    width: '100%',
    borderRadius: 6,
    padding: '8px 12px',
    backgroundColor: isActive ? '#F9FAFB' : 'transparent',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: '#F9FAFB',
    },
  };

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
