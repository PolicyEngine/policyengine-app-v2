import { useState } from 'react';
import {
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  Alert,
  Card,
  Title,
  Badge,
  LoadingOverlay,
  Box,
  Code,
  ScrollArea,
} from '@mantine/core';
import { IconInfoCircle, IconSparkles, IconAlertCircle } from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';
import { dataRequestsAPI, DataRequestResponse } from '@/api/v2/dataRequests';

interface DataElementCreationModalLLMProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (
    aggregates: any[],
    explanation?: string
  ) => void;
  reportId: string;
}

export default function DataElementCreationModalLLM({
  opened,
  onClose,
  onSubmit,
  reportId,
}: DataElementCreationModalLLMProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResponse, setParsedResponse] = useState<DataRequestResponse | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const examplePrompts = [
    "Show average employment income by simulation",
    "Compare household benefits across all policies in a table",
    "Create a bar chart of tax revenues for working-age adults",
    "Display median disposable income trends over time",
    "Show income distribution for people aged 18-65 earning less than £50k",
  ];

  const handleParse = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await dataRequestsAPI.parse(description, reportId);
      console.log('LLM parsed response:', response);
      console.log('Number of aggregates from LLM:', response.aggregates.length);
      setParsedResponse(response);
      setShowConfirmation(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse request. Please try again.');
      console.error('Parse error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResponse) return;

    console.log('Confirming with aggregates:', parsedResponse.aggregates);
    console.log('Number of aggregates being submitted:', parsedResponse.aggregates.length);

    // Pass the aggregates directly from the parsed response
    onSubmit(
      parsedResponse.aggregates,
      parsedResponse.explanation
    );

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setDescription('');
    setParsedResponse(null);
    setShowConfirmation(false);
    setError(null);
  };

  const renderConfirmation = () => {
    if (!parsedResponse) return null;

    return (
      <Stack>
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          <Text size="sm">{parsedResponse.explanation}</Text>
        </Alert>

        <Card withBorder>
          <Stack gap="xs">
            <Text fw={500}>Data to fetch ({parsedResponse.aggregates.length} queries)</Text>
            <ScrollArea h={200}>
              <Stack gap="xs">
                {parsedResponse.aggregates.map((agg, index) => (
                  <Card key={index} withBorder padding="xs">
                    <Stack gap={4}>
                      <Group gap="xs">
                        <Text size="sm" fw={500}>{agg.variable_name}</Text>
                        <Badge size="sm" variant="light">{agg.aggregate_function}</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        Simulation: {agg.simulation_id.slice(0, 8)}...
                      </Text>
                      {agg.filter_variable_name && (
                        <Text size="xs" c="dimmed">
                          Filter: {agg.filter_variable_name}
                          {agg.filter_variable_geq && ` >= ${agg.filter_variable_geq}`}
                          {agg.filter_variable_leq && ` <= ${agg.filter_variable_leq}`}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>
        </Card>

        <Group justify="space-between">
          <Button variant="subtle" onClick={handleReset}>
            Try again
          </Button>
          <Group>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Create visualisation
            </Button>
          </Group>
        </Group>
      </Stack>
    );
  };

  const renderInput = () => (
    <Stack>
      <Alert icon={<IconSparkles size={16} />} color="blue">
        <Text size="sm">
          Describe the data you want to visualise in natural language. I'll figure out the details.
        </Text>
      </Alert>

      <Textarea
        placeholder="e.g., Show me how average household income changes across different policy simulations"
        minRows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={error}
      />

      <Stack gap="xs">
        <Text size="xs" c="dimmed">Example requests:</Text>
        {examplePrompts.map((prompt, index) => (
          <Text
            key={index}
            size="xs"
            c="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => setDescription(prompt)}
          >
            • {prompt}
          </Text>
        ))}
      </Stack>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleParse}
          disabled={!description.trim()}
          leftSection={<IconSparkles size={16} />}
        >
          Analyse request
        </Button>
      </Group>
    </Stack>
  );

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      title="Add data analysis"
      size="lg"
    >
      <Box style={{ position: 'relative', minHeight: 400 }}>
        <LoadingOverlay visible={isLoading} />

        {showConfirmation ? renderConfirmation() : renderInput()}
      </Box>
    </BaseModal>
  );
}