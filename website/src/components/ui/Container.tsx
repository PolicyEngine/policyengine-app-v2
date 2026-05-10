import React from 'react';
import { spacing } from '@/designTokens';
import { cn } from '@/lib/utils';

const sizeMap = {
  xs: 'tw:max-w-screen-xs',
  sm: 'tw:max-w-screen-sm',
  md: 'tw:max-w-screen-md',
  lg: 'tw:max-w-screen-lg',
  xl: 'tw:max-w-screen-xl',
  '2xl': 'tw:max-w-screen-2xl',
} as const;

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeMap;
  variant?: 'guttered';
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, variant, children, style, ...props }, ref) => {
    const gutteredStyle =
      variant === 'guttered'
        ? {
            paddingLeft: spacing.container['2xl'],
            paddingRight: spacing.container['2xl'],
            paddingTop: spacing.container.lg,
            paddingBottom: spacing.container.lg,
          }
        : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          'tw:mx-auto tw:w-full',
          variant !== 'guttered' && 'tw:px-lg',
          size ? sizeMap[size] : 'tw:max-w-[976px]',
          className
        )}
        style={{ ...gutteredStyle, ...style }}
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
