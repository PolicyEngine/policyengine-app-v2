import React from 'react';
import { cn } from '@/lib/utils';

const gapMap = {
  xs: 'tw:gap-1',
  sm: 'tw:gap-2',
  md: 'tw:gap-3',
  lg: 'tw:gap-4',
  xl: 'tw:gap-5',
  '2xl': 'tw:gap-6',
  '3xl': 'tw:gap-8',
  '4xl': 'tw:gap-12',
  '5xl': 'tw:gap-16',
} as const;

const alignMap = {
  start: 'tw:items-start',
  center: 'tw:items-center',
  end: 'tw:items-end',
  stretch: 'tw:items-stretch',
} as const;

const justifyMap = {
  start: 'tw:justify-start',
  center: 'tw:justify-center',
  end: 'tw:justify-end',
  'space-between': 'tw:justify-between',
  'space-around': 'tw:justify-around',
} as const;

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: keyof typeof gapMap;
  align?: keyof typeof alignMap;
  justify?: keyof typeof justifyMap;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap = 'md', align, justify, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'tw:flex tw:flex-col',
          gapMap[gap],
          align && alignMap[align],
          justify && justifyMap[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Stack.displayName = 'Stack';

export { Stack };
export type { StackProps };
