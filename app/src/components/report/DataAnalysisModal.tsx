import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  Alert,
  Badge,
  LoadingOverlay,
  Box,
  MultiSelect,
  Paper,
  Transition,
} from '@mantine/core';
import {
  IconSparkles,
  IconAlertCircle,
  IconRefresh,
  IconCheck,
} from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';
import { dataRequestsAPI, DataRequestResponse } from '@/api/v2/dataRequests';
import { simulationsAPI } from '@/api/v2/simulations';
import { userSimulationsAPI } from '@/api/v2/userSimulations';
import { MOCK_USER_ID } from '@/constants';


interface DataAnalysisModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (
    aggregates: any[],
    aggregateChanges: any[],
    explanation?: string
  ) => void;
  reportId: string;
}

export default function DataAnalysisModal({
  opened,
  onClose,
  onSubmit,
  reportId,
}: DataAnalysisModalProps) {
  const [step, setStep] = useState<'selection' | 'confirmation'>('selection');
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResponse, setParsedResponse] = useState<DataRequestResponse | null>(null);
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Fetch simulations
  const { data: simulations, isLoading: simulationsLoading } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => simulationsAPI.list({ limit: 1000 }),
    enabled: opened,
  });

  // Fetch user simulations for custom names
  const { data: userSimulations = [] } = useQuery({
    queryKey: ['userSimulations', userId],
    queryFn: () => userSimulationsAPI.list(userId),
    enabled: opened,
  });

  // Simulation options with better labels using user-provided names
  const simulationOptions = simulations?.filter(s => s.id).map(s => {
    const userSim = userSimulations.find(us => us.simulation_id === s.id);
    const displayName = userSim?.custom_name || `Simulation ${s.id?.slice(0, 8) || ''}`;

    return {
      value: s.id || '',
      label: displayName,
    };
  }).filter(opt => opt.value) || [];


  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      setStep('selection');
      setSelectedSimulations([]);
      setDescription('');
      setError(null);
      setParsedResponse(null);
    }
  }, [opened]);

  const handleParse = async () => {
    if (selectedSimulations.length === 0) {
      setError('Please select at least one simulation');
      return;
    }

    if (!description.trim()) {
      setError('Please describe what data you want to analyse');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build rich context with simulation details
      const simulationContext = selectedSimulations.map((simId, idx) => {
        const sim = simulations?.find(s => s.id === simId);
        const userSim = userSimulations.find(us => us.simulation_id === simId);
        const displayName = userSim?.custom_name || sim?.name || `Simulation ${idx + 1}`;
        return `- ${displayName} (ID: ${simId})`;
      }).join('\n');

      // Enhanced prompt that makes it clear the LLM should handle ALL selected simulations
      const enhancedDescription = `Available simulations:
${simulationContext}

User request: ${description}

IMPORTANT: The user has selected ${selectedSimulations.length} simulation${selectedSimulations.length > 1 ? 's' : ''}. Make sure to include data for ALL of them in your response. If the request mentions comparing or showing differences, create aggregate_changes. Otherwise, create separate aggregates for each simulation.`;

      // Call API - let the backend infer whether to create aggregates or aggregate changes
      const response = await dataRequestsAPI.parse(
        enhancedDescription,
        reportId,
        selectedSimulations,
        false // Don't force comparison mode - let LLM infer from text
      );

      setParsedResponse(response);
      setStep('confirmation');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to understand your request. Please try rephrasing.');
      console.error('Parse error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResponse) return;

    // Check the response to see what type of data was returned
    // If any aggregate has baseline_simulation_id and comparison_simulation_id, it's a comparison
    const isComparison = parsedResponse.aggregates.some(
      agg => agg.baseline_simulation_id && agg.comparison_simulation_id
    );

    let aggregates: any[] = [];
    let aggregateChanges: any[] = [];

    if (isComparison) {
      aggregateChanges = parsedResponse.aggregates;
    } else {
      aggregates = parsedResponse.aggregates;
    }

    onSubmit(
      aggregates,
      aggregateChanges,
      parsedResponse.explanation
    );

    onClose();
  };

  const handleBack = () => {
    if (step === 'confirmation') {
      setStep('selection');
      setParsedResponse(null);
    }
  };

  const renderSelectionStep = () => (
    <Stack>
      <Text size="sm" c="dimmed">Select simulations and describe what data you'd like to analyse</Text>

      <MultiSelect
        label="Simulations"
        placeholder="Select one or more simulations"
        data={simulationOptions}
        value={selectedSimulations}
        onChange={setSelectedSimulations}
        searchable
        required
        disabled={simulationsLoading}
        size="sm"
        description="Select one simulation to view metrics, or multiple to compare"
      />

      <Textarea
        label="Description"
        placeholder="e.g., Show average household income by income decile, or compare tax revenue changes between simulations"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        minRows={4}
        maxRows={8}
        autosize
        required
      />

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      )}
    </Stack>
  );

  const renderConfirmationStep = () => {
    if (!parsedResponse) return null;

    return (
      <Stack>
        <Text size="sm" c="dimmed">Review the analysis to be created</Text>

        <Paper p="sm" withBorder>
          <Text size="sm">{parsedResponse.explanation}</Text>
        </Paper>

        <Group gap="xs">
          <Badge variant="light" size="sm">
            {parsedResponse.aggregates.length} data {parsedResponse.aggregates.length === 1 ? 'point' : 'points'}
          </Badge>
          <Badge variant="light" size="sm">
            {parsedResponse.chart_type || 'table'} view
          </Badge>
        </Group>

        <Text size="xs" c="dimmed">
          You can customise the visualisation after adding it to your report.
        </Text>
      </Stack>
    );
  };

  const getStepContent = () => {
    switch (step) {
      case 'selection':
        return renderSelectionStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  const getActionButtons = () => {
    switch (step) {
      case 'selection':
        return (
          <>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleParse}
              disabled={selectedSimulations.length === 0 || !description.trim() || simulationsLoading}
              loading={isLoading}
              leftSection={<IconSparkles size={16} />}
            >
              Analyse
            </Button>
          </>
        );
      case 'confirmation':
        return (
          <>
            <Button
              variant="subtle"
              onClick={handleBack}
              leftSection={<IconRefresh size={16} />}
            >
              Try again
            </Button>
            <Button
              onClick={handleConfirm}
              leftSection={<IconCheck size={16} />}
              color="green"
            >
              Create visualisation
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      title="Add data analysis"
      size="md"
      primaryButton={undefined}
      secondaryButton={undefined}
    >
      <Box style={{ position: 'relative', minHeight: 350 }}>
        <LoadingOverlay visible={isLoading} />

        <Stack>
          {/* Progress indicator */}
          <Group justify="center" gap="xs">
            {['selection', 'confirmation'].map((s, idx) => (
              <Box
                key={s}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor:
                    step === s ? 'var(--mantine-color-blue-6)' :
                    ['selection', 'confirmation'].indexOf(step) > idx ?
                      'var(--mantine-color-green-6)' :
                      'var(--mantine-color-gray-3)',
                  transition: 'background-color 0.2s ease',
                }}
              />
            ))}
          </Group>

          <Transition
            mounted={true}
            transition="fade"
            duration={200}
          >
            {(styles) => (
              <Box style={styles}>
                {getStepContent()}
              </Box>
            )}
          </Transition>

          <Group justify="space-between" mt="lg">
            {getActionButtons()}
          </Group>
        </Stack>
      </Box>
    </BaseModal>
  );
}