import React from 'react';
import { cn } from '@/lib/utils';

const gapMap = {
  xs: 'tw:gap-1',
  sm: 'tw:gap-2',
  md: 'tw:gap-3',
  lg: 'tw:gap-4',
  xl: 'tw:gap-5',
} as const;

const justifyMap = {
  start: 'tw:justify-start',
  center: 'tw:justify-center',
  end: 'tw:justify-end',
  'space-between': 'tw:justify-between',
  apart: 'tw:justify-between',
} as const;

const alignMap = {
  start: 'tw:items-start',
  center: 'tw:items-center',
  end: 'tw:items-end',
  stretch: 'tw:items-stretch',
} as const;

interface GroupProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: keyof typeof gapMap;
  justify?: keyof typeof justifyMap;
  align?: keyof typeof alignMap;
  wrap?: 'wrap' | 'nowrap';
  grow?: boolean;
}

const Group = React.forwardRef<HTMLDivElement, GroupProps>(
  (
    { className, gap = 'md', justify, align = 'center', wrap = 'wrap', grow, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'tw:flex tw:flex-row',
          gapMap[gap],
          justifyMap[justify ?? 'start'],
          alignMap[align],
          wrap === 'wrap' ? 'tw:flex-wrap' : 'tw:flex-nowrap',
          grow && '[&>*]:tw:flex-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Group.displayName = 'Group';

export { Group };
export type { GroupProps };
