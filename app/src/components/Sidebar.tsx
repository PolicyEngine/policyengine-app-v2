import {
  IconBook,
  IconExternalLink,
  IconFileDescription,
  IconGitBranch,
  IconPlus,
  IconScale,
  IconSettings2,
  IconUsers,
} from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import { Box, Button, Stack } from '@mantine/core';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { colors, spacing, typography } from '../designTokens';
import SidebarDivider from './sidebar/SidebarDivider';
import SidebarNavItem from './sidebar/SidebarNavItem';
import SidebarSection from './sidebar/SidebarSection';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const location = useLocation();
  const countryId = useCurrentCountry();

  // All internal navigation paths include the country prefix for consistency with v1 app
  const navItems = [
    { label: 'Reports', icon: IconFileDescription, path: `/${countryId}/reports` },
    { label: 'Simulations', icon: IconGitBranch, path: `/${countryId}/simulations` },
    { label: 'Policies', icon: IconScale, path: `/${countryId}/policies` },
    { label: 'Populations', icon: IconUsers, path: `/${countryId}/populations` },
  ];

  const resourceItems = [
    {
      label: 'GitHub',
      icon: IconGitBranch,
      path: 'https://github.com/PolicyEngine',
      external: true,
    },
    { label: 'Join Slack', icon: IconExternalLink, path: 'https://slack.com', external: true },
    { label: 'Visit Blog', icon: IconBook, path: 'https://blog.example.com', external: true },
    { label: 'Methodology', icon: IconFileDescription, path: `/${countryId}/methodology` },
  ];

  const accountItems = [
    { label: 'Account Settings', icon: IconSettings2, path: `/${countryId}/account` },
    { label: 'Contact Support', icon: IconExternalLink, path: `/${countryId}/support` },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <Stack
      h="100vh"
      bg="white"
      style={{
        borderRight: `1px solid ${colors.border.light}`,
        width: parseInt(spacing.appShell.navbar.width, 10),
        left: 0,
        top: 0,
        overflowY: 'auto',
      }}
      gap={0}
    >
      <Stack gap={0}>
        <Box px={16} py={16}>
          <Button
            leftSection={<IconPlus size={16} stroke={2} />}
            fullWidth
            variant="filled"
            size="sm"
            h={36}
            styles={{
              root: {
                backgroundColor: colors.primary[600],
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
              },
            }}
          >
            Create report
          </Button>
        </Box>
      </Stack>

      <Stack gap={0} style={{ flex: 1 }}>
        <SidebarSection>
          {navItems.map((item) => (
            <SidebarNavItem key={item.path} {...item} isActive={location.pathname === item.path} />
          ))}
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection title="Resources">
          {resourceItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              {...item}
              isActive={!item.external && location.pathname === item.path}
            />
          ))}
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection title="My account">
          {accountItems.map((item) => (
            <SidebarNavItem key={item.path} {...item} isActive={location.pathname === item.path} />
          ))}
        </SidebarSection>
      </Stack>
    </Stack>
  );
}
