/**
 * UK constituency or local authority choropleth map
 *
 * The UK counterpart of the US district maps, drawn the same way: SVG
 * boundaries with react-simple-maps, the same color scale, legend, tooltip,
 * frame and logo. Each area joins its boundary by ONS code (by name for an
 * older result without codes). A boundary with no result is grey, and its
 * tooltip says why (`missingAreaText`). `focusNation` draws one nation
 * alone, as `focusState` does for a US state. `navigable` adds the flagship
 * district map's zoom buttons and fixed height; without it the map scales
 * with its width, as the v2 district map does.
 *
 * The boundaries are WGS 84, drawn on the Mercator projection fitted
 * exactly to the areas shown.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { ChartWatermark } from '@/components/charts';
import { Button, Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { ChoroplethColorBar } from './ChoroplethColorBar';
import type { UKAreaChoroplethDataPoint, UKAreaChoroplethMapProps } from './types';
import {
  featureProperty,
  fitMercator,
  UK_BOUNDARY_ATTRIBUTION,
  UK_BOUNDARY_FILES,
  ukNationFromCode,
} from './ukAreaBoundaries';
import { useGeoJSONLoader } from './useGeoJSONLoader';
import { calculateColorRange, getDistrictColor, mergeConfig } from './utils';

/** Default fill for areas without data */
const NO_DATA_FILL = colors.gray[300];

/** Stroke color and width for area borders */
const BORDER_COLOR = colors.white;
const BORDER_WIDTH = 0.5;

/** Outline for the selected area, in screen pixels at any zoom */
const SELECTED_BORDER_COLOR = colors.gray[900];
const SELECTED_BORDER_WIDTH = 1.5;

/** What an area with no result reads, unless the caller says why it has none. */
const DEFAULT_MISSING_AREA_TEXT = 'No data';

/** Zoom limits and button step, the same as the US district maps'. */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 20;
const ZOOM_STEP = 1.5;

const SVG_WIDTH = 800;

/** The UK's middle, for the moment before the boundaries give a fit. */
const DEFAULT_UK_VIEW = { center: [-3.4, 55.4] as [number, number], scale: 1800 };

interface TooltipState {
  x: number;
  y: number;
  lines: string[];
}

/** An area's tooltip lines, in the US district maps' layout: name, then value. */
function tooltipLines(
  name: string,
  point: UKAreaChoroplethDataPoint | undefined,
  formatValue: (value: number) => string,
  missingAreaText: string
): string[] {
  if (!point) {
    return [name, missingAreaText];
  }
  const lines = [point.label, formatValue(point.value)];
  if (typeof point.lower === 'number' && typeof point.upper === 'number') {
    lines.push(`90% range ${formatValue(point.lower)} to ${formatValue(point.upper)}`);
  }
  if (point.approximate) {
    lines.push('Approximate estimate');
  }
  return lines;
}

export function UKAreaChoroplethMap({
  data,
  level,
  config = {},
  geoDataPath,
  focusNation,
  exportRef,
  missingAreaText = DEFAULT_MISSING_AREA_TEXT,
  navigable = false,
  selectedId,
  onAreaClick,
  ariaLabel,
}: UKAreaChoroplethMapProps) {
  const uniqueId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const boundaryFile = UK_BOUNDARY_FILES[level];

  // Downloads capture the frame and the licence credit under it, which the
  // Open Government Licence asks for wherever the boundaries are used.
  const exportWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof exportRef === 'function') {
        exportRef(node);
      } else if (exportRef) {
        (exportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [exportRef]
  );

  const { geoJSON, loading, error } = useGeoJSONLoader(geoDataPath ?? boundaryFile.path);

  const fullConfig = useMemo(() => mergeConfig(config), [config]);

  // Each area joins its boundary by code; one without a code, by name.
  const { pointsByCode, pointsByName } = useMemo(() => {
    const byCode = new Map<string, UKAreaChoroplethDataPoint>();
    const byName = new Map<string, UKAreaChoroplethDataPoint>();
    for (const point of data) {
      if (point.code) {
        byCode.set(point.code, point);
      } else {
        byName.set(point.label, point);
      }
    }
    return { pointsByCode: byCode, pointsByName: byName };
  }, [data]);

  const colorRange = useMemo(
    () =>
      calculateColorRange(
        data.map((point) => ({ geoId: point.id, label: point.label, value: point.value })),
        fullConfig.colorScale.symmetric ?? true
      ),
    [data, fullConfig.colorScale.symmetric]
  );

  // A nation's report draws that nation alone.
  const features = useMemo(() => {
    const all = geoJSON?.features ?? [];
    if (!focusNation) {
      return all;
    }
    return all.filter(
      (feature) =>
        ukNationFromCode(featureProperty(feature, boundaryFile.codeProperty)) === focusNation
    );
  }, [boundaryFile.codeProperty, focusNation, geoJSON]);

  // Geographies re-reads its features whenever this object changes, so it
  // changes only with them, not with each tooltip move.
  const geoSource = useMemo(() => ({ type: 'FeatureCollection', features }), [features]);

  const fit = useMemo(
    () => fitMercator(features, SVG_WIDTH, fullConfig.height) ?? DEFAULT_UK_VIEW,
    [features, fullConfig.height]
  );

  const initialView = useMemo(() => ({ center: fit.center, zoom: 1 }), [fit]);
  const [view, setView] = useState(initialView);
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const pointFor = useCallback(
    (code: string | undefined, name: string | undefined) =>
      (code ? pointsByCode.get(code) : undefined) ?? (name ? pointsByName.get(name) : undefined),
    [pointsByCode, pointsByName]
  );

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleMouseEnter = useCallback((event: React.MouseEvent, lines: string[]) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, lines });
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!tooltip) {
        return;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setTooltip((previous) =>
        previous ? { ...previous, x: event.clientX - rect.left, y: event.clientY - rect.top } : null
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
        <Text style={{ color: colors.error }}>{error}</Text>
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
        <Text style={{ color: colors.text.secondary }}>No area data available</Text>
      </div>
    );
  }

  const gradientId = `choropleth-gradient-${uniqueId.replace(/:/g, '')}`;

  return (
    <Stack ref={exportWrapperRef} style={{ gap: spacing.xs }}>
      <div
        ref={containerRef}
        className="tw:flex tw:items-stretch"
        style={{
          height: navigable ? fullConfig.height : '100%',
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.container,
          backgroundColor: colors.background.primary,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {navigable && (
          <div
            style={{
              position: 'absolute',
              top: spacing.sm,
              left: spacing.sm,
              zIndex: 1,
              display: 'flex',
              gap: spacing.xs,
              background: colors.background.primary,
              borderRadius: spacing.radius.container,
              padding: spacing.xs,
            }}
          >
            <Button
              variant="outline"
              size="icon-xs"
              aria-label="Zoom in"
              disabled={view.zoom >= MAX_ZOOM}
              onClick={() =>
                setView((current) => ({
                  ...current,
                  zoom: Math.min(MAX_ZOOM, current.zoom * ZOOM_STEP),
                }))
              }
            >
              +
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              aria-label="Zoom out"
              disabled={view.zoom <= MIN_ZOOM}
              onClick={() =>
                setView((current) => ({
                  ...current,
                  zoom: Math.max(MIN_ZOOM, current.zoom / ZOOM_STEP),
                }))
              }
            >
              −
            </Button>
            <Button variant="outline" size="xs" onClick={() => setView(initialView)}>
              Reset view
            </Button>
          </div>
        )}
        {/* Map */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: fit.center, scale: fit.scale }}
            width={SVG_WIDTH}
            height={fullConfig.height}
            style={{ width: '100%', height: '100%' }}
            // One named image, not hundreds of unnamed shapes: the lists carry the values.
            {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : {})}
          >
            <ZoomableGroup
              center={navigable ? view.center : initialView.center}
              zoom={navigable ? view.zoom : initialView.zoom}
              // Browsers report trackpad pinch gestures as Ctrl+wheel.
              filterZoomEvent={
                navigable
                  ? (event) => {
                      // react-simple-maps types this as SVGElement, but passes the native event.
                      const input = event as unknown as MouseEvent;
                      return (!input.ctrlKey || input.type === 'wheel') && !input.button;
                    }
                  : undefined
              }
              onMoveEnd={
                navigable
                  ? ({ coordinates, zoom }) => setView({ center: coordinates, zoom })
                  : undefined
              }
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
            >
              <Geographies geography={geoSource as unknown as Record<string, unknown>}>
                {({ geographies }) =>
                  // The selected area draws last, so no neighbour covers its outline.
                  geographies
                    .map((geo) => {
                      const code = featureProperty(geo, boundaryFile.codeProperty);
                      const name = featureProperty(geo, boundaryFile.nameProperty);
                      return { geo, code, name, point: pointFor(code, name) };
                    })
                    .sort(
                      (a, b) =>
                        Number(!!selectedId && a.point?.id === selectedId) -
                        Number(!!selectedId && b.point?.id === selectedId)
                    )
                    .map(({ geo, code, name, point }) => {
                      const isSelected = !!selectedId && point?.id === selectedId;
                      const isClickable = !!onAreaClick && !!point;
                      const fillColor = point
                        ? getDistrictColor(point.value, colorRange, fullConfig.colorScale.colors)
                        : NO_DATA_FILL;
                      const lines = tooltipLines(
                        name ?? code ?? '',
                        point,
                        fullConfig.formatValue,
                        missingAreaText
                      );

                      return (
                        <Geography
                          key={geo.rsmKey ?? code}
                          geography={geo}
                          // Hundreds of unnamed tab stops help no one; the lists beside
                          // the flagship map open an area's details from the keyboard.
                          tabIndex={-1}
                          fill={fillColor}
                          stroke={isSelected ? SELECTED_BORDER_COLOR : BORDER_COLOR}
                          strokeWidth={isSelected ? SELECTED_BORDER_WIDTH : BORDER_WIDTH}
                          // The map scales its shapes to zoom; the outline keeps its width.
                          vectorEffect={isSelected ? 'non-scaling-stroke' : undefined}
                          style={{
                            default: { outline: 'none' },
                            hover: {
                              outline: 'none',
                              opacity: 0.85,
                              cursor: isClickable ? 'pointer' : undefined,
                            },
                            pressed: { outline: 'none' },
                          }}
                          onClick={isClickable && point ? () => onAreaClick(point.id) : undefined}
                          data-selected={isSelected || undefined}
                          onMouseEnter={(event) => handleMouseEnter(event, lines)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                          data-testid={code ? `area-${code}` : undefined}
                        />
                      );
                    })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Color bar */}
        {fullConfig.showColorBar && (
          <ChoroplethColorBar
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
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.element,
              padding: `${spacing.xs} ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: `0 2px 6px ${colors.shadow.medium}`,
              whiteSpace: 'nowrap',
            }}
          >
            {tooltip.lines.map((line, index) => (
              <div
                key={index}
                style={
                  index === 0
                    ? { fontWeight: typography.fontWeight.semibold }
                    : { color: colors.gray[600] }
                }
              >
                {line}
              </div>
            ))}
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
      {/* The Open Government Licence's attribution for the boundaries. */}
      <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        {UK_BOUNDARY_ATTRIBUTION[level]}
      </Text>
    </Stack>
  );
}
