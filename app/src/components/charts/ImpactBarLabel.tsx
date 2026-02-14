import { colors } from '@/designTokens/colors';

interface LabelledEntry {
  label: string;
}

interface ImpactBarLabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  index?: number;
  data: LabelledEntry[];
}

/**
 * Shared bar label for impact charts.
 * Renders the formatted value above positive bars and below negative bars.
 */
export function ImpactBarLabel({ x, y, width, value, index, data }: ImpactBarLabelProps) {
  const entry = index !== undefined ? data[index] : undefined;
  if (!entry || x === undefined || y === undefined || width === undefined) {
    return null;
  }
  return (
    <text
      x={x + width / 2}
      y={(value ?? 0) >= 0 ? y - 4 : y + 16}
      textAnchor="middle"
      fontSize={12}
      fill={colors.gray[700]}
    >
      {entry.label}
    </text>
  );
}
