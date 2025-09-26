import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Text, Table, Button, Group, Badge, TextInput, Tabs } from '@mantine/core';
import { IconPlus, IconSearch, IconRefresh, IconDatabase, IconVersions } from '@tabler/icons-react';
import { datasetsAPI } from '@/api/v2/datasets';

export default function DatasetsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('datasets');
  const queryClient = useQueryClient();

  // Fetch datasets
  const { data: datasets, isLoading: datasetsLoading, error: datasetsError, refetch: refetchDatasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsAPI.listDatasets({ limit: 1000 }),
    refetchInterval: 30000,
  });

  // Fetch versioned datasets
  const { data: versionedDatasets, isLoading: versionsLoading, error: versionsError, refetch: refetchVersions } = useQuery({
    queryKey: ['versioned-datasets'],
    queryFn: () => datasetsAPI.listVersionedDatasets({ limit: 1000 }),
    refetchInterval: 30000,
  });

  // Delete mutations
  const deleteDatasetMutation = useMutation({
    mutationFn: datasetsAPI.deleteDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });

  const deleteVersionMutation = useMutation({
    mutationFn: datasetsAPI.deleteVersionedDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versioned-datasets'] });
    },
  });

  // Filter based on search
  const filteredDatasets = datasets?.filter((dataset) =>
    dataset.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    dataset.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const filteredVersions = versionedDatasets?.filter((version) =>
    version.version.toLowerCase().includes(searchValue.toLowerCase()) ||
    version.dataset_id.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'household': return 'blue';
      case 'population': return 'green';
      case 'economic': return 'orange';
      default: return 'gray';
    }
  };

  if (datasetsError || versionsError) {
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="lg">Datasets</Title>
        <Text c="red">Error loading datasets: {datasetsError?.message || versionsError?.message}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Datasets</Title>
        <Group>
          <TextInput
            placeholder="Search datasets..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.currentTarget.value)}
          />
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={() => {
              refetchDatasets();
              refetchVersions();
            }}
          >
            Refresh
          </Button>
          <Button leftSection={<IconPlus size={16} />}>
            New Dataset
          </Button>
        </Group>
      </Group>

      <Text c="dimmed" mb="lg">
        Manage household, population, and economic datasets for your simulations.
      </Text>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="datasets" leftSection={<IconDatabase size={16} />}>
            Datasets ({filteredDatasets?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab value="versions" leftSection={<IconVersions size={16} />}>
            Versions ({filteredVersions?.length || 0})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="datasets" pt="md">
          {datasetsLoading ? (
            <Text>Loading datasets...</Text>
          ) : filteredDatasets?.length === 0 ? (
            <Text c="dimmed">No datasets found. Create your first dataset.</Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Country</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredDatasets?.map((dataset) => (
                  <Table.Tr key={dataset.id}>
                    <Table.Td>
                      <Text fw={500}>{dataset.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {dataset.description || 'No description'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={getTypeColor(dataset.type)}>
                        {dataset.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {dataset.country && <Badge variant="outline">{dataset.country}</Badge>}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(dataset.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light">
                          View
                        </Button>
                        <Button size="xs" variant="light">
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          onClick={() => {
                            if (confirm('Delete this dataset?')) {
                              deleteDatasetMutation.mutate(dataset.id);
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
        </Tabs.Panel>

        <Tabs.Panel value="versions" pt="md">
          {versionsLoading ? (
            <Text>Loading versions...</Text>
          ) : filteredVersions?.length === 0 ? (
            <Text c="dimmed">No dataset versions found.</Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Dataset ID</Table.Th>
                  <Table.Th>Version</Table.Th>
                  <Table.Th>Valid From</Table.Th>
                  <Table.Th>Valid To</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredVersions?.map((version) => (
                  <Table.Tr key={version.id}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {version.dataset_id.slice(0, 8)}...
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="filled">{version.version}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {version.valid_from ? new Date(version.valid_from).toLocaleDateString() : '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {version.valid_to ? new Date(version.valid_to).toLocaleDateString() : '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(version.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light">
                          View
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          onClick={() => {
                            if (confirm('Delete this version?')) {
                              deleteVersionMutation.mutate(version.id);
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
        </Tabs.Panel>
      </Tabs>

      <Group justify="center" mt="xl">
        <Text size="sm" c="dimmed">
          {datasets?.length || 0} datasets • {versionedDatasets?.length || 0} versions • Live data from database
        </Text>
      </Group>
    </Container>
  );
}