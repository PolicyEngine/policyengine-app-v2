import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Text,
  Table,
  LoadingOverlay,
  Center,
  Stack,
  Paper,
  Group,
  ScrollArea,
  Tabs,
  Button,
  Textarea,
  Badge,
  SegmentedControl,
  useMantineTheme,
  rem,
  Code,
} from '@mantine/core';
import {
  IconSparkles,
  IconTable,
  IconChartBar,
} from '@tabler/icons-react';
import Plot from 'react-plotly.js';
import { aggregatesAPI } from '@/api/v2/aggregates';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { aggregateChangesAPI } from '@/api/v2/aggregateChanges';
import { simulationsAPI } from '@/api/v2/simulations';
import { ReportElement, reportElementsAPI } from '@/api/v2/reportElements';
import { userSimulationsAPI } from '@/api/v2/userSimulations';
import { policiesAPI } from '@/api/v2/policies';
import { datasetsAPI } from '@/api/v2/datasets';
import { MOCK_USER_ID } from '@/constants';
import BaseModal from '@/components/shared/BaseModal';

interface DataElementCellProps {
  element: ReportElement;
  isEditing?: boolean;
}

export default function DataElementCell({
  element,
}: DataElementCellProps) {
  console.log('[DataElementCell] Rendering with element:', {
    id: element.id,
    label: element.label,
    type: element.type,
    processed_output_type: element.processed_output_type,
    processed_output_preview: element.processed_output?.substring(0, 100)
  });

  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'data' | 'processed'>(
    element.processed_output_type ? 'processed' : 'data'
  );
  const [aiPromptOpened, setAiPromptOpened] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch aggregates for this element
  const { data: aggregates, isLoading: aggregatesLoading } = useQuery({
    queryKey: ['elementAggregates', element.id],
    queryFn: () => aggregatesAPI.getByReportElement(element.id),
  });

  // Fetch aggregate changes for this element
  const { data: aggregateChanges, isLoading: aggregateChangesLoading } = useQuery({
    queryKey: ['elementAggregateChanges', element.id],
    queryFn: () => aggregateChangesAPI.getByReportElement(element.id),
  });

  // Fetch simulations for labels
  const simulationIds = useMemo(() => {
    const ids = new Set<string>();
    aggregates?.forEach(a => ids.add(a.simulation_id));
    aggregateChanges?.forEach(a => {
      ids.add(a.baseline_simulation_id);
      ids.add(a.comparison_simulation_id);
    });
    return Array.from(ids);
  }, [aggregates, aggregateChanges]);

  const { data: simulations } = useQuery({
    queryKey: ['simulations', simulationIds],
    queryFn: async () => {
      if (simulationIds.length === 0) return [];
      const sims = await Promise.all(
        simulationIds.map(id => simulationsAPI.get(id).catch(() => null))
      );
      return sims.filter(Boolean);
    },
    enabled: simulationIds.length > 0,
  });

  // Fetch user simulations for custom names
  const { data: userSimulations = [] } = useQuery({
    queryKey: ['userSimulations', userId],
    queryFn: () => userSimulationsAPI.list(userId),
    enabled: simulationIds.length > 0,
  });

  // Update mutation
  const updateElementMutation = useMutation({
    mutationFn: ({ elementId, data }: { elementId: string; data: any }) =>
      reportElementsAPI.update(elementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportElements'] });
      queryClient.invalidateQueries({ queryKey: ['elementAggregates', element.id] });
      queryClient.invalidateQueries({ queryKey: ['elementAggregateChanges', element.id] });
    },
  });

  // Helper to get simulation label
  const getSimLabel = (simId: string) => {
    const userSim = userSimulations.find(us => us.simulation_id === simId);
    if (userSim?.custom_name) return userSim.custom_name;
    const sim = simulations?.find(s => s?.id === simId);
    return (sim as any)?.label || `Simulation ${simId.slice(0, 8)}`;
  };

  // Format number for display
  const formatNumber = (value: number | undefined | null) => {
    if (value === null || value === undefined || typeof value !== 'number') {
      return '-';
    }
    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    } else if (Math.abs(value) >= 100) {
      return value.toFixed(0);
    } else {
      return value.toFixed(2);
    }
  };

  // Handle AI processing
  const handleAIProcess = async () => {
    if (!aiPrompt.trim()) return;

    setIsProcessing(true);
    try {
      // Create context with simulation information and theme
      // Include detailed simulation info with policy and dataset names
      const simulationDetails = await Promise.all(simulationIds.map(async (id) => {
        const userSim = userSimulations.find(us => us.simulation_id === id);
        const sim = simulations?.find(s => s?.id === id);

        // Fetch policy and dataset names
        let policyName = 'Default policy';
        let datasetName = 'Default dataset';
        let dynamicName = undefined;

        try {
          if (sim?.policy_id) {
            const policy = await policiesAPI.get(sim.policy_id);
            policyName = policy.name || `Policy ${sim.policy_id.slice(0, 8)}`;
          }
          if (sim?.dataset_id) {
            const dataset = await datasetsAPI.getDataset(sim.dataset_id);
            datasetName = dataset.name || `Dataset ${sim.dataset_id.slice(0, 8)}`;
          }
          // TODO: Add dynamic name fetching if needed
        } catch (err) {
          console.error('Error loading simulation metadata:', err);
        }

        return {
          id,
          name: userSim?.custom_name || getSimLabel(id),
          label: userSim?.custom_name || getSimLabel(id),
          custom_name: userSim?.custom_name,
          policy_name: policyName,
          dataset_name: datasetName,
          dynamic_name: dynamicName,
          // Include simulation metadata
          policy_id: sim?.policy_id,
          dataset_id: sim?.dataset_id,
          dynamic_id: sim?.dynamic_id,
        };
      }));

      const context = {
        simulations: simulationDetails,
        aggregates: aggregates || [],
        aggregate_changes: aggregateChanges || [],
        theme: {
          colors: {
            primary: theme.colors.primary[6],
            secondary: theme.colors.gray[6],
            background: 'rgba(0,0,0,0)', // Transparent background
            grid: theme.colors.gray[2],
            text: theme.colors.gray[8],
            success: theme.colors.green[6],
            error: theme.colors.red[6],
          },
          font: theme.fontFamily,
        }
      };

      console.log('[AI REQUEST] Sending context to backend:', {
        simulationCount: simulationDetails.length,
        simulations: simulationDetails,
        aggregatesCount: aggregates?.length || 0,
        aggregateChangesCount: aggregateChanges?.length || 0
      });

      // Make request to AI endpoint to process the data
      // The backend already updates the DB, so we just need to invalidate queries
      await reportElementsAPI.processWithAI(
        aiPrompt,
        context,
        element.id
      );

      // Invalidate queries to refetch the updated element
      queryClient.invalidateQueries({ queryKey: ['reportElements'] });
      queryClient.invalidateQueries({ queryKey: ['elementAggregates', element.id] });
      queryClient.invalidateQueries({ queryKey: ['elementAggregateChanges', element.id] });

      // Switch to processed view
      setViewMode('processed');
      setAiPromptOpened(false);
      setAiPrompt('');
    } catch (error) {
      console.error('AI processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to format column names from snake_case to Title Case
  const formatColumnName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .replace(/\bId\b/g, 'ID');
  };

  // Helper to format cell value based on field type
  const formatCellValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return '-';

    // Special handling for simulation IDs
    if (key.includes('simulation_id')) {
      return getSimLabel(value);
    }

    // Format numeric values (but not IDs or years)
    if (typeof value === 'number' && !key.includes('_id') && !key.includes('year')) {
      if (key === 'relative_change') {
        return `${(value * 100).toFixed(1)}%`;
      }
      return formatNumber(value);
    }

    // Format booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Format arrays/objects as JSON
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Render table for a specific data type
  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <Center p="xl">
          <Text c="dimmed">No data available</Text>
        </Center>
      );
    }

    // Get all unique columns from all data rows
    const allColumns = new Set<string>();
    data.forEach(d => {
      Object.keys(d).forEach(key => allColumns.add(key));
    });

    // Convert to array and sort for consistent ordering
    const columns = Array.from(allColumns).sort((a, b) => {
      // Priority order for important columns
      const priority = ['id', 'simulation_id', 'baseline_simulation_id', 'comparison_simulation_id',
                       'variable_name', 'aggregate_function', 'value', 'baseline_value',
                       'comparison_value', 'change', 'relative_change'];
      const aIndex = priority.indexOf(a);
      const bIndex = priority.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return (
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table
            horizontalSpacing="md"
            verticalSpacing="sm"
            highlightOnHover
            withTableBorder={false}
          >
            <Table.Thead>
              <Table.Tr>
                {columns.map(col => (
                  <Table.Th key={col}>
                    <Text size="xs" fw={600}>{formatColumnName(col)}</Text>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, idx) => (
                <Table.Tr key={idx}>
                  {columns.map(col => {
                    const value = formatCellValue(col, row[col]);
                    const isChangeColumn = col === 'change';
                    const isNumeric = typeof value === 'string' && value !== '-' &&
                                    (value.includes('B') || value.includes('M') || value.includes('K') || value.includes('%'));

                    return (
                      <Table.Td key={col}>
                        <Text
                          size="sm"
                          c={isChangeColumn && value !== '-' ?
                            (value.startsWith('-') ? 'red.7' : 'green.7') : undefined
                          }
                          fw={isNumeric ? 500 : 400}
                        >
                          {value}
                        </Text>
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    );
  };

  // Render raw data view with tabs
  const renderDataView = () => {
    const hasAggregates = aggregates && aggregates.length > 0;
    const hasAggregateChanges = aggregateChanges && aggregateChanges.length > 0;

    if (!hasAggregates && !hasAggregateChanges) {
      return (
        <Center p="xl">
          <Stack align="center" gap="xs">
            <Text c="dimmed">No data available</Text>
            <Text size="xs" c="dimmed">
              Use the AI process button to generate insights
            </Text>
          </Stack>
        </Center>
      );
    }

    return (
      <Tabs defaultValue={hasAggregates ? 'aggregates' : 'changes'}>
        <Tabs.List>
          {hasAggregates && (
            <Tabs.Tab
              value="aggregates"
              leftSection={<IconTable size={14} />}
              rightSection={<Badge size="xs" variant="light">{aggregates.length}</Badge>}
            >
              Aggregates
            </Tabs.Tab>
          )}
          {hasAggregateChanges && (
            <Tabs.Tab
              value="changes"
              leftSection={<IconChartBar size={14} />}
              rightSection={<Badge size="xs" variant="light">{aggregateChanges.length}</Badge>}
            >
              Changes
            </Tabs.Tab>
          )}
        </Tabs.List>

        {hasAggregates && (
          <Tabs.Panel value="aggregates" pt="md">
            {renderTable(aggregates)}
          </Tabs.Panel>
        )}
        {hasAggregateChanges && (
          <Tabs.Panel value="changes" pt="md">
            {renderTable(aggregateChanges)}
          </Tabs.Panel>
        )}
      </Tabs>
    );
  };

  // Render AI-generated content
  const renderProcessedView = () => {
    console.log('[RENDER] renderProcessedView - element:', {
      id: element.id,
      processed_output_type: element.processed_output_type,
      processed_output_length: element.processed_output?.length,
      processed_output_preview: element.processed_output?.substring(0, 200)
    });

    if (!element.processed_output_type || !element.processed_output) {
      return (
        <Center p="xl">
          <Stack align="center" gap="xs">
            <Text c="dimmed">No processed output yet</Text>
            <Button
              size="sm"
              leftSection={<IconSparkles size={16} />}
              onClick={() => setAiPromptOpened(true)}
            >
              Process with AI
            </Button>
          </Stack>
        </Center>
      );
    }

    const contentType = element.processed_output_type;
    const content = element.processed_output || '';

    console.log('[RENDER] contentType:', contentType, 'contentLength:', content.length);

    if (contentType === 'markdown') {
      console.log('[RENDER] Rendering markdown, content:', content);
      return <MarkdownRenderer content={content} className="markdown-content" />;
    }

    if (contentType === 'plotly') {
      // Parse the JSON string to get plotly data
      let plotlyContent: any = { data: [], layout: {} };
      try {
        plotlyContent = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse Plotly JSON:', e);
        return (
          <Box p="md">
            <Text c="red">Error: Invalid Plotly data</Text>
          </Box>
        );
      }

      return (
        <Box style={{ height: 400 }}>
          <Plot
            data={plotlyContent.data || []}
            layout={{
              ...(plotlyContent.layout || {}),
              autosize: true,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      );
    }

    return null;
  };

  if (aggregatesLoading || aggregateChangesLoading) {
    return (
      <Box style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </Box>
    );
  }

  return (
    <Stack gap="md">
      {/* Header with view mode toggle and AI button */}
      <Group justify="space-between" pr={40}> {/* Add padding-right to avoid menu overlap */}
        <Text size="sm" fw={500}>{element.label}</Text>
        <Group gap="xs">
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value as 'data' | 'processed')}
            data={[
              { value: 'data', label: <IconTable size={16} /> },
              { value: 'processed', label: <IconChartBar size={16} /> },
            ]}
            size="xs"
          />
          <Button
            size="xs"
            leftSection={<IconSparkles size={14} />}
            onClick={() => setAiPromptOpened(true)}
            variant="light"
          >
            AI process
          </Button>
        </Group>
      </Group>

      {/* Content based on view mode */}
      <Box>
        {viewMode === 'data' ? renderDataView() : renderProcessedView()}
      </Box>

      {/* AI Prompt Modal */}
      <BaseModal
        opened={aiPromptOpened}
        onClose={() => {
          setAiPromptOpened(false);
          setAiPrompt('');
        }}
        title="Process data with AI"
        size="md"
        primaryButton={{
          label: 'Process',
          onClick: handleAIProcess,
          loading: isProcessing,
          disabled: !aiPrompt.trim(),
        }}
        secondaryButton={{
          label: 'Cancel',
          onClick: () => {
            setAiPromptOpened(false);
            setAiPrompt('');
          },
        }}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Describe what you want to create from this data
          </Text>
          <Textarea
            placeholder="e.g., Create a bar chart showing revenue impact sorted by amount, or write a summary table with key metrics"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            minRows={4}
            maxRows={8}
            autosize
            autoFocus
          />
          <Text size="xs" c="dimmed">
            The AI will analyse your data and create visualisations or summaries based on your request.
          </Text>
        </Stack>
      </BaseModal>
    </Stack>
  );
}