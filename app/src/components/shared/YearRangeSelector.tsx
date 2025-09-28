import { useState } from 'react';
import { Group, TextInput, Stack, Text, ActionIcon, Select } from '@mantine/core';
import { IconCalendar, IconDots } from '@tabler/icons-react';

interface YearRangeSelectorProps {
  startValue: string;
  endValue?: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string | undefined) => void;
  children?: React.ReactNode; // For the value input area
}

export default function YearRangeSelector({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  children,
}: YearRangeSelectorProps) {
  const [mode, setMode] = useState<'year' | 'date'>('year');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - 5 + i).toString()
  );

  const handleToggleMode = () => {
    setMode(mode === 'year' ? 'date' : 'year');
    // Reset values to year format if switching back
    if (mode === 'date') {
      const year = startValue.split('-')[0];
      if (year) onStartChange(year);
      if (endValue) {
        const endYear = endValue.split('-')[0];
        if (endYear) onEndChange(endYear);
      }
    }
  };

  if (mode === 'year') {
    return (
      <Stack gap="md">
        <Group align="end" style={{ gap: '16px' }} wrap="nowrap">
          <Stack gap={4} style={{ flex: 1, minWidth: '120px' }}>
            <Text size="xs" c="dimmed">From</Text>
            <Select
              value={startValue}
              onChange={(val) => val && onStartChange(val)}
              data={years}
              placeholder="2025"
              searchable
              clearable={false}
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={handleToggleMode}
                  style={{ marginRight: '-4px' }}
                >
                  <IconCalendar size={14} />
                </ActionIcon>
              }
              styles={{
                input: {
                  paddingRight: '32px',
                }
              }}
            />
          </Stack>

          <Stack gap={4} style={{ flex: 1, minWidth: '120px' }}>
            <Text size="xs" c="dimmed">To (optional)</Text>
            <Select
              value={endValue || ''}
              onChange={(val) => onEndChange(val || undefined)}
              data={years}
              placeholder="None"
              searchable
              clearable
              styles={{
                input: {
                  paddingRight: endValue ? '24px' : '12px',
                }
              }}
            />
          </Stack>

          {children && (
            <Stack gap={4} style={{ flex: 2 }}>
              <Text size="xs" c="dimmed">Value</Text>
              {children}
            </Stack>
          )}
        </Group>
      </Stack>
    );
  }

  // Date mode
  return (
    <Stack gap="md">
      <Group align="end" style={{ gap: '16px' }} wrap="nowrap">
        <Stack gap={4} style={{ flex: 1, minWidth: '120px' }}>
          <Text size="xs" c="dimmed">From</Text>
          <TextInput
            value={startValue}
            onChange={(e) => onStartChange(e.currentTarget.value)}
            placeholder="2025-01-01"
            rightSection={
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={handleToggleMode}
                style={{ marginRight: '-4px' }}
              >
                <IconDots size={14} />
              </ActionIcon>
            }
          />
        </Stack>

        <Stack gap={4} style={{ flex: 1, minWidth: '120px' }}>
          <Text size="xs" c="dimmed">To (optional)</Text>
          <TextInput
            value={endValue || ''}
            onChange={(e) => onEndChange(e.currentTarget.value || undefined)}
            placeholder="None"
          />
        </Stack>

        {children && (
          <Stack gap={4} style={{ flex: 2 }}>
            <Text size="xs" c="dimmed">Value</Text>
            {children}
          </Stack>
        )}
      </Group>
    </Stack>
  );
}