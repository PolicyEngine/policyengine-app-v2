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
} from '@tabler/icons-react';
import { reportsAPI } from '@/api/v2/reports';
import { reportElementsAPI, ReportElement, MarkdownContent } from '@/api/v2/reportElements';
import ReportElementCell from '@/components/report/ReportElementCell';

export default function ReportEditorPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

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
  const handleAddElement = (type: 'markdown' | 'chart' | 'table' | 'metric' = 'markdown') => {
    const position = sortedElements.length;
    const defaultContent = '# New section\n\nStart typing...';

    console.log('Creating element with data:', {
      report_id: reportId!,
      label: 'Markdown section',
      type,
      markdown_content: type === 'markdown' ? defaultContent : undefined,
      position,
    });

    createElementMutation.mutate({
      report_id: reportId!,
      label: 'Markdown section', // Label is required
      type,
      markdown_content: type === 'markdown' ? defaultContent : undefined,
      position,
    });
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
                <Menu.Item onClick={() => handleAddElement('markdown')}>
                  Markdown text
                </Menu.Item>
                <Menu.Item disabled onClick={() => handleAddElement('chart')}>
                  Chart (coming soon)
                </Menu.Item>
                <Menu.Item disabled onClick={() => handleAddElement('table')}>
                  Table (coming soon)
                </Menu.Item>
                <Menu.Item disabled onClick={() => handleAddElement('metric')}>
                  Metric card (coming soon)
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
            <Button onClick={() => handleAddElement('markdown')} leftSection={<IconPlus size={16} />}>
              Add markdown element
            </Button>
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
            <Button
              variant="subtle"
              onClick={() => handleAddElement('markdown')}
              leftSection={<IconPlus size={16} />}
            >
              Add element
            </Button>
          </Center>
        )}
      </Stack>
    </Container>
  );
}