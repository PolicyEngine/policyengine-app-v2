/**
 * Utility functions for US District Choropleth Map
 */

import type { Layout, PlotData } from 'plotly.js';
import { colors } from '@/designTokens';
import { DEFAULT_CHART_LAYOUT } from '@/utils/chartUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';
import type {
  ChoroplethDataPoint,
  ChoroplethMapConfig,
  ColorRange,
  ColorscaleEntry,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  PartialChoroplethMapConfig,
  PlotDataAndLayout,
  PlotlyGeoConfig,
  ProcessedFeatureData,
} from './types';

/**
 * Default configuration for the choropleth map
 */
export const DEFAULT_CHOROPLETH_CONFIG: ChoroplethMapConfig = {
  height: 500,
  showColorBar: true,
  colorScale: {
    colors: DIVERGING_GRAY_TEAL.colors,
    tickFormat: '$,.0f',
    symmetric: true,
  },
  formatValue: (val: number) => val.toFixed(2),
};

/**
 * Merge partial config with defaults to create full config
 */
export function mergeConfig(partial: PartialChoroplethMapConfig): ChoroplethMapConfig {
  return {
    height: partial.height ?? DEFAULT_CHOROPLETH_CONFIG.height,
    showColorBar: partial.showColorBar ?? DEFAULT_CHOROPLETH_CONFIG.showColorBar,
    colorScale: {
      ...DEFAULT_CHOROPLETH_CONFIG.colorScale,
      ...partial.colorScale,
    },
    formatValue: partial.formatValue ?? DEFAULT_CHOROPLETH_CONFIG.formatValue,
  };
}

/**
 * Create a lookup map from data points for efficient access
 */
export function createDataLookupMap(data: ChoroplethDataPoint[]): Map<string, ChoroplethDataPoint> {
  const map = new Map<string, ChoroplethDataPoint>();
  data.forEach((point) => {
    map.set(point.geoId, point);
  });
  return map;
}

/**
 * Calculate the color range (min/max) for the data
 *
 * @param data - Data points to analyze
 * @param symmetric - Whether to center the range at zero
 * @returns Color range with min and max values
 */
export function calculateColorRange(data: ChoroplethDataPoint[], symmetric: boolean): ColorRange {
  const values = data.map((d) => d.value);

  if (values.length === 0) {
    return { min: -1, max: 1 };
  }

  if (symmetric) {
    const maxAbs = Math.max(...values.map(Math.abs));
    return { min: -maxAbs, max: maxAbs };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Build the Plotly colorscale array for diverging colors.
 * Creates a scale that fades toward cream near zero, with a tight band at the center.
 *
 * @returns Array of [position, color] tuples
 */
export function buildDivergingColorscale(): ColorscaleEntry[] {
  return [
    [0, colors.gray[700]], // Most negative - dark gray
    [0.4999, '#EDEBE6'], // Approaching zero - creamy gray (still visible tint)
    [0.5, '#F9F2EA'], // Exactly zero - cream neutral
    [0.5001, '#D6EEEB'], // Just past zero - creamy teal (still visible tint)
    [1, colors.primary[600]], // Most positive - dark teal
  ];
}

/**
 * Process GeoJSON features to extract only those with data.
 * Returns the processed arrays needed for Plotly.
 *
 * @param geoJSON - The full GeoJSON feature collection
 * @param dataMap - Lookup map of geoId to data points
 * @param formatValue - Function to format values for hover text
 * @returns Processed feature data with locations, values, hover text, and filtered features
 */
export function processGeoJSONFeatures(
  geoJSON: GeoJSONFeatureCollection,
  dataMap: Map<string, ChoroplethDataPoint>,
  formatValue: (value: number) => string
): ProcessedFeatureData {
  const locations: string[] = [];
  const values: number[] = [];
  const hoverText: string[] = [];
  const features: GeoJSONFeature[] = [];

  geoJSON.features.forEach((feature: GeoJSONFeature) => {
    const districtId = feature.properties?.DISTRICT_ID as string;
    if (!districtId) {
      return;
    }

    const dataPoint = dataMap.get(districtId);
    if (!dataPoint) {
      return; // Skip districts without data
    }

    locations.push(districtId);
    values.push(dataPoint.value);
    hoverText.push(`${dataPoint.label}<br>${formatValue(dataPoint.value)}`);
    features.push(feature);
  });

  return { locations, values, hoverText, features };
}

/**
 * Build a background outline trace showing ALL district boundaries.
 * White fill with light gray outlines, no hover, no colorbar.
 * This trace is rendered beneath the data trace so all outlines
 * are always visible even before data arrives.
 */
export function buildBackgroundTrace(
  geoJSON: GeoJSONFeatureCollection
): Partial<PlotData> {
  const locations: string[] = [];
  const features: GeoJSONFeature[] = [];

  geoJSON.features.forEach((feature: GeoJSONFeature) => {
    const districtId = feature.properties?.DISTRICT_ID as string;
    if (!districtId) return;
    locations.push(districtId);
    features.push(feature);
  });

  const bgGeoJSON: GeoJSONFeatureCollection = {
    ...geoJSON,
    features: features.map((f, i) => ({ ...f, id: locations[i] })),
  };

  return {
    type: 'choropleth',
    geojson: bgGeoJSON,
    locations,
    z: locations.map(() => 0),
    featureidkey: 'id',
    locationmode: 'geojson-id',
    colorscale: [
      [0, colors.background.primary],
      [1, colors.background.primary],
    ] as ColorscaleEntry[],
    zmin: 0,
    zmax: 1,
    showscale: false,
    hoverinfo: 'skip',
    marker: {
      line: {
        color: colors.gray[300],
        width: 0.5,
      },
    },
  } as Partial<PlotData>;
}

/**
 * Build the geo configuration for Plotly.
 *
 * @param focusState - Optional state code to zoom to
 * @returns Plotly geo configuration object
 */
export function buildGeoConfig(focusState?: string): PlotlyGeoConfig {
  const config: PlotlyGeoConfig = {
    scope: 'usa',
    projection: { type: 'albers usa' },
    showlakes: true,
    lakecolor: 'rgb(255, 255, 255)',
    bgcolor: colors.background.primary,
    showland: false,
    showframe: false,
    showcoastlines: false,
    showcountries: false,
    showsubunits: false,
  };

  // If focusing on a single state, use fitbounds to zoom to the visible districts
  if (focusState) {
    config.fitbounds = 'geojson';
  }

  return config;
}

/**
 * Create a modified GeoJSON with feature IDs set to district IDs.
 * Only includes features that have data.
 *
 * @param geoJSON - Original GeoJSON
 * @param processedData - Processed feature data
 * @returns Modified GeoJSON with IDs
 */
export function createGeoJSONWithIds(
  geoJSON: GeoJSONFeatureCollection,
  processedData: ProcessedFeatureData
): GeoJSONFeatureCollection {
  return {
    ...geoJSON,
    features: processedData.features.map((feature, idx) => ({
      ...feature,
      id: processedData.locations[idx],
    })),
  };
}

/**
 * Build the Plotly trace data for the choropleth.
 *
 * @param geoJSONWithIds - GeoJSON with feature IDs
 * @param processedData - Processed feature data
 * @param colorscale - Plotly colorscale
 * @param colorRange - Min/max values for color mapping
 * @param config - Map configuration
 * @returns Plotly trace data
 */
export function buildPlotData(
  geoJSONWithIds: GeoJSONFeatureCollection,
  processedData: ProcessedFeatureData,
  colorscale: ColorscaleEntry[],
  colorRange: ColorRange,
  config: ChoroplethMapConfig
): Partial<PlotData>[] {
  return [
    {
      type: 'choropleth',
      geojson: geoJSONWithIds,
      locations: processedData.locations,
      z: processedData.values,
      text: processedData.hoverText,
      featureidkey: 'id',
      locationmode: 'geojson-id',
      colorscale,
      zmin: colorRange.min,
      zmax: colorRange.max,
      colorbar: config.showColorBar
        ? {
            title: '',
            thickness: 15,
            len: 0.7,
            outlinewidth: 0,
            tickformat: config.colorScale.tickFormat,
            x: 1.02,
          }
        : undefined,
      showscale: config.showColorBar,
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        line: {
          color: 'white',
          width: 1.0,
        },
      },
    } as Partial<PlotData>,
  ];
}

/**
 * Build the Plotly layout for the choropleth.
 *
 * @param geoConfig - Geo configuration
 * @param height - Map height
 * @returns Plotly layout
 */
export function buildPlotLayout(geoConfig: PlotlyGeoConfig, height: number): Partial<Layout> {
  return {
    ...DEFAULT_CHART_LAYOUT,
    geo: geoConfig,
    height,
    margin: { t: 10, b: 10, l: 10, r: 60 },
    paper_bgcolor: colors.background.primary,
    plot_bgcolor: colors.background.primary,
  };
}

/**
 * Build complete plot data and layout from GeoJSON and data.
 * This is the main function that orchestrates all the helper functions.
 *
 * @param geoJSON - GeoJSON feature collection
 * @param dataMap - Lookup map of data points
 * @param colorRange - Color range for the scale
 * @param config - Map configuration
 * @param focusState - Optional state to zoom to
 * @returns Plot data and layout
 */
export function buildPlotDataAndLayout(
  geoJSON: GeoJSONFeatureCollection,
  dataMap: Map<string, ChoroplethDataPoint>,
  colorRange: ColorRange,
  config: ChoroplethMapConfig,
  focusState?: string
): PlotDataAndLayout {
  // Background trace: all district outlines (white fill, gray borders)
  const backgroundTrace = buildBackgroundTrace(geoJSON);

  // Process features to extract only those with data
  const processedData = processGeoJSONFeatures(geoJSON, dataMap, config.formatValue);

  // Create modified GeoJSON with IDs
  const geoJSONWithIds = createGeoJSONWithIds(geoJSON, processedData);

  // Build colorscale
  const colorscale = buildDivergingColorscale();

  // Build geo config
  const geoConfig = buildGeoConfig(focusState);

  // Build data trace (colored fills for districts with data)
  const dataTraces = buildPlotData(geoJSONWithIds, processedData, colorscale, colorRange, config);
  const plotLayout = buildPlotLayout(geoConfig, config.height);

  return { plotData: [backgroundTrace, ...dataTraces], plotLayout };
}
