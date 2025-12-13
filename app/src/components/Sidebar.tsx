import {
  IconBook,
  IconBrandGithub,
  IconBrandSlack,
  IconFileDescription,
  IconGitBranch,
  IconMail,
  IconPlus,
  IconScale,
  IconSettings2,
  IconUsers,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Stack } from '@mantine/core';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { spacing, typography } from '../designTokens';
import SidebarDivider from './sidebar/SidebarDivider';
import SidebarNavItem from './sidebar/SidebarNavItem';
import SidebarSection from './sidebar/SidebarSection';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  // All internal navigation paths include the country prefix for consistency with v1 app
  const navItems = [
    { label: 'Reports', icon: IconFileDescription, path: `/${countryId}/reports` },
    { label: 'Simulations', icon: IconGitBranch, path: `/${countryId}/simulations` },
    { label: 'Policies', icon: IconScale, path: `/${countryId}/policies` },
    { label: 'Households', icon: IconUsers, path: `/${countryId}/households` },
  ];

  const resourceItems = [
    {
      label: 'GitHub',
      icon: IconBrandGithub,
      path: 'https://github.com/PolicyEngine',
      external: true,
    },
    {
      label: 'Join Slack',
      icon: IconBrandSlack,
      // NOTE: Temporary 30-day joining link added on November 2, 2025
      // Will expire after 30 days OR after 100 people join the Slack
      // TODO: Update this link when it expires
      path: 'https://join.slack.com/t/policyengine-group/shared_invite/zt-3h69snorb-2MPNgFuRGucqGLG_15tijQ',
      external: true,
    },
    {
      label: 'View research',
      icon: IconBook,
      path: `/${countryId}/research`,
      external: true,
    },
  ];

  const accountItems = [
    {
      label: 'Contact support',
      icon: IconMail,
      path: 'mailto:hello@policyengine.org',
      external: true,
    },
    {
      label: 'Account settings',
      icon: IconSettings2,
      path: `/${countryId}/account`,
      disabled: true,
    },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <Stack
      h="100vh"
      style={{
        background: 'linear-gradient(180deg, #0d2b2a 0%, #0a1f1e 100%)',
        borderRight: '1px solid rgba(79, 209, 197, 0.1)',
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
            rightSection={<IconPlus size={16} />}
            fullWidth
            variant="filled"
            size="sm"
            h={36}
            styles={{
              root: {
                background: 'linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)',
                color: '#0d2b2a',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                border: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 20px rgba(79, 209, 197, 0.3)',
                },
              },
            }}
            onClick={() => navigate(`/${countryId}/reports/create`)}
          >
            New report
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
