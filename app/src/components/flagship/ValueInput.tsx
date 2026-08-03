import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface ValueInputProps {
  value: any;
  onChange: (value: any) => void;
  ariaLabel: string;
}

/**
 * Inline editor for a parameter value: numeric input for numbers,
 * on/off toggle for booleans. Shared by the draft preview card and the
 * amendable reform rows in Library.
 */
export default function ValueInput({ value, onChange, ariaLabel }: ValueInputProps) {
  if (typeof value === 'boolean') {
    return (
      <Button variant="outline" size="sm" onClick={() => onChange(!value)} aria-label={ariaLabel}>
        {value ? 'on' : 'off'}
      </Button>
    );
  }

  return (
    <input
      type="number"
      step="any"
      value={value ?? ''}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
      style={{
        width: 110,
        padding: `${spacing.xs} ${spacing.sm}`,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 6,
        fontSize: typography.fontSize.sm,
        fontFamily: typography.fontFamily.primary,
        textAlign: 'right',
      }}
    />
  );
}
