import { useState, useEffect, useMemo } from 'react';
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
  ScrollArea,
  Card,
  Badge,
  TextInput,
  Center,
  Loader,
  Title,
  ThemeIcon,
  Transition,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconSearch,
  IconDatabase,
  IconVariable,
  IconSparkles,
} from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';
import StepIndicator, { Step } from '@/components/shared/StepIndicator';
import { reportElementsAPI } from '@/api/v2/reportElements';
import { simulationsAPI } from '@/api/v2/simulations';
import { userSimulationsAPI } from '@/api/v2/userSimulations';
import { policiesAPI } from '@/api/v2/policies';
import { datasetsAPI } from '@/api/v2/datasets';
import { variablesAPI, Variable } from '@/api/v2/variables';
import { MOCK_USER_ID } from '@/constants';
import { modalDesign } from '@/styles/modalDesign';

interface DataAnalysisModalProps {
  opened: boolean;
  onClose: () => void;
  reportId: string;
}

interface SimulationWithMetadata {
  id: string;
  customName?: string;
  policyName?: string;
  datasetName?: string;
  modelId?: string;
  modelVersionId?: string;
}

type Step = 'simulations' | 'variables' | 'prompt';

export default function DataAnalysisModal({
  opened,
  onClose,
  reportId,
}: DataAnalysisModalProps) {
  const queryClient = useQueryClient();
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<Step>('simulations');

  // Form state
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variableSearch, setVariableSearch] = useState('');

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

  // Build simulations with metadata
  const [simulationsWithMetadata, setSimulationsWithMetadata] = useState<
    SimulationWithMetadata[]
  >([]);

  useEffect(() => {
    if (!simulations || !opened) return;

    const loadSimulationMetadata = async () => {
      const metadata: SimulationWithMetadata[] = await Promise.all(
        simulations.filter(s => s.id).map(async (sim) => {
          const userSim = userSimulations.find(us => us.simulation_id === sim.id);

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
            customName: userSim?.custom_name || undefined,
            policyName,
            datasetName,
            modelId: sim.model_id,
            modelVersionId: sim.model_version_id,
          };
        })
      );

      setSimulationsWithMetadata(metadata);
    };

    loadSimulationMetadata();
  }, [simulations, userSimulations, opened]);

  // Get model ID from selected simulations
  const modelId = useMemo(() => {
    if (selectedSimulations.length === 0) return null;
    const firstSim = simulationsWithMetadata.find(s => s.id === selectedSimulations[0]);
    return firstSim?.modelId || null;
  }, [selectedSimulations, simulationsWithMetadata]);

  // Fetch variables for the model
  const { data: allVariables = [], isLoading: variablesLoading } = useQuery({
    queryKey: ['variables', modelId],
    queryFn: () => variablesAPI.list({ limit: 10000, model_id: modelId || 'policyengine_uk' }),
    enabled: opened && currentStep === 'variables' && !!modelId,
  });

  // Filter variables by search
  const filteredVariables = useMemo(() => {
    if (!variableSearch) return allVariables;
    const search = variableSearch.toLowerCase();
    return allVariables.filter(v =>
      v.name.toLowerCase().includes(search) ||
      v.label?.toLowerCase().includes(search) ||
      v.description?.toLowerCase().includes(search)
    );
  }, [allVariables, variableSearch]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      setCurrentStep('simulations');
      setSelectedSimulations([]);
      setSelectedVariables([]);
      setDescription('');
      setError(null);
      setVariableSearch('');
    }
  }, [opened]);

  const handleSimulationToggle = (simId: string) => {
    setSelectedSimulations(prev =>
      prev.includes(simId)
        ? prev.filter(id => id !== simId)
        : [...prev, simId]
    );
  };

  const handleVariableToggle = (varName: string) => {
    setSelectedVariables(prev =>
      prev.includes(varName)
        ? prev.filter(name => name !== varName)
        : [...prev, varName]
    );
  };

  const buildLLMContext = () => {
    const simDetails = selectedSimulations
      .map(simId => {
        const sim = simulationsWithMetadata.find(s => s.id === simId);
        if (!sim) return null;
        const name = sim.customName || `${sim.policyName} / ${sim.datasetName}`;
        return `- ${name} (ID: ${simId})`;
      })
      .filter(Boolean)
      .join('\n');

    const varDetails = selectedVariables
      .map(varName => {
        const variable = allVariables.find(v => v.name === varName);
        return `- ${variable?.label || varName} (${varName})${variable?.description ? ': ' + variable.description : ''}`;
      })
      .join('\n');

    return `Available simulations:
${simDetails}

Variables to analyse:
${varDetails}

User request: ${description}`;
  };

  const handleNext = () => {
    if (currentStep === 'simulations') {
      if (selectedSimulations.length === 0) {
        setError('Please select at least one simulation');
        return;
      }
      setError(null);
      setCurrentStep('variables');
    } else if (currentStep === 'variables') {
      if (selectedVariables.length === 0) {
        setError('Please select at least one variable');
        return;
      }
      setError(null);
      setCurrentStep('prompt');
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'variables') {
      setCurrentStep('simulations');
    } else if (currentStep === 'prompt') {
      setCurrentStep('variables');
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please describe what you want to analyse');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await reportElementsAPI.createAI(
        buildLLMContext(),
        reportId,
        selectedSimulations
      );

      await queryClient.invalidateQueries({ queryKey: ['reportElements', reportId] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create report element. Please try again.');
      console.error('Error creating AI report element:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepNumber = (step: Step) => {
    const steps: Step[] = ['simulations', 'variables', 'prompt'];
    return steps.indexOf(step) + 1;
  };

  const currentStepNumber = getStepNumber(currentStep);

  // Define steps for the step indicator
  const steps: Step[] = [
    { id: 'simulations', label: 'Simulations' },
    { id: 'variables', label: 'Variables' },
    { id: 'prompt', label: 'Analysis' },
  ];

  // Render current step
  const renderStep = () => {
    if (currentStep === 'simulations') {
      return (
        <Stack gap="lg">
          <Box>
            <Title order={3} mb="xs">Select simulations</Title>
            <Text size="sm" c="dimmed">
              Choose one or more simulations to analyse
            </Text>
          </Box>

          <ScrollArea h={300} offsetScrollbars>
            <Stack gap="xs" p={2}>
              {simulationsWithMetadata.map(sim => {
                const displayName = sim.customName || `${sim.policyName} / ${sim.datasetName}`;
                const isSelected = selectedSimulations.includes(sim.id);

                return (
                  <Card
                    key={sim.id}
                    padding="md"
                    withBorder={false}
                    radius={modalDesign.radius.inner}
                    style={{
                      cursor: 'pointer',
                      border: `2px solid ${isSelected ? modalDesign.colors.primary : modalDesign.colors.border}`,
                      backgroundColor: isSelected ? 'rgba(49, 151, 149, 0.04)' : undefined,
                      boxShadow: isSelected ? '0 2px 8px rgba(49, 151, 149, 0.15)' : 'none',
                      transition: 'all 150ms ease',
                    }}
                    onClick={() => handleSimulationToggle(sim.id)}
                  >
                    <Group justify="space-between">
                      <Group>
                        <ThemeIcon
                          size="lg"
                          radius={modalDesign.radius.inner}
                          variant="light"
                          color={isSelected ? 'teal' : 'gray'}
                        >
                          <IconDatabase size={20} />
                        </ThemeIcon>
                        <Box>
                          <Text fw={500} size="sm">{displayName}</Text>
                          <Text size="xs" c="dimmed">
                            {sim.id.slice(0, 8)}
                          </Text>
                        </Box>
                      </Group>
                      {isSelected && (
                        <ThemeIcon
                          color="teal"
                          variant="light"
                          size="md"
                          radius="xl"
                        >
                          <IconCheck size={16} stroke={2.5} />
                        </ThemeIcon>
                      )}
                    </Group>
                  </Card>
                );
              })}
              {simulationsWithMetadata.length === 0 && !simulationsLoading && (
                <Center h={200}>
                  <Text size="sm" c="dimmed">
                    No simulations available. Create simulations first.
                  </Text>
                </Center>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      );
    }

    if (currentStep === 'variables') {
      return (
        <Stack gap="lg">
          <Box>
            <Title order={3} mb="xs">Select variables</Title>
            <Text size="sm" c="dimmed">
              Choose the variables you want to analyse
            </Text>
          </Box>

          <TextInput
            placeholder="Search variables..."
            value={variableSearch}
            onChange={(e) => setVariableSearch(e.target.value)}
            leftSection={<IconSearch size={16} />}
          />

          {variablesLoading ? (
            <Center h={200}>
              <Loader />
            </Center>
          ) : (
            <>
              <ScrollArea h={250} offsetScrollbars>
                <Stack gap="xs" p={2}>
                  {filteredVariables.map(variable => {
                    const isSelected = selectedVariables.includes(variable.name);

                    return (
                      <Card
                        key={variable.name}
                        padding="md"
                        withBorder={false}
                        radius={modalDesign.radius.inner}
                        style={{
                          cursor: 'pointer',
                          border: `2px solid ${isSelected ? modalDesign.colors.primary : modalDesign.colors.border}`,
                          backgroundColor: isSelected ? 'rgba(49, 151, 149, 0.04)' : undefined,
                          boxShadow: isSelected ? '0 2px 8px rgba(49, 151, 149, 0.15)' : 'none',
                          transition: 'all 150ms ease',
                        }}
                        onClick={() => handleVariableToggle(variable.name)}
                      >
                        <Group justify="space-between" align="flex-start">
                          <Group align="flex-start">
                            <ThemeIcon
                              size="lg"
                              radius={modalDesign.radius.inner}
                              variant="light"
                              color={isSelected ? 'teal' : 'gray'}
                              style={{ marginTop: 2 }}
                            >
                              <IconVariable size={20} />
                            </ThemeIcon>
                            <Box style={{ flex: 1 }}>
                              <Text fw={500} size="sm">{variable.label || variable.name}</Text>
                              <Text size="xs" c="dimmed" mb={4}>
                                {variable.name}
                              </Text>
                              {variable.description && (
                                <Text size="xs" c="dimmed" lineClamp={2}>
                                  {variable.description}
                                </Text>
                              )}
                            </Box>
                          </Group>
                          {isSelected && (
                            <ThemeIcon
                              color="teal"
                              variant="light"
                              size="md"
                              radius="xl"
                            >
                              <IconCheck size={16} stroke={2.5} />
                            </ThemeIcon>
                          )}
                        </Group>
                      </Card>
                    );
                  })}
                  {filteredVariables.length === 0 && (
                    <Center h={200}>
                      <Text size="sm" c="dimmed">
                        {variableSearch ? 'No variables match your search' : 'No variables available'}
                      </Text>
                    </Center>
                  )}
                </Stack>
              </ScrollArea>
            </>
          )}
        </Stack>
      );
    }

    if (currentStep === 'prompt') {
      const selectedSims = simulationsWithMetadata.filter(s =>
        selectedSimulations.includes(s.id)
      );
      const selectedVars = allVariables.filter(v =>
        selectedVariables.includes(v.name)
      );

      return (
        <Stack gap="lg">
          <Box>
            <Title order={3} mb="xs">Describe your analysis</Title>
            <Text size="sm" c="dimmed">
              Tell us what you want to learn from this data
            </Text>
          </Box>

          {/* Context summary */}
          <Paper
            withBorder
            p="lg"
            radius={modalDesign.radius.inner}
            style={{
              backgroundColor: modalDesign.colors.divider,
              borderColor: modalDesign.colors.border,
            }}
          >
            <Stack gap="lg">
              <Box>
                <Group gap="xs" mb="sm">
                  <ThemeIcon size="sm" radius="xl" variant="light" color="teal">
                    <IconDatabase size={14} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>
                    {selectedSims.length} simulation{selectedSims.length !== 1 ? 's' : ''}
                  </Text>
                </Group>
                <Group gap="xs" wrap="wrap">
                  {selectedSims.map(sim => {
                    const name = sim.customName || `${sim.policyName} / ${sim.datasetName}`;
                    return (
                      <Box
                        key={sim.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: modalDesign.radius.button,
                          backgroundColor: 'white',
                          border: `1px solid ${modalDesign.colors.border}`,
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        <IconDatabase size={14} style={{ color: modalDesign.colors.primary, flexShrink: 0 }} />
                        <Text size="sm" style={{ lineHeight: 1.4 }}>{name}</Text>
                      </Box>
                    );
                  })}
                </Group>
              </Box>

              <Box
                style={{
                  height: 1,
                  backgroundColor: modalDesign.colors.border,
                }}
              />

              <Box>
                <Group gap="xs" mb="sm">
                  <ThemeIcon size="sm" radius="xl" variant="light" color="teal">
                    <IconVariable size={14} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>
                    {selectedVars.length} variable{selectedVars.length !== 1 ? 's' : ''}
                  </Text>
                </Group>
                <Group gap="xs" wrap="wrap">
                  {selectedVars.map(variable => (
                    <Box
                      key={variable.name}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: modalDesign.radius.button,
                        backgroundColor: 'white',
                        border: `1px solid ${modalDesign.colors.border}`,
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      <IconVariable size={14} style={{ color: modalDesign.colors.primary, flexShrink: 0 }} />
                      <Text size="sm" style={{ lineHeight: 1.4 }}>{variable.label || variable.name}</Text>
                    </Box>
                  ))}
                </Group>
              </Box>
            </Stack>
          </Paper>

          <Textarea
            label="What do you want to analyse?"
            placeholder="e.g., Show me the average household income by decile across all simulations, or compare the poverty impact between the reforms"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={4}
            maxRows={6}
            autosize
            required
          />

          <Text size="xs" c="dimmed">
            The AI will create a data analysis element based on your selected simulations, variables, and description.
          </Text>
        </Stack>
      );
    }

    return null;
  };

  // Modal buttons
  const getModalButtons = () => {
    const buttons: any = {};

    if (currentStep === 'simulations') {
      buttons.primaryButton = {
        label: 'Next',
        onClick: handleNext,
        disabled: selectedSimulations.length === 0 || simulationsLoading,
      };
    } else if (currentStep === 'variables') {
      buttons.primaryButton = {
        label: 'Next',
        onClick: handleNext,
        disabled: selectedVariables.length === 0 || variablesLoading,
      };
      buttons.secondaryButton = {
        label: 'Back',
        onClick: handleBack,
      };
    } else if (currentStep === 'prompt') {
      buttons.primaryButton = {
        label: 'Create analysis',
        onClick: handleSubmit,
        disabled: !description.trim(),
        loading: isLoading,
      };
      buttons.secondaryButton = {
        label: 'Back',
        onClick: handleBack,
      };
    }

    return buttons;
  };

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      title="Create data analysis"
      description="AI-powered analysis of your simulations and variables"
      icon={<IconSparkles size={24} />}
      iconColor={modalDesign.colors.primary}
      size="lg"
      {...getModalButtons()}
    >
      <Box style={{ position: 'relative' }}>
        <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />

        <Stack gap="xl">
          <StepIndicator steps={steps} currentStepIndex={currentStepNumber - 1} />

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <Transition
            mounted={!!currentStep}
            transition="fade"
            duration={200}
            timingFunction="ease"
          >
            {(styles) => (
              <Box style={styles}>
                {renderStep()}
              </Box>
            )}
          </Transition>
        </Stack>
      </Box>
    </BaseModal>
  );
}
