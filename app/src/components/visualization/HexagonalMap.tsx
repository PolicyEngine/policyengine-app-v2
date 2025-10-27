import { useMemo } from 'react';
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

interface HexagonalMapProps {
  /** Array of data points to visualize */
  data: HexMapDataPoint[];

  /** Configuration for the map */
  config?: Partial<HexMapConfig>;

  /** Country ID for locale-specific formatting */
  countryId?: string;
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
export function HexagonalMap({
  data,
  config = {},
  countryId = 'uk',
}: HexagonalMapProps) {
  // Apply default configuration
  const fullConfig: HexMapConfig = useMemo(
    () => ({
      height: 600,
      hexSize: 12,
      showColorBar: true,
      colorScale: {
        colors: getColorScale('diverging-gray-blue'),
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

  // Plotly layout configuration
  const plotLayout = {
    xaxis: {
      visible: false,
      showgrid: false,
      showline: false,
    },
    yaxis: {
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
      },
      colorscale: fullConfig.colorScale!.colors.map((color, i, arr) => [
        i / (arr.length - 1),
        color,
      ]),
    },
    margin: {
      t: 0,
      b: 80,
      l: 80,
      r: 0,
    },
    ...fullConfig.layoutOverrides,
  } as Partial<Layout>;

  // Plotly config
  const plotConfig: Partial<Config> = {
    displayModeBar: false,
    responsive: true,
  };

  return (
    <Plot
      data={plotData}
      layout={plotLayout}
      config={plotConfig}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
