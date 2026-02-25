/**
 * US Congressional District Choropleth Map
 *
 * Renders a geographic choropleth map of US congressional districts using
 * react-simple-maps (SVG). Supports diverging color scales, custom formatting,
 * and state-level zooming.
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
 *       symmetric: true,
 *     },
 *     formatValue: (val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
 *   }}
 * />
 * ```
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { ChartWatermark } from '@/components/charts';
import { Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import type {
  GeoJSONFeatureCollection,
  MapVisualizationType,
  USDistrictChoroplethMapProps,
} from './types';
import {
  calculateColorRange,
  createDataLookupMap,
  getDistrictColor,
  mergeConfig,
  STATE_ABBREV_TO_FIPS,
} from './utils';

/** GeoJSON cache to avoid re-fetching (keyed by path) */
const geoJSONCache: Record<string, GeoJSONFeatureCollection> = {};

/** GeoJSON paths for each visualization type */
const GEOJSON_PATHS: Record<MapVisualizationType, string> = {
  geographic: '/data/geojson/congressional_districts.geojson',
  hex: '/data/geojson/congressional_districts_hex.geojson',
};

/** Default fill for districts without data */
const NO_DATA_FILL = '#e0e0e0';

/** Stroke color for district borders */
const BORDER_COLOR = '#ffffff';

/** Stroke width for district borders */
const BORDER_WIDTH = 0.5;

/** Color bar dimensions */
const COLOR_BAR_WIDTH = 16;
const COLOR_BAR_HEIGHT_FRACTION = 0.6;

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
 * Compute center and zoom for a focused state.
 */
function useFocusStateView(
  geoJSON: GeoJSONFeatureCollection | null,
  focusState: string | undefined
): { center: [number, number]; zoom: number } | null {
  return useMemo(() => {
    if (!focusState || !geoJSON) {
      return null;
    }

    const statePrefix = `${focusState.toUpperCase()}-`;
    const fips = STATE_ABBREV_TO_FIPS[focusState.toLowerCase()];

    const stateFeatures = geoJSON.features.filter((f) => {
      const districtId = f.properties?.DISTRICT_ID as string | undefined;
      const stateFp = f.properties?.STATEFP as string | undefined;
      return (districtId && districtId.startsWith(statePrefix)) || (fips && stateFp === fips);
    });

    if (stateFeatures.length === 0) {
      return null;
    }

    let minLng = Infinity,
      maxLng = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;

    for (const feature of stateFeatures) {
      const geom = feature.geometry as {
        type: string;
        coordinates: number[][][] | number[][][][];
      };
      if (!geom || !geom.coordinates) {
        continue;
      }

      const rings =
        geom.type === 'Polygon'
          ? (geom.coordinates as number[][][])
          : geom.type === 'MultiPolygon'
            ? (geom.coordinates as number[][][][]).flat()
            : [];

      for (const ring of rings) {
        for (const coord of ring) {
          const [lng, lat] = coord;
          if (lng < minLng) {
            minLng = lng;
          }
          if (lng > maxLng) {
            maxLng = lng;
          }
          if (lat < minLat) {
            minLat = lat;
          }
          if (lat > maxLat) {
            maxLat = lat;
          }
        }
      }
    }

    if (!isFinite(minLng)) {
      return null;
    }

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const spanLng = maxLng - minLng;
    const spanLat = maxLat - minLat;
    const maxSpan = Math.max(spanLng, spanLat);

    const zoom = Math.min(Math.max(50 / (maxSpan || 1), 1), 20);

    return { center: [centerLng, centerLat], zoom };
  }, [geoJSON, focusState]);
}

interface TooltipState {
  x: number;
  y: number;
  label: string;
  value: string;
}

function ColorBar({
  scaleColors,
  height,
  min,
  max,
  formatValue,
  gradientId,
}: {
  scaleColors: string[];
  height: number;
  min: number;
  max: number;
  formatValue: (v: number) => string;
  gradientId: string;
}) {
  const barHeight = Math.round(height * COLOR_BAR_HEIGHT_FRACTION);
  const barY = Math.round((height - barHeight) / 2);

  return (
    <svg
      width={60}
      height={height}
      style={{ flexShrink: 0 }}
      role="img"
      aria-label="Color scale legend"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
          {scaleColors.map((color, i) => (
            <stop key={i} offset={`${(i / (scaleColors.length - 1)) * 100}%`} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      <rect
        x={4}
        y={barY}
        width={COLOR_BAR_WIDTH}
        height={barHeight}
        fill={`url(#${gradientId})`}
        rx={2}
      />
      <text x={24} y={barY + 4} fontSize={10} fill={colors.gray[600]} dominantBaseline="hanging">
        {formatValue(max)}
      </text>
      <text x={24} y={barY + barHeight - 4} fontSize={10} fill={colors.gray[600]}>
        {formatValue(min)}
      </text>
    </svg>
  );
}

function useGeoJSONFitProjection(
  geoJSON: GeoJSONFeatureCollection | null,
  enabled: boolean,
  svgWidth: number,
  svgHeight: number
): { center: [number, number]; scale: number } | null {
  return useMemo(() => {
    if (!enabled || !geoJSON) {
      return null;
    }

    let minLng = Infinity,
      maxLng = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;

    for (const feature of geoJSON.features) {
      const geom = feature.geometry as {
        type: string;
        coordinates: number[][][] | number[][][][];
      };
      if (!geom?.coordinates) {
        continue;
      }

      const rings =
        geom.type === 'Polygon'
          ? (geom.coordinates as number[][][])
          : geom.type === 'MultiPolygon'
            ? (geom.coordinates as number[][][][]).flat()
            : [];

      for (const ring of rings) {
        for (const [lng, lat] of ring) {
          if (lng < minLng) {
            minLng = lng;
          }
          if (lng > maxLng) {
            maxLng = lng;
          }
          if (lat < minLat) {
            minLat = lat;
          }
          if (lat > maxLat) {
            maxLat = lat;
          }
        }
      }
    }

    if (!isFinite(minLng)) {
      return null;
    }

    const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
    const lonSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;

    const padding = 0.85;
    const scaleForWidth = (svgWidth * padding) / ((lonSpan * Math.PI) / 180);
    const scaleForHeight = (svgHeight * padding) / ((latSpan * Math.PI) / 180);
    const scale = Math.min(scaleForWidth, scaleForHeight);

    return { center, scale };
  }, [enabled, geoJSON, svgWidth, svgHeight]);
}

const SVG_WIDTH = 800;

const DEFAULT_US_CENTER: [number, number] = [-96, 38.5];

export function USDistrictChoroplethMap({
  data,
  config = {},
  geoDataPath,
  focusState,
  visualizationType = 'geographic',
  exportRef,
}: USDistrictChoroplethMapProps) {
  const uniqueId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const isHexMap = visualizationType === 'hex';

  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof exportRef === 'function') {
        exportRef(node);
      } else if (exportRef) {
        (exportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [exportRef]
  );

  const effectiveGeoDataPath = geoDataPath ?? GEOJSON_PATHS[visualizationType];

  const { geoJSON, loading, error } = useGeoJSONLoader(effectiveGeoDataPath);

  const fullConfig = useMemo(() => mergeConfig(config), [config]);

  const dataMap = useMemo(() => createDataLookupMap(data), [data]);

  const colorRange = useMemo(
    () => calculateColorRange(data, fullConfig.colorScale.symmetric ?? true),
    [data, fullConfig.colorScale.symmetric]
  );

  const hexFit = useGeoJSONFitProjection(geoJSON, isHexMap, SVG_WIDTH, fullConfig.height);

  const focusView = useFocusStateView(geoJSON, focusState);

  const filteredGeoJSON = useMemo(() => {
    if (!geoJSON || !focusState) {
      return geoJSON;
    }

    const statePrefix = `${focusState.toUpperCase()}-`;
    const fips = STATE_ABBREV_TO_FIPS[focusState.toLowerCase()];

    const filtered = geoJSON.features.filter((f) => {
      const districtId = f.properties?.DISTRICT_ID as string | undefined;
      const stateFp = f.properties?.STATEFP as string | undefined;
      return (districtId && districtId.startsWith(statePrefix)) || (fips && stateFp === fips);
    });

    return { ...geoJSON, features: filtered };
  }, [geoJSON, focusState]);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent, districtId: string) => {
      const dataPoint = dataMap.get(districtId);
      if (!dataPoint) {
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setTooltip({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        label: dataPoint.label,
        value: fullConfig.formatValue(dataPoint.value),
      });
    },
    [dataMap, fullConfig]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!tooltip) {
        return;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setTooltip((prev) =>
        prev
          ? {
              ...prev,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            }
          : null
      );
    },
    [tooltip]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        className="tw:flex tw:items-center tw:justify-center"
        style={{ height: fullConfig.height }}
      >
        <Stack align="center" gap="sm">
          <Spinner size="lg" />
          <Text size="sm" style={{ color: colors.text.secondary }}>
            Loading map data...
          </Text>
        </Stack>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="tw:flex tw:items-center tw:justify-center"
        style={{ height: fullConfig.height }}
      >
        <Text style={{ color: 'red' }}>{error}</Text>
      </div>
    );
  }

  // No data state
  if (!data.length) {
    return (
      <div
        className="tw:flex tw:items-center tw:justify-center"
        style={{ height: fullConfig.height }}
      >
        <Text style={{ color: colors.text.secondary }}>No district data available</Text>
      </div>
    );
  }

  const geoSource = filteredGeoJSON ?? geoJSON;
  const gradientId = `choropleth-gradient-${uniqueId.replace(/:/g, '')}`;

  return (
    <div
      ref={mergedRef}
      className="tw:flex tw:items-stretch"
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        backgroundColor: colors.background.primary,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Map */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ComposableMap
          projection={isHexMap ? 'geoEquirectangular' : 'geoAlbersUsa'}
          projectionConfig={
            isHexMap && hexFit ? { center: hexFit.center, scale: hexFit.scale } : undefined
          }
          width={SVG_WIDTH}
          height={fullConfig.height}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            center={focusView?.center ?? (isHexMap && hexFit ? hexFit.center : DEFAULT_US_CENTER)}
            zoom={focusView?.zoom ?? 1}
            minZoom={0.5}
            maxZoom={20}
          >
            {geoSource && (
              <Geographies geography={geoSource as unknown as Record<string, unknown>}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const districtId = geo.properties?.DISTRICT_ID as string | undefined;
                    const dataPoint = districtId ? dataMap.get(districtId) : undefined;

                    const fillColor = dataPoint
                      ? getDistrictColor(dataPoint.value, colorRange, fullConfig.colorScale.colors)
                      : NO_DATA_FILL;

                    return (
                      <Geography
                        key={geo.rsmKey ?? districtId ?? geo.id}
                        geography={geo}
                        fill={fillColor}
                        stroke={BORDER_COLOR}
                        strokeWidth={BORDER_WIDTH}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', opacity: 0.85 },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={(event) => {
                          if (districtId) {
                            handleMouseEnter(event, districtId);
                          }
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        data-testid={districtId ? `district-${districtId}` : undefined}
                      />
                    );
                  })
                }
              </Geographies>
            )}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Color bar */}
      {fullConfig.showColorBar && (
        <ColorBar
          scaleColors={fullConfig.colorScale.colors}
          height={fullConfig.height}
          min={colorRange.min}
          max={colorRange.max}
          formatValue={fullConfig.formatValue}
          gradientId={gradientId}
        />
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          role="tooltip"
          data-export-exclude
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y - 30,
            background: 'white',
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.element,
            padding: '6px 10px',
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 600 }}>{tooltip.label}</div>
          <div style={{ color: colors.gray[600] }}>{tooltip.value}</div>
        </div>
      )}
      {/* PolicyEngine logo watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: spacing.xs,
          right: spacing.sm,
        }}
      >
        <ChartWatermark />
      </div>
    </div>
  );
}
