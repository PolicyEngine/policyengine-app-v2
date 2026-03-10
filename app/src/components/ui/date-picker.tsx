import dayjs from 'dayjs';
import * as React from 'react';
import { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  minDate?: Date | null | undefined;
  maxDate?: Date | null | undefined;
  placeholder?: string;
  displayFormat?: string;
  className?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  displayFormat = 'MMM. D, YYYY',
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const initialMonth = value ? dayjs(value) : dayjs();
  const [viewMonth, setViewMonth] = useState(initialMonth.startOf('month'));

  const displayText = value ? dayjs(value).format(displayFormat) : placeholder;

  // Generate calendar days for the current view month
  const startOfMonth = viewMonth.startOf('month');
  const endOfMonth = viewMonth.endOf('month');
  const startDay = startOfMonth.day(); // 0 = Sunday
  const daysInMonth = viewMonth.daysInMonth();

  // Build 6 rows x 7 cols grid
  const calendarDays: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(startOfMonth.subtract(startDay - i, 'day'));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(viewMonth.date(i));
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push(endOfMonth.add(i, 'day'));
  }

  const handleSelect = (day: dayjs.Dayjs) => {
    onChange(day.toDate());
    setOpen(false);
  };

  const isDateDisabled = (day: dayjs.Dayjs) => {
    if (minDate && day.isBefore(dayjs(minDate), 'day')) {
      return true;
    }
    if (maxDate && day.isAfter(dayjs(maxDate), 'day')) {
      return true;
    }
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'tw:border-input tw:flex tw:h-9 tw:w-full tw:items-center tw:justify-between tw:rounded-md tw:border tw:px-3 tw:py-2 tw:text-sm tw:shadow-xs tw:transition-[color,box-shadow] tw:outline-none',
            !value && 'tw:text-muted-foreground',
            className
          )}
        >
          {displayText}
          <IconChevronRight size={14} className="tw:opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="tw:w-[280px] tw:p-3" align="start">
        {/* Month navigation */}
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setViewMonth((m) => m.subtract(1, 'month'))}
          >
            <IconChevronLeft size={14} />
          </Button>
          <span className="tw:text-sm tw:font-medium">{viewMonth.format('MMMM YYYY')}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setViewMonth((m) => m.add(1, 'month'))}
          >
            <IconChevronRight size={14} />
          </Button>
        </div>
        {/* Day of week headers */}
        <div className="tw:grid tw:grid-cols-7 tw:gap-0 tw:mb-1">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="tw:h-8 tw:flex tw:items-center tw:justify-center tw:text-xs tw:text-muted-foreground tw:font-medium"
            >
              {d}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="tw:grid tw:grid-cols-7 tw:gap-0">
          {calendarDays.map((day, i) => {
            if (!day) {
              return <div key={i} />;
            }
            const isCurrentMonth = day.month() === viewMonth.month();
            const isSelected = value && day.isSame(dayjs(value), 'day');
            const isDisabled = isDateDisabled(day);
            const isToday = day.isSame(dayjs(), 'day');

            return (
              <button
                key={i}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelect(day)}
                className={cn(
                  'tw:h-8 tw:w-full tw:rounded-md tw:text-sm tw:transition-colors',
                  isSelected
                    ? 'tw:bg-primary tw:text-primary-foreground tw:font-medium'
                    : 'tw:hover:bg-accent tw:hover:text-accent-foreground',
                  !isCurrentMonth && !isSelected && 'tw:text-muted-foreground',
                  isToday && !isSelected && 'tw:font-semibold',
                  isDisabled && 'tw:opacity-30 tw:pointer-events-none'
                )}
              >
                {day.date()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
export type { DatePickerProps };
