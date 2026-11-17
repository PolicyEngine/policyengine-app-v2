import { colors, spacing, typography } from '@/designTokens';
import { SCALE_COLORS } from '@/libs/flagship/explore/colorScale';

interface MapLegendProps {
  label: string;
  min: string;
  max: string;
}

/** The color steps, lowest to highest; the page places it by the map. */
export default function MapLegend({ label, min, max }: MapLegendProps) {
  return (
    <div
      aria-hidden
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        padding: `${spacing.xs} ${spacing.sm}`,
        borderRadius: spacing.radius.element,
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
      }}
    >
      {label}
      <div style={{ display: 'flex', height: 8, width: 140, margin: `${spacing.xs} 0 2px` }}>
        {SCALE_COLORS.map((color) => (
          <span key={color} style={{ flex: 1, background: color }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
