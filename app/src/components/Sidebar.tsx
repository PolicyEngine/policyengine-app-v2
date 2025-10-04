import {
  IconAdjustments,
  IconBook,
  IconChartBar,
  IconDatabase,
  IconExternalLink,
  IconFileAnalytics,
  IconFileDescription,
  IconGitBranch,
  IconHome,
  IconPlaystationSquare,
  IconPlus,
  IconSettings2,
} from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Divider, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '../designTokens';
import SidebarDivider from './sidebar/SidebarDivider';
import SidebarNavItem from './sidebar/SidebarNavItem';
import SidebarSection from './sidebar/SidebarSection';
import SidebarUser from './sidebar/SidebarUser';
import { usersAPI } from '@/api/v2/users';
import { MOCK_USER_ID } from '@/constants';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const location = useLocation();
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => usersAPI.getUser(userId),
  });

  const displayName = usersAPI.getDisplayName(user || { username: 'User' });
  const initials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';

  // Core data model navigation - all the main entities
  const dataItems = [
    { label: 'Policies', icon: IconFileDescription, path: '/policies' },
    { label: 'Dynamics', icon: IconAdjustments, path: '/dynamics' },
    { label: 'Datasets', icon: IconDatabase, path: '/datasets' },
    { label: 'Simulations', icon: IconPlaystationSquare, path: '/simulations' },
    { label: 'Reports', icon: IconFileAnalytics, path: '/reports' },
  ];

  const resourceItems = [
    { label: 'GitHub', icon: IconGitBranch, path: 'https://github.com', external: true },
    { label: 'Join Slack', icon: IconExternalLink, path: 'https://slack.com', external: true },
    { label: 'Visit Blog', icon: IconBook, path: 'https://blog.example.com', external: true },
    { label: 'Methodology', icon: IconFileDescription, path: '/methodology' },
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
        overflow: 'hidden',
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

      <Stack gap={0} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarSection>
            <SidebarNavItem
              label="Home"
              icon={IconHome}
              path="/"
              isActive={location.pathname === '/'}
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

        </Box>
      </Stack>

      <Box p={16}>
        <Divider mb={16} color={colors.border.light} />
        <SidebarUser name={displayName} initials={initials} />
      </Box>
    </Stack>
  );
}
