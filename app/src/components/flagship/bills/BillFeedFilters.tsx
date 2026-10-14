import { useMemo } from 'react';
import { STATE_NAMES, type TrackedBill } from '@/api/billFeed';
import ScopePicker, { type ScopeOption } from '@/components/flagship/ScopePicker';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui';
import { stateBillCounts, type BillFilters } from '@/libs/flagship/billFilters';
import { BILL_STAGE_LABELS, billStage } from '@/libs/flagship/billStage';

const LEVEL_OPTIONS: SegmentedControlOption[] = [
  { value: 'all', label: 'All' },
  { value: 'federal', label: 'Federal' },
  { value: 'state', label: 'State' },
];

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
 * The bill feed's filters in one row: level (all, federal, state), one
 * state once the level is state, and stage (all, enacted, proposed —
 * and failed, when the feed holds a bill that failed).
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
    const options: SegmentedControlOption[] = [
      { value: 'all', label: 'All' },
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
      <div role="group" aria-label="Level">
        <SegmentedControl
          value={value.level}
          onValueChange={(level) =>
            // A new level starts from all its states.
            onChange({ ...value, level: level as BillFilters['level'], state: 'all' })
          }
          options={LEVEL_OPTIONS}
        />
      </div>
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
      <div role="group" aria-label="Stage">
        <SegmentedControl
          value={value.stage}
          onValueChange={(stage) => onChange({ ...value, stage: stage as BillFilters['stage'] })}
          options={stageOptions}
        />
      </div>
    </div>
  );
}
