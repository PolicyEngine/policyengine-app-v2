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
  TextInput,
  NumberInput,
  SegmentedControl,
  Divider,
  Button,
  ScrollArea,
  Slider,
} from '@mantine/core';
import Plot from 'react-plotly.js';
import {
  IconChartBar,
  IconChartLine,
  IconTable,
  IconCards,
  IconSettings,
} from '@tabler/icons-react';
import { aggregatesAPI, AggregateTable } from '@/api/v2/aggregates';
import { simulationsAPI } from '@/api/v2/simulations';
import { ReportElement } from '@/api/v2/reportElements';
import { reportElementsAPI } from '@/api/v2/reportElements';
import { modelVersionsAPI } from '@/api/v2/modelVersions';
import BaseModal from '@/components/shared/BaseModal';

interface DataElementCellProps {
  element: ReportElement;
  isEditing?: boolean;
}

type ChartType = 'table' | 'bar_chart' | 'line_chart' | 'metric_card';

interface ChartConfig {
  chartType: ChartType;
  xAxisColumn: string;
  yAxisColumn: string;
  colorColumn: string;
  barMode: 'group' | 'stack';
  title?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  showLegend: boolean;
  showGrid: boolean;
  height?: number;
  // Advanced Plotly layout options
  legendPosition?: string;
  legendOrientation?: string;
  xAxisType?: string;
  yAxisType?: string;
  hoverMode?: string | false;
  yAxisTickFormat?: string;
  xAxisTickAngle?: number;
  customLayout?: string;
}

export default function DataElementCell({
  element,
  isEditing = false,
}: DataElementCellProps) {
  const theme = useMantineTheme();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Load config from metadata or use defaults
  const savedConfig = (element as any).report_element_metadata as ChartConfig | undefined;

  const [chartType, setChartType] = useState<ChartType>(
    savedConfig?.chartType || (element.chart_type as ChartType) || 'table'
  );
  const [xAxisColumn, setXAxisColumn] = useState<string>(
    savedConfig?.xAxisColumn || element.x_axis_variable || ''
  );
  const [yAxisColumn, setYAxisColumn] = useState<string>(
    savedConfig?.yAxisColumn || element.y_axis_variable || ''
  );
  const [colorColumn, setColorColumn] = useState<string>(
    savedConfig?.colorColumn || ''
  );
  const [barMode, setBarMode] = useState<'group' | 'stack'>(
    savedConfig?.barMode || 'group'
  );
  const [showSettings, setShowSettings] = useState(false);

  // Additional chart options
  const [chartTitle, setChartTitle] = useState(savedConfig?.title || '');
  const [xAxisTitle, setXAxisTitle] = useState(savedConfig?.xAxisTitle || '');
  const [yAxisTitle, setYAxisTitle] = useState(savedConfig?.yAxisTitle || '');
  const [showLegend, setShowLegend] = useState(savedConfig?.showLegend !== false);
  const [showGrid, setShowGrid] = useState(savedConfig?.showGrid !== false);
  const [chartHeight, setChartHeight] = useState(savedConfig?.height || 400);

  // Advanced Plotly layout options
  const [legendPosition, setLegendPosition] = useState(savedConfig?.legendPosition || 'right');
  const [legendOrientation, setLegendOrientation] = useState(savedConfig?.legendOrientation || 'v');
  const [xAxisType, setXAxisType] = useState(savedConfig?.xAxisType || '-');
  const [yAxisType, setYAxisType] = useState(savedConfig?.yAxisType || '-');
  const [hoverMode, setHoverMode] = useState(savedConfig?.hoverMode || 'closest');
  const [yAxisTickFormat, setYAxisTickFormat] = useState(savedConfig?.yAxisTickFormat || '.2s');
  const [xAxisTickAngle, setXAxisTickAngle] = useState(savedConfig?.xAxisTickAngle || 0);
  const [customLayout, setCustomLayout] = useState(savedConfig?.customLayout || '{}');
  const [settingsStep, setSettingsStep] = useState(0); // For multistep modal
  const [isHovered, setIsHovered] = useState(false); // For hover effect

  // Steps for the settings modal
  const settingsSteps = ['Data', 'Appearance', 'Advanced'];
  const totalSteps = settingsSteps.length;

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
    return (sim as any)?.label || `Simulation ${simId.slice(0, 8)}`;
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
    } as Record<string, any>));

    // Get unique columns
    const columns = Object.keys(rows[0] || {});

    return { rows, columns };
  }, [aggregates, simulations]);

  // Get available columns for axis selection (exclude only internal IDs)
  const availableColumns = dataframe.columns.filter(
    col => col !== 'simulation_id'
  );

  // Handle step navigation
  const handleNextStep = () => {
    if (settingsStep < totalSteps - 1) {
      setSettingsStep(settingsStep + 1);
    } else {
      handleSaveConfig();
    }
  };

  const handlePreviousStep = () => {
    if (settingsStep > 0) {
      setSettingsStep(settingsStep - 1);
    }
  };

  // Save chart configuration
  const handleSaveConfig = () => {
    const config: ChartConfig = {
      chartType,
      xAxisColumn,
      yAxisColumn,
      colorColumn,
      barMode,
      title: chartTitle,
      xAxisTitle,
      yAxisTitle,
      showLegend,
      showGrid,
      height: chartHeight,
      // Advanced Plotly options
      legendPosition,
      legendOrientation,
      xAxisType,
      yAxisType,
      hoverMode,
      yAxisTickFormat,
      xAxisTickAngle,
      customLayout,
    };

    updateElementMutation.mutate({
      elementId: element.id,
      data: {
        chart_type: chartType,
        x_axis_variable: xAxisColumn,
        y_axis_variable: yAxisColumn,
        report_element_metadata: config as any,
      },
    });
    setShowSettings(false);
  };

  // Create consistent Plotly layout styling
  const createPlotlyLayout = (extraProps = {}) => {
    // Build legend position object based on settings
    const legendConfig: any = {
      bgcolor: 'transparent',
      borderwidth: 0,
      font: {
        size: 10,
        color: theme.colors.gray[6],
      },
      orientation: legendOrientation,
    };

    // Set legend position
    if (legendPosition === 'top') {
      legendConfig.x = 0.5;
      legendConfig.y = 1.1;
      legendConfig.xanchor = 'center';
      legendConfig.yanchor = 'bottom';
    } else if (legendPosition === 'bottom') {
      legendConfig.x = 0.5;
      legendConfig.y = -0.15;
      legendConfig.xanchor = 'center';
      legendConfig.yanchor = 'top';
    } else if (legendPosition === 'left') {
      legendConfig.x = -0.1;
      legendConfig.y = 0.5;
      legendConfig.xanchor = 'right';
      legendConfig.yanchor = 'middle';
    } else { // right (default)
      legendConfig.x = 1;
      legendConfig.y = 0.5;
      legendConfig.xanchor = 'left';
      legendConfig.yanchor = 'middle';
    }

    return {
      title: chartTitle ? {
        text: chartTitle,
        font: {
          size: 18,
          color: theme.colors.gray[8],
          weight: 600,
        },
        x: 0,
        xanchor: 'left',
      } : undefined,
      margin: {
        l: 60,
        r: 30,
        t: chartTitle ? 40 : 20,
        b: 50
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'white',
      font: {
        family: theme.fontFamily,
        color: theme.colors.gray[7],
        size: 11,
      },
      xaxis: {
        title: xAxisTitle || xAxisColumn || undefined,
        type: xAxisType === '-' ? undefined : xAxisType,
        gridcolor: showGrid ? theme.colors.gray[2] : 'transparent',
        linecolor: theme.colors.gray[3],
        tickfont: {
          color: theme.colors.gray[6],
          size: 10,
        },
        tickangle: xAxisTickAngle,
      },
      yaxis: {
        title: yAxisTitle || yAxisColumn || undefined,
        type: yAxisType === '-' ? undefined : yAxisType,
        gridcolor: showGrid ? theme.colors.gray[2] : 'transparent',
        linecolor: theme.colors.gray[3],
        tickformat: yAxisTickFormat,
        tickfont: {
          color: theme.colors.gray[6],
          size: 10,
        },
      },
      showlegend: showLegend && !!colorColumn,
      legend: legendConfig,
      hovermode: hoverMode,
      ...extraProps,
      // Apply custom JSON layout options
      ...((() => {
        try {
          return customLayout ? JSON.parse(customLayout) : {};
        } catch {
          return {};
        }
      })()),
    };
  };

  const plotConfig = {
    displayModeBar: false,
    responsive: true,
  };

  // Color palette
  const colors = [
    theme.colors.blue[6],
    theme.colors.red[6],
    theme.colors.green[6],
    theme.colors.orange[6],
    theme.colors.grape[6],
    theme.colors.cyan[6],
    theme.colors.pink[6],
    theme.colors.teal[6],
  ];

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
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Text size="sm" color="dimmed" tt="uppercase" fw={500}>
              {row['Variable']}
            </Text>
            <Title order={2} style={{ fontSize: '2.5rem' }}>
              {formatNumber(row['Value'])}
            </Title>
            <Group gap="xs">
              <Text size="xs" color="dimmed">
                {row['Function']}
              </Text>
              <Text size="xs" color="dimmed">•</Text>
              <Text size="xs" color="dimmed">
                {row['Simulation']}
              </Text>
            </Group>
          </Stack>
        </Paper>
      );
    }

    if (chartType === 'table') {
      // Show clean table design
      return (
        <ScrollArea>
          <Table
            horizontalSpacing="sm"
            verticalSpacing="xs"
            striped
            highlightOnHover
            withTableBorder={false}
            style={{
              borderRadius: theme.radius.md,
              overflow: 'hidden',
            }}
          >
            <Table.Thead style={{
              backgroundColor: theme.colors.gray[0],
              borderBottom: `2px solid ${theme.colors.gray[2]}`,
            }}>
              <Table.Tr>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7] }}>
                  Simulation
                </Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7] }}>
                  Entity
                </Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7] }}>
                  Variable
                </Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7] }}>
                  Function
                </Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7] }}>
                  Year
                </Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7] }}>
                  Filter
                </Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7] }}>
                  Min
                </Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7] }}>
                  Max
                </Table.Th>
                <Table.Th style={{ fontWeight: 600, fontSize: '0.75rem', color: theme.colors.gray[7], textAlign: 'right' }}>
                  Value
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {aggregates?.map((agg, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td style={{ fontSize: '0.875rem' }}>
                    <Text size="sm" lineClamp={1}>
                      {getSimLabel(agg.simulation_id)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.875rem' }}>
                    {agg.entity}
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.875rem' }}>
                    {agg.variable_name}
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.875rem' }}>
                    {agg.aggregate_function}
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.875rem' }}>
                    {agg.year || '-'}
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.875rem' }}>
                    {agg.filter_variable_name || '-'}
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.875rem' }}>
                    {agg.filter_variable_geq !== null && agg.filter_variable_geq !== undefined ? agg.filter_variable_geq : '-'}
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.875rem' }}>
                    {agg.filter_variable_leq !== null && agg.filter_variable_leq !== undefined ? agg.filter_variable_leq : '-'}
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.875rem', textAlign: 'right', fontWeight: 500 }}>
                    {formatNumber(agg.value || 0)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
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
            color: colors[idx % colors.length],
          },
        };
      });

      const layout = createPlotlyLayout({
        barmode: barMode,
      });

      return (
        <Box style={{ height: chartHeight, position: 'relative' }}>
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
            color: colors[idx % colors.length],
            width: 2,
          },
          marker: {
            size: 6,
            color: colors[idx % colors.length],
          },
        };
      });

      const layout = createPlotlyLayout();

      return (
        <Box style={{ height: chartHeight, position: 'relative' }}>
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
            {row['Variable']}: {formatNumber(row['Value'])} ({row['Simulation']})
          </Text>
        ))}
        {dataframe.rows.length > 10 && (
          <Text size="xs" color="dimmed">... and {dataframe.rows.length - 10} more rows</Text>
        )}
      </Stack>
    );
  };

  return (
    <Stack gap="xs"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      {/* Header with chart type selector and settings */}
      <Group justify="space-between"
        style={{
          opacity: isHovered ? 1 : 0.3,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        <Group gap="xs">
          <SegmentedControl
            value={chartType}
            onChange={(value) => setChartType(value as ChartType)}
            data={[
              { value: 'table', label: <IconTable size={16} /> },
              { value: 'bar_chart', label: <IconChartBar size={16} /> },
              { value: 'line_chart', label: <IconChartLine size={16} /> },
              ...(dataframe.rows.length === 1
                ? [{ value: 'metric_card' as const, label: <IconCards size={16} /> }]
                : []),
            ]}
          />

          {(chartType === 'bar_chart' || chartType === 'line_chart') && (
            <Button
              variant={showSettings ? 'filled' : 'light'}
              leftSection={<IconSettings size={16} />}
              size="xs"
              onClick={() => setShowSettings(!showSettings)}
            >
              Customise
            </Button>
          )}
        </Group>

        {/* Model version citation */}
        {modelVersion && (
          <Text size="xs" color="dimmed">
            PolicyEngine {getCountry()} v{modelVersion.version}
          </Text>
        )}
      </Group>

      {/* Settings Modal - Using BaseModal for consistency */}
      <BaseModal
        opened={showSettings && (chartType === 'bar_chart' || chartType === 'line_chart')}
        onClose={() => {
          setShowSettings(false);
          setSettingsStep(0);
        }}
        title={`Customise chart - ${settingsSteps[settingsStep]}`}
        size="md"
        primaryButton={{
          label: settingsStep === totalSteps - 1 ? 'Apply changes' : 'Next',
          onClick: handleNextStep,
        }}
        secondaryButton={settingsStep > 0 ? {
          label: 'Back',
          onClick: handlePreviousStep,
        } : undefined}
      >
        <Stack gap="md">
          {/* Progress indicator */}
          <Group justify="center" gap="xs">
            {settingsSteps.map((_, index) => (
              <Box
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === settingsStep
                    ? theme.colors.blue[6]
                    : index < settingsStep
                      ? theme.colors.green[6]
                      : theme.colors.gray[3],
                  transition: 'background-color 0.2s ease',
                }}
              />
            ))}
          </Group>

          {/* Step 1: Data configuration */}
          {settingsStep === 0 && (
            <Stack gap="sm">
              <Text size="sm" color="dimmed" mb="xs">
                Configure which data to display on each axis
              </Text>
              <Select
                label="X-axis"
                value={xAxisColumn}
                onChange={(val) => setXAxisColumn(val || '')}
                data={availableColumns}
                size="sm"
                required
              />
              <Select
                label="Y-axis"
                value={yAxisColumn}
                onChange={(val) => setYAxisColumn(val || '')}
                data={availableColumns}
                size="sm"
                required
              />
              <Select
                label="Group by (optional)"
                value={colorColumn}
                onChange={(val) => setColorColumn(val || '')}
                data={[{ value: '', label: 'None' }, ...availableColumns]}
                size="sm"
                clearable
                description="Group data by this column for multiple series"
              />
              {chartType === 'bar_chart' && colorColumn && (
                <Box>
                  <Text size="sm" mb="xs" fw={500}>Bar mode</Text>
                  <SegmentedControl
                    value={barMode}
                    onChange={(val) => setBarMode(val as 'group' | 'stack')}
                    data={[
                      { label: 'Grouped', value: 'group' },
                      { label: 'Stacked', value: 'stack' },
                    ]}
                    fullWidth
                    size="sm"
                  />
                </Box>
              )}
            </Stack>
          )}

          {/* Step 2: Appearance */}
          {settingsStep === 1 && (
            <Stack gap="sm">
              <Text size="sm" color="dimmed" mb="xs">
                Customise how your chart looks
              </Text>
              <TextInput
                label="Chart title"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Enter a title for your chart"
                size="sm"
              />
              <Group grow>
                <TextInput
                  label="X-axis label"
                  value={xAxisTitle}
                  onChange={(e) => setXAxisTitle(e.target.value)}
                  placeholder={xAxisColumn || 'Auto'}
                  size="sm"
                />
                <TextInput
                  label="Y-axis label"
                  value={yAxisTitle}
                  onChange={(e) => setYAxisTitle(e.target.value)}
                  placeholder={yAxisColumn || 'Auto'}
                  size="sm"
                />
              </Group>
              <Box>
                <Text size="sm" mb="xs" fw={500}>Chart height</Text>
                <Slider
                  value={chartHeight}
                  onChange={setChartHeight}
                  min={200}
                  max={600}
                  step={50}
                  marks={[
                    { value: 200, label: 'Small' },
                    { value: 400, label: 'Medium' },
                    { value: 600, label: 'Large' },
                  ]}
                />
              </Box>
              <Group>
                <Switch
                  label="Show grid lines"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.currentTarget.checked)}
                  size="md"
                />
                {colorColumn && (
                  <Switch
                    label="Show legend"
                    checked={showLegend}
                    onChange={(e) => setShowLegend(e.currentTarget.checked)}
                    size="md"
                  />
                )}
              </Group>
              {colorColumn && showLegend && (
                <Group grow>
                  <Select
                    label="Legend position"
                    value={legendPosition}
                    onChange={(val) => setLegendPosition(val || 'right')}
                    data={[
                      { value: 'right', label: 'Right' },
                      { value: 'left', label: 'Left' },
                      { value: 'top', label: 'Top' },
                      { value: 'bottom', label: 'Bottom' },
                    ]}
                    size="sm"
                  />
                  <Select
                    label="Legend style"
                    value={legendOrientation}
                    onChange={(val) => setLegendOrientation(val || 'v')}
                    data={[
                      { value: 'v', label: 'Vertical' },
                      { value: 'h', label: 'Horizontal' },
                    ]}
                    size="sm"
                  />
                </Group>
              )}
            </Stack>
          )}

          {/* Step 3: Advanced options */}
          {settingsStep === 2 && (
            <Stack gap="sm">
              <Text size="sm" color="dimmed" mb="xs">
                Fine-tune axis scales and formatting
              </Text>
              <Group grow>
                <Select
                  label="X-axis scale"
                  value={xAxisType}
                  onChange={(val) => setXAxisType(val || '-')}
                  data={[
                    { value: '-', label: 'Auto' },
                    { value: 'linear', label: 'Linear' },
                    { value: 'log', label: 'Logarithmic' },
                    { value: 'date', label: 'Date' },
                    { value: 'category', label: 'Category' },
                  ]}
                  size="sm"
                />
                <Select
                  label="Y-axis scale"
                  value={yAxisType}
                  onChange={(val) => setYAxisType(val || '-')}
                  data={[
                    { value: '-', label: 'Auto' },
                    { value: 'linear', label: 'Linear' },
                    { value: 'log', label: 'Logarithmic' },
                  ]}
                  size="sm"
                />
              </Group>
              <Group grow>
                <TextInput
                  label="Number format"
                  value={yAxisTickFormat}
                  onChange={(e) => setYAxisTickFormat(e.target.value)}
                  placeholder=".2s"
                  size="sm"
                  description="e.g. .2s for SI, .0% for percent"
                />
                <NumberInput
                  label="X-axis label angle"
                  value={xAxisTickAngle}
                  onChange={(val) => setXAxisTickAngle(typeof val === 'number' ? val : 0)}
                  min={-90}
                  max={90}
                  step={15}
                  size="sm"
                  description="Rotate labels if they overlap"
                />
              </Group>
              <Select
                label="Hover interaction"
                value={hoverMode === false ? 'false' : (hoverMode as string)}
                onChange={(val) => setHoverMode(val === 'false' ? false : (val as string || 'closest'))}
                data={[
                  { value: 'closest', label: 'Show closest point' },
                  { value: 'x', label: 'Compare all data at X position' },
                  { value: 'x unified', label: 'Unified tooltip at X' },
                  { value: 'false', label: 'Disable hover' },
                ]}
                size="sm"
              />
            </Stack>
          )}
        </Stack>
      </BaseModal>

      {/* Visualization */}
      {renderVisualization()}
    </Stack>
  );
}