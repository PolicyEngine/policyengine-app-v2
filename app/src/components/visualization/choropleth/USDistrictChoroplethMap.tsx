/**
 * US Congressional District Choropleth Map
 *
 * Renders a geographic choropleth map of US congressional districts using Plotly.
 * Supports diverging color scales, custom formatting, and state-level zooming.
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

import { useEffect, useMemo, useState } from 'react';
import type { Config } from 'plotly.js';
import Plot from 'react-plotly.js';
import { Box, Center, Loader, Stack, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { DEFAULT_CHART_CONFIG } from '@/utils/chartUtils';
import type { GeoJSONFeatureCollection, USDistrictChoroplethMapProps } from './types';
import {
  buildPlotDataAndLayout,
  calculateColorRange,
  createDataLookupMap,
  mergeConfig,
} from './utils';

/** GeoJSON cache to avoid re-fetching (keyed by path) */
const geoJSONCache: Record<string, GeoJSONFeatureCollection> = {};

/** Default path to GeoJSON file */
const DEFAULT_GEOJSON_PATH = '/data/geojson/congressional_districts.geojson';

/**
 * Custom hook for loading and caching GeoJSON data
 */
function useGeoJSONLoader(geoDataPath: string) {
  const cached = geoJSONCache[geoDataPath];
  const [geoJSON, setGeoJSON] = useState<GeoJSONFeatureCollection | null>(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cachedData = geoJSONCache[geoDataPath];
    if (cachedData) {
      setGeoJSON(cachedData);
      setLoading(false);
      return;
    }

    const loadGeoData = async () => {
      try {
        setLoading(true);
        const response = await fetch(geoDataPath);
        if (!response.ok) {
          throw new Error(`Failed to load geo data: ${response.status}`);
        }
        const geoJSONData: GeoJSONFeatureCollection = await response.json();

        geoJSONCache[geoDataPath] = geoJSONData;
        setGeoJSON(geoJSONData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    loadGeoData();
  }, [geoDataPath]);

  return { geoJSON, loading, error };
}

/**
 * Build Plotly config with zoom controls enabled
 */
function buildPlotConfig(): Partial<Config> {
  return {
    ...DEFAULT_CHART_CONFIG,
    displayModeBar: 'hover',
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'hoverClosestGeo', 'toImage'],
    scrollZoom: true,
    responsive: true,
  };
}

/**
 * US Congressional District Choropleth Map Component
 *
 * Renders a geographic choropleth map of US congressional districts.
 * Supports diverging color scales, custom formatting, and state-level zooming.
 */
export function USDistrictChoroplethMap({
  data,
  config = {},
  geoDataPath = DEFAULT_GEOJSON_PATH,
  focusState,
}: USDistrictChoroplethMapProps) {
  // Load GeoJSON data
  const { geoJSON, loading, error } = useGeoJSONLoader(geoDataPath);

  // Merge configuration with defaults
  const fullConfig = useMemo(() => mergeConfig(config), [config]);

  // Create data lookup map for efficient access
  const dataMap = useMemo(() => createDataLookupMap(data), [data]);

  // Calculate color range
  const colorRange = useMemo(
    () => calculateColorRange(data, fullConfig.colorScale.symmetric ?? true),
    [data, fullConfig.colorScale.symmetric]
  );

  // Build Plotly data and layout
  const { plotData, plotLayout } = useMemo(() => {
    if (!geoJSON) {
      return { plotData: [], plotLayout: {} };
    }
    return buildPlotDataAndLayout(geoJSON, dataMap, colorRange, fullConfig, focusState);
  }, [geoJSON, dataMap, colorRange, fullConfig, focusState]);

  // Build Plotly config
  const plotConfig = useMemo(() => buildPlotConfig(), []);

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
