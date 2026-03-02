import { useMemo, useState } from 'react';
import { ChartWatermark } from '@/components/charts';
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

/** Color bar width in SVG units */
const COLOR_BAR_WIDTH = 12;
/** Color bar right margin */
const COLOR_BAR_MARGIN = 60;

export function HexagonalMap({ data, config = {}, exportRef }: HexagonalMapProps) {
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
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        style={{ display: 'block' }}
      >
        {/* Hexagon data points */}
        {positionedData.map((point) => {
          const cx = toSvgX(point.x);
          const cy = toSvgY(point.y);
          const fill = interpolateColor(point.value, colorRange.min, colorRange.max, scaleColors);
          const hoverText = generateHoverText(point, fullConfig.formatValue!);

          return (
            <polygon
              key={point.id}
              points={hexPoints(cx, cy, hexPixelSize)}
              fill={fill}
              stroke={colors.background.primary}
              strokeWidth={0.5}
              style={{ cursor: 'pointer' }}
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
      <div style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}>
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
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  min: number;
  max: number;
  scaleColors: string[];
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

function formatTick(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (Math.abs(value) >= 1) {
    return value.toFixed(0);
  }
  return value.toFixed(2);
}
