import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Text, Table, Button, Group, Badge, TextInput } from '@mantine/core';
import { IconPlus, IconSearch, IconRefresh } from '@tabler/icons-react';
import { apiClient } from '@/api/apiClient';

interface Dynamic {
  id: string;
  name: string;
  description?: string;
  type?: string;
  parameters?: any;
  created_at: string;
  updated_at: string;
}

export default function DynamicsPage() {
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();

  // Fetch dynamics from API
  const { data: dynamics, isLoading, error, refetch } = useQuery({
    queryKey: ['dynamics'],
    queryFn: () => apiClient.get<Dynamic[]>('/dynamics/', { params: { limit: 1000 } }),
    refetchInterval: 30000, // Refetch every 30 seconds for live data
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/dynamics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamics'] });
    },
  });

  // Filter dynamics based on search
  const filteredDynamics = dynamics?.filter((dynamic) =>
    dynamic.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    dynamic.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="lg">Dynamics</Title>
        <Text c="red">Error loading dynamics: {error.message}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Dynamics</Title>
        <Group>
          <TextInput
            placeholder="Search dynamics..."
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
            New Dynamic
          </Button>
        </Group>
      </Group>

      <Text c="dimmed" mb="lg">
        Manage time-varying behaviours and dynamic configurations for your models.
      </Text>

      {isLoading ? (
        <Text>Loading dynamics...</Text>
      ) : filteredDynamics?.length === 0 ? (
        <Text c="dimmed">No dynamics found. Create your first dynamic configuration.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredDynamics?.map((dynamic) => (
              <Table.Tr key={dynamic.id}>
                <Table.Td>
                  <Text fw={500}>{dynamic.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {dynamic.description || 'No description'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {dynamic.type && <Badge variant="light">{dynamic.type}</Badge>}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {new Date(dynamic.created_at).toLocaleDateString()}
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
                        if (confirm('Delete this dynamic configuration?')) {
                          deleteMutation.mutate(dynamic.id);
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
          {filteredDynamics?.length || 0} dynamic configurations • Live data from database
        </Text>
      </Group>
    </Container>
  );
}