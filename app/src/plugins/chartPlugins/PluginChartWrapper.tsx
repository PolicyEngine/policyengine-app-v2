/**
 * Plugin Chart Wrapper
 *
 * React component that renders a chart plugin.
 * Handles sandbox execution, error states, and renders the resulting Plotly chart.
 */

import { Alert, Center, Loader, Stack, Text } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { ChartContainer } from '@/components/ChartContainer';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getClampedChartHeight } from '@/utils/chartUtils';
import { localeCode } from '@/utils/formatters';
import { chartPluginRegistry } from './ChartPluginRegistry';
import { type ChartRenderResult, getChartPluginSandbox } from './ChartPluginSandbox';

interface Props {
  /** Plugin ID to render */
  pluginId: string;
  /** Report output data */
  output: SocietyWideReportOutput;
}

interface RenderState {
  loading: boolean;
  error: string | null;
  result: ChartRenderResult | null;
}

/**
 * Renders a chart from a plugin.
 */
export function PluginChartWrapper({ pluginId, output }: Props) {
  const countryId = useCurrentCountry();
  const { height: viewportHeight } = useViewportSize();
  const chartHeight = getClampedChartHeight(viewportHeight, false);

  const [state, setState] = useState<RenderState>({
    loading: true,
    error: null,
    result: null,
  });

  // Get the plugin from registry
  const plugin = chartPluginRegistry.getPlugin(pluginId);

  useEffect(() => {
    let mounted = true;

    async function renderChart() {
      if (!plugin) {
        setState({
          loading: false,
          error: `Plugin "${pluginId}" not found`,
          result: null,
        });
        return;
      }

      if (!plugin.code) {
        setState({
          loading: false,
          error: 'Plugin code not loaded',
          result: null,
        });
        return;
      }

      setState({ loading: true, error: null, result: null });

      try {
        const sandbox = getChartPluginSandbox();
        const result = await sandbox.render(pluginId, plugin.code, output, countryId);

        if (!mounted) {
          return;
        }

        if (result.success) {
          setState({ loading: false, error: null, result });
        } else {
          setState({
            loading: false,
            error: result.error || 'Unknown error',
            result: null,
          });
        }
      } catch (error) {
        if (!mounted) {
          return;
        }
        setState({
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null,
        });
      }
    }

    renderChart();

    return () => {
      mounted = false;
    };
  }, [pluginId, plugin, output, countryId]);

  // Placeholder download handler for plugin charts
  // TODO: Implement CSV export for plugin charts
  const handleDownloadCsv = () => {
    console.info('[PluginChartWrapper] CSV download not yet implemented for plugin charts');
  };

  // Loading state
  if (state.loading) {
    return (
      <ChartContainer title={plugin?.manifest.name || 'Loading plugin...'} onDownloadCsv={handleDownloadCsv}>
        <Center h={chartHeight}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="sm" c="dimmed">
              Loading chart plugin...
            </Text>
          </Stack>
        </Center>
      </ChartContainer>
    );
  }

  // Error state
  if (state.error) {
    return (
      <ChartContainer title={plugin?.manifest.name || 'Plugin Error'} onDownloadCsv={handleDownloadCsv}>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Chart Plugin Error"
          color="red"
          variant="light"
        >
          <Text size="sm">{state.error}</Text>
          {plugin && (
            <Text size="xs" c="dimmed" mt="xs">
              Plugin: {plugin.manifest.name} (v{plugin.manifest.version})
            </Text>
          )}
        </Alert>
      </ChartContainer>
    );
  }

  // No result
  if (!state.result || !state.result.data) {
    return (
      <ChartContainer title={plugin?.manifest.name || 'No Data'} onDownloadCsv={handleDownloadCsv}>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="No Chart Data"
          color="yellow"
          variant="light"
        >
          <Text size="sm">The plugin did not return any chart data.</Text>
        </Alert>
      </ChartContainer>
    );
  }

  // Success - render the chart
  const { data, layout, config } = state.result;

  // Merge default layout with plugin layout
  const finalLayout = {
    margin: { t: 0, b: 80, l: 80, r: 40 },
    ...((layout as object) || {}),
  };

  // Merge default config with plugin config
  const finalConfig = {
    displayModeBar: true,
    responsive: true,
    displaylogo: false,
    locale: localeCode(countryId),
    ...((config as object) || {}),
  };

  return (
    <ChartContainer title={plugin?.manifest.name || 'Plugin Chart'} onDownloadCsv={handleDownloadCsv}>
      <Stack gap="md">
        <Plot
          data={data as Plotly.Data[]}
          layout={finalLayout}
          config={finalConfig}
          style={{ width: '100%', height: chartHeight }}
        />
        {plugin?.manifest.description && (
          <Text size="sm" c="dimmed" ta="center" px="md">
            {plugin.manifest.description}
          </Text>
        )}
      </Stack>
    </ChartContainer>
  );
}

/**
 * Factory function to create a chart component for a specific plugin.
 * This is used to integrate with the VIEW_MAP in ComparativeAnalysisPage.
 */
export function createPluginChartComponent(pluginId: string) {
  return function PluginChart({ output }: { output: SocietyWideReportOutput }) {
    return <PluginChartWrapper pluginId={pluginId} output={output} />;
  };
}
