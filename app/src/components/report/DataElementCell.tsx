import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  Text,
  Table,
  LoadingOverlay,
  Center,
  Stack,
  Title,
  Paper,
  Group,
  useMantineTheme,
  Select,
  ActionIcon,
  Menu,
  Switch,
} from '@mantine/core';
import Plot from 'react-plotly.js';
import {
  IconChartBar,
  IconChartLine,
  IconTable,
  IconCards,
  IconSettings,
  IconChevronDown
} from '@tabler/icons-react';
import { aggregatesAPI, AggregateTable } from '@/api/v2/aggregates';
import { simulationsAPI } from '@/api/v2/simulations';
import { ReportElement } from '@/api/v2/reportElements';
import { reportElementsAPI } from '@/api/v2/reportElements';
import { modelVersionsAPI } from '@/api/v2/modelVersions';

interface DataElementCellProps {
  element: ReportElement;
  isEditing?: boolean;
}

type ChartType = 'table' | 'bar_chart' | 'line_chart' | 'metric_card';

export default function DataElementCell({
  element,
  isEditing = false,
}: DataElementCellProps) {
  const theme = useMantineTheme();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Local state for visualization configuration
  const [chartType, setChartType] = useState<ChartType>(
    (element.chart_type as ChartType) || 'table'
  );
  const [xAxisColumn, setXAxisColumn] = useState<string>(
    element.x_axis_variable || ''
  );
  const [yAxisColumn, setYAxisColumn] = useState<string>(
    element.y_axis_variable || ''
  );
  const [colorColumn, setColorColumn] = useState<string>('');
  const [barMode, setBarMode] = useState<'group' | 'stack'>('group');
  const [showSettings, setShowSettings] = useState(false);

  // Get country from URL
  const getCountry = () => {
    const pathname = location.pathname;
    if (pathname.includes('/uk/')) return 'UK';
    if (pathname.includes('/us/')) return 'US';
    return 'UK'; // Default to UK
  };

  // Fetch aggregate data for this element
  const { data: aggregates, isLoading: aggregatesLoading } = useQuery({
    queryKey: ['elementAggregates', element.id],
    queryFn: () => aggregatesAPI.getByReportElement(element.id),
  });

  // Fetch model version details if we have a model_version_id
  const { data: modelVersion } = useQuery({
    queryKey: ['modelVersion', element.model_version_id],
    queryFn: () => modelVersionsAPI.get(element.model_version_id!),
    enabled: !!element.model_version_id,
  });

  // Fetch simulation details for labels
  const simulationIds = [...new Set(aggregates?.map(a => a.simulation_id) || [])];
  const { data: simulations } = useQuery({
    queryKey: ['simulations', simulationIds],
    queryFn: async () => {
      if (simulationIds.length === 0) return [];
      const sims = await Promise.all(
        simulationIds.map(id => simulationsAPI.get(id).catch(() => null))
      );
      return sims.filter(Boolean);
    },
    enabled: simulationIds.length > 0,
  });

  // Update mutation
  const updateElementMutation = useMutation({
    mutationFn: ({ elementId, data }: { elementId: string; data: any }) =>
      reportElementsAPI.update(elementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportElements'] });
    },
  });

  // Helper to get simulation label
  const getSimLabel = (simId: string) => {
    const sim = simulations?.find(s => s?.id === simId);
    return sim?.label || `Simulation ${simId.slice(0, 8)}`;
  };

  // Format number for display
  const formatNumber = (value: number) => {
    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    } else {
      return value.toFixed(2);
    }
  };

  // Build dataframe from aggregates with proper column names
  const dataframe = useMemo(() => {
    if (!aggregates || aggregates.length === 0) return { rows: [], columns: [] };

    // Convert aggregates to rows with column names matching the table
    const rows = aggregates.map(agg => ({
      'Simulation': getSimLabel(agg.simulation_id),
      'Entity': agg.entity,
      'Variable': agg.variable_name,
      'Function': agg.aggregate_function,
      'Year': agg.year || null,
      'Filter variable': agg.filter_variable_name || null,
      'Filter ≥': agg.filter_variable_geq,
      'Filter ≤': agg.filter_variable_leq,
      'Value': agg.value || 0,
      // Keep original IDs for reference
      simulation_id: agg.simulation_id,
    }));

    // Get unique columns
    const columns = Object.keys(rows[0] || {});

    return { rows, columns };
  }, [aggregates, simulations]);

  // Get available columns for axis selection (exclude only internal IDs)
  const availableColumns = dataframe.columns.filter(
    col => col !== 'simulation_id'
  );

  // Save chart configuration
  const handleSaveConfig = () => {
    updateElementMutation.mutate({
      elementId: element.id,
      data: {
        chart_type: chartType,
        x_axis_variable: xAxisColumn,
        y_axis_variable: yAxisColumn,
      },
    });
    setShowSettings(false);
  };

  // Create consistent Plotly layout styling
  const createPlotlyLayout = (extraProps = {}) => ({
    margin: { l: 50, r: 30, t: 30, b: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: theme.fontFamily,
      color: theme.colors.gray[8],
    },
    xaxis: {
      gridcolor: theme.colors.gray[3],
      linecolor: theme.colors.gray[4],
      tickfont: {
        color: theme.colors.gray[8],
      },
    },
    yaxis: {
      gridcolor: theme.colors.gray[3],
      linecolor: theme.colors.gray[4],
      tickformat: '.2s',
      tickfont: {
        color: theme.colors.gray[8],
      },
    },
    ...extraProps,
  });

  const plotConfig = {
    displayModeBar: false,
    responsive: true,
  };

  // Set default axes if not set - must be before any conditional returns
  useEffect(() => {
    if (!xAxisColumn && availableColumns.length > 0) {
      // Default x-axis based on chart type
      if (chartType === 'bar_chart') {
        // For bar charts, prefer Filter ≥ if we have filters, otherwise Simulation
        if (availableColumns.includes('Filter ≥') && dataframe.rows.some(r => r['Filter ≥'] !== null)) {
          setXAxisColumn('Filter ≥');
        } else {
          setXAxisColumn(availableColumns.includes('Simulation') ? 'Simulation' : availableColumns[0]);
        }
      } else if (chartType === 'line_chart') {
        // For line charts, prefer Year, then Filter ≥, then Simulation
        if (availableColumns.includes('Year') && dataframe.rows.some(r => r['Year'])) {
          setXAxisColumn('Year');
        } else if (availableColumns.includes('Filter ≥') && dataframe.rows.some(r => r['Filter ≥'] !== null)) {
          setXAxisColumn('Filter ≥');
        } else {
          setXAxisColumn(availableColumns.includes('Simulation') ? 'Simulation' : availableColumns[0]);
        }
      }
    }
    if (!yAxisColumn && availableColumns.includes('Value')) {
      setYAxisColumn('Value');
    }
  }, [chartType, availableColumns, dataframe.rows]);

  if (aggregatesLoading) {
    return (
      <Box style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </Box>
    );
  }

  if (!aggregates || aggregates.length === 0) {
    return (
      <Center p="xl">
        <Text color="dimmed">No data available</Text>
      </Center>
    );
  }

  // Render visualizations based on selected chart type
  const renderVisualization = () => {
    if (chartType === 'metric_card' && dataframe.rows.length === 1) {
      // Single metric display
      const row = dataframe.rows[0];
      return (
        <Card shadow="xs" padding="lg">
          <Stack align="center" gap="xs">
            <Text size="sm" color="dimmed">{row['Variable']}</Text>
            <Title order={2}>{formatNumber(row['Value'])}</Title>
            <Text size="xs" color="dimmed">
              {row['Function']} • {row['Simulation']}
            </Text>
          </Stack>
        </Card>
      );
    }

    if (chartType === 'table') {
      // Show raw aggregate data structure
      return (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Simulation</Table.Th>
              <Table.Th>Entity</Table.Th>
              <Table.Th>Variable</Table.Th>
              <Table.Th>Function</Table.Th>
              <Table.Th>Year</Table.Th>
              <Table.Th>Filter variable</Table.Th>
              <Table.Th>Filter ≥</Table.Th>
              <Table.Th>Filter ≤</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {aggregates?.map((agg, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>{getSimLabel(agg.simulation_id).slice(0, 20)}</Table.Td>
                <Table.Td>{agg.entity}</Table.Td>
                <Table.Td>{agg.variable_name}</Table.Td>
                <Table.Td>{agg.aggregate_function}</Table.Td>
                <Table.Td>{agg.year || '-'}</Table.Td>
                <Table.Td>{agg.filter_variable_name || '-'}</Table.Td>
                <Table.Td>{agg.filter_variable_geq !== null && agg.filter_variable_geq !== undefined ? agg.filter_variable_geq : '-'}</Table.Td>
                <Table.Td>{agg.filter_variable_leq !== null && agg.filter_variable_leq !== undefined ? agg.filter_variable_leq : '-'}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  {formatNumber(agg.value || 0)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      );
    }

    if (chartType === 'bar_chart') {
      // Group data by selected axes
      const xValues = [...new Set(dataframe.rows.map(r => r[xAxisColumn]))].filter(v => v !== null);
      const colorValues = colorColumn
        ? [...new Set(dataframe.rows.map(r => r[colorColumn]))]
        : [null];

      const plotData = colorValues.map((colorVal, idx) => {
        const filteredRows = colorColumn
          ? dataframe.rows.filter(r => r[colorColumn] === colorVal)
          : dataframe.rows;

        const xData = xValues.map(xVal => {
          const row = filteredRows.find(r => r[xAxisColumn] === xVal);
          return row ? row[yAxisColumn] || row['Value'] : 0;
        });

        return {
          x: xValues.map(v => String(v !== null ? v : '')),
          y: xData.map(v => typeof v === 'number' ? v : 0),
          type: 'bar' as const,
          name: colorVal ? String(colorVal) : undefined,
          marker: {
            color: colorVal
              ? theme.colors[['blue', 'red', 'green', 'orange', 'purple'][idx % 5]][6]
              : theme.colors.blue[6],
          },
        };
      });

      const layout = createPlotlyLayout({
        barmode: barMode,
        showlegend: !!colorColumn,
        xaxis: { title: xAxisColumn },
        yaxis: { title: yAxisColumn || 'Value' },
      });

      return (
        <Box style={{ height: 300, position: 'relative' }}>
          <Plot
            data={plotData}
            layout={layout}
            config={plotConfig}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      );
    }

    if (chartType === 'line_chart') {
      // Group data by color column for multiple lines
      const xValues = [...new Set(dataframe.rows.map(r => r[xAxisColumn]))].filter(v => v !== null);
      const colorValues = colorColumn
        ? [...new Set(dataframe.rows.map(r => r[colorColumn]))]
        : [null];

      const plotData = colorValues.map((colorVal, idx) => {
        const filteredRows = colorColumn
          ? dataframe.rows.filter(r => r[colorColumn] === colorVal)
          : dataframe.rows;

        const xData = xValues.filter(xVal =>
          filteredRows.some(r => r[xAxisColumn] === xVal)
        );

        const yData = xData.map(xVal => {
          const row = filteredRows.find(r => r[xAxisColumn] === xVal);
          const value = row ? row[yAxisColumn] || row['Value'] : 0;
          return typeof value === 'number' ? value : 0;
        });

        return {
          x: xData.map(v => String(v !== null ? v : '')),
          y: yData,
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          name: colorVal ? String(colorVal) : undefined,
          line: {
            color: colorVal
              ? theme.colors[['blue', 'red', 'green', 'orange', 'purple'][idx % 5]][6]
              : theme.colors.blue[6],
          },
        };
      });

      const layout = createPlotlyLayout({
        showlegend: !!colorColumn,
        xaxis: { title: xAxisColumn },
        yaxis: { title: yAxisColumn || 'Value' },
      });

      return (
        <Box style={{ height: 300, position: 'relative' }}>
          <Plot
            data={plotData}
            layout={layout}
            config={plotConfig}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      );
    }

    // Default: show raw data
    return (
      <Stack>
        {dataframe.rows.slice(0, 10).map((row, idx) => (
          <Text key={idx} size="sm">
            {row.variable}: {formatNumber(row.value)} ({row.simulation})
          </Text>
        ))}
        {dataframe.rows.length > 10 && (
          <Text size="xs" color="dimmed">... and {dataframe.rows.length - 10} more rows</Text>
        )}
      </Stack>
    );
  };

  return (
    <Stack gap="xs">
      {/* Chart type selector and settings */}
      <Group justify="space-between">
        <Group gap="xs">
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon.Group>
                <ActionIcon variant="default" size="lg">
                  {chartType === 'table' && <IconTable size={18} />}
                  {chartType === 'bar_chart' && <IconChartBar size={18} />}
                  {chartType === 'line_chart' && <IconChartLine size={18} />}
                  {chartType === 'metric_card' && <IconCards size={18} />}
                </ActionIcon>
                <ActionIcon variant="default" size="lg">
                  <IconChevronDown size={14} />
                </ActionIcon>
              </ActionIcon.Group>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconTable size={14} />}
                onClick={() => setChartType('table')}
              >
                Table
              </Menu.Item>
              <Menu.Item
                leftSection={<IconChartBar size={14} />}
                onClick={() => setChartType('bar_chart')}
              >
                Bar chart
              </Menu.Item>
              <Menu.Item
                leftSection={<IconChartLine size={14} />}
                onClick={() => setChartType('line_chart')}
              >
                Line chart
              </Menu.Item>
              {dataframe.rows.length === 1 && (
                <Menu.Item
                  leftSection={<IconCards size={14} />}
                  onClick={() => setChartType('metric_card')}
                >
                  Metric card
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>

          {(chartType === 'bar_chart' || chartType === 'line_chart') && (
            <ActionIcon
              variant={showSettings ? 'filled' : 'default'}
              onClick={() => setShowSettings(!showSettings)}
            >
              <IconSettings size={18} />
            </ActionIcon>
          )}
        </Group>

        {/* Model version citation */}
        {modelVersion && (
          <Text size="xs" color="dimmed">
            PolicyEngine {getCountry()} v{modelVersion.version}
          </Text>
        )}
      </Group>

      {/* Chart configuration panel */}
      {showSettings && (chartType === 'bar_chart' || chartType === 'line_chart') && (
        <Paper withBorder p="sm">
          <Stack gap="xs">
            <Select
              label="X-axis"
              value={xAxisColumn}
              onChange={(val) => setXAxisColumn(val || '')}
              data={availableColumns}
              size="xs"
            />
            <Select
              label="Y-axis"
              value={yAxisColumn}
              onChange={(val) => setYAxisColumn(val || '')}
              data={availableColumns}
              size="xs"
            />
            <Select
              label="Color by"
              value={colorColumn}
              onChange={(val) => setColorColumn(val || '')}
              data={[{ value: '', label: 'None' }, ...availableColumns]}
              size="xs"
              clearable
            />
            {chartType === 'bar_chart' && colorColumn && (
              <Switch
                label="Stack bars"
                checked={barMode === 'stack'}
                onChange={(e) => setBarMode(e.currentTarget.checked ? 'stack' : 'group')}
                size="xs"
              />
            )}
            <Group justify="flex-end" gap="xs">
              <ActionIcon size="sm" onClick={() => setShowSettings(false)} variant="subtle">
                Cancel
              </ActionIcon>
              <ActionIcon size="sm" onClick={handleSaveConfig} variant="filled">
                Save
              </ActionIcon>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Visualization */}
      {renderVisualization()}
    </Stack>
  );
}