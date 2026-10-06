import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { Growth, GrowthRounding, GrowthTiming, RoundMode } from '@/libs/flagship/uprating';

interface GrowthControlProps {
  /** The year the value is set from */
  year: number;
  lastYear: number;
  value: Growth;
  options: Array<{ value: Growth; label: string }>;
  timing: GrowthTiming;
  /** Years the chosen series has a level for, to offer as base years */
  seriesYears: number[];
  /** The amount as the hint quotes it, e.g. "$2,500" */
  amountText: string;
  rounding: GrowthRounding;
  /** "$" or "£", for the rounding steps */
  currency: string;
  onChange: (value: Growth, timing: GrowthTiming, rounding: GrowthRounding) => void;
}

/** Steps laws round indexed amounts to. */
const ROUND_STEPS = [1, 5, 10, 25, 50, 100, 500, 1000, 5000];

const ROUND_MODES: Array<{ value: RoundMode; label: string }> = [
  { value: 'down', label: 'down to' },
  { value: 'nearest', label: 'to the nearest' },
  { value: 'up', label: 'up to' },
];

const money = (currency: string, step: number) =>
  `${currency}${step < 1 ? step.toFixed(2) : step.toLocaleString('en-US')}`;

function MiniSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
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
  );
}

/** ", rounded down to a multiple of $50" — or nothing, for whole units to the nearest. */
function roundingPhrase({ roundTo, round }: GrowthRounding, currency: string): string {
  if (round === 'nearest') {
    return roundTo === 1 || roundTo === 0.01 ? '' : `, to the nearest ${money(currency, roundTo)}`;
  }
  return `, rounded ${round} to a multiple of ${money(currency, roundTo)}`;
}

/** What the choice does, as the formula it applies. */
function hint(props: GrowthControlProps): string {
  const { value, options, timing, amountText, rounding, currency } = props;
  if (value === 'fixed') {
    return options.some((option) => option.value === 'current_law')
      ? 'Held at this value every year after. Current law would grow it.'
      : 'Held at this value every year after.';
  }
  const rounded = roundingPhrase(rounding, currency);
  if (value === 'current_law') {
    return `From ${timing.start}, ${amountText} grows as current law grows it from ${timing.base}${rounded}.`;
  }
  const index = options.find((option) => option.value === value)?.label.replace(/^Grows with /, '');
  return `From ${timing.start}: ${amountText} × ${index} that year ÷ ${index} in ${timing.base}${rounded}.`;
}

const words: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
  whiteSpace: 'nowrap',
};

/**
 * How one value moves after its year, set where the value is: held,
 * grown as current law grows it, or grown with an inflation index — and,
 * when it grows, from which year, how it rounds, and against which base
 * year, since each changes every later value.
 */
export default function GrowthControl(props: GrowthControlProps) {
  const { year, lastYear, value, options, timing, seriesYears, rounding, currency, onChange } =
    props;
  const steps = ROUND_STEPS.includes(rounding.roundTo)
    ? ROUND_STEPS
    : [rounding.roundTo, ...ROUND_STEPS].sort((a, b) => a - b);
  const starts = Array.from({ length: Math.max(lastYear - year, 0) }, (_, i) => year + 1 + i);
  const bases = seriesYears.filter(
    (candidate) => candidate < timing.start && candidate >= year - 10
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
        <MiniSelect
          label={`After ${year}`}
          value={value}
          options={options}
          onChange={(next) => onChange(next, timing, rounding)}
        />
        {value !== 'fixed' && starts.length > 0 && (
          <>
            <span style={words}>starting</span>
            <MiniSelect
              label="Indexing starts"
              value={String(timing.start)}
              options={starts.map((start) => ({ value: String(start), label: String(start) }))}
              // A later start keeps its base before it.
              onChange={(next) =>
                onChange(
                  value,
                  { start: Number(next), base: Math.min(timing.base, Number(next) - 1) },
                  rounding
                )
              }
            />
            <span style={words}>rounded</span>
            <MiniSelect
              label="Rounding"
              value={rounding.round}
              options={ROUND_MODES}
              onChange={(next) =>
                onChange(value, timing, { ...rounding, round: next as RoundMode })
              }
            />
            <MiniSelect
              label="Rounding step"
              value={String(rounding.roundTo)}
              options={steps.map((step) => ({ value: String(step), label: money(currency, step) }))}
              onChange={(next) => onChange(value, timing, { ...rounding, roundTo: Number(next) })}
            />
            {bases.length > 0 && (
              <>
                <span style={words}>base year</span>
                <MiniSelect
                  label="Base year"
                  value={String(timing.base)}
                  options={bases.map((base) => ({ value: String(base), label: String(base) }))}
                  onChange={(next) => onChange(value, { ...timing, base: Number(next) }, rounding)}
                />
              </>
            )}
          </>
        )}
      </div>
      <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
        {hint(props)}
      </span>
    </div>
  );
}
