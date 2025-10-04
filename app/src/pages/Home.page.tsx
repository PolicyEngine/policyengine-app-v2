import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Title,
  TextInput,
  Stack,
  Text,
  Badge,
  Group,
  Paper,
  Grid,
  Button,
  Box,
  SimpleGrid,
  Avatar,
  Divider,
  ActionIcon,
  ScrollArea,
} from '@mantine/core';
import {
  IconSearch,
  IconFileText,
  IconChartBar,
  IconDatabase,
  IconRocket,
  IconClock,
  IconPlus,
  IconArrowRight,
  IconSettings,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFetchMetadata } from '@/hooks/useMetadata';
import { reportsAPI } from '@/api/v2/reports';
import { userSimulationsAPI } from '@/api/v2/userSimulations';
import { userPoliciesAPI } from '@/api/v2/userPolicies';
import { userDynamicsAPI } from '@/api/v2/userDynamics';
import { userDatasetsAPI } from '@/api/v2/userDatasets';
import { MOCK_USER_ID } from '@/constants';

export default function HomePage() {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const [searchQuery, setSearchQuery] = useState('');

  useFetchMetadata(countryId);

  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch all user data
  const { data: reports = [] } = useQuery({
    queryKey: ['reports', userId],
    queryFn: () => reportsAPI.list({ limit: 100, user_id: userId }),
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ['userSimulations', userId],
    queryFn: () => userSimulationsAPI.list({ limit: 100 }),
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['userPolicies', userId],
    queryFn: () => userPoliciesAPI.list({ limit: 100 }),
  });

  const { data: dynamics = [] } = useQuery({
    queryKey: ['userDynamics', userId],
    queryFn: () => userDynamicsAPI.list({ limit: 100 }),
  });

  const { data: datasets = [] } = useQuery({
    queryKey: ['userDatasets', userId],
    queryFn: () => userDatasetsAPI.list({ limit: 100 }),
  });

  // Combine all items with timestamps for recent activity
  const allItems = [
    ...reports.map(r => ({ ...r, type: 'report', icon: IconFileText, color: 'blue' })),
    ...simulations.map(s => ({ ...s, type: 'simulation', icon: IconChartBar, color: 'green' })),
    ...policies.map(p => ({ ...p, type: 'policy', icon: IconSettings, color: 'violet' })),
    ...dynamics.map(d => ({ ...d, type: 'dynamic', icon: IconRocket, color: 'orange' })),
    ...datasets.map(d => ({ ...d, type: 'dataset', icon: IconDatabase, color: 'cyan' })),
  ].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  // Filter items by search
  const filteredItems = allItems.filter(item =>
    (item.name || item.label)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentItems = filteredItems.slice(0, 8);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getItemPath = (item: any) => {
    switch (item.type) {
      case 'report': return `/report/${item.id}`;
      case 'simulation': return `/simulation/${item.id}`;
      case 'policy': return `/policy/${item.id}`;
      case 'dynamic': return `/dynamic/${item.id}`;
      case 'dataset': return `/dataset/${item.id}`;
      default: return '/';
    }
  };

  const quickActions = [
    { label: 'New report', icon: IconFileText, color: 'blue', path: '/reports' },
    { label: 'New simulation', icon: IconChartBar, color: 'green', path: '/simulations' },
    { label: 'New policy', icon: IconSettings, color: 'violet', path: '/policies' },
    { label: 'New dataset', icon: IconDatabase, color: 'cyan', path: '/datasets' },
  ];

  const stats = [
    { label: 'Reports', value: reports.length, icon: IconFileText, color: 'blue', path: '/reports' },
    { label: 'Simulations', value: simulations.length, icon: IconChartBar, color: 'green', path: '/simulations' },
    { label: 'Policies', value: policies.length, icon: IconSettings, color: 'violet', path: '/policies' },
    { label: 'Datasets', value: datasets.length, icon: IconDatabase, color: 'cyan', path: '/datasets' },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Box>
          <Title order={1} mb="xs">Welcome back</Title>
          <Text c="dimmed">Here's what's happening with your work</Text>
        </Box>

        {/* Quick Stats */}
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          {stats.map((stat) => (
            <Paper
              key={stat.label}
              p="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(stat.path)}
            >
              <Group justify="space-between">
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {stat.label}
                  </Text>
                  <Text size="xl" fw={700} mt={4}>
                    {stat.value}
                  </Text>
                </Box>
                <Avatar color={stat.color} variant="light" size="lg">
                  <stat.icon size={24} />
                </Avatar>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Search */}
        <TextInput
          placeholder="Search reports, simulations, policies, and datasets"
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="md"
        />

        {/* Quick Actions */}
        <Box>
          <Text size="lg" fw={600} mb="md">Quick actions</Text>
          <SimpleGrid cols={{ base: 2, sm: 4 }}>
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="light"
                color={action.color}
                leftSection={<action.icon size={18} />}
                onClick={() => navigate(action.path)}
                fullWidth
              >
                {action.label}
              </Button>
            ))}
          </SimpleGrid>
        </Box>

        {/* Recent Activity */}
        <Box>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <IconClock size={20} />
              <Text size="lg" fw={600}>Recent activity</Text>
            </Group>
            {filteredItems.length > 8 && (
              <Button
                variant="subtle"
                size="sm"
                rightSection={<IconArrowRight size={14} />}
                onClick={() => navigate(`/reports`)}
              >
                View all
              </Button>
            )}
          </Group>

          {recentItems.length === 0 ? (
            <Paper p="xl" withBorder>
              <Stack align="center" gap="md">
                <Avatar size="xl" variant="light" color="gray">
                  <IconPlus size={32} />
                </Avatar>
                <Box ta="center">
                  <Text fw={500} mb={4}>No items yet</Text>
                  <Text size="sm" c="dimmed">
                    Create your first report, simulation, or policy to get started
                  </Text>
                </Box>
                <Group>
                  <Button
                    leftSection={<IconFileText size={16} />}
                    onClick={() => navigate(`/reports`)}
                  >
                    New report
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconChartBar size={16} />}
                    onClick={() => navigate(`/simulations`)}
                  >
                    New simulation
                  </Button>
                </Group>
              </Stack>
            </Paper>
          ) : (
            <Grid>
              {recentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Grid.Col key={`${item.type}-${item.id}`} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                    <Paper
                      p="md"
                      withBorder
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        height: '100%',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                      onClick={() => navigate(getItemPath(item))}
                    >
                      <Stack gap="sm" h="100%" justify="space-between">
                        <Box>
                          <Group justify="space-between" mb="xs">
                            <Avatar color={item.color} variant="light" size="sm">
                              <Icon size={16} />
                            </Avatar>
                            <Badge variant="light" color={item.color} size="xs">
                              {item.type}
                            </Badge>
                          </Group>
                          <Text fw={500} lineClamp={2} mb={4}>
                            {item.name || item.label || 'Untitled'}
                          </Text>
                          {item.description && (
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {item.description}
                            </Text>
                          )}
                        </Box>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            {formatDate(item.created_at)}
                          </Text>
                          <ActionIcon variant="subtle" size="sm">
                            <IconArrowRight size={14} />
                          </ActionIcon>
                        </Group>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                );
              })}
            </Grid>
          )}
        </Box>

        {/* Activity by Type */}
        {filteredItems.length > 0 && (
          <Box>
            <Text size="lg" fw={600} mb="md">Browse by type</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {[
                { type: 'report', label: 'Reports', icon: IconFileText, color: 'blue', items: reports },
                { type: 'simulation', label: 'Simulations', icon: IconChartBar, color: 'green', items: simulations },
                { type: 'policy', label: 'Policies', icon: IconSettings, color: 'violet', items: policies },
                { type: 'dataset', label: 'Datasets', icon: IconDatabase, color: 'cyan', items: datasets },
              ].filter(category => category.items.length > 0).map((category) => {
                const Icon = category.icon;
                const recent = category.items.slice(0, 3);

                return (
                  <Paper key={category.type} p="md" withBorder>
                    <Group justify="space-between" mb="sm">
                      <Group gap="xs">
                        <Avatar color={category.color} variant="light" size="sm">
                          <Icon size={16} />
                        </Avatar>
                        <Text fw={600}>{category.label}</Text>
                        <Badge variant="light" size="sm">{category.items.length}</Badge>
                      </Group>
                      <Button
                        variant="subtle"
                        size="xs"
                        rightSection={<IconArrowRight size={12} />}
                        onClick={() => navigate(`/${category.type}s`)}
                      >
                        View all
                      </Button>
                    </Group>
                    <Divider mb="sm" />
                    <Stack gap="xs">
                      {recent.map((item) => (
                        <Group
                          key={item.id}
                          justify="space-between"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(getItemPath({ ...item, type: category.type }))}
                        >
                          <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                            {item.name || item.label || 'Untitled'}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {formatDate(item.created_at)}
                          </Text>
                        </Group>
                      ))}
                      {category.items.length === 0 && (
                        <Text size="sm" c="dimmed" ta="center" py="md">
                          No {category.label.toLowerCase()} yet
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
