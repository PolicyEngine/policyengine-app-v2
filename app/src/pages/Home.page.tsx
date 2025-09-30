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
  Table,
  Checkbox,
  ActionIcon,
  Tabs,
  Button,
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconDotsVertical,
  IconArrowDown,
  IconPlus,
  IconFile,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFetchMetadata } from '@/hooks/useMetadata';
import { reportsAPI } from '@/api/v2/reports';
import { simulationsAPI } from '@/api/v2/simulations';

export default function HomePage() {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'bookmarked'>('recent');

  useFetchMetadata(countryId);

  // TODO: Get actual user ID from auth context
  const userId = 'dev_test';

  // Fetch reports for this user
  const { data: reports = [] } = useQuery({
    queryKey: ['reports', userId],
    queryFn: () => reportsAPI.list({ limit: 100, user_id: userId }),
  });

  // Fetch simulations for each report to show details
  const reportIds = reports.map(r => r.id);
  const { data: simulationsMap = {} } = useQuery({
    queryKey: ['reportSimulations', reportIds],
    queryFn: async () => {
      const map: Record<string, any[]> = {};
      for (const report of reports) {
        if (report.simulation_ids && report.simulation_ids.length > 0) {
          const sims = await Promise.all(
            report.simulation_ids.map(id =>
              simulationsAPI.get(id).catch(() => null)
            )
          );
          map[report.id] = sims.filter(s => s !== null);
        }
      }
      return map;
    },
    enabled: reports.length > 0,
  });

  // Filter reports by search
  const filteredReports = reports.filter(report =>
    report.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getReportType = (report: any) => {
    if (!report.simulation_ids || report.simulation_ids.length === 0) return 'Error';
    if (report.simulation_ids.length === 1) return 'Simulation';
    if (report.simulation_ids.length === 2) return 'Policy Reform';
    return 'Report';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Home</Title>

        <TextInput
          placeholder="Search your reports and files"
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="md"
        />

        {/* Template cards section */}
        <Box>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={600}>Start with a template</Text>
            <Button variant="subtle" size="sm">See more</Button>
          </Group>
          <Group>
            {[1, 2, 3].map(i => (
              <Paper key={i} withBorder p="md" style={{ flex: 1, minWidth: 280 }}>
                <Group justify="space-between" mb="xs">
                  <Badge variant="light" leftSection={<IconFile size={12} />}>
                    New Tax Policy
                  </Badge>
                  <ActionIcon variant="subtle" size="sm">
                    <IconPlus size={16} />
                  </ActionIcon>
                </Group>
                <Text fw={500} mb={4}>Template title</Text>
                <Text size="sm" c="dimmed">Template details. Lorem ipsum dolor ninwefdd</Text>
              </Paper>
            ))}
          </Group>
        </Box>

        {/* Recent Activity section */}
        <Box>
          <Text size="lg" fw={600} mb="md">Recent Activity</Text>

          <Tabs value={activeTab} onChange={(val) => setActiveTab(val as any)}>
            <Tabs.List>
              <Tabs.Tab value="recent">Recent</Tabs.Tab>
              <Tabs.Tab value="bookmarked">Bookmarked</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Paper withBorder mt="md">
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}></Table.Th>
                  <Table.Th>
                    <Group gap={4}>
                      Title
                      <IconArrowDown size={14} />
                    </Group>
                  </Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Date Created</Table.Th>
                  <Table.Th>Details</Table.Th>
                  <Table.Th style={{ width: 40 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredReports.slice(0, 6).map((report) => {
                  const reportType = getReportType(report);
                  const sims = simulationsMap[report.id] || [];

                  return (
                    <Table.Tr
                      key={report.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/${countryId}/report/${report.id}`)}
                    >
                      <Table.Td>
                        <Checkbox />
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>{report.name || 'Title'}</Text>
                        {report.name && (
                          <Text size="xs" c="blue" component="span">Link</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" size="sm">{reportType}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(report.created_at)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {sims.map((sim, idx) => (
                            <Badge key={idx} variant="dot" size="sm">
                              Simulation {sim.id?.slice(0, 4)}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon variant="subtle" size="sm" onClick={(e) => e.stopPropagation()}>
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            <Group justify="center" p="md">
              <Button variant="subtle" size="sm">See All</Button>
            </Group>
          </Paper>
        </Box>
      </Stack>
    </Container>
  );
}