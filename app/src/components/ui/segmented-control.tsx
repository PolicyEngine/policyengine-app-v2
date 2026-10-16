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
  /** Slide the selected highlight to the chosen option instead of jumping. Off by default. */
  animated?: boolean;
}

function SegmentedControl({
  value,
  onValueChange,
  options,
  size = 'sm',
  className,
  animated = false,
}: SegmentedControlProps) {
  const listRef = React.useRef<HTMLDivElement>(null);
  // Where the highlight sits: under the active option, measured after layout.
  const [pill, setPill] = React.useState<{ left: number; width: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!animated) {
      return;
    }
    const list = listRef.current;
    const measure = () => {
      const active = list?.querySelector<HTMLElement>('[data-state="active"]');
      if (active) {
        setPill({ left: active.offsetLeft, width: active.offsetWidth });
      }
    };
    measure();
    if (!list || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [animated, value, options.length]);

  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List
        ref={listRef}
        data-slot="segmented-control"
        className={cn(
          'tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:bg-muted',
          size === 'xs' ? 'tw:h-7 tw:p-1' : 'tw:h-9 tw:p-1',
          animated && 'tw:relative',
          className
        )}
      >
        {animated && pill && (
          <span
            aria-hidden
            className="tw:absolute tw:top-1 tw:bottom-1 tw:left-0 tw:rounded-md tw:bg-background tw:shadow-sm tw:transition-[transform,width] tw:duration-200 tw:ease-out"
            style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
          />
        )}
        {options.map((option) => (
          <TabsPrimitive.Trigger
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              'tw:inline-flex tw:h-full tw:items-center tw:justify-center tw:rounded-md tw:px-2 tw:font-medium tw:whitespace-nowrap tw:transition-all',
              'tw:text-muted-foreground tw:data-[state=active]:text-foreground',
              // The sliding highlight paints the active option; without it, the option does.
              animated
                ? 'tw:relative tw:z-[1]'
                : 'tw:data-[state=active]:bg-background tw:data-[state=active]:shadow-sm',
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
