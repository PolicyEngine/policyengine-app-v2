/**
 * VariableSearchDropdown - Search input with dropdown results for adding variables
 */

import { IconSearch } from '@tabler/icons-react';
import { Badge, Box, Group, Stack, Text, TextInput } from '@mantine/core';
import { VariableInfo } from '@/utils/VariableResolver';

export interface VariableSearchDropdownProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  filteredVariables: VariableInfo[];
  onSelect: (variable: VariableInfo) => void;
  /** Function to get badge info for a variable (label and whether to show it) */
  getBadgeInfo?: (variable: VariableInfo) => { show: boolean; label: string } | null;
  disabled?: boolean;
  placeholder?: string;
}

export default function VariableSearchDropdown({
  searchValue,
  onSearchChange,
  isFocused,
  onFocusChange,
  filteredVariables,
  onSelect,
  getBadgeInfo,
  disabled = false,
  placeholder = 'Search for a variable...',
}: VariableSearchDropdownProps) {
  return (
    <Box>
      <TextInput
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => setTimeout(() => onFocusChange(false), 200)}
        leftSection={<IconSearch size={16} />}
        disabled={disabled}
        autoFocus
      />

      {isFocused && (
        <Box
          mt="xs"
          style={{
            maxHeight: 200,
            overflow: 'auto',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          {filteredVariables.length > 0 ? (
            <Stack gap={0}>
              {filteredVariables.map((variable) => {
                const badgeInfo = getBadgeInfo?.(variable);
                return (
                  <Box
                    key={variable.name}
                    p="sm"
                    onMouseDown={() => onSelect(variable)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--mantine-color-default-border)',
                    }}
                  >
                    <Group gap="xs" justify="space-between">
                      <Text size="sm">{variable.label}</Text>
                      {badgeInfo?.show && (
                        <Badge size="xs" variant="light" color="gray">
                          {badgeInfo.label}
                        </Badge>
                      )}
                    </Group>
                    {variable.documentation && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {variable.documentation}
                      </Text>
                    )}
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" p="md" ta="center">
              No variables found
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}
