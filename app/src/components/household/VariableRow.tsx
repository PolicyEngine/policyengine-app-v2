/**
 * VariableRow - Reusable row for displaying a variable with label and input
 */

import { IconX } from '@tabler/icons-react';
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import { Household } from '@/types/ingredients/Household';
import { VariableInfo } from '@/utils/VariableResolver';
import VariableInput from './VariableInput';

export interface VariableRowProps {
  variable: VariableInfo;
  household: Household;
  metadata: any;
  year: string;
  entityName?: string;
  onChange: (household: Household) => void;
  onRemove?: () => void;
  disabled?: boolean;
  /** Reserve space for remove button column (for alignment with removable rows) */
  showRemoveColumn?: boolean;
}

/**
 * Sentence case label for display (capitalize first letter only)
 */
function sentenceCaseLabel(label: string): string {
  if (!label) {
    return '';
  }

  const firstLetter = label.charAt(0).toUpperCase();
  const remainingText = label.slice(1).toLowerCase();

  return firstLetter + remainingText;
}

// Fixed width for remove button column (matches ActionIcon size="sm")
const REMOVE_COLUMN_WIDTH = 22;

export default function VariableRow({
  variable,
  household,
  metadata,
  year,
  entityName,
  onChange,
  onRemove,
  disabled = false,
  showRemoveColumn = false,
}: VariableRowProps) {
  const shouldShowColumn = onRemove || showRemoveColumn;

  return (
    <Group gap="xs" align="center" wrap="nowrap">
      <Box style={{ flex: 1 }}>
        <Text size="sm">{sentenceCaseLabel(variable.label)}</Text>
      </Box>
      <Box style={{ flex: 1 }}>
        <VariableInput
          variable={{ ...variable, label: '' }}
          household={household}
          metadata={metadata}
          year={year}
          entityName={entityName}
          onChange={onChange}
          disabled={disabled}
        />
      </Box>
      {shouldShowColumn && (
        <Box style={{ width: REMOVE_COLUMN_WIDTH }}>
          {onRemove && (
            <Tooltip label="Remove variable">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={onRemove}
                disabled={disabled}
              >
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Box>
      )}
    </Group>
  );
}
