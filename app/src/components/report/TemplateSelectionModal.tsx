import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Group,
  Stack,
  Text,
  Alert,
  Badge,
  LoadingOverlay,
  Box,
  Select,
  Radio,
  Paper,
  Divider,
  Transition,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconChevronRight,
  IconCheck,
} from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';
import { simulationsAPI } from '@/api/v2/simulations';
import type { ReportElementTemplate } from '@/api/v2/reportElementTemplates';

type DataType = 'single' | 'comparison';

interface TemplateSelectionModalProps {
  opened: boolean;
  onClose: () => void;
  template: ReportElementTemplate | null;
  onSubmit: (
    aggregates: any[],
    aggregateChanges: any[],
    explanation: string
  ) => void;
}

export default function TemplateSelectionModal({
  opened,
  onClose,
  template,
  onSubmit,
}: TemplateSelectionModalProps) {
  const [step, setStep] = useState<'selection' | 'confirmation'>('selection');
  const [dataType, setDataType] = useState<DataType>('comparison');
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (opened && template) {
      setStep('selection');
      // Most templates are for comparisons (baseline vs reform)
      const needsComparison = template.category !== 'household';
      setDataType(needsComparison ? 'comparison' : 'single');
      setSelectedSimulations([]);
      setError(null);
    }
  }, [opened, template]);

  const handleProceedToConfirmation = () => {
    if (selectedSimulations.length === 0) {
      setError('Please select at least one simulation');
      return;
    }
    if (dataType === 'comparison' && selectedSimulations.length !== 2) {
      setError('Please select exactly two simulations for comparison');
      return;
    }
    setError(null);
    setStep('confirmation');
  };

  const handleConfirm = async () => {
    if (!template) return;

    // Get country from simulation to determine correct variables
    let country: string | null = null;
    try {
      const sim = await simulationsAPI.get(selectedSimulations[0]);
      // Extract country from model (e.g., "policyengine_us" -> "us")
      if (sim.model) {
        const match = sim.model.match(/policyengine_(\w+)/);
        if (match) {
          country = match[1];
        }
      }
    } catch (error) {
      console.warn('Could not determine country from simulation:', error);
    }

    // Generate the aggregates based on template and selections
    const aggregates: any[] = [];
    const aggregateChanges: any[] = [];

    // Get the template configuration
    const config = getTemplateConfig(template, country);

    if (dataType === 'comparison') {
      // For comparisons, create aggregate changes for each variable/filter combo
      const baselineSimId = selectedSimulations[0];
      const reformSimId = selectedSimulations[1];

      for (const varConfig of config.variables) {
        const aggregateChange: any = {
          baseline_simulation_id: baselineSimId,
          comparison_simulation_id: reformSimId,
          variable_name: varConfig.variable,
          aggregate_function: varConfig.aggregateFunction || 'mean',
        };

        // Add filters if specified
        if (varConfig.filterVariable) {
          aggregateChange.filter_variable_name = varConfig.filterVariable;
        }
        if (varConfig.filterValue !== undefined) {
          aggregateChange.filter_variable_value = varConfig.filterValue;
        }
        if (varConfig.filterQuantileLeq !== undefined) {
          aggregateChange.filter_variable_quantile_leq = varConfig.filterQuantileLeq;
        }
        if (varConfig.filterQuantileGeq !== undefined) {
          aggregateChange.filter_variable_quantile_geq = varConfig.filterQuantileGeq;
        }

        aggregateChanges.push(aggregateChange);
      }
    } else {
      // For single simulations, create aggregates
      const simId = selectedSimulations[0];

      for (const varConfig of config.variables) {
        const aggregate: any = {
          simulation_id: simId,
          variable_name: varConfig.variable,
          aggregate_function: varConfig.aggregateFunction || 'mean',
        };

        // Add filters if specified
        if (varConfig.filterVariable) {
          aggregate.filter_variable_name = varConfig.filterVariable;
        }
        if (varConfig.filterValue !== undefined) {
          aggregate.filter_variable_value = varConfig.filterValue;
        }
        if (varConfig.filterQuantileLeq !== undefined) {
          aggregate.filter_variable_quantile_leq = varConfig.filterQuantileLeq;
        }
        if (varConfig.filterQuantileGeq !== undefined) {
          aggregate.filter_variable_quantile_geq = varConfig.filterQuantileGeq;
        }

        aggregates.push(aggregate);
      }
    }

    onSubmit(
      aggregates,
      aggregateChanges,
      template.name
    );

    onClose();
  };

  const handleBack = () => {
    if (step === 'confirmation') {
      setStep('selection');
    }
  };

  // Template configuration: maps templates to the variables they need
  interface TemplateVariableConfig {
    variable: string;
    aggregateFunction?: 'sum' | 'mean' | 'median' | 'count';
    filterVariable?: string;
    filterValue?: string;
    filterQuantileLeq?: number;
    filterQuantileGeq?: number;
  }

  interface TemplateConfig {
    variables: TemplateVariableConfig[];
  }

  const getTemplateConfig = (template: ReportElementTemplate, country: string | null): TemplateConfig => {
    // UK-specific configurations (only UK supported for now)
    if (country === 'uk') {
      const configs: Record<string, TemplateConfig> = {
        // Budgetary impact top-level: gov_tax, gov_spending, gov_balance
        'budgetary-impact': {
          variables: [
            { variable: 'gov_tax', aggregateFunction: 'sum' as const },
            { variable: 'gov_spending', aggregateFunction: 'sum' as const },
            { variable: 'gov_balance', aggregateFunction: 'sum' as const },
          ],
        },

        // Budgetary impact detailed: all individual benefit/tax variables
        'detailed-budgetary-impact': {
          variables: [
            // Benefits
            { variable: 'child_benefit', aggregateFunction: 'sum' as const },
            { variable: 'esa_income', aggregateFunction: 'sum' as const },
            { variable: 'esa_contrib', aggregateFunction: 'sum' as const },
            { variable: 'housing_benefit', aggregateFunction: 'sum' as const },
            { variable: 'income_support', aggregateFunction: 'sum' as const },
            { variable: 'jsa_income', aggregateFunction: 'sum' as const },
            { variable: 'jsa_contrib', aggregateFunction: 'sum' as const },
            { variable: 'pension_credit', aggregateFunction: 'sum' as const },
            { variable: 'universal_credit', aggregateFunction: 'sum' as const },
            { variable: 'working_tax_credit', aggregateFunction: 'sum' as const },
            { variable: 'child_tax_credit', aggregateFunction: 'sum' as const },
            { variable: 'attendance_allowance', aggregateFunction: 'sum' as const },
            { variable: 'carers_allowance', aggregateFunction: 'sum' as const },
            { variable: 'dla', aggregateFunction: 'sum' as const },
            { variable: 'pip', aggregateFunction: 'sum' as const },
            { variable: 'state_pension', aggregateFunction: 'sum' as const },
            { variable: 'winter_fuel_allowance', aggregateFunction: 'sum' as const },
            // Taxes
            { variable: 'council_tax', aggregateFunction: 'sum' as const },
            { variable: 'income_tax', aggregateFunction: 'sum' as const },
            { variable: 'national_insurance', aggregateFunction: 'sum' as const },
          ],
        },

        // Decile charts: hbai_household_net_income by equiv_hbai_household_net_income deciles
        'average-impact-by-income-decile': {
          variables: Array.from({ length: 10 }, (_, i) => ({
            variable: 'hbai_household_net_income',
            aggregateFunction: 'mean' as const,
            filterVariable: 'equiv_hbai_household_net_income_decile',
            filterValue: String(i + 1),
          })),
        },
        'relative-impact-by-income-decile': {
          variables: Array.from({ length: 10 }, (_, i) => ({
            variable: 'hbai_household_net_income',
            aggregateFunction: 'mean' as const,
            filterVariable: 'equiv_hbai_household_net_income_decile',
            filterValue: String(i + 1),
          })),
        },

        // Poverty: in_poverty_bhc, in_poverty_ahc, in_relative_poverty_bhc, in_relative_poverty_ahc
        'poverty-impact': {
          variables: [
            { variable: 'in_poverty_bhc', aggregateFunction: 'mean' as const },
            { variable: 'in_poverty_bhc', aggregateFunction: 'sum' as const },
            { variable: 'in_poverty_ahc', aggregateFunction: 'mean' as const },
            { variable: 'in_poverty_ahc', aggregateFunction: 'sum' as const },
            { variable: 'in_relative_poverty_bhc', aggregateFunction: 'mean' as const },
            { variable: 'in_relative_poverty_bhc', aggregateFunction: 'sum' as const },
            { variable: 'in_relative_poverty_ahc', aggregateFunction: 'mean' as const },
            { variable: 'in_relative_poverty_ahc', aggregateFunction: 'sum' as const },
          ],
        },
        'deep-poverty-impact': {
          variables: [
            { variable: 'in_deep_poverty_bhc', aggregateFunction: 'mean' as const },
            { variable: 'in_deep_poverty_bhc', aggregateFunction: 'sum' as const },
            { variable: 'in_deep_poverty_ahc', aggregateFunction: 'mean' as const },
            { variable: 'in_deep_poverty_ahc', aggregateFunction: 'sum' as const },
          ],
        },
      };

      return configs[template.id] || {
        variables: [{ variable: 'hbai_household_net_income', aggregateFunction: 'mean' }],
      };
    }

    // US configurations (placeholder for now)
    if (country === 'us') {
      const configs: Record<string, TemplateConfig> = {
        'average-impact-by-income-decile': {
          variables: Array.from({ length: 10 }, (_, i) => ({
            variable: 'household_net_income',
            aggregateFunction: 'mean' as const,
            filterVariable: 'household_income_decile',
            filterValue: String(i + 1),
          })),
        },
        'poverty-impact': {
          variables: [
            { variable: 'person_in_poverty', aggregateFunction: 'mean' as const },
          ],
        },
      };

      return configs[template.id] || {
        variables: [{ variable: 'household_net_income', aggregateFunction: 'mean' }],
      };
    }

    // Default fallback
    return {
      variables: [{ variable: 'household_net_income', aggregateFunction: 'mean' }],
    };
  };

  const renderSelectionStep = () => (
    <Stack>
      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={600}>{template?.name}</Text>
            <Badge size="sm" variant="light">{template?.category}</Badge>
          </Group>
          <Text size="sm" c="dimmed">{template?.description}</Text>
        </Stack>
      </Paper>

      <Divider />

      <Text size="sm" c="dimmed">Select simulations for this analysis</Text>

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

  const renderConfirmationStep = () => {
    if (!template) return null;

    const baselineSim = simulations?.find(s => s.id === selectedSimulations[0]);
    const reformSim = dataType === 'comparison' ? simulations?.find(s => s.id === selectedSimulations[1]) : null;

    return (
      <Stack>
        <Text size="sm" c="dimmed">Review your selection</Text>

        <Paper p="sm" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>{template.name}</Text>
            <Text size="xs" c="dimmed">{template.description}</Text>
          </Stack>
        </Paper>

        <Stack gap="xs">
          {dataType === 'comparison' ? (
            <>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Baseline:</Text>
                <Text size="sm">{baselineSim?.label || selectedSimulations[0]}</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Reform:</Text>
                <Text size="sm">{reformSim?.label || selectedSimulations[1]}</Text>
              </Group>
            </>
          ) : (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Simulation:</Text>
              <Text size="sm">{baselineSim?.label || selectedSimulations[0]}</Text>
            </Group>
          )}
        </Stack>
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
              onClick={handleProceedToConfirmation}
              disabled={
                selectedSimulations.length === 0 ||
                (dataType === 'comparison' && selectedSimulations.length !== 2) ||
                simulationsLoading
              }
              rightSection={<IconChevronRight size={16} />}
            >
              Next
            </Button>
          </>
        );
      case 'confirmation':
        return (
          <>
            <Button variant="subtle" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              leftSection={<IconCheck size={16} />}
            >
              Add to report
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  if (!template) return null;

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      title="Configure template"
      size="md"
      primaryButton={undefined}
      secondaryButton={undefined}
    >
      <Box style={{ position: 'relative', minHeight: 300 }}>
        <LoadingOverlay visible={simulationsLoading} />

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