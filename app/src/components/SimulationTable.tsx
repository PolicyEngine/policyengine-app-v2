import { useState } from 'react';
import {
  Table,
  Checkbox,
  Text,
  Badge,
  Group,
  Button,
  Menu,
  ActionIcon,
  Pagination,
  Stack,
  Box,
  Anchor,
} from '@mantine/core';
import { IconChevronDown, IconDots } from '@tabler/icons-react';
import { colors } from '@/designTokens';

// Types
export interface SimulationRecord {
  id: string;
  name: string;
  simulationId: string;
  dateCreated: Date;
  policy: {
    name: string;
    provisions: number;
    additionalCount?: number;
  };
  population: {
    type: 'household' | 'geographic';
    name: string;
    id?: string;
  };
  connectedReports: {
    title: string;
    additionalCount?: number;
  };
}

interface SimulationTableProps {
  data: SimulationRecord[];
  onSimulationSelect?: (simulationId: string) => void;
  onAddToReport?: (simulationId: string) => void;
  onAction?: (action: string, simulationId: string) => void;
  selectedSimulations?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function SimulationTable({
  data,
  onSimulationSelect,
  onAction,
  selectedSimulations = [],
  onSelectionChange,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: SimulationTableProps) {
  const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(data.map(item => item.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (simulationId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedSimulations, simulationId]);
    } else {
      onSelectionChange?.(selectedSimulations.filter(id => id !== simulationId));
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const allSelected = data.length > 0 && selectedSimulations.length === data.length;
  const someSelected = selectedSimulations.length > 0 && selectedSimulations.length < data.length;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  return (
    <Box>
      <Table miw={800} verticalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(event) => handleSelectAll(event.currentTarget.checked)}
              />
            </Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Date Create</Table.Th>
            <Table.Th>Policy</Table.Th>
            <Table.Th>Population</Table.Th>
            <Table.Th>Connected Reports</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((simulation) => (
            <Table.Tr key={simulation.id}>
              <Table.Td>
                <Checkbox
                  checked={selectedSimulations.includes(simulation.id)}
                  onChange={(event) => handleSelectRow(simulation.id, event.currentTarget.checked)}
                />
              </Table.Td>
              
              <Table.Td>
                <Stack gap={4}>
                  <Text fw={700} size="sm">
                    {simulation.name}
                  </Text>
                  <Anchor
                    size="sm"
                    c={colors.blue[600]}
                    onClick={() => onSimulationSelect?.(simulation.simulationId)}
                    style={{ textDecoration: 'none' }}
                  >
                    #{simulation.simulationId}
                  </Anchor>
                </Stack>
              </Table.Td>

              <Table.Td>
                <Text size="sm" c={colors.text.secondary}>
                  {formatRelativeTime(simulation.dateCreated)}
                </Text>
              </Table.Td>

              <Table.Td>
                <Stack gap={4}>
                  <Text fw={700} size="sm">
                    {simulation.policy.name}
                  </Text>
                  <Group gap={4}>
                    <Badge
                      size="sm"
                      variant="light"
                      color="red"
                      radius="xl"
                    >
                      {simulation.policy.provisions} Provisions
                    </Badge>
                    {simulation.policy.additionalCount && (
                      <Badge
                        size="sm"
                        variant="light"
                        color="gray"
                        radius="xl"
                      >
                        +{simulation.policy.additionalCount}
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Table.Td>

              <Table.Td>
                <Text size="sm" c={colors.blue[600]}>
                  {simulation.population.type === 'household' ? 'Household' : ''} #{simulation.population.id || simulation.population.name}
                </Text>
              </Table.Td>

              <Table.Td>
                <Group gap={4}>
                  <Badge
                    size="sm"
                    variant="light"
                    color="gray"
                    radius="xl"
                    leftSection={
                      <Box
                        w={6}
                        h={6}
                        bg={colors.gray[600]}
                        style={{ borderRadius: '50%' }}
                      />
                    }
                  >
                    {simulation.connectedReports.title}
                  </Badge>
                  {simulation.connectedReports.additionalCount && (
                    <Badge
                      size="sm"
                      variant="light"
                      color="gray"
                      radius="xl"
                    >
                      +{simulation.connectedReports.additionalCount}
                    </Badge>
                  )}
                </Group>
              </Table.Td>

              <Table.Td>
                <Group gap={8} justify="flex-end">
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button
                        variant="outline"
                        color="gray"
                        radius="lg"
                        size="sm"
                        rightSection={<IconChevronDown size={14} />}
                      >
                        Add to Report
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => onAction?.('bookmark', simulation.id)}>
                        Bookmark
                      </Menu.Item>
                      <Menu.Item onClick={() => onAction?.('edit', simulation.id)}>
                        Edit
                      </Menu.Item>
                      <Menu.Item onClick={() => onAction?.('share', simulation.id)}>
                        Share
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        onClick={() => onAction?.('delete', simulation.id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  <Menu
                    shadow="md"
                    width={200}
                    opened={openedMenuId === simulation.id}
                    onChange={(opened) => setOpenedMenuId(opened ? simulation.id : null)}
                  >
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                  
                  </Menu>
                </Group>
              </Table.Td>
            </Table.Tr>
            
          ))}
        </Table.Tbody>
      </Table>
      
      <Box
        w="100%"
        h={1}
        bg={colors.gray[300]}
        mt="md"
      />

      <Group justify="space-between" mt="xl">
        <Button
          variant="outline"
          color="gray"
          radius="xl"
          size="sm"
          disabled={currentPage <= 1}
          onClick={handlePreviousPage}
          style={{
            borderColor: currentPage <= 1 ? colors.gray[300] : colors.gray[400],
            color: currentPage <= 1 ? colors.gray[400] : colors.gray[600],
          }}
        >
          Previous
        </Button>
        
        <Text size="sm" c={colors.text.primary}>
          Page {currentPage} of {totalPages}
        </Text>
        
        <Button
          variant="outline"
          color="gray"
          radius="xl"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={handleNextPage}
          style={{
            borderColor: currentPage >= totalPages ? colors.gray[300] : colors.gray[400],
            color: currentPage >= totalPages ? colors.gray[400] : colors.gray[600],
          }}
        >
          Next
        </Button>
      </Group>
    </Box>
  );
}
