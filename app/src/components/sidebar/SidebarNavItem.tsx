import { NavLink } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

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
  const navLinkStyles = {
    root: {
      borderRadius: 6,
      padding: '8px 12px',
      color: isActive ? '#101828' : '#344054',
      fontSize: 14,
      lineHeight: '20px',
      fontWeight: isActive ? 500 : 400,
      backgroundColor: isActive ? '#F9FAFB' : 'transparent',
      '&:hover': {
        backgroundColor: '#F9FAFB',
      },
    },
    section: {
      marginRight: 0,
      marginLeft: 0,
    },
    leftSection: {
      color: isActive ? '#344054' : '#667085',
      marginRight: 24,
    },
  };

  if (external) {
    return (
      <NavLink
        component="a"
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        label={label}
        leftSection={<Icon size={20} stroke={1.5} />}
        rightSection={<IconExternalLink size={14} stroke={1.5} />}
        styles={navLinkStyles}
      />
    );
  }

  return (
    <NavLink
      component={Link}
      to={path}
      label={label}
      leftSection={<Icon size={20} stroke={1.5} />}
      active={isActive}
      styles={navLinkStyles}
    />
  );
}