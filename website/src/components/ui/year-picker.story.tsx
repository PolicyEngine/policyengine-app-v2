"use client";
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { YearPicker } from './year-picker';

const meta: Meta<typeof YearPicker> = {
  title: 'UI/YearPicker',
  component: YearPicker,
  decorators: [
    (Story) => (
      <div style={{ padding: 24, maxWidth: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof YearPicker>;

function ControlledYearPicker({
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
    <YearPicker
      value={value}
      onChange={setValue}
      minDate={minDate}
      maxDate={maxDate}
      placeholder="Select year"
    />
  );
}

export const Empty: Story = {
  render: () => <ControlledYearPicker />,
};

export const WithValue: Story = {
  render: () => <ControlledYearPicker initialValue={new Date(2026, 0, 1)} />,
};

export const WithRange: Story = {
  render: () => (
    <ControlledYearPicker
      initialValue={new Date(2025, 0, 1)}
      minDate={new Date(2020, 0, 1)}
      maxDate={new Date(2030, 0, 1)}
    />
  ),
};
