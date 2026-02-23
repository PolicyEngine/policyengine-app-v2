import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    size: {
      xs: 'tw:text-xs',
      sm: 'tw:text-sm',
      md: 'tw:text-base',
      lg: 'tw:text-lg',
      xl: 'tw:text-xl',
    },
    weight: {
      normal: 'tw:font-normal',
      medium: 'tw:font-medium',
      semibold: 'tw:font-semibold',
      bold: 'tw:font-bold',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface TextProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  span?: boolean;
  fw?: number;
  c?: string;
  component?: React.ElementType;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, size, weight, span, fw, c, component, style, children, ...props }, ref) => {
    const Component = component || (span ? 'span' : 'p');
    const fontWeightStyle = fw ? { fontWeight: fw } : undefined;
    const colorStyle = c ? { color: c } : undefined;

    return (
      <Component
        ref={ref}
        className={cn(textVariants({ size, weight }), className)}
        style={{ ...fontWeightStyle, ...colorStyle, ...style }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Text.displayName = 'Text';

export { Text, textVariants };
export type { TextProps };
