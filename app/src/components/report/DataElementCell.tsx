import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mantine/core';
import Plot from 'react-plotly.js';
import { aggregatesAPI, AggregateTable } from '@/api/v2/aggregates';
import { simulationsAPI } from '@/api/v2/simulations';
import { ReportElement } from '@/api/v2/reportElements';
import { modelVersionsAPI } from '@/api/v2/modelVersions';

interface DataElementCellProps {
  element: ReportElement;
  isEditing?: boolean;
}

export default function DataElementCell({
  element,
  isEditing = false,
}: DataElementCellProps) {
  const theme = useMantineTheme();
  const location = useLocation();

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

  // Extract visualization info from element
  const chartType = element.chart_type || element.data_type;
  const xAxis = element.x_axis_variable;
  const yAxis = element.y_axis_variable;

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

  // Render based on chart type
  const renderVisualization = () => {
    if (chartType === 'metric_card' || aggregates.length === 1) {
      // Single metric display
      const aggregate = aggregates[0];
      return (
        <Card shadow="xs" padding="lg">
          <Stack align="center" gap="xs">
            <Text size="sm" color="dimmed">{aggregate.variable_name}</Text>
            <Title order={2}>{formatNumber(aggregate.value || 0)}</Title>
            <Text size="xs" color="dimmed">
              {aggregate.aggregate_function} • {getSimLabel(aggregate.simulation_id)}
            </Text>
          </Stack>
        </Card>
      );
    }

    if (chartType === 'table' || (!chartType && aggregates.length > 1)) {
      // Table display
      // Group by simulation and variable
      const tableData: Record<string, Record<string, number>> = {};
      const variables = [...new Set(aggregates.map(a => a.variable_name))];

      aggregates.forEach(agg => {
        const simLabel = getSimLabel(agg.simulation_id);
        if (!tableData[simLabel]) tableData[simLabel] = {};
        tableData[simLabel][agg.variable_name] = agg.value || 0;
      });

      return (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Simulation</Table.Th>
              {variables.map(v => (
                <Table.Th key={v} style={{ textAlign: 'right' }}>{v}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.entries(tableData).map(([sim, values]) => (
              <Table.Tr key={sim}>
                <Table.Td>{sim}</Table.Td>
                {variables.map(v => (
                  <Table.Td key={v} style={{ textAlign: 'right' }}>{formatNumber(values[v] || 0)}</Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      );
    }

    if (chartType === 'bar_chart') {
      // Bar chart
      const data = aggregates.map(agg => ({
        name: xAxis === 'simulation_id'
          ? getSimLabel(agg.simulation_id)
          : agg.variable_name,
        value: agg.value || 0,
        variable: agg.variable_name,
      }));

      const plotData = [{
        x: data.map(d => d.name),
        y: data.map(d => d.value),
        type: 'bar' as const,
        marker: {
          color: theme.colors.blue[6],
        },
      }];

      const layout = createPlotlyLayout();

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
      // Line chart
      let plotData: any[] = [];

      if (xAxis === 'year') {
        // Group by year
        const yearData: Record<number, Record<string, number>> = {};
        aggregates.forEach(agg => {
          if (agg.year) {
            if (!yearData[agg.year]) yearData[agg.year] = {};
            yearData[agg.year][getSimLabel(agg.simulation_id)] = agg.value || 0;
          }
        });

        const years = Object.keys(yearData).map(Number).sort();
        const simulations = [...new Set(aggregates.map(agg => getSimLabel(agg.simulation_id)))];

        plotData = simulations.map((sim, index) => ({
          x: years,
          y: years.map(year => yearData[year]?.[sim] || 0),
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          name: sim,
          line: {
            color: theme.colors[['blue', 'red', 'green', 'orange', 'purple'][index % 5]][6],
          },
        }));
      } else {
        // Simulations on X-axis
        const data = aggregates.map(agg => ({
          name: getSimLabel(agg.simulation_id),
          value: agg.value || 0,
        }));

        plotData = [{
          x: data.map(d => d.name),
          y: data.map(d => d.value),
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          line: {
            color: theme.colors.blue[6],
          },
        }];
      }

      const layout = createPlotlyLayout({
        showlegend: xAxis === 'year',
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

    // Default: show as text
    return (
      <Stack>
        {aggregates.map((agg, idx) => (
          <Text key={idx}>
            {agg.variable_name}: {formatNumber(agg.value || 0)}
            ({agg.aggregate_function} for {getSimLabel(agg.simulation_id)})
          </Text>
        ))}
      </Stack>
    );
  };

  // Get citation info
  const getCitationInfo = () => {
    if (!aggregates || aggregates.length === 0) return null;

    // Get the most recent updated date from aggregates or element
    const dates = aggregates
      .map(a => a.updated_at)
      .filter(Boolean)
      .map(d => new Date(d));

    // Also consider the element's updated_at
    if (element.updated_at) {
      dates.push(new Date(element.updated_at));
    }

    const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

    // Format date
    const formatDate = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));

      if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
      if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
      if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
      return 'Just now';
    };

    // Get model version from fetched data or fallback
    const versionText = modelVersion?.version || aggregates[0]?.model_version || 'v2.1.0';
    const isLatest = aggregates[0]?.is_latest_model_version !== false;

    return {
      date: formatDate(latestDate),
      modelVersion: versionText,
      isLatest
    };
  };

  const citation = getCitationInfo();

  return (
    <Stack gap="xs">
      {isEditing && (
        <Paper p="xs" withBorder>
          <Text size="xs" color="dimmed">
            Data visualization: {chartType || 'auto'} • {aggregates.length} values
          </Text>
        </Paper>
      )}
      {renderVisualization()}
      {citation && (
        <Group justify="flex-end">
          <Text
            size="xs"
            color="dimmed"
            style={{
              fontSize: '11px',
              fontStyle: 'italic'
            }}
          >
            Updated {citation.date} • PolicyEngine {getCountry()} {citation.modelVersion}
            {!citation.isLatest && ' (outdated)'}
          </Text>
        </Group>
      )}
    </Stack>
  );
}