import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Group,
  Stack,
  Text,
  Select,
  MultiSelect,
  Card,
  SimpleGrid,
  Box,
  LoadingOverlay,
  NumberInput,
  Title,
  Radio,
  Divider,
} from '@mantine/core';
import { IconChartBar, IconTable, IconHash, IconChartLine } from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';
import { simulationsAPI } from '@/api/v2/simulations';
import { baselineVariablesAPI, BaselineVariableTable } from '@/api/v2/baselineVariables';

export type VisualizationType = 'table' | 'bar_chart' | 'line_chart' | 'metric_card';
export type AggregateFunction = 'mean' | 'sum' | 'median' | 'count' | 'min' | 'max';
export type AxisType = 'simulations' | 'single_variable_filtered' | 'multiple_variables';
export type ComparisonType = 'absolute' | 'change' | 'relative_change';

interface AxisConfig {
  type: AxisType;
  simulations?: string[];
  variable?: string;
  variables?: string[];
  filterMin?: number;
  filterMax?: number;
}

export interface DataElementConfig {
  visualizationType: VisualizationType;

  // Common fields
  entity: string;
  aggregation: AggregateFunction;
  comparisonType?: ComparisonType;

  // For metric card
  metricSimulation?: string;
  metricVariable?: string;

  // For charts and tables
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;

  // Legacy fields for backward compatibility
  metricAggregation?: AggregateFunction;
  tableRows?: string[];
  tableColumns?: string[];
  tableAggregation?: AggregateFunction;
  barXAxis?: 'simulations' | 'variables';
  barSimulations?: string[];
  barVariables?: string[];
  barAggregation?: AggregateFunction;
  lineXAxis?: 'year' | 'simulations';
  lineSimulations?: string[];
  lineVariable?: string;
  lineAggregation?: AggregateFunction;
  lineYears?: number[];
  filterVariableName?: string;
  filterVariableLeq?: number;
  filterVariableGeq?: number;
}

interface DataElementCreationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (config: DataElementConfig) => void;
  reportId: string;
}

export default function DataElementCreationModal({
  opened,
  onClose,
  onSubmit,
  reportId,
}: DataElementCreationModalProps) {
  const [visualizationType, setVisualizationType] = useState<VisualizationType | null>(null);
  const [xAxisConfig, setXAxisConfig] = useState<AxisConfig>({ type: 'simulations' });
  const [yAxisConfig, setYAxisConfig] = useState<AxisConfig>({ type: 'single_variable_filtered' });
  const [entity, setEntity] = useState<string>('person');
  const [aggregation, setAggregation] = useState<AggregateFunction>('mean');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('absolute');

  // For metric card
  const [metricSimulation, setMetricSimulation] = useState<string>('');
  const [metricVariable, setMetricVariable] = useState<string>('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      setVisualizationType(null);
      setXAxisConfig({ type: 'simulations' });
      setYAxisConfig({ type: 'single_variable_filtered' });
      setEntity('person');
      setAggregation('mean');
      setComparisonType('absolute');
      setMetricSimulation('');
      setMetricVariable('');
    }
  }, [opened]);

  // Fetch simulations
  const { data: simulations, isLoading: simulationsLoading } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => simulationsAPI.list({ limit: 1000 }),
    enabled: opened,
  });

  // Fetch baseline variables
  const { data: baselineVariables, isLoading: variablesLoading } = useQuery({
    queryKey: ['baseline-variables'],
    queryFn: () => baselineVariablesAPI.list({ limit: 1000 }),
    enabled: opened,
  });

  const isLoading = simulationsLoading || variablesLoading;

  // Filter variables by entity - the 'id' field is the variable name
  let filteredVariables = baselineVariables?.filter(v => {
    return v.id && v.entity === entity;
  }) || [];

  // If no variables for this entity, show all variables
  if (filteredVariables.length === 0 && baselineVariables && baselineVariables.length > 0) {
    filteredVariables = baselineVariables.filter(v => v.id) || [];
  }

  const variableOptions = filteredVariables.map(v => ({
    value: v.id,
    label: v.label || v.id,
  }));

  // Simulation options
  const simulationOptions = simulations?.filter(s => s.id).map(s => ({
    value: s.id || '',
    label: s.label || `Simulation ${s.id?.slice(0, 8) || ''}`,
  })).filter(opt => opt.value) || [];

  const aggregationOptions = [
    { value: 'mean', label: 'Mean' },
    { value: 'sum', label: 'Sum' },
    { value: 'median', label: 'Median' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
  ];

  const handleVisualizationSelect = (type: VisualizationType) => {
    setVisualizationType(type);

    // Set default axis configurations based on visualization type
    if (type === 'table') {
      setXAxisConfig({ type: 'simulations' });
      setYAxisConfig({ type: 'multiple_variables' });
    } else if (type === 'bar_chart') {
      setXAxisConfig({ type: 'simulations' });
      setYAxisConfig({ type: 'single_variable_filtered' });
    } else if (type === 'line_chart') {
      setXAxisConfig({ type: 'simulations' });
      setYAxisConfig({ type: 'single_variable_filtered' });
    }
  };

  const renderVisualizationSelection = () => (
    <Stack>
      <Title order={4}>Choose visualisation type</Title>
      <SimpleGrid cols={2}>
        <Card
          padding="lg"
          style={{
            cursor: 'pointer',
            border: visualizationType === 'metric_card' ? '2px solid var(--mantine-color-blue-6)' : undefined,
          }}
          onClick={() => handleVisualizationSelect('metric_card')}
        >
          <Stack align="center" gap="sm">
            <IconHash size={32} />
            <Text fw={500}>Single metric</Text>
            <Text size="xs" c="dimmed" ta="center">
              Display one key value
            </Text>
          </Stack>
        </Card>

        <Card
          padding="lg"
          style={{
            cursor: 'pointer',
            border: visualizationType === 'table' ? '2px solid var(--mantine-color-blue-6)' : undefined,
          }}
          onClick={() => handleVisualizationSelect('table')}
        >
          <Stack align="center" gap="sm">
            <IconTable size={32} />
            <Text fw={500}>Table</Text>
            <Text size="xs" c="dimmed" ta="center">
              Compare multiple values
            </Text>
          </Stack>
        </Card>

        <Card
          padding="lg"
          style={{
            cursor: 'pointer',
            border: visualizationType === 'bar_chart' ? '2px solid var(--mantine-color-blue-6)' : undefined,
          }}
          onClick={() => handleVisualizationSelect('bar_chart')}
        >
          <Stack align="center" gap="sm">
            <IconChartBar size={32} />
            <Text fw={500}>Bar chart</Text>
            <Text size="xs" c="dimmed" ta="center">
              Compare values visually
            </Text>
          </Stack>
        </Card>

        <Card
          padding="lg"
          style={{
            cursor: 'pointer',
            border: visualizationType === 'line_chart' ? '2px solid var(--mantine-color-blue-6)' : undefined,
          }}
          onClick={() => handleVisualizationSelect('line_chart')}
        >
          <Stack align="center" gap="sm">
            <IconChartLine size={32} />
            <Text fw={500}>Line chart</Text>
            <Text size="xs" c="dimmed" ta="center">
              Show trends
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );

  const renderAxisConfiguration = (
    axis: 'x' | 'y',
    config: AxisConfig,
    setConfig: (config: AxisConfig) => void,
    label: string
  ) => (
    <Stack>
      <Divider label={label} labelPosition="left" />

      <Radio.Group
        label="Data type"
        value={config.type}
        onChange={(value) => setConfig({ ...config, type: value as AxisType })}
      >
        <Stack mt="xs">
          <Radio value="simulations" label="Simulations" />
          <Radio value="single_variable_filtered" label="Single variable (with value filters)" />
          <Radio value="multiple_variables" label="Multiple variables" />
        </Stack>
      </Radio.Group>

      {config.type === 'simulations' && (
        <MultiSelect
          label="Select simulations"
          placeholder="Choose simulations"
          data={simulationOptions}
          value={config.simulations || []}
          onChange={(value) => setConfig({ ...config, simulations: value })}
          required
        />
      )}

      {config.type === 'single_variable_filtered' && (
        <>
          <Select
            label="Select variable"
            placeholder="Choose variable"
            data={variableOptions}
            value={config.variable || ''}
            onChange={(value) => setConfig({ ...config, variable: value || undefined })}
            searchable
            required
          />
          <Group grow>
            <NumberInput
              label="Min value (optional)"
              placeholder="e.g., 0"
              value={config.filterMin}
              onChange={(value) => setConfig({ ...config, filterMin: typeof value === 'number' ? value : undefined })}
            />
            <NumberInput
              label="Max value (optional)"
              placeholder="e.g., 50000"
              value={config.filterMax}
              onChange={(value) => setConfig({ ...config, filterMax: typeof value === 'number' ? value : undefined })}
            />
          </Group>
        </>
      )}

      {config.type === 'multiple_variables' && (
        <MultiSelect
          label="Select variables"
          placeholder="Choose variables"
          data={variableOptions}
          value={config.variables || []}
          onChange={(value) => setConfig({ ...config, variables: value })}
          searchable
          required
        />
      )}
    </Stack>
  );

  const renderConfiguration = () => {
    if (!visualizationType) return null;

    if (visualizationType === 'metric_card') {
      return (
        <Stack>
          <Title order={4}>Configure metric</Title>

          <Select
            label="Entity type"
            data={[
              { value: 'person', label: 'Person' },
              { value: 'household', label: 'Household' },
            ]}
            value={entity}
            onChange={(value) => setEntity(value || 'person')}
          />

          <Select
            label="Simulation"
            placeholder="Select simulation"
            data={simulationOptions}
            value={metricSimulation}
            onChange={(value) => setMetricSimulation(value || '')}
            required
          />

          <Select
            label="Variable"
            placeholder="Select variable"
            data={variableOptions}
            value={metricVariable}
            onChange={(value) => setMetricVariable(value || '')}
            searchable
            required
          />

          <Select
            label="Aggregation"
            data={aggregationOptions}
            value={aggregation}
            onChange={(value) => setAggregation(value as AggregateFunction)}
            required
          />
        </Stack>
      );
    }

    // For charts and tables
    return (
      <Stack>
        <Title order={4}>Configure {visualizationType.replace('_', ' ')}</Title>

        <Select
          label="Entity type"
          data={[
            { value: 'person', label: 'Person' },
            { value: 'household', label: 'Household' },
          ]}
          value={entity}
          onChange={(value) => setEntity(value || 'person')}
        />

        <Select
          label="Aggregation"
          data={aggregationOptions}
          value={aggregation}
          onChange={(value) => setAggregation(value as AggregateFunction)}
          required
        />

        {renderAxisConfiguration(
          'x',
          xAxisConfig,
          setXAxisConfig,
          visualizationType === 'table' ? 'Rows' : 'X-axis'
        )}

        {renderAxisConfiguration(
          'y',
          yAxisConfig,
          setYAxisConfig,
          visualizationType === 'table' ? 'Columns' : 'Y-axis / Values'
        )}

        {xAxisConfig.type === 'simulations' && xAxisConfig.simulations && xAxisConfig.simulations.length > 1 && (
          <Select
            label="Comparison type"
            data={[
              { value: 'absolute', label: 'Absolute values' },
              { value: 'change', label: 'Change from baseline' },
              { value: 'relative_change', label: 'Relative change (%)' },
            ]}
            value={comparisonType}
            onChange={(value) => setComparisonType(value as ComparisonType)}
          />
        )}
      </Stack>
    );
  };

  const isConfigValid = () => {
    if (!visualizationType) return false;

    if (visualizationType === 'metric_card') {
      return !!(metricSimulation && metricVariable);
    }

    // For charts and tables
    const xValid =
      (xAxisConfig.type === 'simulations' && xAxisConfig.simulations && xAxisConfig.simulations.length > 0) ||
      (xAxisConfig.type === 'single_variable_filtered' && xAxisConfig.variable) ||
      (xAxisConfig.type === 'multiple_variables' && xAxisConfig.variables && xAxisConfig.variables.length > 0);

    const yValid =
      (yAxisConfig.type === 'simulations' && yAxisConfig.simulations && yAxisConfig.simulations.length > 0) ||
      (yAxisConfig.type === 'single_variable_filtered' && yAxisConfig.variable) ||
      (yAxisConfig.type === 'multiple_variables' && yAxisConfig.variables && yAxisConfig.variables.length > 0);

    return xValid && yValid;
  };

  const handleSubmit = () => {
    if (!isConfigValid() || !visualizationType) return;

    // Build config object with legacy fields for compatibility
    const config: DataElementConfig = {
      visualizationType,
      entity,
      aggregation,
      comparisonType,
    };

    if (visualizationType === 'metric_card') {
      config.metricSimulation = metricSimulation;
      config.metricVariable = metricVariable;
      config.metricAggregation = aggregation;
    } else {
      // Store new axis configs
      config.xAxis = xAxisConfig;
      config.yAxis = yAxisConfig;

      // Map to legacy fields for backward compatibility
      if (visualizationType === 'table') {
        config.tableAggregation = aggregation;
        if (xAxisConfig.type === 'simulations') {
          config.tableRows = xAxisConfig.simulations;
        }
        if (yAxisConfig.type === 'multiple_variables') {
          config.tableColumns = yAxisConfig.variables;
        }
      } else if (visualizationType === 'bar_chart') {
        config.barAggregation = aggregation;
        if (xAxisConfig.type === 'simulations') {
          config.barXAxis = 'simulations';
          config.barSimulations = xAxisConfig.simulations;
        } else {
          config.barXAxis = 'variables';
        }

        if (yAxisConfig.type === 'single_variable_filtered') {
          config.barVariables = [yAxisConfig.variable!];
          if (yAxisConfig.filterMin !== undefined || yAxisConfig.filterMax !== undefined) {
            config.filterVariableName = yAxisConfig.variable;
            config.filterVariableGeq = yAxisConfig.filterMin;
            config.filterVariableLeq = yAxisConfig.filterMax;
          }
        } else if (yAxisConfig.type === 'multiple_variables') {
          config.barVariables = yAxisConfig.variables;
        }
      } else if (visualizationType === 'line_chart') {
        config.lineAggregation = aggregation;
        config.lineXAxis = 'simulations';
        if (xAxisConfig.type === 'simulations') {
          config.lineSimulations = xAxisConfig.simulations;
        }

        if (yAxisConfig.type === 'single_variable_filtered') {
          config.lineVariable = yAxisConfig.variable;
          if (yAxisConfig.filterMin !== undefined || yAxisConfig.filterMax !== undefined) {
            config.filterVariableName = yAxisConfig.variable;
            config.filterVariableGeq = yAxisConfig.filterMin;
            config.filterVariableLeq = yAxisConfig.filterMax;
          }
        }
      }
    }

    onSubmit(config);
  };

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      title="Add data analysis"
      size="lg"
    >
      <Box style={{ position: 'relative', minHeight: 400 }}>
        <LoadingOverlay visible={isLoading} />

        <Stack>
          {!visualizationType && renderVisualizationSelection()}

          {visualizationType && (
            <>
              <Group>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setVisualizationType(null)}
                >
                  ← Back to visualisation types
                </Button>
              </Group>

              {renderConfiguration()}

              <Group justify="flex-end" mt="md">
                <Button variant="subtle" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!isConfigValid()}>
                  Create
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Box>
    </BaseModal>
  );
}