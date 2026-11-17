import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { colors, spacing, typography } from '@/designTokens';
import type { MapShape } from '@/hooks/useExploreData';
import {
  districtIdOf,
  districtRegion,
  regionLevel,
  stateCodeOf,
  stateRegion,
  type BaselineFile,
} from '@/libs/flagship/explore/baselineData';
import { NO_DATA_COLOR, type ColorScale } from '@/libs/flagship/explore/colorScale';
import type { ExploreMetric } from '@/libs/flagship/explore/exploreMetrics';
import {
  interpolateView,
  MAP_HEIGHT,
  MAP_SCALE,
  MAP_WIDTH,
  NATION_VIEW,
  viewFor,
  type MapView,
} from '@/libs/flagship/explore/mapView';
import MapLegend from './MapLegend';

interface ExploreMapProps {
  file: BaselineFile;
  states: MapShape[];
  districts: MapShape[];
  metric: ExploreMetric;
  /** The chosen region: the map zooms to its state. */
  region: string;
  onSelect: (region: string) => void;
  /** At the nation level, color the 436 districts instead of the states. */
  showDistricts: boolean;
  /** The page's scale for the metric and level, shared with the ranked list. */
  scale: ColorScale;
}

const BORDER = colors.white;
const SELECTED_BORDER = colors.gray[900];
const ZOOM_MS = 600;

/** The map's name for screen readers; the ranked list under it gives the values. */
const MAP_LABEL =
  'Map of the United States, colored by the chosen measure. The list under the map gives the values.';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * The Explore map: states at the nation level, one state's districts once
 * a state or district is chosen. A change of region glides the view to
 * the state; Esc and the page's breadcrumb go back out. Hover shows a
 * value; the ranked list and the place card carry the numbers for
 * keyboards and screen readers.
 */
export default function ExploreMap({
  file,
  states,
  districts,
  metric,
  region,
  onSelect,
  showDistricts,
  scale,
}: ExploreMapProps) {
  const level = regionLevel(region);
  const focusState = stateCodeOf(region);
  const selectedDistrict = districtIdOf(region);
  const districtMode = level !== 'nation' || showDistricts;

  const valueOf = (shape: MapShape, asDistrict: boolean) =>
    file.regions[
      asDistrict ? districtRegion(shape.properties.id) : stateRegion(shape.properties.id)
    ]?.metrics[metric.key];

  // The view follows the chosen state, gliding there.
  const target = useMemo(() => {
    const shape = focusState && states.find((s) => s.properties.id === focusState);
    return shape ? viewFor(shape) : NATION_VIEW;
  }, [focusState, states]);
  const [view, setView] = useState<MapView>(target);
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    const from = viewRef.current;
    if (prefersReducedMotion()) {
      setView(target);
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ZOOM_MS);
      const eased = 1 - (1 - t) ** 3;
      setView(interpolateView(from, target, eased));
      if (t < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const showTip = (event: MouseEvent, text: string) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (box) {
      setTip({ x: event.clientX - box.left, y: event.clientY - box.top, text });
    }
  };

  const shapeStyle = (clickable: boolean) => ({
    default: { outline: 'none', transition: 'fill 300ms' },
    hover: { outline: 'none', opacity: 0.85, cursor: clickable ? 'pointer' : undefined },
    pressed: { outline: 'none' },
  });

  const visibleDistricts = districtMode
    ? districts.filter((d) => level === 'nation' || d.properties.state === focusState)
    : [];

  return (
    <div
      ref={boxRef}
      style={{
        position: 'relative',
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        overflow: 'hidden',
        background: colors.white,
      }}
      onMouseLeave={() => setTip(null)}
    >
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: MAP_SCALE }}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={MAP_LABEL}
      >
        <ZoomableGroup
          center={view.center}
          zoom={view.zoom}
          minZoom={1}
          maxZoom={16}
          onMoveEnd={({ coordinates, zoom }) => setView({ center: coordinates, zoom })}
        >
          <Geographies geography={states as unknown as Record<string, unknown>[]}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const shape = geo as unknown as MapShape;
                const code = shape.properties.id;
                const inFocus = level === 'nation' || code === focusState;
                // Under a chosen state's districts, and under all districts when shown.
                const covered = districtMode && inFocus;
                const name = file.regions[stateRegion(code)]?.label ?? code;
                const value = valueOf(shape, false);
                return (
                  <Geography
                    key={code}
                    geography={geo}
                    tabIndex={-1}
                    fill={inFocus ? scale.color(value) : colors.gray[100]}
                    fillOpacity={covered ? 0 : 1}
                    stroke={BORDER}
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                    style={shapeStyle(!covered)}
                    onClick={() => {
                      if (!covered || level === 'nation') {
                        onSelect(stateRegion(code));
                      }
                    }}
                    onMouseMove={(event) =>
                      !covered &&
                      showTip(
                        event,
                        value === undefined
                          ? `${name}: no data`
                          : `${name}: ${metric.format(value)}`
                      )
                    }
                    data-testid={`state-${code}`}
                  />
                );
              })
            }
          </Geographies>
          {districtMode && (
            <Geographies geography={visibleDistricts as unknown as Record<string, unknown>[]}>
              {({ geographies }) =>
                [...geographies]
                  // The chosen district draws last, so no neighbor covers its outline.
                  .sort(
                    (a, b) =>
                      Number((a as unknown as MapShape).properties.id === selectedDistrict) -
                      Number((b as unknown as MapShape).properties.id === selectedDistrict)
                  )
                  .map((geo) => {
                    const shape = geo as unknown as MapShape;
                    const id = shape.properties.id;
                    const value = valueOf(shape, true);
                    const selected = id === selectedDistrict;
                    return (
                      <Geography
                        key={id}
                        geography={geo}
                        tabIndex={-1}
                        fill={value === undefined ? NO_DATA_COLOR : scale.color(value)}
                        stroke={selected ? SELECTED_BORDER : BORDER}
                        strokeWidth={selected ? 2 : 0.4}
                        vectorEffect="non-scaling-stroke"
                        style={shapeStyle(true)}
                        onClick={() => onSelect(districtRegion(id))}
                        onMouseMove={(event) =>
                          showTip(
                            event,
                            value === undefined
                              ? `${id}: no data`
                              : `${id}: ${metric.format(value)}`
                          )
                        }
                        data-testid={`district-${id}`}
                        data-selected={selected || undefined}
                      />
                    );
                  })
              }
            </Geographies>
          )}
        </ZoomableGroup>
      </ComposableMap>

      <MapLegend
        label={`${metric.label} · ${districtMode ? 'districts' : 'states'}`}
        min={metric.format(scale.min)}
        max={metric.format(scale.max)}
      />

      {tip && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: tip.x + 12,
            top: tip.y + 12,
            pointerEvents: 'none',
            background: colors.gray[900],
            color: colors.white,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: spacing.radius.element,
            fontSize: typography.fontSize.xs,
            whiteSpace: 'nowrap',
          }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}
