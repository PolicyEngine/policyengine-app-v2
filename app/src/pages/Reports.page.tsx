import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Text, Table, Button, Group, Badge, TextInput, Progress } from '@mantine/core';
import { IconPlus, IconSearch, IconRefresh, IconFileAnalytics, IconCheck, IconX, IconClock } from '@tabler/icons-react';
import { reportsAPI } from '@/api/v2/reports';

export default function ReportsPage() {
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();

  // Fetch reports from API (when endpoint becomes available)
  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsAPI.list({ limit: 1000 }),
    refetchInterval: 30000,
    retry: false, // Don't retry if endpoint doesn't exist yet
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: reportsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  // Filter reports based on search
  const filteredReports = reports?.filter((report) =>
    report.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    report.id.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <IconCheck size={16} />;
      case 'failed': return <IconX size={16} />;
      case 'processing': return <IconClock size={16} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'processing': return 'blue';
      case 'pending': return 'gray';
      default: return 'gray';
    }
  };

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="lg">Reports</Title>
        <Text c="dimmed">Reports endpoint not yet available in API.</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Reports</Title>
        <Group>
          <TextInput
            placeholder="Search reports..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.currentTarget.value)}
          />
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button leftSection={<IconPlus size={16} />}>
            Generate Report
          </Button>
        </Group>
      </Group>

      <Text c="dimmed" mb="lg">
        View and generate analysis reports from your simulation results.
      </Text>

      {isLoading ? (
        <Text>Loading reports...</Text>
      ) : filteredReports?.length === 0 ? (
        <Container>
          <Group justify="center" py="xl">
            <IconFileAnalytics size={48} color="gray" />
          </Group>
          <Text ta="center" c="dimmed">
            No reports available. The reports endpoint will be available soon.
          </Text>
        </Container>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Report ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Simulations</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredReports?.map((report) => (
              <Table.Tr key={report.id}>
                <Table.Td>
                  <Text size="sm" ff="monospace">
                    {report.id.slice(0, 8)}...
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={500}>{report.name || 'Unnamed Report'}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline">
                    {report.simulation_ids.length} simulation(s)
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={getStatusColor(report.status)}
                    leftSection={getStatusIcon(report.status)}
                  >
                    {report.status}
                  </Badge>
                  {report.status === 'processing' && (
                    <Progress size="xs" value={50} animated mt="xs" />
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {new Date(report.created_at).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="light" disabled={report.status !== 'completed'}>
                      View
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => {
                        if (confirm('Delete this report?')) {
                          deleteMutation.mutate(report.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Group justify="center" mt="xl">
        <Text size="sm" c="dimmed">
          {filteredReports?.length || 0} reports • Live data from database
        </Text>
      </Group>
    </Container>
  );
}
