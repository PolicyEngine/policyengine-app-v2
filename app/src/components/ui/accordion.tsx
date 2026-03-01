'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('tw:border-b tw:last:border-b-0', className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="tw:flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'tw:bg-transparent tw:focus-visible:border-ring tw:focus-visible:ring-ring/50 tw:flex tw:flex-1 tw:items-start tw:justify-between tw:gap-4 tw:rounded-md tw:py-4 tw:text-left tw:text-sm tw:font-medium tw:transition-all tw:outline-none tw:hover:underline tw:focus-visible:ring-[3px] tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:[&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="tw:text-muted-foreground tw:pointer-events-none tw:size-4 tw:shrink-0 tw:translate-y-0.5 tw:transition-transform tw:duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="tw:data-[state=closed]:animate-accordion-up tw:data-[state=open]:animate-accordion-down tw:overflow-hidden tw:text-sm"
      {...props}
    >
      <div className={cn('tw:pt-0 tw:pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
