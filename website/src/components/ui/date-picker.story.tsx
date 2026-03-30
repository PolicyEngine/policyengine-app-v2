"use client";
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './date-picker';

const meta: Meta<typeof DatePicker> = {
  title: 'UI/DatePicker',
  component: DatePicker,
  decorators: [
    (Story) => (
      <div style={{ padding: 24, maxWidth: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

function ControlledDatePicker({
  initialValue,
  minDate,
  maxDate,
}: {
  initialValue?: Date;
  minDate?: Date;
  maxDate?: Date;
}) {
  const [value, setValue] = useState<Date | null>(initialValue ?? null);
  return (
    <DatePicker
      value={value}
      onChange={setValue}
      minDate={minDate}
      maxDate={maxDate}
      placeholder="Select date"
    />
  );
}

export const Empty: Story = {
  render: () => <ControlledDatePicker />,
};

export const WithValue: Story = {
  render: () => <ControlledDatePicker initialValue={new Date(2026, 0, 15)} />,
};

export const WithDateRange: Story = {
  render: () => (
    <ControlledDatePicker
      initialValue={new Date(2026, 5, 1)}
      minDate={new Date(2025, 0, 1)}
      maxDate={new Date(2027, 11, 31)}
    />
  ),
};
