"use client";
import * as React from 'react';
import { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface YearPickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  minDate?: Date | null | undefined;
  maxDate?: Date | null | undefined;
  placeholder?: string;
  className?: string;
}

function YearPicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select year',
  className,
}: YearPickerProps) {
  const [open, setOpen] = useState(false);
  const currentYear = value ? value.getFullYear() : new Date().getFullYear();
  const [decadeStart, setDecadeStart] = useState(Math.floor(currentYear / 10) * 10);

  const minYear = minDate ? minDate.getFullYear() : 1900;
  const maxYear = maxDate ? maxDate.getFullYear() : 2100;

  const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);

  const handleSelect = (year: number) => {
    onChange(new Date(year, 0, 1));
    setOpen(false);
  };

  const displayText = value ? value.getFullYear().toString() : placeholder;

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
        {/* Decade navigation */}
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setDecadeStart((d) => d - 10)}
            disabled={decadeStart - 10 + 11 < minYear}
          >
            <IconChevronLeft size={14} />
          </Button>
          <span className="tw:text-sm tw:font-medium">
            {decadeStart} – {decadeStart + 9}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setDecadeStart((d) => d + 10)}
            disabled={decadeStart + 10 > maxYear}
          >
            <IconChevronRight size={14} />
          </Button>
        </div>
        {/* Year grid */}
        <div className="tw:grid tw:grid-cols-3 tw:gap-1">
          {years.map((year) => {
            const isSelected = value && value.getFullYear() === year;
            const isDisabled = year < minYear || year > maxYear;
            const isOutOfDecade = year < decadeStart || year > decadeStart + 9;
            return (
              <button
                key={year}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelect(year)}
                className={cn(
                  'tw:h-9 tw:rounded-md tw:text-sm tw:transition-colors',
                  isSelected
                    ? 'tw:bg-primary tw:text-primary-foreground tw:font-medium'
                    : 'tw:hover:bg-accent tw:hover:text-accent-foreground',
                  isOutOfDecade && !isSelected && 'tw:text-muted-foreground',
                  isDisabled && 'tw:opacity-30 tw:pointer-events-none'
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { YearPicker };
export type { YearPickerProps };
