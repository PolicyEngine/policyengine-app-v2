import { colors } from '@/designTokens';

/** Color bar dimensions, as the US district maps draw theirs. */
const COLOR_BAR_WIDTH = 16;
const COLOR_BAR_HEIGHT_FRACTION = 0.6;

/**
 * The vertical color scale beside a choropleth: a gradient through the
 * scale's colors, labelled with its two ends. The US district maps' legend.
 */
export function ChoroplethColorBar({
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
  formatValue: (value: number) => string;
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
          {scaleColors.map((color, index) => (
            <stop
              key={index}
              offset={`${(index / (scaleColors.length - 1)) * 100}%`}
              stopColor={color}
            />
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
