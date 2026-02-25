import React from 'react';
import { cn } from '@/lib/utils';

const orderStyles = {
  1: 'tw:text-4xl tw:font-bold',
  2: 'tw:text-3xl tw:font-bold',
  3: 'tw:text-2xl tw:font-semibold',
  4: 'tw:text-xl tw:font-semibold',
  5: 'tw:text-lg tw:font-medium',
  6: 'tw:text-base tw:font-medium',
} as const;

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  order?: 1 | 2 | 3 | 4 | 5 | 6;
}

const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
  ({ className, order = 1, children, ...props }, ref) => {
    const Component = `h${order}` as const;

    return (
      <Component
        ref={ref as React.Ref<HTMLHeadingElement>}
        className={cn(orderStyles[order], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Title.displayName = 'Title';

export { Title };
export type { TitleProps };
