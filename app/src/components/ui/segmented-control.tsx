import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

interface SegmentedControlOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedControlOption[];
  size?: 'xs' | 'sm';
  className?: string;
}

function SegmentedControl({
  value,
  onValueChange,
  options,
  size = 'sm',
  className,
}: SegmentedControlProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List
        data-slot="segmented-control"
        className={cn(
          'tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:bg-muted',
          size === 'xs' ? 'tw:h-7 tw:p-1' : 'tw:h-9 tw:p-1',
          className
        )}
      >
        {options.map((option) => (
          <TabsPrimitive.Trigger
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              'tw:inline-flex tw:h-full tw:items-center tw:justify-center tw:rounded-md tw:px-2 tw:font-medium tw:whitespace-nowrap tw:transition-all',
              'tw:text-muted-foreground tw:data-[state=active]:bg-background tw:data-[state=active]:text-foreground tw:data-[state=active]:shadow-sm',
              'tw:disabled:pointer-events-none tw:disabled:opacity-50',
              size === 'xs' ? 'tw:text-xs' : 'tw:text-sm'
            )}
          >
            {option.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}

export { SegmentedControl };
export type { SegmentedControlOption, SegmentedControlProps };
