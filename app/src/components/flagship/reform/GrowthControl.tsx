import { useState } from 'react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { Growth, GrowthRounding, GrowthTiming, RoundMode } from '@/libs/flagship/uprating';

interface GrowthControlProps {
  /** The year the value is set from */
  year: number;
  lastYear: number;
  value: Growth;
  options: Array<{ value: Growth; label: string }>;
  timing: GrowthTiming;
  /** Years a series has a level for, to offer as base years: the pop-up's choice, not the applied one */
  seriesYearsFor: (growth: Growth) => number[];
  /** The amount as the hint quotes it, e.g. "$2,500" */
  amountText: string;
  rounding: GrowthRounding;
  /** "$" or "£", for the rounding steps */
  currency: string;
  onChange: (value: Growth, timing: GrowthTiming, rounding: GrowthRounding) => void;
  /** The button alone, beside the value's start: the formula shows in the pop-up. */
  buttonOnly?: boolean;
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

interface Choice {
  value: Growth;
  timing: GrowthTiming;
  rounding: GrowthRounding;
}

/** What a choice does, as the formula it applies. */
function hint(
  { value, timing, rounding }: Choice,
  { year, options, amountText, currency }: GrowthControlProps
): string {
  if (value === 'fixed') {
    return options.some((option) => option.value === 'current_law')
      ? `Every later year keeps the ${year} value. Current law would index it.`
      : `Every later year keeps the ${year} value.`;
  }
  const rounded = roundingPhrase(rounding, currency);
  if (value === 'current_law') {
    return `From ${timing.start}, ${amountText} grows at current law's rate from ${timing.base}${rounded}.`;
  }
  const index = options.find((option) => option.value === value)?.label;
  return `From ${timing.start}: ${amountText} × ${index} that year ÷ ${index} in ${timing.base}${rounded}.`;
}

const fieldLabel: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  color: colors.text.secondary,
  whiteSpace: 'nowrap',
};

/**
 * How one value moves after its year. The grid row says what applies —
 * the formula — and a pop-up holds every choice at once: the index, from
 * which year, against which base year, and how it rounds, since each
 * changes every later value. Nothing changes until Apply, and then the
 * later years in the grid show the indexed values.
 */
export default function GrowthControl(props: GrowthControlProps) {
  const {
    year,
    lastYear,
    value,
    options,
    timing,
    seriesYearsFor,
    rounding,
    currency,
    onChange,
    buttonOnly = false,
  } = props;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Choice>({ value, timing, rounding });

  const steps = ROUND_STEPS.includes(pending.rounding.roundTo)
    ? ROUND_STEPS
    : [pending.rounding.roundTo, ...ROUND_STEPS].sort((a, b) => a - b);
  const starts = Array.from({ length: Math.max(lastYear - year, 0) }, (_, i) => year + 1 + i);
  const bases = seriesYearsFor(pending.value).filter(
    (candidate) => candidate < pending.timing.start && candidate >= year - 10
  );
  const indexed = value !== 'fixed';

  const openWith = (next: boolean) => {
    // Each opening starts from what applies now.
    if (next) {
      setPending({ value, timing, rounding });
    }
    setOpen(next);
  };

  const apply = () => {
    onChange(pending.value, pending.timing, pending.rounding);
    setOpen(false);
  };

  return (
    // The formula on the left, its edit on the right of the same row.
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md }}>
      {!buttonOnly && (
        <span
          style={{
            flex: '1 1 260px',
            minWidth: 0,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.relaxed,
            color: colors.text.secondary,
          }}
        >
          {hint({ value, timing, rounding }, props)}
        </span>
      )}
      <Popover open={open} onOpenChange={openWith}>
        <PopoverTrigger asChild>
          <Button
            size={buttonOnly ? 'default' : 'sm'}
            variant="outline"
            style={{ flexShrink: 0, marginLeft: buttonOnly ? undefined : 'auto' }}
          >
            {indexed ? 'Edit indexing' : 'Add indexing'}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label="Indexing"
          style={{ width: 360, padding: spacing.lg, fontFamily: typography.fontFamily.primary }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              Indexing
            </span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                alignItems: 'center',
                columnGap: spacing.md,
                rowGap: spacing.sm,
              }}
            >
              <span style={fieldLabel}>Grow with</span>
              <div>
                <MiniSelect
                  label="Indexing"
                  value={pending.value}
                  options={options}
                  onChange={(next) => setPending((current) => ({ ...current, value: next }))}
                />
              </div>
              {pending.value !== 'fixed' && starts.length > 0 && (
                <>
                  <span style={fieldLabel}>Starting</span>
                  <div>
                    <MiniSelect
                      label="Indexing starts"
                      value={String(pending.timing.start)}
                      options={starts.map((start) => ({
                        value: String(start),
                        label: String(start),
                      }))}
                      // A later start keeps its base before it.
                      onChange={(next) =>
                        setPending((current) => ({
                          ...current,
                          timing: {
                            start: Number(next),
                            base: Math.min(current.timing.base, Number(next) - 1),
                          },
                        }))
                      }
                    />
                  </div>
                  {bases.length > 0 && (
                    <>
                      <span style={fieldLabel}>Base year</span>
                      <div>
                        <MiniSelect
                          label="Base year"
                          value={String(pending.timing.base)}
                          options={bases.map((base) => ({
                            value: String(base),
                            label: String(base),
                          }))}
                          onChange={(next) =>
                            setPending((current) => ({
                              ...current,
                              timing: { ...current.timing, base: Number(next) },
                            }))
                          }
                        />
                      </div>
                    </>
                  )}
                  <span style={fieldLabel}>Rounding</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                    <MiniSelect
                      label="Rounding"
                      value={pending.rounding.round}
                      options={ROUND_MODES}
                      onChange={(next) =>
                        setPending((current) => ({
                          ...current,
                          rounding: { ...current.rounding, round: next as RoundMode },
                        }))
                      }
                    />
                    <MiniSelect
                      label="Rounding step"
                      value={String(pending.rounding.roundTo)}
                      options={steps.map((step) => ({
                        value: String(step),
                        label: money(currency, step),
                      }))}
                      onChange={(next) =>
                        setPending((current) => ({
                          ...current,
                          rounding: { ...current.rounding, roundTo: Number(next) },
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </div>
            <span
              style={{
                fontSize: typography.fontSize.xs,
                lineHeight: typography.lineHeight.relaxed,
                color: colors.text.tertiary,
              }}
            >
              {hint(pending, props)}
            </span>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.sm }}>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={apply}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
