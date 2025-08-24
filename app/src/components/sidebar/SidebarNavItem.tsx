import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Group, Text, UnstyledButton } from '@mantine/core';
import { colors } from '../../designTokens';

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
      <Icon size={20} stroke={1.5} color={isActive ? colors.gray[700] : colors.text.secondary} />
      <Text
        size="sm"
        fw={isActive ? 500 : 400}
        c={isActive ? colors.gray[900] : colors.gray[700]}
        style={{ flex: 1 }}
      >
        {label}
      </Text>
      {external && <IconExternalLink size={14} stroke={1.5} color={colors.text.secondary} />}
    </Group>
  );

  const buttonStyles = {
    display: 'block',
    width: '100%',
    borderRadius: 6,
    padding: '8px 12px',
    backgroundColor: isActive ? colors.gray[50] : 'transparent',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: colors.gray[50],
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
