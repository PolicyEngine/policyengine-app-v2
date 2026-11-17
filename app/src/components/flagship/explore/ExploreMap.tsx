import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { FeatureCollection } from 'geojson';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
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
  fitProjection,
  IDENTITY,
  interpolateTransform,
  pathFor,
  screenSize,
  transformFor,
  type MapFrame,
  type MapInset,
  type MapTransform,
} from '@/libs/flagship/explore/mapView';

interface ExploreMapProps {
  file: BaselineFile;
  states: MapShape[];
  districts: MapShape[];
  metric: ExploreMetric;
  /** The chosen region: the map zooms to its state, or to a district too small to see there. */
  region: string;
  onSelect: (region: string) => void;
  /** Color districts (a chosen state's, or all at the nation level) instead of states. */
  districtMode: boolean;
  /** The page's scale for the metric and level, shared with the ranked list. */
  scale: ColorScale;
  /** Where the page's overlays sit; the map fits the country, and zooms, into the rest. */
  inset: MapInset;
}

const BORDER = colors.white;
const SELECTED_BORDER = colors.gray[900];
const OTHER_STATE = colors.gray[200];
const ZOOM_MS = 650;
/** A chosen district smaller than this on screen, at its state's zoom, gets a zoom of its own. */
const MIN_DISTRICT_PX = 48;

/** The map's name for screen readers; the ranked list beside it gives the values. */
const MAP_LABEL =
  'Map of the United States, colored by the chosen measure. The list beside the map gives the values.';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/** The box's size, kept current as the window or the layout changes. */
function useBoxSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) {
      return undefined;
    }
    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      setSize((current) =>
        current && current.width === width && current.height === height
          ? current
          : { width, height }
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  return { ref, size };
}

/**
 * The Explore map, filling its box: states at the nation level, one
 * state's districts once a state or district is chosen. The country fits
 * the part of the box that the page's overlays leave free; a change of
 * place glides there. Hover shows a value; the place card and the ranked
 * list carry the numbers for keyboards and screen readers.
 */
export default function ExploreMap(props: ExploreMapProps) {
  const { ref, size } = useBoxSize();
  return (
    <div
      ref={ref}
      style={{ position: 'absolute', inset: 0, background: colors.gray[50], overflow: 'hidden' }}
    >
      {size && size.width > 0 && size.height > 0 && (
        <MapCanvas {...props} width={size.width} height={size.height} />
      )}
    </div>
  );
}

function MapCanvas({
  file,
  states,
  districts,
  metric,
  region,
  onSelect,
  districtMode,
  scale,
  inset,
  width,
  height,
}: ExploreMapProps & { width: number; height: number }) {
  const level = regionLevel(region);
  const focusState = stateCodeOf(region);
  const selectedDistrict = districtIdOf(region);

  const { top, right, bottom, left } = inset;
  const frame: MapFrame = useMemo(
    () => ({ width, height, inset: { top, right, bottom, left } }),
    [width, height, top, right, bottom, left]
  );
  const statesCollection = useMemo<FeatureCollection>(
    () => ({ type: 'FeatureCollection', features: states }),
    [states]
  );
  const projection = useMemo(
    () => fitProjection(frame, statesCollection),
    [frame, statesCollection]
  );
  const path = useMemo(() => pathFor(projection), [projection]);

  // Where the view should be: the nation, the chosen state, or a district
  // that would be a speck at its state's zoom.
  const target = useMemo<MapTransform>(() => {
    const stateShape = focusState && states.find((s) => s.properties.id === focusState);
    if (!stateShape) {
      return IDENTITY;
    }
    const stateView = transformFor(path, frame, stateShape);
    // Only when the map shows districts: otherwise the state's color would fill the view.
    const districtShape =
      districtMode &&
      selectedDistrict &&
      districts.find((d) => d.properties.id === selectedDistrict);
    if (districtShape) {
      const [w, h] = screenSize(path, districtShape, stateView);
      if (Math.max(w, h) < MIN_DISTRICT_PX) {
        return transformFor(path, frame, districtShape, 0.35);
      }
    }
    return stateView;
  }, [focusState, selectedDistrict, districtMode, states, districts, path, frame]);

  // The zoom is written to the shapes' group directly, frame by frame, so
  // a glide redraws no shape: React renders the 400-odd paths once.
  const groupRef = useRef<SVGGElement>(null);
  const viewRef = useRef<MapTransform>(target);
  const frameRef = useRef(frame);
  const apply = (next: MapTransform) => {
    viewRef.current = next;
    groupRef.current?.setAttribute('transform', `translate(${next.x} ${next.y}) scale(${next.k})`);
  };
  useEffect(() => {
    const from = viewRef.current;
    // A resize refits the map at once, as does a hidden page, which runs
    // no animation frames; otherwise a new place glides there.
    if (frameRef.current !== frame || prefersReducedMotion() || document.hidden) {
      frameRef.current = frame;
      apply(target);
      return undefined;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ZOOM_MS);
      const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      apply(interpolateTransform(frame, from, target, eased));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    // A browser that holds back animation frames (a hidden pane, a busy
    // device) still lands on the place, without the glide.
    const landing = setTimeout(() => {
      cancelAnimationFrame(raf);
      apply(target);
    }, ZOOM_MS + 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(landing);
    };
  }, [target, frame]);

  // The tooltip, too, is moved and filled directly: a hover never
  // re-renders the map.
  const boxRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const showTip = (event: MouseEvent, text: string) => {
    const box = boxRef.current?.getBoundingClientRect();
    const tip = tipRef.current;
    if (!box || !tip) {
      return;
    }
    if (tip.textContent !== text) {
      tip.textContent = text;
    }
    tip.style.transform = `translate(${Math.min(event.clientX - box.left + 12, width - 180)}px, ${event.clientY - box.top + 12}px)`;
    tip.style.visibility = 'visible';
  };
  const hideTip = () => {
    if (tipRef.current) {
      tipRef.current.style.visibility = 'hidden';
    }
  };

  const valueOf = (shape: MapShape, asDistrict: boolean) =>
    file.regions[
      asDistrict ? districtRegion(shape.properties.id) : stateRegion(shape.properties.id)
    ]?.metrics[metric.key];

  const shapeStyle = (clickable: boolean) => ({
    default: { outline: 'none', transition: 'fill 300ms' },
    hover: { outline: 'none', opacity: 0.85, cursor: clickable ? 'pointer' : undefined },
    pressed: { outline: 'none' },
  });

  const visibleDistricts = districtMode
    ? districts.filter((d) => level === 'nation' || d.properties.state === focusState)
    : [];

  return (
    <div ref={boxRef} style={{ position: 'absolute', inset: 0 }} onMouseLeave={hideTip}>
      <ComposableMap
        projection={projection as never}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
        role="img"
        aria-label={MAP_LABEL}
        onClick={() => {
          // A click on the sea goes back out.
          if (level !== 'nation') {
            onSelect('us');
          }
        }}
      >
        <g
          ref={groupRef}
          transform={`translate(${viewRef.current.x} ${viewRef.current.y}) scale(${viewRef.current.k})`}
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
                    fill={inFocus ? scale.color(value) : OTHER_STATE}
                    fillOpacity={covered ? 0 : 1}
                    stroke={BORDER}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    style={shapeStyle(!covered)}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!covered) {
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
                        strokeWidth={selected ? 2.5 : 0.5}
                        vectorEffect="non-scaling-stroke"
                        style={shapeStyle(true)}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(districtRegion(id));
                        }}
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
        </g>
      </ComposableMap>

      <div
        ref={tipRef}
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          willChange: 'transform',
          background: colors.gray[900],
          color: colors.white,
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: spacing.radius.element,
          fontSize: typography.fontSize.xs,
          whiteSpace: 'nowrap',
        }}
      />
    </div>
  );
}
