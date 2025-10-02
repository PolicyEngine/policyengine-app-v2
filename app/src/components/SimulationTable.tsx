import React, { useState } from 'react';
import {
  Table,
  Checkbox,
  Text,
  Badge,
  Group,
  Button,
  Menu,
  ActionIcon,
  Stack,
  Box,
  Anchor,
  Flex,
} from '@mantine/core';
import { IconChevronDown, IconDotsVertical } from '@tabler/icons-react';
import { colors } from '@/designTokens';

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
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export default function SimulationTable({
  data,
  onSimulationSelect,
  onAddToReport,
  onAction,
  selectedSimulations = [],
  onSelectionChange,
  currentPage = 1,
  totalPages = 1,
  rowsPerPage = 10,
  onPageChange,
}: SimulationTableProps) {
  const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageIds = paginatedData.map(item => item.id);
      const newSelection = [...new Set([...selectedSimulations, ...currentPageIds])];
      onSelectionChange?.(newSelection);
    } else {
      const currentPageIds = paginatedData.map(item => item.id);
      const newSelection = selectedSimulations.filter(id => !currentPageIds.includes(id));
      onSelectionChange?.(newSelection);
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
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentPageIds = paginatedData.map(item => item.id);
  const currentPageSelectedCount = currentPageIds.filter(id => selectedSimulations.includes(id)).length;
  const allSelected = paginatedData.length > 0 && currentPageSelectedCount === paginatedData.length;
  const someSelected = currentPageSelectedCount > 0 && currentPageSelectedCount < paginatedData.length;

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

  const getDropdownMenuConfigs = (simulationId: string) => [
    {
      label: 'Bookmark',
      variant: 'default',
      onClick: () => onAction?.('bookmark', simulationId),
      isDivider: false,
    },
    {
      label: 'Edit',
      variant: 'default',
      onClick: () => onAction?.('edit', simulationId),
      isDivider: false,
    },
    {
      label: 'Share',
      variant: 'default',
      onClick: () => onAction?.('share', simulationId),
      isDivider: false,
    },
    {
      label: 'Delete',
      variant: 'default',
      onClick: () => onAction?.('delete', simulationId),
      isDivider: true,
    },
  ];

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
            <Table.Th w={200}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedData.map((simulation) => {
            const isHousehold = simulation.population.type === 'household';
            return (
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
                    c={colors.primary[600]}
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
                <Badge
                  variant="light"
                  color={isHousehold ? "primary" : "gray"}
                  radius="xl"
                  style={{ 
                    whiteSpace: 'normal', 
                    height: 'auto', 
                    padding: '4px 8px',
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  <Text 
                    size="sm" 
                    c={isHousehold ? colors.primary[600] : colors.gray[600]} 
                    style={{ 
                      lineHeight: 1.2,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      textAlign: 'left',
                    }}
                  >
                    {isHousehold 
                      ? `Household #${simulation.population.id || simulation.population.name}`
                      : `${simulation.population.id || simulation.population.name}`
                    }
                  </Text>
                </Badge>
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
                <Flex justify="flex-start" direction="row">
                  <Menu shadow="md" width={150}>
                    <Menu.Target>
                      <Button
                        variant="outline"
                        color={colors.gray[300]}
                        radius="lg"
                        size="sm"
                        c={colors.gray[600]}
                        px="xs"
                        onClick={() => onAddToReport?.(simulation.simulationId)}
                        rightSection={
                          <Group gap={8} align="center">
                            <Box
                              w={1}
                              h={60}
                              bg={colors.gray[300]}
                            />
                            <IconChevronDown size={14} color={colors.gray[600]} />
                          </Group>
                        }
                      >
                        Add to Report
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {getDropdownMenuConfigs(simulation.simulationId).map((config, index) => (
                        <React.Fragment key={config.label}>
                          {config.isDivider && <Menu.Divider />}
                          <Menu.Item 
                            onClick={config.onClick}
                            color={config.label === 'Delete' ? 'red' : undefined}
                          >
                            {config.label}
                          </Menu.Item>
                        </React.Fragment>
                      ))}
                    </Menu.Dropdown>
                  </Menu>

                  <Menu
                    shadow="md"
                    width={80}
                    opened={openedMenuId === simulation.id}
                    onChange={(opened) => setOpenedMenuId(opened ? simulation.id : null)}
                  >
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {getDropdownMenuConfigs(simulation.simulationId).map((config, index) => (
                        <React.Fragment key={config.label}>
                          {config.isDivider && <Menu.Divider />}
                          <Menu.Item 
                            onClick={config.onClick}
                            color={config.label === 'Delete' ? 'red' : undefined}
                          >
                            {config.label}
                          </Menu.Item>
                        </React.Fragment>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                </Flex>
              </Table.Td>
            </Table.Tr>
          )})}
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
          variant={currentPage <= 1 ? 'disabled' : 'default'}
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>

        <Text size="sm" c={colors.text.primary}>
          Page {currentPage} of {totalPages}
        </Text>
        
        <Button
          variant={currentPage >= totalPages ? 'disabled' : 'default'}
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </Group>
    </Box>
  );
}
