import dayjs from 'dayjs';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { FOREVER } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import PolicyDatePicker, { DatePreset, formatPolicyDate } from './PolicyDatePicker';
import ValueGrid, { ValueGridMember } from './ValueGrid';

interface CustomDatesEditorProps {
  members: ValueGridMember[];
  parameters: ParameterMetadataCollection;
  /** The first day the report year covers, where the range starts out. */
  defaultStart: string;
  minDate: string;
  maxDate: string;
  /** What is in effect on a date: the reform's value, or current law. */
  valueOn: (path: string, date: string) => any;
  baselineOn: (path: string, date: string) => any;
  onAdd: (startDate: string, endDate: string, values: Record<string, any>) => void;
  focusedPath: string;
  onFocus: (path: string) => void;
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: spacing.xs,
  fontSize: typography.fontSize.xs,
  color: colors.text.secondary,
};

/**
 * One date range, a value for each member: a breakdown's members are
 * set over the same dates together, as the other modes set them over
 * years. Only the values typed here are added.
 */
export default function CustomDatesEditor({
  members,
  parameters,
  defaultStart,
  minDate,
  maxDate,
  valueOn,
  baselineOn,
  onAdd,
  focusedPath,
  onFocus,
}: CustomDatesEditorProps) {
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(dayjs(defaultStart).endOf('year').format('YYYY-MM-DD'));
  const [typed, setTyped] = useState<Record<string, any>>({});

  const ordered = startDate <= endDate;
  const count = Object.keys(typed).length;
  const rangeLabel =
    endDate === FOREVER
      ? `${formatPolicyDate(startDate)} onward`
      : `${formatPolicyDate(startDate)} – ${formatPolicyDate(endDate)}`;

  const changeStart = (next: string) => {
    setStartDate(next);
    // A range that would run backwards ends with its start's year instead.
    if (endDate < next) {
      setEndDate(dayjs(next).endOf('year').format('YYYY-MM-DD'));
    }
  };

  // The dates changes usually take: the start of a year, mid-year, or
  // no end at all. Only those inside the model's years are offered.
  const startYear = Number(startDate.slice(0, 4));
  const inRange = (preset: DatePreset) =>
    preset.value === FOREVER || (preset.value >= minDate && preset.value <= maxDate);
  const fromPresets = [
    { label: `Jan 1, ${startYear}`, value: `${startYear}-01-01` },
    { label: `Jul 1, ${startYear}`, value: `${startYear}-07-01` },
    { label: `Jan 1, ${startYear + 1}`, value: `${startYear + 1}-01-01` },
  ].filter(inRange);
  const yearLater = dayjs(startDate).add(1, 'year').subtract(1, 'day');
  const toPresets = [
    { label: `Dec 31, ${startYear}`, value: `${startYear}-12-31` },
    {
      label: `One year (${yearLater.format('MMM D, YYYY')})`,
      value: yearLater.format('YYYY-MM-DD'),
    },
    { label: 'No end date', value: FOREVER },
  ]
    .filter(inRange)
    .filter((preset) => preset.value >= startDate)
    // A Jan 1 start's year runs to Dec 31: offer that once.
    .filter(
      (preset, index, all) => all.findIndex((other) => other.value === preset.value) === index
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
        <div style={{ flex: '1 1 180px' }}>
          <span style={fieldLabel}>From</span>
          <PolicyDatePicker
            label="From"
            value={startDate}
            onChange={changeStart}
            minDate={minDate}
            maxDate={maxDate}
            rangeStart={startDate}
            rangeEnd={endDate}
            presets={fromPresets}
          />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <span style={fieldLabel}>To</span>
          <PolicyDatePicker
            label="To"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate}
            maxDate={maxDate}
            rangeStart={startDate}
            rangeEnd={endDate}
            presets={toPresets}
          />
        </div>
      </div>

      <ValueGrid
        members={members}
        years={[Number(startDate.slice(0, 4))]}
        headers={[rangeLabel]}
        openEnded={false}
        parameters={parameters}
        valueAt={(path) => (path in typed ? typed[path] : valueOn(path, startDate))}
        baselineAt={(path) => baselineOn(path, startDate)}
        onChange={(path, _year, value) => setTyped((current) => ({ ...current, [path]: value }))}
        focusedPath={focusedPath}
        onFocus={onFocus}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <Button
          size="sm"
          disabled={count === 0 || !ordered}
          onClick={() => {
            onAdd(startDate, endDate, typed);
            setTyped({});
          }}
        >
          Add change{members.length > 1 && count > 1 ? ` to ${count} values` : ''}
        </Button>
        {count === 0 && (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
            Type {members.length > 1 ? 'the values' : 'a value'} for these dates.
          </span>
        )}
      </div>
    </div>
  );
}
