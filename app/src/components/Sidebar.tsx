import {
  IconBook,
  IconExternalLink,
  IconFileDescription,
  IconGitBranch,
  IconHome,
  IconPlus,
  IconSettings2,
  IconDatabase,
  IconChartBar,
  IconFileAnalytics,
  IconAdjustments,
  IconPlaystationSquare,
} from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import { Box, Button, Divider, Stack, Text } from '@mantine/core';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { colors, spacing, typography } from '../designTokens';
import SidebarDivider from './sidebar/SidebarDivider';
import SidebarNavItem from './sidebar/SidebarNavItem';
import SidebarSection from './sidebar/SidebarSection';
import SidebarUser from './sidebar/SidebarUser';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const location = useLocation();
  const countryId = useCurrentCountry();

  // Core data model navigation - all the main entities
  const dataItems = [
    { label: 'Policies', icon: IconFileDescription, path: `/${countryId}/policies` },
    { label: 'Dynamics', icon: IconAdjustments, path: `/${countryId}/dynamics` },
    { label: 'Datasets', icon: IconDatabase, path: `/${countryId}/datasets` },
    { label: 'Simulations', icon: IconPlaystationSquare, path: `/${countryId}/simulations` },
    { label: 'Reports', icon: IconFileAnalytics, path: `/${countryId}/reports` },
  ];

  const resourceItems = [
    { label: 'GitHub', icon: IconGitBranch, path: 'https://github.com', external: true },
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
            Create new
          </Button>
        </Box>
      </Stack>

      <Stack gap={0} style={{ flex: 1 }}>
        <SidebarSection>
          <SidebarNavItem
            label="Home"
            icon={IconHome}
            path={`/${countryId}`}
            isActive={location.pathname === `/${countryId}`}
          />
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection title="Data models">
          {dataItems.map((item) => (
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

      <Box p={16}>
        <Divider mb={16} color={colors.border.light} />
        <Stack gap={8}>
          <Text size="xs" c={colors.text.secondary} style={{ fontSize: 10 }}>
            Running 2 items
          </Text>
          <Box
            p={8}
            style={{
              border: `1px solid ${colors.border.light}`,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <Stack gap={4}>
              <Text size="xs" fw={600} c={colors.gray[900]} style={{ fontSize: 12 }}>
                Report title
              </Text>
              <Text size="xs" c={colors.text.secondary} style={{ fontSize: 11 }}>
                300 KB
              </Text>
            </Stack>
          </Box>
          <Button
            variant="subtle"
            size="xs"
            c={colors.gray[700]}
            styles={{
              root: {
                fontSize: 12,
                fontWeight: 400,
                height: 'auto',
                padding: '4px 0',
              },
            }}
          >
            View Report
          </Button>
        </Stack>
        <Divider my={16} color={colors.border.light} />
        <SidebarUser name="Olivia Rhye" initials="OR" />
      </Box>
    </Stack>
  );
}
