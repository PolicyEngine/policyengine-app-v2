import { Switch } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface ValueInputProps {
  value: any;
  onChange: (value: any) => void;
  ariaLabel: string;
}

/**
 * Inline editor for a parameter value: numeric input for numbers, a
 * switch labelled true or false for booleans. Shared by the report's
 * adjust panel and the amendable reform rows in Library.
 */
export default function ValueInput({ value, onChange, ariaLabel }: ValueInputProps) {
  if (typeof value === 'boolean') {
    return (
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: spacing.sm,
          cursor: 'pointer',
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
        }}
      >
        <Switch checked={value} onCheckedChange={onChange} aria-label={ariaLabel} />
        {value ? 'true' : 'false'}
      </label>
    );
  }

  return (
    <input
      type="number"
      step="any"
      value={value ?? ''}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
      // On a phone: a fingertip tall, and 16px so the browser does not zoom in to type.
      className="tw:max-sm:min-h-10 tw:max-sm:text-base!"
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
