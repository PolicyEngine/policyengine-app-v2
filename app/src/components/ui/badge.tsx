import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-transparent tw:px-2 tw:py-0.5 tw:text-xs tw:font-medium tw:w-fit tw:whitespace-nowrap tw:shrink-0 tw:[&>svg]:size-3 tw:gap-1 tw:[&>svg]:pointer-events-none tw:focus-visible:border-ring tw:focus-visible:ring-ring/50 tw:focus-visible:ring-[3px] tw:aria-invalid:ring-destructive/20 tw:aria-invalid:border-destructive tw:transition-[color,box-shadow] tw:overflow-hidden',
  {
    variants: {
      variant: {
        default: 'tw:bg-primary tw:text-primary-foreground tw:[a&]:hover:bg-primary/90',
        secondary: 'tw:bg-secondary tw:text-secondary-foreground tw:[a&]:hover:bg-secondary/90',
        destructive:
          'tw:bg-destructive tw:text-white tw:[a&]:hover:bg-destructive/90 tw:focus-visible:ring-destructive/20',
        outline:
          'tw:border-border tw:text-foreground tw:[a&]:hover:bg-accent tw:[a&]:hover:text-accent-foreground',
        ghost: 'tw:[a&]:hover:bg-accent tw:[a&]:hover:text-accent-foreground',
        link: 'tw:text-primary tw:underline-offset-4 tw:[a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
