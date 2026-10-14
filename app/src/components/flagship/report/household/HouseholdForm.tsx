import { useId, type ReactNode } from 'react';
import { STATE_NAMES } from '@/api/billFeed';
import {
  Button,
  Input,
  Label,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  DEFAULT_CHILD_AGE,
  isValidHouseholdInput,
  MAX_CHILD_AGE,
  MAX_CHILDREN,
  type FlagshipHouseholdInput,
} from '@/libs/flagship/householdRun';

const STATES = Object.entries(STATE_NAMES).sort(([, a], [, b]) => a.localeCompare(b));
const CHILD_COUNTS = Array.from({ length: MAX_CHILDREN + 1 }, (_, count) => String(count));

/** A number typed into a field; an empty or partial entry is no number. */
const parseNumber = (text: string) => (text.trim() === '' ? Number.NaN : Number(text));
const shownNumber = (value: number) => (Number.isFinite(value) ? String(value) : '');

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, minWidth: 0 }}>
      <Label
        htmlFor={htmlFor}
        style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: spacing.md,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: typography.fontSize.sm,
          color: colors.text.tertiary,
        }}
      >
        $
      </span>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        // Any amount: a step would block the form on, say, $52,500.
        step="any"
        value={shownNumber(value)}
        aria-invalid={!(Number.isFinite(value) && value >= 0)}
        onChange={(event) => onChange(parseNumber(event.target.value))}
        className="tw:bg-white"
        style={{ paddingLeft: spacing['2xl'], fontVariantNumeric: 'tabular-nums' }}
      />
    </div>
  );
}

interface HouseholdFormProps {
  value: FlagshipHouseholdInput;
  onChange: (next: FlagshipHouseholdInput) => void;
  onSubmit: () => void;
  /** While the household runs, or while its result is the one on screen. */
  submitDisabled: boolean;
}

/**
 * One household in a few fields: where it lives, whether the head is
 * married, the children's ages, and what the adults earn in a year.
 */
export default function HouseholdForm({
  value,
  onChange,
  onSubmit,
  submitDisabled,
}: HouseholdFormProps) {
  const id = useId();
  const valid = isValidHouseholdInput(value);
  const update = (patch: Partial<FlagshipHouseholdInput>) => onChange({ ...value, ...patch });
  const setChildCount = (count: number) =>
    update({
      childAges: Array.from(
        { length: count },
        (_, index) => value.childAges[index] ?? DEFAULT_CHILD_AGE
      ),
    });

  return (
    <form
      aria-label="Describe a household"
      // The household's own check decides; the browser's would differ from it.
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && !submitDisabled) {
          onSubmit();
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: spacing.lg,
          alignItems: 'end',
        }}
      >
        <Field label="State" htmlFor={`${id}-state`}>
          <Select value={value.state} onValueChange={(state) => update({ state })}>
            <SelectTrigger
              id={`${id}-state`}
              className="tw:cursor-pointer tw:bg-white tw:hover:border-primary-500"
              style={{ fontFamily: typography.fontFamily.primary }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="tw:max-h-72">
              {STATES.map(([code, name]) => (
                <SelectItem key={code} value={code} className="tw:cursor-pointer">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <span
            id={`${id}-marital`}
            style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
          >
            Marital status
          </span>
          <div role="group" aria-labelledby={`${id}-marital`}>
            <SegmentedControl
              animated
              value={value.married ? 'married' : 'single'}
              onValueChange={(next) => update({ married: next === 'married' })}
              options={[
                { value: 'single', label: 'Single' },
                { value: 'married', label: 'Married' },
              ]}
            />
          </div>
        </div>
        <Field label="Children" htmlFor={`${id}-children`}>
          <Select
            value={String(value.childAges.length)}
            onValueChange={(count) => setChildCount(Number(count))}
          >
            <SelectTrigger
              id={`${id}-children`}
              className="tw:cursor-pointer tw:bg-white tw:hover:border-primary-500"
              style={{ fontFamily: typography.fontFamily.primary }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {CHILD_COUNTS.map((count) => (
                <SelectItem key={count} value={count} className="tw:cursor-pointer">
                  {count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label={value.married ? 'Your annual earnings' : 'Annual earnings'}
          htmlFor={`${id}-earnings`}
        >
          <MoneyInput
            id={`${id}-earnings`}
            value={value.earnings}
            onChange={(earnings) => update({ earnings })}
          />
        </Field>
        {value.married && (
          <Field label="Partner's annual earnings" htmlFor={`${id}-partner`}>
            <MoneyInput
              id={`${id}-partner`}
              value={value.partnerEarnings}
              onChange={(partnerEarnings) => update({ partnerEarnings })}
            />
          </Field>
        )}
      </div>

      {value.childAges.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: spacing.md }}>
          {value.childAges.map((age, index) => (
            <Field key={index} label={`Child ${index + 1} age`} htmlFor={`${id}-child-${index}`}>
              <Input
                id={`${id}-child-${index}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_CHILD_AGE}
                step={1}
                value={shownNumber(age)}
                aria-invalid={!(Number.isInteger(age) && age >= 0 && age <= MAX_CHILD_AGE)}
                onChange={(event) =>
                  update({
                    childAges: value.childAges.map((current, position) =>
                      position === index ? parseNumber(event.target.value) : current
                    ),
                  })
                }
                className="tw:bg-white"
                style={{ width: 96, fontVariantNumeric: 'tabular-nums' }}
              />
            </Field>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}>
        <Button type="submit" size="sm" disabled={!valid || submitDisabled}>
          Calculate
        </Button>
        {!valid && (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
            Enter earnings of $0 or more and children&apos;s ages from 0 to {MAX_CHILD_AGE}.
          </span>
        )}
      </div>
    </form>
  );
}
