import { useId, useState, type ReactNode } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { STATE_NAMES } from '@/api/billFeed';
import {
  Button,
  Input,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  DEFAULT_ADULT_AGE,
  DEFAULT_CHILD_AGE,
  isValidHouseholdInput,
  MAX_ADULT_AGE,
  MAX_CHILD_AGE,
  MAX_CHILDREN,
  MIN_ADULT_AGE,
  OTHER_INCOME,
  type FlagshipHouseholdInput,
  type OtherIncomeKey,
} from '@/libs/flagship/householdRun';

const STATES = Object.entries(STATE_NAMES).sort(([, a], [, b]) => a.localeCompare(b));
const CHILD_COUNTS = Array.from({ length: MAX_CHILDREN + 1 }, (_, count) => String(count));

/** A number typed into a field; an empty or partial entry is no number. */
const parseNumber = (text: string) => (text.trim() === '' ? Number.NaN : Number(text));
const shownNumber = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) ? String(value) : '';
/** An optional amount: empty is none, not zero. */
const parseOptional = (text: string) => (text.trim() === '' ? undefined : Number(text));

const LABEL_STYLE: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  color: colors.text.secondary,
  lineHeight: '16px',
};

const SECTION_TITLE: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: colors.text.secondary,
};

type Person = { who: 'head' | 'partner'; label: string };

/** A label over its control, every label the same height, so a row's controls line up. */
function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, minWidth: 0 }}>
      <label htmlFor={id} style={LABEL_STYLE}>
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberBox({
  id,
  value,
  onChange,
  money = false,
  min = 0,
  max,
  invalid,
  ariaLabel,
  placeholder,
}: {
  id: string;
  value: number | undefined;
  onChange: (text: string) => void;
  money?: boolean;
  min?: number;
  max?: number;
  invalid: boolean;
  ariaLabel?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      {money && (
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
      )}
      <Input
        id={id}
        type="number"
        inputMode={money ? 'decimal' : 'numeric'}
        min={min}
        max={max}
        // Any amount: a step would block the form on, say, $52,500.
        step={money ? 'any' : 1}
        value={shownNumber(value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        className="tw:h-9 tw:bg-white"
        style={{
          paddingLeft: money ? spacing['2xl'] : undefined,
          fontVariantNumeric: 'tabular-nums',
        }}
      />
    </div>
  );
}

function SelectBox({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        className="tw:h-9 tw:w-full tw:cursor-pointer tw:bg-white tw:hover:border-primary-500"
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="tw:max-h-72">
        {options.map(([option, label]) => (
          <SelectItem key={option} value={option} className="tw:cursor-pointer">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const isAmount = (value: number | undefined) =>
  value === undefined || (Number.isFinite(value) && value >= 0);
const isAdultAge = (age: number | undefined) =>
  age === undefined || (Number.isInteger(age) && age >= MIN_ADULT_AGE && age <= MAX_ADULT_AGE);

interface HouseholdFormProps {
  value: FlagshipHouseholdInput;
  onChange: (next: FlagshipHouseholdInput) => void;
  onSubmit: () => void;
  /** While the household runs, or while its result is the one on screen. */
  submitDisabled: boolean;
}

/**
 * One household: who lives in it (where, married or not, the adults' and
 * children's ages), what each adult earns, and — when asked for — their
 * other income and what the household pays in rent and child care.
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
  const hasDetails =
    Object.keys(value.otherIncome?.head ?? {}).length > 0 ||
    Object.keys(value.otherIncome?.partner ?? {}).length > 0 ||
    value.rent !== undefined ||
    value.childcare !== undefined;
  const [detailsOpen, setDetailsOpen] = useState(hasDetails);
  const setChildCount = (count: number) =>
    update({
      childAges: Array.from(
        { length: count },
        (_, index) => value.childAges[index] ?? DEFAULT_CHILD_AGE
      ),
    });
  const setOtherIncome = (who: Person['who'], key: OtherIncomeKey, text: string) => {
    const current = { ...(value.otherIncome?.[who] ?? {}) };
    const amount = parseOptional(text);
    if (amount === undefined) {
      delete current[key];
    } else {
      current[key] = amount;
    }
    update({ otherIncome: { ...value.otherIncome, [who]: current } });
  };
  const people: Person[] = value.married
    ? [
        { who: 'head', label: 'You' },
        { who: 'partner', label: 'Partner' },
      ]
    : [{ who: 'head', label: 'You' }];
  const earningsOf = (who: Person['who']) =>
    who === 'head' ? value.earnings : value.partnerEarnings;

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
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <p style={SECTION_TITLE}>Household</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))',
            gap: `${spacing.md} ${spacing.lg}`,
            alignItems: 'start',
          }}
        >
          <Field label="State" id={`${id}-state`}>
            <SelectBox
              id={`${id}-state`}
              value={value.state}
              onChange={(state) => update({ state })}
              options={STATES}
            />
          </Field>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <span id={`${id}-marital`} style={LABEL_STYLE}>
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
                className="tw:w-full"
              />
            </div>
          </div>
          <Field label="Children" id={`${id}-children`}>
            <SelectBox
              id={`${id}-children`}
              value={String(value.childAges.length)}
              onChange={(count) => setChildCount(Number(count))}
              options={CHILD_COUNTS.map((count) => [count, count])}
            />
          </Field>
          <Field label={value.married ? 'Your age' : 'Age'} id={`${id}-age`}>
            <NumberBox
              id={`${id}-age`}
              value={value.headAge ?? DEFAULT_ADULT_AGE}
              min={MIN_ADULT_AGE}
              max={MAX_ADULT_AGE}
              invalid={!isAdultAge(value.headAge)}
              onChange={(text) => update({ headAge: parseNumber(text) })}
            />
          </Field>
          {value.married && (
            <Field label="Partner's age" id={`${id}-partner-age`}>
              <NumberBox
                id={`${id}-partner-age`}
                value={value.partnerAge ?? DEFAULT_ADULT_AGE}
                min={MIN_ADULT_AGE}
                max={MAX_ADULT_AGE}
                invalid={!isAdultAge(value.partnerAge)}
                onChange={(text) => update({ partnerAge: parseNumber(text) })}
              />
            </Field>
          )}
          {value.childAges.map((age, index) => (
            <Field key={index} label={`Child ${index + 1} age`} id={`${id}-child-${index}`}>
              <NumberBox
                id={`${id}-child-${index}`}
                value={age}
                max={MAX_CHILD_AGE}
                invalid={!(Number.isInteger(age) && age >= 0 && age <= MAX_CHILD_AGE)}
                onChange={(text) =>
                  update({
                    childAges: value.childAges.map((current, position) =>
                      position === index ? parseNumber(text) : current
                    ),
                  })
                }
              />
            </Field>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <p style={SECTION_TITLE}>Income, per year</p>
        <div
          role="group"
          aria-label="Income"
          style={{
            display: 'grid',
            gridTemplateColumns: `minmax(120px, 200px) repeat(${people.length}, minmax(120px, 180px))`,
            gap: `${spacing.sm} ${spacing.lg}`,
            alignItems: 'center',
          }}
        >
          <span aria-hidden />
          {people.map((person) => (
            <span key={person.who} aria-hidden style={LABEL_STYLE}>
              {person.label}
            </span>
          ))}
          <span aria-hidden style={{ fontSize: typography.fontSize.sm }}>
            Earnings
          </span>
          {people.map((person) => (
            <NumberBox
              key={person.who}
              id={`${id}-earnings-${person.who}`}
              money
              ariaLabel={`Earnings, ${person.label}`}
              value={earningsOf(person.who)}
              invalid={!(Number.isFinite(earningsOf(person.who)) && earningsOf(person.who) >= 0)}
              onChange={(text) =>
                update(
                  person.who === 'head'
                    ? { earnings: parseNumber(text) }
                    : { partnerEarnings: parseNumber(text) }
                )
              }
            />
          ))}
          {detailsOpen &&
            OTHER_INCOME.map((source) => (
              <IncomeRow key={source.key} label={source.label}>
                {people.map((person) => (
                  <NumberBox
                    key={person.who}
                    id={`${id}-${source.key}-${person.who}`}
                    money
                    placeholder="0"
                    ariaLabel={`${source.label}, ${person.label}`}
                    value={value.otherIncome?.[person.who]?.[source.key]}
                    invalid={!isAmount(value.otherIncome?.[person.who]?.[source.key])}
                    onChange={(text) => setOtherIncome(person.who, source.key, text)}
                  />
                ))}
              </IncomeRow>
            ))}
        </div>
      </div>

      {detailsOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <p style={SECTION_TITLE}>Costs, per year</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 220px))',
              gap: `${spacing.md} ${spacing.lg}`,
            }}
          >
            <Field label="Rent" id={`${id}-rent`}>
              <NumberBox
                id={`${id}-rent`}
                money
                placeholder="0"
                value={value.rent}
                invalid={!isAmount(value.rent)}
                onChange={(text) => update({ rent: parseOptional(text) })}
              />
            </Field>
            {value.childAges.length > 0 && (
              <Field label="Child care" id={`${id}-childcare`}>
                <NumberBox
                  id={`${id}-childcare`}
                  money
                  placeholder="0"
                  value={value.childcare}
                  invalid={!isAmount(value.childcare)}
                  onChange={(text) => update({ childcare: parseOptional(text) })}
                />
              </Field>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}>
        <Button type="submit" size="sm" disabled={!valid || submitDisabled}>
          Calculate
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          {detailsOpen ? 'Fewer details' : 'Add other income and costs'}
          <IconChevronDown
            size={14}
            aria-hidden
            style={{ transform: detailsOpen ? 'rotate(180deg)' : undefined }}
          />
        </Button>
        {!valid && (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
            Enter amounts of $0 or more, adults aged {MIN_ADULT_AGE} to {MAX_ADULT_AGE}, and
            children aged 0 to {MAX_CHILD_AGE}.
          </span>
        )}
      </div>
    </form>
  );
}

function IncomeRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden style={{ fontSize: typography.fontSize.sm }}>
        {label}
      </span>
      {children}
    </>
  );
}
