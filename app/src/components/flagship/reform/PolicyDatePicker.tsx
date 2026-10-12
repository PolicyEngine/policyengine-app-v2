import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import {
  IconCalendarEvent,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { FOREVER } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';

export interface DatePreset {
  label: string;
  /** YYYY-MM-DD, or FOREVER for no end. */
  value: string;
}

interface PolicyDatePickerProps {
  /** "From" or "To": names the trigger for screen readers. */
  label: string;
  /** YYYY-MM-DD, or FOREVER for no end. */
  value: string;
  onChange: (value: string) => void;
  minDate: string;
  maxDate: string;
  /** The range being set, shaded on the calendar so both ends read together. */
  rangeStart: string;
  rangeEnd: string;
  /** The dates policies most often turn on, a click away. */
  presets: DatePreset[];
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = Array.from({ length: 12 }, (_, month) => dayjs().month(month).format('MMMM'));

export const formatPolicyDate = (value: string) =>
  value === FOREVER ? 'No end date' : dayjs(value).format('MMM D, YYYY');

const selectStyle: React.CSSProperties = {
  height: 28,
  padding: `0 ${spacing.xs}`,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.element,
  background: colors.background.primary,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  fontFamily: typography.fontFamily.primary,
  color: colors.text.primary,
};

const navButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: 'none',
  borderRadius: spacing.radius.element,
  background: 'transparent',
  color: colors.text.secondary,
};

/**
 * A date for a policy change. Policy dates sit years apart, so the month
 * and year are menus rather than a month-by-month walk; the range being
 * set is shaded; and the dates changes usually take — the start of a
 * year, mid-year, no end — are one click.
 */
export default function PolicyDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  rangeStart,
  rangeEnd,
  presets,
}: PolicyDatePickerProps) {
  const [open, setOpen] = useState(false);
  const anchor = value === FOREVER ? rangeStart : value;
  const [view, setView] = useState<Dayjs>(dayjs(anchor).startOf('month'));

  const min = dayjs(minDate);
  const max = dayjs(maxDate);
  const years = Array.from({ length: max.year() - min.year() + 1 }, (_, i) => min.year() + i);
  const shadeEnd = rangeEnd === FOREVER ? max : dayjs(rangeEnd);
  const start = dayjs(rangeStart);

  const first = view.startOf('month');
  const days = Array.from({ length: 42 }, (_, i) =>
    first.subtract(first.day(), 'day').add(i, 'day')
  );
  const canBack = view.isAfter(min, 'month');
  const canForward = view.isBefore(max, 'month');

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Open on the month of the date being set.
        if (next) {
          setView(dayjs(anchor).startOf('month'));
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${formatPolicyDate(value)}`}
          className="tw:cursor-pointer tw:transition-colors tw:hover:border-primary-500"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            width: '100%',
            height: 36,
            padding: `0 ${spacing.md}`,
            border: `1px solid ${open ? colors.primary[500] : colors.border.light}`,
            borderRadius: spacing.radius.container,
            background: colors.background.primary,
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.primary,
            textAlign: 'left',
          }}
        >
          <IconCalendarEvent size={16} color={colors.text.tertiary} aria-hidden />
          <span style={{ flex: 1 }}>{formatPolicyDate(value)}</span>
          <IconChevronDown size={14} color={colors.text.tertiary} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" style={{ width: 300, padding: spacing.md }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            marginBottom: spacing.sm,
          }}
        >
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canBack}
            onClick={() => setView((current) => current.subtract(1, 'month'))}
            className="tw:cursor-pointer tw:hover:bg-gray-100 tw:disabled:cursor-default tw:disabled:opacity-30"
            style={navButton}
          >
            <IconChevronLeft size={16} />
          </button>
          <select
            aria-label="Month"
            value={view.month()}
            onChange={(event) => setView((current) => current.month(Number(event.target.value)))}
            style={{ ...selectStyle, flex: 1 }}
          >
            {MONTHS.map((name, month) => (
              <option key={name} value={month}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="Year"
            value={view.year()}
            onChange={(event) => setView((current) => current.year(Number(event.target.value)))}
            style={selectStyle}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Next month"
            disabled={!canForward}
            onClick={() => setView((current) => current.add(1, 'month'))}
            className="tw:cursor-pointer tw:hover:bg-gray-100 tw:disabled:cursor-default tw:disabled:opacity-30"
            style={navButton}
          >
            <IconChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
          {WEEKDAYS.map((day) => (
            <span
              key={day}
              style={{
                padding: `${spacing.xs} 0`,
                textAlign: 'center',
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.tertiary,
              }}
            >
              {day}
            </span>
          ))}
          {days.map((day) => {
            const iso = day.format('YYYY-MM-DD');
            const inMonth = day.month() === view.month();
            const disabled = day.isBefore(min, 'day') || day.isAfter(max, 'day');
            const selected = iso === value;
            const isEnd = iso === rangeStart || iso === rangeEnd;
            const inRange = !day.isBefore(start, 'day') && !day.isAfter(shadeEnd, 'day');
            return (
              <div
                key={iso}
                // The range reads as one band across the week.
                style={{ background: inRange && inMonth ? colors.primary[50] : undefined }}
              >
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={day.format('MMMM D, YYYY')}
                  aria-pressed={selected}
                  onClick={() => choose(iso)}
                  className={selected ? undefined : 'tw:cursor-pointer tw:hover:bg-primary-100'}
                  style={{
                    width: '100%',
                    height: 32,
                    border: isEnd && !selected ? `1px solid ${colors.primary[500]}` : 'none',
                    borderRadius: spacing.radius.element,
                    background: selected ? colors.primary[600] : 'transparent',
                    fontSize: typography.fontSize.sm,
                    fontWeight: selected || isEnd ? typography.fontWeight.semibold : undefined,
                    fontFamily: typography.fontFamily.primary,
                    color: selected
                      ? colors.white
                      : !inMonth || disabled
                        ? colors.gray[300]
                        : inRange
                          ? colors.primary[800]
                          : colors.text.primary,
                    cursor: disabled ? 'default' : undefined,
                  }}
                >
                  {day.date()}
                </button>
              </div>
            );
          })}
        </div>

        {presets.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.xs,
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTop: `1px solid ${colors.border.light}`,
            }}
          >
            {presets.map((preset) => {
              const chosen = preset.value === value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => choose(preset.value)}
                  className="tw:cursor-pointer tw:transition-colors tw:hover:border-primary-500"
                  style={{
                    padding: `2px ${spacing.sm}`,
                    border: `1px solid ${chosen ? colors.primary[500] : colors.border.light}`,
                    borderRadius: 999,
                    background: chosen ? colors.primary[50] : colors.background.primary,
                    fontSize: typography.fontSize.xs,
                    fontFamily: typography.fontFamily.primary,
                    color: chosen ? colors.primary[700] : colors.text.secondary,
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
