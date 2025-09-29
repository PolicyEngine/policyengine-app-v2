import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  ScrollArea,
  Select,
  MultiSelect,
  Radio,
  Paper,
  Divider,
  Transition,
  Chip,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconSparkles,
  IconAlertCircle,
  IconChevronRight,
  IconInfoCircle,
  IconRefresh,
  IconX,
  IconCheck,
} from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';
import { dataRequestsAPI, DataRequestResponse } from '@/api/v2/dataRequests';
import { simulationsAPI } from '@/api/v2/simulations';

type DataType = 'single' | 'comparison';

interface SimulationSelection {
  type: DataType;
  simulations: string[];
}

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
  const [step, setStep] = useState<'selection' | 'description' | 'confirmation'>('selection');
  const [dataType, setDataType] = useState<DataType>('single');
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResponse, setParsedResponse] = useState<DataRequestResponse | null>(null);

  // Fetch simulations
  const { data: simulations, isLoading: simulationsLoading } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => simulationsAPI.list({ limit: 1000 }),
    enabled: opened,
  });

  // Simulation options with better labels
  const simulationOptions = simulations?.filter(s => s.id).map(s => ({
    value: s.id || '',
    label: s.label || `Simulation ${s.id?.slice(0, 8) || ''}`,
  })).filter(opt => opt.value) || [];


  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      setStep('selection');
      setDataType('single');
      setSelectedSimulations([]);
      setDescription('');
      setError(null);
      setParsedResponse(null);
    }
  }, [opened]);

  const handleProceedToDescription = () => {
    if (selectedSimulations.length === 0) {
      setError('Please select at least one simulation');
      return;
    }
    if (dataType === 'comparison' && selectedSimulations.length !== 2) {
      setError('Please select exactly two simulations for comparison');
      return;
    }
    setError(null);
    setStep('description');
  };

  const handleParse = async () => {
    if (!description.trim()) {
      setError('Please describe what data you want to analyse');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Enhanced description with simulation context
      const enhancedDescription = dataType === 'comparison'
        ? `Compare the following between these two simulations: ${description}`
        : `For this simulation: ${description}`;

      // Call API with simulation IDs embedded
      const response = await dataRequestsAPI.parse(
        enhancedDescription,
        reportId,
        selectedSimulations,
        dataType === 'comparison'
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

    // Separate aggregates and aggregate changes based on data type
    let aggregates: any[] = [];
    let aggregateChanges: any[] = [];

    if (dataType === 'single') {
      aggregates = parsedResponse.aggregates;
    } else {
      // For comparisons, ensure we have the correct field names
      // Map the simulation IDs to baseline and comparison
      aggregateChanges = parsedResponse.aggregates.map(agg => {
        // If the backend already provided baseline_simulation_id and comparison_simulation_id, use them
        if (agg.baseline_simulation_id && agg.comparison_simulation_id) {
          return agg;
        }

        // Otherwise, map from selectedSimulations
        return {
          ...agg,
          baseline_simulation_id: agg.baseline_simulation_id || selectedSimulations[0],
          comparison_simulation_id: agg.comparison_simulation_id || selectedSimulations[1],
          // Remove simulation_id if it exists to avoid confusion
          simulation_id: undefined,
        };
      });
    }

    onSubmit(
      aggregates,
      aggregateChanges,
      parsedResponse.explanation
    );

    onClose();
  };

  const handleBack = () => {
    if (step === 'description') {
      setStep('selection');
      setError(null);
    } else if (step === 'confirmation') {
      setStep('description');
      setParsedResponse(null);
    }
  };

  const renderSelectionStep = () => (
    <Stack>
      <Text size="sm" c="dimmed">Choose the type of analysis and simulations to use</Text>

      <Radio.Group
        value={dataType}
        onChange={(value) => {
          setDataType(value as DataType);
          setSelectedSimulations([]);
        }}
      >
        <Stack gap="sm">
          <Paper withBorder p="sm">
            <Radio
              value="single"
              label={
                <Stack gap={4}>
                  <Text size="sm" fw={500}>Single simulation</Text>
                  <Text size="xs" c="dimmed">
                    View metrics from one policy
                  </Text>
                </Stack>
              }
            />
          </Paper>

          <Paper withBorder p="sm">
            <Radio
              value="comparison"
              label={
                <Stack gap={4}>
                  <Text size="sm" fw={500}>Compare simulations</Text>
                  <Text size="xs" c="dimmed">
                    See changes between baseline and reform
                  </Text>
                </Stack>
              }
            />
          </Paper>
        </Stack>
      </Radio.Group>

      <Divider />

      {dataType === 'single' ? (
        <Select
          label="Simulation"
          placeholder="Choose a simulation"
          data={simulationOptions}
          value={selectedSimulations[0] || ''}
          onChange={(value) => setSelectedSimulations(value ? [value] : [])}
          searchable
          required
          disabled={simulationsLoading}
          size="sm"
        />
      ) : (
        <Stack gap="sm">
          <Select
            label="Baseline"
            placeholder="Select baseline simulation"
            data={simulationOptions}
            value={selectedSimulations[0] || ''}
            onChange={(value) => {
              const newSelection = [...selectedSimulations];
              newSelection[0] = value || '';
              setSelectedSimulations(newSelection.filter(s => s));
            }}
            searchable
            required
            disabled={simulationsLoading}
            size="sm"
          />
          <Select
            label="Reform"
            placeholder="Select reform simulation"
            data={simulationOptions}
            value={selectedSimulations[1] || ''}
            onChange={(value) => {
              const newSelection = [...selectedSimulations];
              newSelection[1] = value || '';
              setSelectedSimulations(newSelection.filter(s => s));
            }}
            searchable
            required
            disabled={simulationsLoading}
            size="sm"
          />
        </Stack>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" size="sm">
          {error}
        </Alert>
      )}
    </Stack>
  );

  const renderDescriptionStep = () => (
    <Stack>
      <Text size="sm" c="dimmed">Describe the data you'd like to see</Text>

      <Textarea
        placeholder={dataType === 'single'
          ? "e.g., Show average household income by income decile"
          : "e.g., Compare the change in tax revenue between the two policies"
        }
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
      case 'description':
        return renderDescriptionStep();
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
              onClick={handleProceedToDescription}
              disabled={selectedSimulations.length === 0 || simulationsLoading}
              rightSection={<IconChevronRight size={16} />}
            >
              Next
            </Button>
          </>
        );
      case 'description':
        return (
          <>
            <Button variant="subtle" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleParse}
              disabled={!description.trim()}
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
            {['selection', 'description', 'confirmation'].map((s, idx) => (
              <Box
                key={s}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor:
                    step === s ? 'var(--mantine-color-blue-6)' :
                    ['selection', 'description', 'confirmation'].indexOf(step) > idx ?
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