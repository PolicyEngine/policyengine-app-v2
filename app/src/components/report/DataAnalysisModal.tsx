import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  Alert,
  LoadingOverlay,
  Box,
  Paper,
  Checkbox,
  ScrollArea,
  Code,
  Collapse,
  ActionIcon,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';
import { reportElementsAPI } from '@/api/v2/reportElements';
import { simulationsAPI } from '@/api/v2/simulations';
import { userSimulationsAPI } from '@/api/v2/userSimulations';
import { policiesAPI } from '@/api/v2/policies';
import { datasetsAPI } from '@/api/v2/datasets';
import { MOCK_USER_ID } from '@/constants';

interface DataAnalysisModalProps {
  opened: boolean;
  onClose: () => void;
  reportId: string;
}

interface SimulationSelection {
  id: string;
  selected: boolean;
  customName?: string;
  policyName?: string;
  datasetName?: string;
}

export default function DataAnalysisModal({
  opened,
  onClose,
  reportId,
}: DataAnalysisModalProps) {
  const queryClient = useQueryClient();
  const [selectedSimulations, setSelectedSimulations] = useState<SimulationSelection[]>([]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
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

  // Initialize simulation selections with metadata
  useEffect(() => {
    if (!simulations || !opened) return;

    const loadSimulationMetadata = async () => {
      const selections: SimulationSelection[] = await Promise.all(
        simulations.filter(s => s.id).map(async (sim) => {
          const userSim = userSimulations.find(us => us.simulation_id === sim.id);

          // Fetch policy and dataset names
          let policyName = 'Default policy';
          let datasetName = 'Default dataset';

          try {
            if (sim.policy_id) {
              const policy = await policiesAPI.get(sim.policy_id);
              policyName = policy.name || `Policy ${sim.policy_id.slice(0, 8)}`;
            }
            if (sim.dataset_id) {
              const dataset = await datasetsAPI.getDataset(sim.dataset_id);
              datasetName = dataset.name || `Dataset ${sim.dataset_id.slice(0, 8)}`;
            }
          } catch (err) {
            console.error('Error loading simulation metadata:', err);
          }

          return {
            id: sim.id || '',
            selected: false,
            customName: userSim?.custom_name || undefined,
            policyName,
            datasetName,
          };
        })
      );

      setSelectedSimulations(selections);
    };

    loadSimulationMetadata();
  }, [simulations, userSimulations, opened]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      setDescription('');
      setError(null);
      setShowContext(false);
    }
  }, [opened]);

  const handleToggleSimulation = (simId: string) => {
    setSelectedSimulations(prev =>
      prev.map(sim =>
        sim.id === simId ? { ...sim, selected: !sim.selected } : sim
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = selectedSimulations.every(s => s.selected);
    setSelectedSimulations(prev =>
      prev.map(sim => ({ ...sim, selected: !allSelected }))
    );
  };

  const getSelectedCount = () => selectedSimulations.filter(s => s.selected).length;

  const buildLLMContext = () => {
    const selected = selectedSimulations.filter(s => s.selected);

    return `Available simulations for analysis:
${selected.map((sim, idx) => {
  const name = sim.customName || `Simulation ${idx + 1}`;
  return `
- ${name} (ID: ${sim.id})
  Policy: ${sim.policyName}
  Dataset: ${sim.datasetName}`;
}).join('')}

Total simulations selected: ${selected.length}

User request: ${description}`;
  };

  const handleSubmit = async () => {
    const selected = selectedSimulations.filter(s => s.selected);

    if (selected.length === 0) {
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
      // Call new AI endpoint
      const response = await reportElementsAPI.createAI(
        buildLLMContext(),
        reportId,
        selected.map(s => s.id)
      );

      console.log('AI report element created:', response);

      // Just refresh the report elements - the AI endpoint already created the element
      await queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create report element. Please try again.');
      console.error('Error creating AI report element:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      title="Add data analysis"
      size="lg"
      primaryButton={{
        label: 'Create analysis',
        onClick: handleSubmit,
        disabled: getSelectedCount() === 0 || !description.trim() || simulationsLoading,
        loading: isLoading,
      }}
      secondaryButton={{
        label: 'Cancel',
        onClick: onClose,
      }}
    >
      <Box style={{ position: 'relative', minHeight: 400 }}>
        <LoadingOverlay visible={isLoading} />

        <Stack>
          <Text size="sm" c="dimmed">
            Select simulations from your library and describe what data you'd like to analyse
          </Text>

          {/* Simulation selector */}
          <Paper withBorder p="md">
            <Group justify="space-between" mb="sm">
              <Text size="sm" fw={500}>
                Simulations ({getSelectedCount()} selected)
              </Text>
              <Button
                size="xs"
                variant="subtle"
                onClick={handleSelectAll}
                disabled={simulationsLoading}
              >
                {selectedSimulations.every(s => s.selected) ? 'Deselect all' : 'Select all'}
              </Button>
            </Group>

            <ScrollArea h={200}>
              <Stack gap="xs">
                {selectedSimulations.map(sim => {
                  const displayName = sim.customName || `${sim.policyName} / ${sim.datasetName}`;

                  return (
                    <Checkbox
                      key={sim.id}
                      checked={sim.selected}
                      onChange={() => handleToggleSimulation(sim.id)}
                      label={
                        <Group gap="xs">
                          <Text size="sm">{displayName}</Text>
                          <Text size="xs" c="dimmed">
                            ({sim.id.slice(0, 8)})
                          </Text>
                        </Group>
                      }
                    />
                  );
                })}
                {selectedSimulations.length === 0 && !simulationsLoading && (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No simulations available. Create simulations first.
                  </Text>
                )}
              </Stack>
            </ScrollArea>
          </Paper>

          {/* Description */}
          <Textarea
            label="Analysis description"
            placeholder="e.g., Show average household income by income decile for all simulations, or compare tax revenue changes between reforms"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={4}
            maxRows={8}
            autosize
            required
          />

          {/* Show/hide context */}
          {selectedSimulations.length > 0 && (
            <Group>
              <ActionIcon
                variant="subtle"
                onClick={() => setShowContext(!showContext)}
                size="sm"
              >
                {showContext ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </ActionIcon>
              <Text size="xs" c="dimmed">
                {showContext ? 'Hide' : 'Show'} LLM context
              </Text>
            </Group>
          )}

          {/* LLM context preview */}
          <Collapse in={showContext}>
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="xs" fw={500} mb="xs">Context sent to AI:</Text>
              <Code block style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                {buildLLMContext()}
              </Code>
            </Paper>
          </Collapse>

          {/* Error display */}
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          )}

          <Text size="xs" c="dimmed">
            The AI will create report elements with data from all selected simulations.
            You can further process the data with AI after creation.
          </Text>
        </Stack>
      </Box>
    </BaseModal>
  );
}