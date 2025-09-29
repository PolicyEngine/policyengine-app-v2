import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Skeleton,
  Paper,
  ActionIcon,
  Tooltip,
  Menu,
  Badge,
  LoadingOverlay,
  Center,
  Loader,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconEdit,
  IconTrash,
  IconChartBar,
  IconMarkdown,
  IconPlus,
  IconShare,
  IconChevronDown,
} from '@tabler/icons-react';
import { reportsAPI } from '@/api/v2/reports';
import { reportElementsAPI } from '@/api/v2/reportElements';
import { aggregatesAPI } from '@/api/v2/aggregates';
import { aggregateChangesAPI } from '@/api/v2/aggregateChanges';
import { modelVersionsAPI } from '@/api/v2/modelVersions';
import { simulationsAPI } from '@/api/v2/simulations';
import ReportElementCell from '@/components/report/ReportElementCell';
import DataAnalysisModal from '@/components/report/DataAnalysisModal';

export default function ReportEditorPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dataModalOpened, setDataModalOpened] = useState(false);
  const [isCreatingElement, setIsCreatingElement] = useState(false);

  // Fetch report details
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => reportsAPI.get(reportId!),
    enabled: !!reportId,
  });

  // Fetch report elements
  const { data: reportElements, isLoading: elementsLoading } = useQuery({
    queryKey: ['reportElements', reportId],
    queryFn: () => reportElementsAPI.getByReport(reportId!),
    enabled: !!reportId,
  });

  // Fetch all model versions
  const { data: modelVersions } = useQuery({
    queryKey: ['modelVersions'],
    queryFn: () => modelVersionsAPI.list({ limit: 100 }),
  });

  // Sort elements by position
  const sortedElements = useMemo(() => {
    if (!reportElements) return [];
    return [...reportElements].sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [reportElements]);

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      reportsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
    },
  });

  // Delete report element mutation
  const deleteElementMutation = useMutation({
    mutationFn: (elementId: string) => reportElementsAPI.delete(elementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
    },
  });

  // Update report element mutation
  const updateElementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      reportElementsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
    },
  });

  // Handle element updates
  const handleUpdateElement = async (elementId: string, content: string) => {
    await updateElementMutation.mutateAsync({
      id: elementId,
      data: { markdown_content: content },
    });
  };

  // Handle element deletion
  const handleDeleteElement = async (elementId: string) => {
    if (window.confirm('Are you sure you want to delete this element?')) {
      await deleteElementMutation.mutateAsync(elementId);
    }
  };

  // Handle moving elements up/down
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const element = sortedElements[index];
    const prevElement = sortedElements[index - 1];

    await Promise.all([
      updateElementMutation.mutateAsync({
        id: element.id,
        data: { position: prevElement.position },
      }),
      updateElementMutation.mutateAsync({
        id: prevElement.id,
        data: { position: element.position },
      }),
    ]);
  };

  const handleMoveDown = async (index: number) => {
    if (index === sortedElements.length - 1) return;
    const element = sortedElements[index];
    const nextElement = sortedElements[index + 1];

    await Promise.all([
      updateElementMutation.mutateAsync({
        id: element.id,
        data: { position: nextElement.position },
      }),
      updateElementMutation.mutateAsync({
        id: nextElement.id,
        data: { position: element.position },
      }),
    ]);
  };

  // Handle unified data element creation
  const handleCreateDataElement = async (
    aggregates: any[],
    aggregateChanges: any[],
    explanation?: string
  ) => {
    setDataModalOpened(false); // Close modal immediately
    setIsCreatingElement(true); // Show loading state

    try {
      const position = sortedElements.length;
      const label = explanation || 'Data analysis';

      // Determine data type based on which array has content
      const isComparison = aggregateChanges.length > 0;
      const dataType = isComparison ? 'AggregateChange' : 'Aggregate';
      const data = isComparison ? aggregateChanges : aggregates;

      console.log('Creating data element with:');
      console.log('Data type:', dataType);
      console.log('Number of items:', data.length);
      console.log('Data:', data);
      console.log('Explanation:', explanation);

      // Get model_version_id from the first simulation
      let model_version_id: string | undefined;
      const firstSimulationId = data[0]?.simulation_id || data[0]?.baseline_simulation_id;
      if (firstSimulationId) {
        try {
          const simulation = await simulationsAPI.get(firstSimulationId);
          model_version_id = simulation.model_version_id;
        } catch (error) {
          console.warn('Could not fetch simulation for model_version_id:', error);
        }
      }

      // First, create the report element
      const elementPayload = {
        label,
        type: 'data',
        data_type: dataType,
        data: data,  // This should trigger aggregate creation in backend
        data_table: isComparison ? 'aggregate_changes' : 'aggregates',
        chart_type: 'table',
        x_axis_variable: null,
        y_axis_variable: null,
        model_version_id,
        report_id: reportId!,
        position,
      };

      console.log('Creating report element with payload:', elementPayload);
      const response = await reportElementsAPI.create(elementPayload);
      console.log('Report element created:', response);

      // Refresh the report elements
      await queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
      console.log('Queries invalidated');
    } catch (error: any) {
      console.error('Failed to create data element:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to create data element: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsCreatingElement(false); // Clear loading state
    }
  };

  // Handle adding a markdown element
  const handleAddMarkdownElement = async () => {
    try {
      const position = sortedElements.length;
      console.log('Creating markdown element at position:', position);

      const response = await reportElementsAPI.create({
        label: 'Text',
        type: 'markdown',
        markdown_content: '# New section\n\nClick to edit this text...',
        report_id: reportId!,
        position,
      });

      console.log('Markdown element created:', response);
      await queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
      console.log('Queries invalidated');
    } catch (error: any) {
      console.error('Failed to create markdown element:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to create text element: ${error.response?.data?.detail || error.message}`);
    }
  };

  const isLoading = reportLoading || elementsLoading;

  if (!reportId) {
    return (
      <Container size="md" py="xl">
        <Text>Invalid report ID</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ size: "lg" }}
      />

      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={() => navigate('/reports')}>
              <IconChevronLeft size={20} />
            </ActionIcon>
            <Stack gap={4}>
              <Title order={2}>{report?.label || 'Untitled report'}</Title>
              {report?.description && (
                <Text size="sm" c="dimmed">
                  {report.description}
                </Text>
              )}
            </Stack>
          </Group>
          <Group>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button rightSection={<IconChevronDown size={14} />}>
                  Add element
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setDataModalOpened(true)} leftSection={<IconChartBar size={14} />}>
                  Data analysis
                </Menu.Item>
                <Menu.Item onClick={handleAddMarkdownElement} leftSection={<IconMarkdown size={14} />}>
                  Text block
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
              <Button onClick={() => setDataModalOpened(true)} leftSection={<IconChartBar size={14} />}>
                Add data analysis
              </Button>
              <Button onClick={handleAddMarkdownElement} leftSection={<IconMarkdown size={14} />}>
                Add text block
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

            {/* Loading indicator for new element */}
            {isCreatingElement && (
              <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
                <Stack align="center" gap="md">
                  <Loader size="lg" />
                  <Text size="sm" c="dimmed">
                    Creating your data analysis...
                  </Text>
                </Stack>
              </Paper>
            )}
          </Stack>
        )}

        {/* Add element button at bottom */}
        {sortedElements.length > 0 && (
          <Center>
            <Group>
              <Button
                variant="subtle"
                onClick={() => setDataModalOpened(true)}
                leftSection={<IconChartBar size={14} />}
              >
                Add data
              </Button>
              <Button
                variant="subtle"
                onClick={handleAddMarkdownElement}
                leftSection={<IconMarkdown size={14} />}
              >
                Add text
              </Button>
            </Group>
          </Center>
        )}
      </Stack>

      {/* Data Analysis Modal */}
      <DataAnalysisModal
        opened={dataModalOpened}
        onClose={() => setDataModalOpened(false)}
        onSubmit={handleCreateDataElement}
        reportId={reportId!}
      />
    </Container>
  );
}