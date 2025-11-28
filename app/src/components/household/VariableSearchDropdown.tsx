/**
 * VariableSearchDropdown - Search input with dropdown results for adding variables
 */

import { useMemo } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { Box, Group, Stack, Text, TextInput } from '@mantine/core';
import { colors } from '@/designTokens';
import { VariableInfo } from '@/utils/VariableResolver';

export interface VariableSearchDropdownProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  filteredVariables: VariableInfo[];
  onSelect: (variable: VariableInfo) => void;
  /** Function to get entity hint for a variable (e.g., "Person" or "Household") */
  getEntityHint?: (variable: VariableInfo) => { show: boolean; label: string } | null;
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
  getEntityHint,
  disabled = false,
  placeholder = 'Search for a variable...',
}: VariableSearchDropdownProps) {
  // Sort so matching-context variables appear first (could extract to arrayUtils if reused)
  const sortedVariables = useMemo(() => {
    if (!getEntityHint) {
      return filteredVariables;
    }
    const matching: VariableInfo[] = [];
    const different: VariableInfo[] = [];
    for (const v of filteredVariables) {
      if (getEntityHint(v)?.show) {
        different.push(v);
      } else {
        matching.push(v);
      }
    }
    return [...matching, ...different];
  }, [filteredVariables, getEntityHint]);

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
          {sortedVariables.length > 0 ? (
            <Stack gap={0}>
              {sortedVariables.map((variable) => {
                const entityHint = getEntityHint?.(variable);
                return (
                  <Box
                    key={variable.name}
                    p="sm"
                    onMouseDown={() => onSelect(variable)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: `1px solid ${colors.gray[300]}`,
                    }}
                  >
                    <Group gap="xs" justify="space-between">
                      <Text size="sm">{variable.label}</Text>
                      {entityHint?.show && (
                        <Text size="xs" c="dimmed" fs="italic">
                          {entityHint.label}
                        </Text>
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
