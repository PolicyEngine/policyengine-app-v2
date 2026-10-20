import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChartWatermark } from '@/components/charts';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { HexMapConfig } from '@/types/visualization/HexMapConfig';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';
import { getColorScale, interpolateColor } from '@/utils/visualization/colorScales';
import {
  applyHexagonalPositioning,
  calculateSymmetricRange,
  generateHoverText,
} from '@/utils/visualization/hexMapUtils';

interface HexagonalMapProps {
  /** Array of data points to visualize */
  data: HexMapDataPoint[];

  /** Configuration for the map */
  config?: Partial<HexMapConfig>;

  /** Optional ref to the map container for image export */
  exportRef?: React.Ref<HTMLDivElement>;

  /** Opt-in: the id of the hexagon to outline as selected. */
  selectedId?: string | null;

  /** Opt-in: called with a hexagon's id when it is clicked. */
  onSelect?: (id: string) => void;

  /**
   * Opt-in: keep the logo watermark clear of the map's frame. Without it the
   * logo sits flush in the bottom-right corner, where the rounded frame clips it.
   */
  insetWatermark?: boolean;

  /**
   * Opt-in: zoom (buttons, wheel, pinch) and drag to pan, as the US
   * district map does. Without it the map is fixed.
   */
  zoomable?: boolean;
}

/** Zoom limits and button step, the same as the US district map's. */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 20;
const ZOOM_STEP = 1.5;
/** Pointer travel, in screen pixels, past which a press is a drag, not a click. */
const DRAG_THRESHOLD = 3;

/** A zoom level and pan offset, in SVG units: translate(x, y) scale(k). */
export interface HexMapView {
  k: number;
  x: number;
  y: number;
}

const INITIAL_VIEW: HexMapView = { k: 1, x: 0, y: 0 };

function clampZoom(k: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
}

/** `view` zoomed to `k`, keeping the SVG point (px, py) where it is on screen. */
export function zoomAbout(view: HexMapView, k: number, px: number, py: number): HexMapView {
  const next = clampZoom(k);
  const ratio = next / view.k;
  return { k: next, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio };
}

/** A client point in the SVG's own units, or null where the browser cannot say (e.g. jsdom). */
function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const matrix = svg.getScreenCTM?.();
  if (!matrix || typeof svg.createSVGPoint !== 'function') {
    return null;
  }
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const local = point.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}

/** SVG units per screen pixel. */
function svgUnitsPerPixel(svg: SVGSVGElement): number {
  const matrix = svg.getScreenCTM?.();
  return matrix && matrix.a ? 1 / matrix.a : 1;
}

/**
 * Zoom and pan for the hex map: wheel and pinch zoom about the pointer,
 * drag to pan, and a press that moves no further than a few pixels stays
 * a click, so a hexagon can still be selected while zoomed.
 */
function useHexMapZoom(enabled: boolean, centerX: number, centerY: number) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<HexMapView>(INITIAL_VIEW);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startView: HexMapView;
    start: { x: number; y: number };
    startDistance?: number;
    dragging: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!enabled || !svg) {
      return;
    }
    // A native listener, so the page does not scroll while the map zooms.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002;
      const factor = 2 ** (-event.deltaY * unit * (event.ctrlKey ? 10 : 1));
      const at = toSvgPoint(svg, event.clientX, event.clientY) ?? { x: centerX, y: centerY };
      setView((current) => zoomAbout(current, current.k * factor, at.x, at.y));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [enabled, centerX, centerY]);

  if (!enabled) {
    return { svgRef, view: INITIAL_VIEW, handlers: {}, controls: null };
  }

  const beginGesture = () => {
    const points = [...pointers.current.values()];
    if (points.length >= 2) {
      const [a, b] = points;
      gesture.current = {
        startView: view,
        start: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        startDistance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        dragging: true,
      };
    } else if (points.length === 1) {
      gesture.current = { startView: view, start: points[0], dragging: false };
    } else {
      gesture.current = null;
    }
  };

  const handlers = {
    onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.button !== 0) {
        return;
      }
      suppressClick.current = false;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      beginGesture();
    },
    onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      const current = gesture.current;
      if (!svg || !current || !pointers.current.has(event.pointerId)) {
        return;
      }
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const points = [...pointers.current.values()];
      if (points.length >= 2 && current.startDistance) {
        const [a, b] = points;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const at = toSvgPoint(svg, current.start.x, current.start.y) ?? {
          x: centerX,
          y: centerY,
        };
        setView(
          zoomAbout(
            current.startView,
            (current.startView.k * distance) / current.startDistance,
            at.x,
            at.y
          )
        );
        return;
      }
      const dx = event.clientX - current.start.x;
      const dy = event.clientY - current.start.y;
      if (!current.dragging && Math.hypot(dx, dy) <= DRAG_THRESHOLD) {
        return;
      }
      if (!current.dragging) {
        current.dragging = true;
        svg.setPointerCapture?.(event.pointerId);
      }
      const unit = svgUnitsPerPixel(svg);
      setView({
        ...current.startView,
        x: current.startView.x + dx * unit,
        y: current.startView.y + dy * unit,
      });
    },
    onPointerUp: (event: React.PointerEvent<SVGSVGElement>) => {
      if (gesture.current?.dragging) {
        suppressClick.current = true;
      }
      pointers.current.delete(event.pointerId);
      beginGesture();
    },
    onPointerCancel: (event: React.PointerEvent<SVGSVGElement>) => {
      pointers.current.delete(event.pointerId);
      beginGesture();
    },
    // A drag ends in a click; it must not select the hexagon under it.
    onClickCapture: (event: React.MouseEvent<SVGSVGElement>) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        event.stopPropagation();
      }
    },
  };

  const controls = (
    <div
      data-export-exclude
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
        disabled={view.k >= MAX_ZOOM}
        onClick={() =>
          setView((current) => zoomAbout(current, current.k * ZOOM_STEP, centerX, centerY))
        }
      >
        +
      </Button>
      <Button
        variant="outline"
        size="icon-xs"
        aria-label="Zoom out"
        disabled={view.k <= MIN_ZOOM}
        onClick={() =>
          setView((current) => zoomAbout(current, current.k / ZOOM_STEP, centerX, centerY))
        }
      >
        −
      </Button>
      <Button variant="outline" size="xs" onClick={() => setView(INITIAL_VIEW)}>
        Reset view
      </Button>
    </div>
  );

  return { svgRef, view, handlers, controls };
}

/** Generate SVG polygon points for a flat-topped hexagon centered at (cx, cy) */
function hexPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
}

/**
 * Outline of the selected hexagon: a dark ring with a white core, so it
 * reads on the darkest fill and the lightest alike.
 */
const SELECTED_STROKE_COLOR = colors.gray[900];
const SELECTED_STROKE_WIDTH = 1.5;
const SELECTED_RING_WIDTH = 3;
const SELECTED_CORE_COLOR = colors.white;
const SELECTED_CORE_WIDTH = 1;

/** Color bar width in SVG units */
const COLOR_BAR_WIDTH = 12;
/** Color bar right margin */
const COLOR_BAR_MARGIN = 60;

export function HexagonalMap({
  data,
  config = {},
  exportRef,
  selectedId,
  onSelect,
  insetWatermark = false,
  zoomable = false,
}: HexagonalMapProps) {
  const clipId = `hex-map-clip-${useId().replace(/:/g, '')}`;
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const fullConfig: HexMapConfig = useMemo(
    () => ({
      height: 380,
      hexSize: 8,
      coordinateScale: 1,
      showColorBar: true,
      colorScale: {
        colors: getColorScale('diverging-gray-teal'),
        tickFormat: '.2f',
        symmetric: true,
        ...config.colorScale,
      },
      formatValue: config.formatValue || ((val) => val.toFixed(2)),
      ...config,
    }),
    [config]
  );

  // Transform data for hexagonal positioning and apply coordinate scaling
  const positionedData = useMemo(() => {
    const hexPositioned = applyHexagonalPositioning(data);
    const scale = fullConfig.coordinateScale ?? 1;

    if (scale === 1) {
      return hexPositioned;
    }

    return hexPositioned.map((point) => ({
      ...point,
      x: point.x * scale,
      y: point.y * scale,
    }));
  }, [data, fullConfig.coordinateScale]);

  // The selected hexagon draws last, so no neighbour covers its outline.
  const drawOrder = useMemo(() => {
    if (!selectedId) {
      return positionedData;
    }
    return [
      ...positionedData.filter((point) => point.id !== selectedId),
      ...positionedData.filter((point) => point.id === selectedId),
    ];
  }, [positionedData, selectedId]);

  const selectedPoint = selectedId
    ? (positionedData.find((point) => point.id === selectedId) ?? null)
    : null;

  // Calculate data bounds
  const dataBounds = useMemo(() => {
    if (positionedData.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const xs = positionedData.map((p) => p.x);
    const ys = positionedData.map((p) => p.y);
    return {
      xMin: Math.min(...xs),
      xMax: Math.max(...xs),
      yMin: Math.min(...ys),
      yMax: Math.max(...ys),
    };
  }, [positionedData]);

  // Calculate color range
  const colorValues = positionedData.map((p) => p.value);
  const colorRange = useMemo(() => {
    if (colorValues.length === 0) {
      return { min: 0, max: 1 };
    }
    if (fullConfig.colorScale!.symmetric) {
      return calculateSymmetricRange(colorValues);
    }
    return {
      min: Math.min(...colorValues),
      max: Math.max(...colorValues),
    };
  }, [colorValues, fullConfig.colorScale]);

  const scaleColors = fullConfig.colorScale!.colors;
  const height = fullConfig.height ?? 380;
  const hexSize = fullConfig.hexSize ?? 8;

  // Compute SVG coordinate system
  // We map data coordinates to SVG pixels with padding
  const padding = hexSize * 2;
  const colorBarSpace = fullConfig.showColorBar ? COLOR_BAR_MARGIN + COLOR_BAR_WIDTH + 40 : 0;
  const svgWidth = 600; // Fixed width, responsive via CSS

  const dataWidth = dataBounds.xMax - dataBounds.xMin || 1;
  const dataHeight = dataBounds.yMax - dataBounds.yMin || 1;

  // Scale to fit within available area while maintaining aspect ratio
  const availW = svgWidth - padding * 2 - colorBarSpace;
  const availH = height - padding * 2;
  const scale = Math.min(availW / dataWidth, availH / dataHeight);
  const hexPixelSize = Math.min(hexSize * (scale / 20), scale * 0.45);

  const toSvgX = (x: number) => padding + (x - dataBounds.xMin) * scale;
  // Flip Y so higher grid-y values go upward
  const toSvgY = (y: number) => height - padding - (y - dataBounds.yMin) * scale;

  // The map's own area, left of the color bar: zoom centres on it and clips to it.
  const mapAreaWidth = fullConfig.showColorBar ? svgWidth - COLOR_BAR_MARGIN - 8 : svgWidth;
  const zoom = useHexMapZoom(zoomable, mapAreaWidth / 2, height / 2);
  // The selected outline keeps its width in screen pixels at any zoom.
  const outlineEffect = zoomable ? 'non-scaling-stroke' : undefined;

  const mapLayer = (
    <>
      {/* Hexagon data points */}
      {drawOrder.map((point) => {
        const cx = toSvgX(point.x);
        const cy = toSvgY(point.y);
        const fill = interpolateColor(point.value, colorRange.min, colorRange.max, scaleColors);
        const hoverText = generateHoverText(point, fullConfig.formatValue!);
        const isSelected = !!selectedId && point.id === selectedId;

        return (
          <polygon
            key={point.id}
            points={hexPoints(cx, cy, hexPixelSize)}
            fill={fill}
            stroke={isSelected ? SELECTED_STROKE_COLOR : colors.background.primary}
            strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : 0.5}
            vectorEffect={isSelected ? outlineEffect : undefined}
            style={{ cursor: 'pointer' }}
            onClick={onSelect ? () => onSelect(point.id) : undefined}
            data-area-id={onSelect ? point.id : undefined}
            data-selected={isSelected || undefined}
            onMouseEnter={(e) => {
              const rect = (
                e.currentTarget.ownerSVGElement as SVGSVGElement
              ).getBoundingClientRect();
              setTooltip({
                text: hoverText,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        );
      })}

      {/* The selected hexagon's ring, over its neighbours; clicks pass through. */}
      {selectedPoint && (
        <g data-export-exclude pointerEvents="none" data-testid="hex-selection-ring">
          <polygon
            points={hexPoints(toSvgX(selectedPoint.x), toSvgY(selectedPoint.y), hexPixelSize)}
            fill="none"
            stroke={SELECTED_STROKE_COLOR}
            strokeWidth={SELECTED_RING_WIDTH}
            strokeLinejoin="round"
            vectorEffect={outlineEffect}
          />
          <polygon
            points={hexPoints(toSvgX(selectedPoint.x), toSvgY(selectedPoint.y), hexPixelSize)}
            fill="none"
            stroke={SELECTED_CORE_COLOR}
            strokeWidth={SELECTED_CORE_WIDTH}
            strokeLinejoin="round"
            vectorEffect={outlineEffect}
          />
        </g>
      )}
    </>
  );

  return (
    <div
      ref={exportRef}
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        backgroundColor: colors.background.primary,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {zoom.controls}
      <svg
        ref={zoom.svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        style={
          zoomable
            ? { display: 'block', touchAction: 'none', userSelect: 'none', cursor: 'grab' }
            : { display: 'block' }
        }
        {...zoom.handlers}
      >
        {zoomable ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <rect x={0} y={0} width={mapAreaWidth} height={height} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              <g
                transform={`translate(${zoom.view.x} ${zoom.view.y}) scale(${zoom.view.k})`}
                data-testid="hex-map-zoom-layer"
              >
                {mapLayer}
              </g>
            </g>
          </>
        ) : (
          mapLayer
        )}

        {/* Color bar */}
        {fullConfig.showColorBar && positionedData.length > 0 && (
          <ColorBar
            x={svgWidth - COLOR_BAR_MARGIN}
            y={padding}
            width={COLOR_BAR_WIDTH}
            height={height - padding * 2}
            min={colorRange.min}
            max={colorRange.max}
            scaleColors={scaleColors}
            formatTick={fullConfig.formatColorBarTick}
          />
        )}
      </svg>

      {/* Tooltip overlay */}
      {tooltip && (
        <div
          data-export-exclude
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: spacing.radius.element,
            fontSize: typography.fontSize.xs,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {tooltip.text}
        </div>
      )}
      {/* PolicyEngine logo watermark */}
      <div
        style={{
          padding: insetWatermark
            ? `${spacing.xs} ${spacing.sm}`
            : `${spacing.xs}px ${spacing.sm}px`,
        }}
      >
        <ChartWatermark />
      </div>
    </div>
  );
}

/** Vertical color bar with gradient and tick labels */
function ColorBar({
  x,
  y,
  width,
  height,
  min,
  max,
  scaleColors,
  formatTick = defaultFormatTick,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  min: number;
  max: number;
  scaleColors: string[];
  /** How each tick reads; plain numbers unless the caller opts in. */
  formatTick?: (value: number) => string;
}) {
  const gradientId = 'hex-color-bar-gradient';
  const tickCount = 5;
  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(min + (max - min) * (i / (tickCount - 1)));
  }

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
          {scaleColors.map((color, i) => (
            <stop key={i} offset={`${(i / (scaleColors.length - 1)) * 100}%`} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={`url(#${gradientId})`} rx={2} />
      {ticks.map((tick, i) => {
        const ty = y + height - (i / (tickCount - 1)) * height;
        return (
          <text
            key={i}
            x={x + width + 4}
            y={ty}
            fontSize={9}
            fill={colors.gray[600]}
            dominantBaseline="central"
          >
            {formatTick(tick)}
          </text>
        );
      })}
    </g>
  );
}

function defaultFormatTick(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (Math.abs(value) >= 1) {
    return value.toFixed(0);
  }
  return value.toFixed(2);
}
