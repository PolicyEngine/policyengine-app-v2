/**
 * VariableSearchDropdown - Search input with dropdown results for adding variables
 * Uses Mantine Combobox for canonical dropdown behavior
 */

import { useEffect, useMemo } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Center,
  Combobox,
  Group,
  InputBase,
  Loader,
  Text,
  Tooltip,
  useCombobox,
} from '@mantine/core';
import { VariableInfo } from '@/utils/VariableResolver';

export interface VariableSearchDropdownProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFocusChange: (focused: boolean) => void;
  filteredVariables: VariableInfo[];
  onSelect: (variable: VariableInfo) => void;
  /** Function to get entity hint for a variable (e.g., "Person" or "Household") */
  getEntityHint?: (variable: VariableInfo) => { show: boolean; label: string } | null;
  disabled?: boolean;
  placeholder?: string;
  /** Show loading spinner in dropdown */
  loading?: boolean;
  /** Called when user clicks the X button to close the dropdown entirely */
  onClose?: () => void;
}

// Fixed width for close button column (matches VariableRow's REMOVE_COLUMN_WIDTH)
const CLOSE_COLUMN_WIDTH = 22;

export default function VariableSearchDropdown({
  searchValue,
  onSearchChange,
  onFocusChange,
  filteredVariables,
  onSelect,
  getEntityHint,
  disabled = false,
  placeholder = 'Search for a variable...',
  loading = false,
  onClose,
}: VariableSearchDropdownProps) {
  const combobox = useCombobox(
    {
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      onFocusChange(false);
    },
    onDropdownOpen: () => {
      onFocusChange(true);
    },
  }
    );

  // Sort so matching-context variables appear first
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

  // Update selected option index when filtered list changes
  useEffect(() => {
    combobox.updateSelectedOptionIndex();
  }, [sortedVariables, combobox]);

  const handleOptionSubmit = (value: string) => {
    const variable = sortedVariables.find((v) => v.name === value);
    if (variable) {
      onSelect(variable);
    }
    combobox.closeDropdown();
  };

  const handleClose = () => {
    combobox.closeDropdown();
    onClose?.();
  };

  const options = sortedVariables.map((variable) => {
    const entityHint = getEntityHint?.(variable);
    return (
      <Combobox.Option value={variable.name} key={variable.name}>
        <Group gap="xs" justify="space-between" wrap="nowrap">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" truncate>
              {variable.label}
            </Text>
            {variable.documentation && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {variable.documentation}
              </Text>
            )}
          </div>
          {entityHint?.show && (
            <Text size="xs" c="dimmed" fs="italic" style={{ flexShrink: 0 }}>
              {entityHint.label}
            </Text>
          )}
        </Group>
      </Combobox.Option>
    );
  });

  return (
    <Group gap="xs" align="center" wrap="nowrap">
      <Box style={{ flex: 1 }}>
        <Combobox
          store={combobox}
          onOptionSubmit={handleOptionSubmit}
          withinPortal={false}
        >
          <Combobox.Target>
            <InputBase
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => {
                onSearchChange(e.currentTarget.value);
                combobox.updateSelectedOptionIndex();
              }}
              onClick={() => {
                combobox.openDropdown()
              }}
              onFocus={() => combobox.openDropdown()}
              onBlur={() => {
                combobox.closeDropdown()
              }}
              leftSection={<IconSearch size={16} />}
              rightSection={<Combobox.Chevron />}
              rightSectionPointerEvents="none"
              disabled={disabled}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClose();
                }
              }}
            />
          </Combobox.Target>

          <Combobox.Dropdown>
            <Combobox.Options mah={200} style={{ overflowY: 'auto' }}>
              {loading ? (
                <Center p="md">
                  <Loader size="sm" />
                </Center>
              ) : options.length > 0 ? (
                options
              ) : (
                <Combobox.Empty>No variables found</Combobox.Empty>
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      </Box>
      {onClose && (
        <Box style={{ width: CLOSE_COLUMN_WIDTH }}>
          <Tooltip label="Cancel">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={handleClose}
              disabled={disabled}
              style={{ height: 22 }}
            >
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Box>
      )}
    </Group>
  );
}
