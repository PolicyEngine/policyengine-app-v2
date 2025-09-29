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
  Tabs,
  NumberInput,
  Title,
  Badge,
} from '@mantine/core';
import { IconChartBar, IconTable, IconHash, IconChartLine, IconDatabase } from '@tabler/icons-react';
import BaseModal from '@/components/shared/BaseModal';
import { simulationsAPI } from '@/api/v2/simulations';
import { baselineVariablesAPI, BaselineVariableTable } from '@/api/v2/baselineVariables';

export type VisualizationType = 'table' | 'bar_chart' | 'line_chart' | 'metric_card';
export type AggregateFunction = 'mean' | 'sum' | 'median' | 'count' | 'min' | 'max';

export interface DataElementConfig {
  visualizationType: VisualizationType;

  // For metric card
  metricSimulation?: string;
  metricVariable?: string;
  metricAggregation?: AggregateFunction;

  // For table
  tableRows?: string[]; // simulation ids
  tableColumns?: string[]; // variable names
  tableAggregation?: AggregateFunction;

  // For bar chart
  barXAxis?: 'simulations' | 'variables';
  barSimulations?: string[];
  barVariables?: string[];
  barAggregation?: AggregateFunction;

  // For line chart
  lineXAxis?: 'year' | 'simulations';
  lineSimulations?: string[];
  lineVariable?: string;
  lineAggregation?: AggregateFunction;
  lineYears?: number[];

  // Common fields
  entity: string;
  filterVariableName?: string;
  filterVariableValue?: string;
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
  const [activeTab, setActiveTab] = useState<string | null>('visualization');
  const [config, setConfig] = useState<Partial<DataElementConfig>>({
    entity: 'person',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      setActiveTab('visualization');
      setConfig({
        entity: 'person',
      });
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

  const handleComplete = () => {
    if (isConfigComplete()) {
      onSubmit(config as DataElementConfig);
      onClose();
    }
  };

  const isConfigComplete = () => {
    switch (config.visualizationType) {
      case 'metric_card':
        return !!(config.metricSimulation && config.metricVariable && config.metricAggregation);
      case 'table':
        return !!(config.tableRows?.length && config.tableColumns?.length && config.tableAggregation);
      case 'bar_chart':
        return !!(config.barSimulations?.length && config.barVariables?.length && config.barAggregation);
      case 'line_chart':
        return !!(config.lineSimulations?.length && config.lineVariable && config.lineAggregation);
      default:
        return false;
    }
  };

  // Group baseline variables by entity
  const variablesByEntity = baselineVariables?.reduce((acc, variable) => {
    const entity = variable.entity;
    if (!acc[entity]) acc[entity] = [];
    acc[entity].push(variable);
    return acc;
  }, {} as Record<string, BaselineVariableTable[]>) || {};

  const getVariableOptions = () => {
    const entity = config.entity || 'person';
    return variablesByEntity[entity]?.map(v => ({
      value: v.id,
      label: v.label || v.id,
    })) || [];
  };

  const getSimulationOptions = () => {
    return simulations?.map(sim => ({
      value: sim.id,
      label: sim.label || `Simulation ${sim.id.slice(0, 8)}`,
    })) || [];
  };

  const isDataLoading = simulationsLoading || variablesLoading;

  const renderVisualizationConfig = () => {
    switch (config.visualizationType) {
      case 'metric_card':
        return (
          <Stack>
            <Text size="sm" fw={500}>Configure metric display</Text>
            <Select
              label="Simulation"
              placeholder="Select simulation"
              data={getSimulationOptions()}
              value={config.metricSimulation}
              onChange={(value) => value && setConfig({ ...config, metricSimulation: value })}
              searchable
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Entity type"
              data={[
                { value: 'person', label: 'Person' },
                { value: 'household', label: 'Household' },
                { value: 'tax_unit', label: 'Tax unit' },
                { value: 'spm_unit', label: 'SPM unit' },
              ]}
              value={config.entity}
              onChange={(value) => value && setConfig({ ...config, entity: value })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Variable"
              placeholder="Select variable to display"
              data={getVariableOptions()}
              value={config.metricVariable}
              onChange={(value) => value && setConfig({ ...config, metricVariable: value })}
              searchable
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Aggregation"
              data={[
                { value: 'mean', label: 'Mean' },
                { value: 'sum', label: 'Sum' },
                { value: 'median', label: 'Median' },
                { value: 'count', label: 'Count' },
                { value: 'min', label: 'Minimum' },
                { value: 'max', label: 'Maximum' },
              ]}
              value={config.metricAggregation}
              onChange={(value) => value && setConfig({ ...config, metricAggregation: value as AggregateFunction })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
          </Stack>
        );

      case 'table':
        return (
          <Stack>
            <Text size="sm" fw={500}>Configure table</Text>
            <MultiSelect
              label="Table rows (simulations)"
              placeholder="Select simulations for rows"
              data={getSimulationOptions()}
              value={config.tableRows}
              onChange={(value) => setConfig({ ...config, tableRows: value })}
              searchable
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Entity type"
              data={[
                { value: 'person', label: 'Person' },
                { value: 'household', label: 'Household' },
                { value: 'tax_unit', label: 'Tax unit' },
                { value: 'spm_unit', label: 'SPM unit' },
              ]}
              value={config.entity}
              onChange={(value) => value && setConfig({ ...config, entity: value })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <MultiSelect
              label="Table columns (variables)"
              placeholder="Select variables for columns"
              data={getVariableOptions()}
              value={config.tableColumns}
              onChange={(value) => setConfig({ ...config, tableColumns: value })}
              searchable
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Aggregation for all cells"
              data={[
                { value: 'mean', label: 'Mean' },
                { value: 'sum', label: 'Sum' },
                { value: 'median', label: 'Median' },
                { value: 'count', label: 'Count' },
              ]}
              value={config.tableAggregation}
              onChange={(value) => value && setConfig({ ...config, tableAggregation: value as AggregateFunction })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
          </Stack>
        );

      case 'bar_chart':
        return (
          <Stack>
            <Text size="sm" fw={500}>Configure bar chart</Text>
            <Select
              label="X-axis"
              data={[
                { value: 'simulations', label: 'Simulations' },
                { value: 'variables', label: 'Variables' },
              ]}
              value={config.barXAxis}
              onChange={(value) => value && setConfig({ ...config, barXAxis: value as 'simulations' | 'variables' })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <MultiSelect
              label="Simulations"
              placeholder="Select simulations to compare"
              data={getSimulationOptions()}
              value={config.barSimulations}
              onChange={(value) => setConfig({ ...config, barSimulations: value })}
              searchable
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Entity type"
              data={[
                { value: 'person', label: 'Person' },
                { value: 'household', label: 'Household' },
                { value: 'tax_unit', label: 'Tax unit' },
                { value: 'spm_unit', label: 'SPM unit' },
              ]}
              value={config.entity}
              onChange={(value) => value && setConfig({ ...config, entity: value })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <MultiSelect
              label="Variables"
              placeholder="Select variables to display"
              data={getVariableOptions()}
              value={config.barVariables}
              onChange={(value) => setConfig({ ...config, barVariables: value })}
              searchable
              maxValues={config.barXAxis === 'simulations' ? 1 : undefined}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Aggregation"
              data={[
                { value: 'mean', label: 'Mean' },
                { value: 'sum', label: 'Sum' },
                { value: 'median', label: 'Median' },
                { value: 'count', label: 'Count' },
              ]}
              value={config.barAggregation}
              onChange={(value) => value && setConfig({ ...config, barAggregation: value as AggregateFunction })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
          </Stack>
        );

      case 'line_chart':
        return (
          <Stack>
            <Text size="sm" fw={500}>Configure line chart</Text>
            <Select
              label="X-axis"
              data={[
                { value: 'year', label: 'Year (time series)' },
                { value: 'simulations', label: 'Simulations' },
              ]}
              value={config.lineXAxis}
              onChange={(value) => value && setConfig({ ...config, lineXAxis: value as 'year' | 'simulations' })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <MultiSelect
              label="Simulations"
              placeholder="Select simulations"
              data={getSimulationOptions()}
              value={config.lineSimulations}
              onChange={(value) => setConfig({ ...config, lineSimulations: value })}
              searchable
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Entity type"
              data={[
                { value: 'person', label: 'Person' },
                { value: 'household', label: 'Household' },
                { value: 'tax_unit', label: 'Tax unit' },
                { value: 'spm_unit', label: 'SPM unit' },
              ]}
              value={config.entity}
              onChange={(value) => value && setConfig({ ...config, entity: value })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            <Select
              label="Variable"
              placeholder="Select variable to plot"
              data={getVariableOptions()}
              value={config.lineVariable}
              onChange={(value) => value && setConfig({ ...config, lineVariable: value })}
              searchable
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
            {config.lineXAxis === 'year' && (
              <MultiSelect
                label="Years"
                placeholder="Select years"
                data={[
                  { value: '2023', label: '2023' },
                  { value: '2024', label: '2024' },
                  { value: '2025', label: '2025' },
                  { value: '2026', label: '2026' },
                  { value: '2027', label: '2027' },
                  { value: '2028', label: '2028' },
                ]}
                value={config.lineYears?.map(y => y.toString())}
                onChange={(value) => setConfig({ ...config, lineYears: value.map(v => parseInt(v)) })}
                styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
              />
            )}
            <Select
              label="Aggregation"
              data={[
                { value: 'mean', label: 'Mean' },
                { value: 'sum', label: 'Sum' },
                { value: 'median', label: 'Median' },
              ]}
              value={config.lineAggregation}
              onChange={(value) => value && setConfig({ ...config, lineAggregation: value as AggregateFunction })}
              styles={{ label: { fontSize: 14, fontWeight: 500, color: '#344054' } }}
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <BaseModal
      opened={opened}
      onClose={onClose}
      title="Add data visualization"
      description="Choose a visualization type and configure your data"
      icon={<IconDatabase size={19} />}
      size="md"
      primaryButton={{
        label: 'Add visualization',
        onClick: handleComplete,
        disabled: !isConfigComplete() || isDataLoading,
      }}
    >
      <Box style={{ position: 'relative', minHeight: 400 }}>
        <LoadingOverlay visible={isDataLoading} />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="visualization">Visualization type</Tabs.Tab>
            <Tabs.Tab value="configuration" disabled={!config.visualizationType}>
              Configuration
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="visualization" pt="xl">
            <Stack>
              <Text size="sm" color="dimmed">
                Choose how you want to display your data
              </Text>
              <SimpleGrid cols={2}>
                <Card
                  shadow="xs"
                  padding="lg"
                  style={{
                    cursor: 'pointer',
                    border: config.visualizationType === 'metric_card' ? '2px solid #319795' : '1px solid #e5e5e5',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setConfig({
                      ...config,
                      visualizationType: 'metric_card',
                      metricAggregation: 'mean'
                    });
                    setActiveTab('configuration');
                  }}
                >
                  <Stack align="center" gap="xs">
                    <IconHash size={32} color={config.visualizationType === 'metric_card' ? '#319795' : '#666'} />
                    <Text size="sm" fw={config.visualizationType === 'metric_card' ? 600 : 400}>
                      Metric card
                    </Text>
                    <Text size="xs" color="dimmed" ta="center">
                      Single value display
                    </Text>
                  </Stack>
                </Card>

                <Card
                  shadow="xs"
                  padding="lg"
                  style={{
                    cursor: 'pointer',
                    border: config.visualizationType === 'table' ? '2px solid #319795' : '1px solid #e5e5e5',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setConfig({
                      ...config,
                      visualizationType: 'table',
                      tableAggregation: 'mean'
                    });
                    setActiveTab('configuration');
                  }}
                >
                  <Stack align="center" gap="xs">
                    <IconTable size={32} color={config.visualizationType === 'table' ? '#319795' : '#666'} />
                    <Text size="sm" fw={config.visualizationType === 'table' ? 600 : 400}>
                      Table
                    </Text>
                    <Text size="xs" color="dimmed" ta="center">
                      Rows and columns
                    </Text>
                  </Stack>
                </Card>

                <Card
                  shadow="xs"
                  padding="lg"
                  style={{
                    cursor: 'pointer',
                    border: config.visualizationType === 'bar_chart' ? '2px solid #319795' : '1px solid #e5e5e5',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setConfig({
                      ...config,
                      visualizationType: 'bar_chart',
                      barXAxis: 'simulations',
                      barAggregation: 'mean'
                    });
                    setActiveTab('configuration');
                  }}
                >
                  <Stack align="center" gap="xs">
                    <IconChartBar size={32} color={config.visualizationType === 'bar_chart' ? '#319795' : '#666'} />
                    <Text size="sm" fw={config.visualizationType === 'bar_chart' ? 600 : 400}>
                      Bar chart
                    </Text>
                    <Text size="xs" color="dimmed" ta="center">
                      Compare values
                    </Text>
                  </Stack>
                </Card>

                <Card
                  shadow="xs"
                  padding="lg"
                  style={{
                    cursor: 'pointer',
                    border: config.visualizationType === 'line_chart' ? '2px solid #319795' : '1px solid #e5e5e5',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setConfig({
                      ...config,
                      visualizationType: 'line_chart',
                      lineXAxis: 'year',
                      lineAggregation: 'mean',
                      lineYears: [2024, 2025, 2026]
                    });
                    setActiveTab('configuration');
                  }}
                >
                  <Stack align="center" gap="xs">
                    <IconChartLine size={32} color={config.visualizationType === 'line_chart' ? '#319795' : '#666'} />
                    <Text size="sm" fw={config.visualizationType === 'line_chart' ? 600 : 400}>
                      Line chart
                    </Text>
                    <Text size="xs" color="dimmed" ta="center">
                      Trends over time
                    </Text>
                  </Stack>
                </Card>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="configuration" pt="xl">
            {renderVisualizationConfig()}
          </Tabs.Panel>
        </Tabs>
      </Box>
    </BaseModal>
  );
}