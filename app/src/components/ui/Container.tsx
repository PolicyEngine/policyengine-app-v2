import React from 'react';
import { cn } from '@/lib/utils';

const sizeMap = {
  xs: 'tw:max-w-screen-xs',
  sm: 'tw:max-w-screen-sm',
  md: 'tw:max-w-screen-md',
  lg: 'tw:max-w-screen-lg',
  xl: 'tw:max-w-screen-xl',
} as const;

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeMap;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'tw:mx-auto tw:w-full tw:px-lg',
          size ? sizeMap[size] : 'tw:max-w-[976px]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Container.displayName = 'Container';

export { Container };
export type { ContainerProps };
