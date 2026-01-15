import { useEffect, useMemo, useState } from 'react';
import type { Config, Layout, PlotData } from 'plotly.js';
import Plot from 'react-plotly.js';
import { Box, Center, Loader, Stack, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { DEFAULT_CHART_CONFIG, DEFAULT_CHART_LAYOUT } from '@/utils/chartUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';

/**
 * GeoJSON Feature interface for congressional districts
 */
interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  properties: {
    STATEFP?: string;
    CD118FP?: string;
    GEOID?: string;
    DISTRICT_ID?: string; // Added: matches API format (e.g., "AL-01")
    NAMELSAD?: string;
    [key: string]: unknown;
  } | null;
  geometry: unknown;
}

/**
 * GeoJSON FeatureCollection interface
 */
interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Data point for choropleth map visualization
 */
export interface ChoroplethDataPoint {
  /** District ID matching GeoJSON DISTRICT_ID property (e.g., "AL-01") */
  geoId: string;

  /** Display label for hover tooltip */
  label: string;

  /** Value to visualize (determines color) */
  value: number;
}

/**
 * Configuration options for the choropleth map
 */
export interface ChoroplethMapConfig {
  /** Map height in pixels */
  height?: number;

  /** Color scale configuration */
  colorScale?: {
    /** Array of colors for the scale */
    colors: string[];
    /** Plotly tick format string */
    tickFormat: string;
    /** Whether to center the scale at zero */
    symmetric?: boolean;
  };

  /** Whether to show the color bar */
  showColorBar?: boolean;

  /** Custom value formatter for hover text */
  formatValue?: (value: number) => string;
}

interface USDistrictChoroplethMapProps {
  /** Array of data points to visualize */
  data: ChoroplethDataPoint[];

  /** Configuration for the map */
  config?: Partial<ChoroplethMapConfig>;

  /** Path to GeoJSON file (optional, defaults to 119th Congress) */
  geoJsonPath?: string;
}

// GeoJSON cache to avoid re-fetching (keyed by path)
const geoJSONCache: Record<string, GeoJSONFeatureCollection> = {};

/**
 * US Congressional District Choropleth Map
 *
 * Renders a geographic choropleth map of US congressional districts using Plotly.
 * Supports diverging color scales and custom formatting.
 *
 * @example
 * ```tsx
 * <USDistrictChoroplethMap
 *   data={[
 *     { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 312.45 },
 *     { geoId: 'AL-02', label: "Alabama's 2nd congressional district", value: -45.30 },
 *   ]}
 *   config={{
 *     colorScale: {
 *       colors: DIVERGING_GRAY_TEAL.colors,
 *       tickFormat: '$,.0f',
 *       symmetric: true,
 *     },
 *     formatValue: (val) => `$${val.toFixed(0)}`,
 *   }}
 * />
 * ```
 */
export function USDistrictChoroplethMap({
  data,
  config = {},
  geoJsonPath = '/data/geojson/real_congressional_districts.geojson',
}: USDistrictChoroplethMapProps) {
  const cached = geoJSONCache[geoJsonPath];
  const [geoJSON, setGeoJSON] = useState<GeoJSONFeatureCollection | null>(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  // Apply default configuration
  const fullConfig: ChoroplethMapConfig = useMemo(
    () => ({
      height: 500,
      showColorBar: true,
      colorScale: {
        colors: DIVERGING_GRAY_TEAL.colors,
        tickFormat: '$,.0f',
        symmetric: true,
        ...config.colorScale,
      },
      formatValue: config.formatValue || ((val) => val.toFixed(2)),
      ...config,
    }),
    [config]
  );

  // Load GeoJSON data
  useEffect(() => {
    const cachedData = geoJSONCache[geoJsonPath];
    if (cachedData) {
      setGeoJSON(cachedData);
      setLoading(false);
      return;
    }

    const loadGeoJSON = async () => {
      try {
        setLoading(true);
        const response = await fetch(geoJsonPath);
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON: ${response.status}`);
        }
        const jsonData = await response.json();
        geoJSONCache[geoJsonPath] = jsonData;
        setGeoJSON(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    loadGeoJSON();
  }, [geoJsonPath]);

  // Create data lookup map for efficient access
  const dataMap = useMemo(() => {
    const map = new Map<string, ChoroplethDataPoint>();
    data.forEach((point) => {
      map.set(point.geoId, point);
    });
    return map;
  }, [data]);

  // Calculate color range
  const colorRange = useMemo(() => {
    const values = data.map((d) => d.value);
    if (values.length === 0) {
      return { min: -1, max: 1 };
    }

    if (fullConfig.colorScale?.symmetric) {
      const maxAbs = Math.max(...values.map(Math.abs));
      return { min: -maxAbs, max: maxAbs };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data, fullConfig.colorScale?.symmetric]);

  // Build Plotly data and layout
  const { plotData, plotLayout } = useMemo(() => {
    if (!geoJSON) {
      return { plotData: [], plotLayout: {} };
    }

    // Prepare arrays for Plotly
    const locations: string[] = [];
    const z: number[] = [];
    const text: string[] = [];

    // Process each GeoJSON feature
    geoJSON.features.forEach((feature: GeoJSONFeature) => {
      // Use DISTRICT_ID which matches API format (e.g., "AL-01")
      const districtId = feature.properties?.DISTRICT_ID as string;
      if (!districtId) {
        return;
      }

      const dataPoint = dataMap.get(districtId);
      const value = dataPoint?.value ?? 0;
      const label = dataPoint?.label ?? `District ${districtId}`;

      locations.push(districtId);
      z.push(value);
      text.push(`${label}<br>${fullConfig.formatValue!(value)}`);
    });

    // Create modified GeoJSON with feature IDs
    const geoJSONWithIds = {
      ...geoJSON,
      features: geoJSON.features.map((feature: GeoJSONFeature, idx: number) => ({
        ...feature,
        id: locations[idx],
      })),
    };

    // Build color scale for Plotly (typed as [number, string] tuples)
    const colorscale: Array<[number, string]> = fullConfig.colorScale!.colors.map(
      (color, i, arr) => [i / (arr.length - 1), color] as [number, string]
    );

    const plotData: Partial<PlotData>[] = [
      {
        type: 'choropleth',
        geojson: geoJSONWithIds,
        locations,
        z,
        text,
        featureidkey: 'id',
        locationmode: 'geojson-id',
        colorscale,
        zmin: colorRange.min,
        zmax: colorRange.max,
        colorbar: fullConfig.showColorBar
          ? {
              title: '',
              thickness: 15,
              len: 0.7,
              outlinewidth: 0,
              tickformat: fullConfig.colorScale!.tickFormat,
              x: 1.02,
            }
          : undefined,
        showscale: fullConfig.showColorBar,
        hovertemplate: '%{text}<extra></extra>',
        marker: {
          line: {
            color: 'white',
            width: 0.5,
          },
        },
      } as Partial<PlotData>,
    ];

    const plotLayout: Partial<Layout> = {
      ...DEFAULT_CHART_LAYOUT,
      geo: {
        scope: 'usa',
        projection: {
          type: 'albers usa',
        },
        showlakes: true,
        lakecolor: 'rgb(255, 255, 255)',
        bgcolor: colors.background.primary,
        showland: false,
        showframe: false,
      },
      height: fullConfig.height,
      margin: { t: 10, b: 10, l: 10, r: 60 },
      paper_bgcolor: colors.background.primary,
      plot_bgcolor: colors.background.primary,
    };

    return { plotData, plotLayout };
  }, [geoJSON, dataMap, colorRange, fullConfig]);

  // Plotly config
  const plotConfig: Partial<Config> = {
    ...DEFAULT_CHART_CONFIG,
    displayModeBar: false,
    responsive: true,
  };

  // Loading state
  if (loading) {
    return (
      <Center h={fullConfig.height}>
        <Stack align="center" gap="sm">
          <Loader size="lg" color={colors.primary[500]} />
          <Text size="sm" c="dimmed">
            Loading map data...
          </Text>
        </Stack>
      </Center>
    );
  }

  // Error state
  if (error) {
    return (
      <Center h={fullConfig.height}>
        <Text c="red">{error}</Text>
      </Center>
    );
  }

  // No data state
  if (!data.length) {
    return (
      <Center h={fullConfig.height}>
        <Text c="dimmed">No district data available</Text>
      </Center>
    );
  }

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
