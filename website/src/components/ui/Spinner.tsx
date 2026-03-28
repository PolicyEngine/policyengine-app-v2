import React from 'react';
import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'tw:h-4 tw:w-4',
  md: 'tw:h-8 tw:w-8',
  lg: 'tw:h-12 tw:w-12',
} as const;

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeMap;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          'tw:animate-spin tw:rounded-full tw:border-2 tw:border-current tw:border-t-transparent tw:text-primary-500',
          sizeMap[size],
          className
        )}
        {...props}
      >
        <span className="tw:sr-only">Loading...</span>
      </div>
    );
  }
);
Spinner.displayName = 'Spinner';

export { Spinner };
export type { SpinnerProps };
