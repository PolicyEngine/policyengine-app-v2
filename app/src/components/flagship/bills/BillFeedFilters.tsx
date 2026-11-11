import { useMemo } from 'react';
import { STATE_NAMES, type TrackedBill } from '@/api/billFeed';
import ScopePicker, { type ScopeOption } from '@/components/flagship/ScopePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { stateBillCounts, type BillFilters } from '@/libs/flagship/billFilters';
import { BILL_STAGE_LABELS, billStage } from '@/libs/flagship/billStage';

interface FilterOption {
  value: string;
  label: string;
}

const LEVEL_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All levels' },
  { value: 'federal', label: 'Federal' },
  { value: 'state', label: 'State' },
];

/** One filter as a dropdown, at the height and border of its neighbors. */
function FilterSelect({
  label,
  value,
  options,
  onChange,
  controlStyle,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  controlStyle: React.CSSProperties;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="tw:w-auto tw:min-w-[140px] tw:cursor-pointer tw:hover:border-primary-500 tw:max-sm:min-h-10"
        style={controlStyle}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="tw:cursor-pointer tw:max-sm:min-h-10"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const ALL_STATES: ScopeOption[] = [{ code: 'all', label: 'All states' }];

interface BillFeedFiltersProps {
  /** The country's whole feed: the states and stages there are to pick. */
  bills: TrackedBill[];
  /** The bills the search leaves, which the state picker counts. */
  searched: TrackedBill[];
  value: BillFilters;
  onChange: (next: BillFilters) => void;
  /** Trigger styling shared with the neighboring search box. */
  controlStyle: React.CSSProperties;
}

/**
 * The bill feed's filters in one row, as dropdowns: level (all, federal,
 * state), one state once the level is state, and stage (all, enacted,
 * proposed — and failed, when the feed holds a bill that failed).
 */
export default function BillFeedFilters({
  bills,
  searched,
  value,
  onChange,
  controlStyle,
}: BillFeedFiltersProps) {
  const states = useMemo(() => {
    const codes = new Set(bills.flatMap((bill) => (bill.state ? [bill.state.toUpperCase()] : [])));
    return [...codes]
      .map((code) => ({ code: code.toLowerCase(), label: STATE_NAMES[code] ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [bills]);

  const stageOptions = useMemo(() => {
    const options: FilterOption[] = [
      { value: 'all', label: 'All stages' },
      { value: 'enacted', label: BILL_STAGE_LABELS.enacted },
      { value: 'proposed', label: BILL_STAGE_LABELS.proposed },
    ];
    if (value.stage === 'failed' || bills.some((bill) => billStage(bill.status) === 'failed')) {
      options.push({ value: 'failed', label: BILL_STAGE_LABELS.failed });
    }
    return options;
  }, [bills, value.stage]);

  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
      <FilterSelect
        label="Level"
        value={value.level}
        options={LEVEL_OPTIONS}
        // A new level starts from all its states.
        onChange={(level) =>
          onChange({ ...value, level: level as BillFilters['level'], state: 'all' })
        }
        controlStyle={controlStyle}
      />
      {value.level === 'state' && states.length > 1 && (
        <ScopePicker
          label="State"
          value={value.state}
          onChange={(state) => onChange({ ...value, state })}
          states={states}
          scopes={ALL_STATES}
          counts={stateBillCounts(
            searched,
            value,
            states.map((state) => state.code)
          )}
          triggerStyle={controlStyle}
        />
      )}
      <FilterSelect
        label="Stage"
        value={value.stage}
        options={stageOptions}
        onChange={(stage) => onChange({ ...value, stage: stage as BillFilters['stage'] })}
        controlStyle={controlStyle}
      />
    </div>
  );
}
