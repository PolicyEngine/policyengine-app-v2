import { IconTrendingUp } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { Growth } from '@/libs/flagship/uprating';

interface GrowthControlProps {
  year: number;
  value: Growth;
  options: Array<{ value: Growth; label: string }>;
  onChange: (value: Growth) => void;
}

/** What the choice does, in a line under it. */
function hint(value: Growth, options: GrowthControlProps['options']): string {
  if (value === 'fixed') {
    return options.some((option) => option.value === 'current_law')
      ? 'Held at this value every year after. Current law would grow it.'
      : 'Held at this value every year after.';
  }
  if (value === 'current_law') {
    return 'Grows each year at the rate current law projects for it.';
  }
  const label = options.find((option) => option.value === value)?.label ?? '';
  return `${label.replace(/^Grows with /, 'Grows each year with ')}, as the model projects it.`;
}

/**
 * How one value moves after its year: held, grown as current law grows
 * it, or grown with an inflation index. A reform value otherwise replaces
 * current law's indexing and holds still.
 */
export default function GrowthControl({ year, value, options, onChange }: GrowthControlProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
        paddingTop: spacing.sm,
        borderTop: `1px solid ${colors.border.light}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          <IconTrendingUp size={16} aria-hidden style={{ color: colors.text.tertiary }} />
          After {year}
        </span>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            aria-label={`After ${year}`}
            size="sm"
            className="tw:w-auto tw:cursor-pointer tw:bg-white tw:hover:border-primary-500"
            style={{ fontFamily: typography.fontFamily.primary }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="tw:cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
        {hint(value, options)}
      </span>
    </div>
  );
}
