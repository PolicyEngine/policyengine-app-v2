import { useMemo } from 'react';
import { Box } from '@mantine/core';
import Plot from 'react-plotly.js';
import type { Data, Layout, Config } from 'plotly.js';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';
import type { HexMapConfig } from '@/types/visualization/HexMapConfig';
import {
  applyHexagonalPositioning,
  calculateSymmetricRange,
  generateHoverText,
} from '@/utils/visualization/hexMapUtils';
import { getColorScale } from '@/utils/visualization/colorScales';
import { colors, spacing } from '@/designTokens';

interface HexagonalMapProps {
  /** Array of data points to visualize */
  data: HexMapDataPoint[];

  /** Configuration for the map */
  config?: Partial<HexMapConfig>;
}

/**
 * Generic hexagonal map visualization component
 *
 * Renders data points on a hexagonal grid using Plotly.
 * Supports diverging color scales, custom formatting, and responsive layout.
 *
 * @example
 * ```tsx
 * <HexagonalMap
 *   data={constituencyData}
 *   config={{
 *     colorScale: {
 *       colors: DIVERGING_GRAY_BLUE.colors,
 *       tickFormat: '£,.0f',
 *       symmetric: true
 *     },
 *     formatValue: (val) => formatParameterValue(val, 'currency-GBP', {
 *       decimalPlaces: 0,
 *       includeSymbol: true
 *     })
 *   }}
 * />
 * ```
 */
export function HexagonalMap({ data, config = {} }: HexagonalMapProps) {
  // Apply default configuration
  const fullConfig: HexMapConfig = useMemo(
    () => ({
      height: 600,
      hexSize: 12,
      showColorBar: true,
      colorScale: {
        colors: getColorScale('diverging-gray-teal'),
        tickFormat: '.2f',
        symmetric: true,
        ...config.colorScale,
      },
      formatValue: config.formatValue || ((val) => val.toFixed(2)),
      layoutOverrides: config.layoutOverrides || {},
    }),
    [config]
  );

  // Transform data for hexagonal positioning
  const positionedData = useMemo(() => applyHexagonalPositioning(data), [data]);

  // Extract arrays for Plotly
  const xValues = positionedData.map((p) => p.x);
  const yValues = positionedData.map((p) => p.y);
  const colorValues = positionedData.map((p) => p.value);
  const hoverText = positionedData.map((p) =>
    generateHoverText(p, fullConfig.formatValue!)
  );

  // Calculate data bounds
  const dataBounds = useMemo(() => {
    if (xValues.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    return {
      xMin: Math.min(...xValues),
      xMax: Math.max(...xValues),
      yMin: Math.min(...yValues),
      yMax: Math.max(...yValues),
    };
  }, [xValues, yValues]);




  // Calculate color range
  const colorRange = useMemo(() => {
    if (fullConfig.colorScale!.symmetric) {
      return calculateSymmetricRange(colorValues);
    }
    return {
      min: Math.min(...colorValues),
      max: Math.max(...colorValues),
    };
  }, [colorValues, fullConfig.colorScale]);

  // Plotly data configuration
  const plotData: Partial<Data>[] = [
    {
      type: 'scatter',
      mode: 'markers',
      x: xValues,
      y: yValues,
      text: hoverText,
      marker: {
        color: colorValues,
        symbol: 'hexagon',
        size: fullConfig.hexSize,
        coloraxis: 'coloraxis',
      } as any,
      showlegend: false,
      hoverinfo: 'text',
    },
  ];

  const plotLayout = {
    xaxis: {
      domain: [0.02, 0.88],
      range: [dataBounds.xMin - 1, dataBounds.xMax + 1],
      scaleanchor: 'y',
      scaleratio: 1.18,
      constrain: 'domain',
      constraintoward: 'center',
      visible: false,
      showgrid: false,
      showline: false,
    },
    yaxis: {
      domain: [0.02, 0.98],
      range: [dataBounds.yMin - 1, dataBounds.yMax + 1],
      scaleratio: 1,
      constrain: 'domain',
      constraintoward: 'middle',
      visible: false,
      showgrid: false,
      showline: false,
    },
    height: fullConfig.height,
    showlegend: false,
    coloraxis: {
      showscale: fullConfig.showColorBar,
      cmin: colorRange.min,
      cmax: colorRange.max,
      colorbar: {
        outlinewidth: 0,
        thickness: 10,
        tickformat: fullConfig.colorScale!.tickFormat,
        x: 0.95, // Position colorbar at 95% (in the 85%-100% area outside plot domain)
        len: 0.8, // Colorbar height as fraction of plot area
      },
      colorscale: fullConfig.colorScale!.colors.map((color, i, arr) => [
        i / (arr.length - 1),
        color,
      ]),
    },
    margin: {
      t: 10,
      b: 40,
      l: 20,
      r: 100,
    },
    ...fullConfig.layoutOverrides,
  } as Partial<Layout>;

  // Plotly config
  const plotConfig: Partial<Config> = {
    displayModeBar: false,
    responsive: true,
  };

  return (
    <Box
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.sm,
        backgroundColor: colors.background.primary,
        overflow: 'hidden',
      }}
    >
      <Plot
        data={plotData}
        layout={plotLayout}
        config={plotConfig}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
}
