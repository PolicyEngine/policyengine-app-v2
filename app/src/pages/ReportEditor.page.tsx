import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  ActionIcon,
  Menu,
  rem,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconPlus,
  IconArrowLeft,
  IconDotsVertical,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconDeviceFloppy,
  IconChartBar,
  IconMarkdown,
} from '@tabler/icons-react';
import { reportsAPI } from '@/api/v2/reports';
import { reportElementsAPI, ReportElement, MarkdownContent } from '@/api/v2/reportElements';
import { aggregatesAPI, AggregateTable } from '@/api/v2/aggregates';
import { simulationsAPI } from '@/api/v2/simulations';
import ReportElementCell from '@/components/report/ReportElementCell';
import DataElementCreationModal, { DataElementConfig } from '@/components/report/DataElementCreationModal';

export default function ReportEditorPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [dataModalOpened, setDataModalOpened] = useState(false);

  // Fetch report details
  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => reportsAPI.get(reportId!),
    enabled: !!reportId,
  });

  // Fetch report elements
  const {
    data: elements,
    isLoading: elementsLoading,
    error: elementsError,
  } = useQuery({
    queryKey: ['reportElements', reportId],
    queryFn: () => reportElementsAPI.list(reportId!),
    enabled: !!reportId,
  });

  // Sort elements by position (handle undefined positions)
  const sortedElements = elements?.sort((a, b) => {
    const posA = a.position ?? 0;
    const posB = b.position ?? 0;
    return posA - posB;
  }) || [];

  // Create element mutation
  const createElementMutation = useMutation({
    mutationFn: reportElementsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
    },
    onError: (error) => {
      console.error('Failed to create report element:', error);
      alert('Failed to create element. Please try again.');
    },
  });

  // Update element mutation
  const updateElementMutation = useMutation({
    mutationFn: ({ elementId, data }: { elementId: string; data: any }) =>
      reportElementsAPI.update(elementId, data),
    onMutate: async ({ elementId, data }) => {
      setIsSaving(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
    },
  });

  // Delete element mutation
  const deleteElementMutation = useMutation({
    mutationFn: (elementId: string) => reportElementsAPI.delete(elementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
    },
  });

  // Add new markdown element
  const handleAddMarkdownElement = () => {
    const position = sortedElements.length;
    const defaultContent = '# New section\n\nStart typing...';

    createElementMutation.mutate({
      report_id: reportId!,
      label: 'Markdown section',
      type: 'markdown',
      markdown_content: defaultContent,
      position,
    });
  };

  // Handle data element creation
  const handleCreateDataElement = async (config: DataElementConfig) => {
    try {
      const position = sortedElements.length;

      // Determine label based on visualization type
      let label = 'Data visualization';
      // Use the exact visualization type for chart_type
      let chart_type = config.visualizationType; // 'bar_chart' or 'line_chart'
      let x_axis_variable = '';
      let y_axis_variable = '';

      if (config.visualizationType === 'metric_card') {
        label = `Metric: ${config.metricVariable}`;
        y_axis_variable = config.metricVariable || '';
      } else if (config.visualizationType === 'table') {
        label = `Table: ${config.tableColumns?.length || 0} variables`;
      } else if (config.visualizationType === 'bar_chart') {
        label = `Bar chart: ${config.barVariables?.join(', ')}`;
        x_axis_variable = config.barXAxis === 'simulations' ? 'simulation_id' : 'variable_name';
        y_axis_variable = config.barVariables?.[0] || '';
      } else if (config.visualizationType === 'line_chart') {
        label = `Line chart: ${config.lineVariable}`;
        x_axis_variable = config.lineXAxis === 'year' ? 'year' : 'simulation_id';
        y_axis_variable = config.lineVariable || '';
      }

      // Build aggregate inputs based on visualization type
      const aggregateInputs: any[] = [];

      if (config.visualizationType === 'metric_card') {
        // Single aggregate for metric card
        aggregateInputs.push({
          simulation_id: config.metricSimulation!,
          entity: config.entity,
          variable_name: config.metricVariable!,
          aggregate_function: config.metricAggregation!,
          year: null,
          filter_variable_name: config.filterVariableName || null,
          filter_variable_value: config.filterVariableValue || null,
          filter_variable_leq: config.filterVariableLeq || null,
          filter_variable_geq: config.filterVariableGeq || null,
        });
      } else if (config.visualizationType === 'table') {
        // Create aggregate for each cell (simulation x variable)
        for (const simulationId of config.tableRows || []) {
          for (const variable of config.tableColumns || []) {
            aggregateInputs.push({
              simulation_id: simulationId,
              entity: config.entity,
              variable_name: variable,
              aggregate_function: config.tableAggregation!,
              year: null,
              filter_variable_name: config.filterVariableName || null,
              filter_variable_value: config.filterVariableValue || null,
              filter_variable_leq: config.filterVariableLeq || null,
              filter_variable_geq: config.filterVariableGeq || null,
            });
          }
        }
      } else if (config.visualizationType === 'bar_chart') {
        // Create aggregates for bar chart
        for (const simulationId of config.barSimulations || []) {
          for (const variable of config.barVariables || []) {
            aggregateInputs.push({
              simulation_id: simulationId,
              entity: config.entity,
              variable_name: variable,
              aggregate_function: config.barAggregation!,
              year: null,
              filter_variable_name: config.filterVariableName || null,
              filter_variable_value: config.filterVariableValue || null,
              filter_variable_leq: config.filterVariableLeq || null,
              filter_variable_geq: config.filterVariableGeq || null,
            });
          }
        }
      } else if (config.visualizationType === 'line_chart') {
        if (config.lineXAxis === 'year') {
          // Time series: create aggregate for each year
          for (const simulationId of config.lineSimulations || []) {
            for (const year of config.lineYears || [2024, 2025, 2026]) {
              aggregateInputs.push({
                simulation_id: simulationId,
                entity: config.entity,
                variable_name: config.lineVariable!,
                aggregate_function: config.lineAggregation!,
                year: year,
                filter_variable_name: config.filterVariableName || null,
                filter_variable_value: config.filterVariableValue || null,
                filter_variable_leq: config.filterVariableLeq || null,
                filter_variable_geq: config.filterVariableGeq || null,
              });
            }
          }
        } else {
          // Simulations on X-axis
          for (const simulationId of config.lineSimulations || []) {
            aggregateInputs.push({
              simulation_id: simulationId,
              entity: config.entity,
              variable_name: config.lineVariable!,
              aggregate_function: config.lineAggregation!,
              year: null,
              filter_variable_name: config.filterVariableName || null,
              filter_variable_value: config.filterVariableValue || null,
              filter_variable_leq: config.filterVariableLeq || null,
              filter_variable_geq: config.filterVariableGeq || null,
            });
          }
        }
      }

      // Get model_version_id from the first simulation
      let model_version_id: string | undefined;
      const firstSimulationId = aggregateInputs[0]?.simulation_id;
      if (firstSimulationId) {
        try {
          const simulation = await simulationsAPI.get(firstSimulationId);
          model_version_id = simulation.model_version_id;
        } catch (error) {
          console.warn('Could not fetch simulation for model_version_id:', error);
        }
      }

      console.log('Creating report element with aggregates:', {
        label,
        type: 'data',
        data_type: 'Aggregate',
        data: aggregateInputs,
        chart_type,
        x_axis_variable,
        y_axis_variable,
        model_version_id,
        report_id: reportId!,
        position,
      });

      // Create the report element with aggregates in the data field
      // The API will process them automatically
      const response = await reportElementsAPI.create({
        label,
        type: 'data',
        data_type: 'Aggregate',
        data: aggregateInputs,
        chart_type,
        x_axis_variable,
        y_axis_variable,
        model_version_id,
        report_id: reportId!,
        position,
      });

      console.log('Report element created with processed aggregates:', response);

      // Refresh the report elements
      queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
      setDataModalOpened(false);
    } catch (error: any) {
      console.error('Failed to create data element:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to create data element: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Update element content
  const handleUpdateElement = (elementId: string, content: any) => {
    // For markdown, we update the markdown_content field
    const markdown_content = typeof content === 'string' ? content : content.text;
    console.log('handleUpdateElement called with:', {
      elementId,
      content,
      contentType: typeof content,
      markdown_content
    });

    const updateData = { markdown_content };
    console.log('Passing to mutation:', { elementId, data: updateData });

    updateElementMutation.mutate({ elementId, data: updateData });
  };

  // Delete element
  const handleDeleteElement = (elementId: string) => {
    if (confirm('Are you sure you want to delete this element?')) {
      deleteElementMutation.mutate(elementId);
    }
  };

  // Move element up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newElements = [...sortedElements];
    [newElements[index - 1], newElements[index]] = [newElements[index], newElements[index - 1]];

    // Update positions
    newElements.forEach((element, idx) => {
      const currentPos = element.position ?? 0;
      if (currentPos !== idx) {
        updateElementMutation.mutate({
          elementId: element.id,
          data: { position: idx },
        });
      }
    });
  };

  // Move element down
  const handleMoveDown = (index: number) => {
    if (index === sortedElements.length - 1) return;

    const newElements = [...sortedElements];
    [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];

    // Update positions
    newElements.forEach((element, idx) => {
      const currentPos = element.position ?? 0;
      if (currentPos !== idx) {
        updateElementMutation.mutate({
          elementId: element.id,
          data: { position: idx },
        });
      }
    });
  };

  if (reportLoading || elementsLoading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (reportError || elementsError) {
    return (
      <Container size="lg" py="xl">
        <Text color="red">Error loading report. Please try again.</Text>
        <Button mt="md" onClick={() => navigate('/reports')}>
          Back to reports
        </Button>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={() => navigate('/reports')}>
              <IconArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Title order={2}>{report?.label || `Report ${reportId?.slice(0, 8)}`}</Title>
              <Text size="sm" color="dimmed">
                {sortedElements.length} element{sortedElements.length !== 1 ? 's' : ''}
              </Text>
            </div>
          </Group>
          <Group>
            {isSaving && (
              <Group gap="xs">
                <Loader size="xs" />
                <Text size="sm" color="dimmed">
                  Saving...
                </Text>
              </Group>
            )}
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button leftSection={<IconPlus size={16} />}>Add element</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={handleAddMarkdownElement} leftSection={<IconMarkdown size={14} />}>
                  Markdown text
                </Menu.Item>
                <Menu.Item onClick={() => setDataModalOpened(true)} leftSection={<IconChartBar size={14} />}>
                  Data analysis
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Report Elements */}
        {sortedElements.length === 0 ? (
          <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
            <Text size="lg" mb="md">
              Your report is empty
            </Text>
            <Text color="dimmed" mb="xl">
              Add your first element to get started
            </Text>
            <Group>
              <Button onClick={handleAddMarkdownElement} leftSection={<IconMarkdown size={14} />}>
                Add markdown element
              </Button>
              <Button onClick={() => setDataModalOpened(true)} leftSection={<IconChartBar size={14} />}>
                Add data analysis
              </Button>
            </Group>
          </Paper>
        ) : (
          <Stack gap="md">
            {sortedElements.map((element, index) => (
              <ReportElementCell
                key={element.id}
                element={element}
                onUpdate={(content) => handleUpdateElement(element.id, content)}
                onDelete={() => handleDeleteElement(element.id)}
                onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
                onMoveDown={
                  index < sortedElements.length - 1 ? () => handleMoveDown(index) : undefined
                }
              />
            ))}
          </Stack>
        )}

        {/* Add element button at bottom */}
        {sortedElements.length > 0 && (
          <Center>
            <Group>
              <Button
                variant="subtle"
                onClick={handleAddMarkdownElement}
                leftSection={<IconMarkdown size={14} />}
              >
                Add markdown
              </Button>
              <Button
                variant="subtle"
                onClick={() => setDataModalOpened(true)}
                leftSection={<IconChartBar size={14} />}
              >
                Add data
              </Button>
            </Group>
          </Center>
        )}
      </Stack>

      {/* Data Element Creation Modal */}
      <DataElementCreationModal
        opened={dataModalOpened}
        onClose={() => setDataModalOpened(false)}
        onSubmit={handleCreateDataElement}
        reportId={reportId!}
      />
    </Container>
  );
}