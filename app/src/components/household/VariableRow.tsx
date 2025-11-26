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
}

/**
 * Capitalize label for display
 */
function capitalizeLabel(label: string): string {
  return label
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function VariableRow({
  variable,
  household,
  metadata,
  year,
  entityName,
  onChange,
  onRemove,
  disabled = false,
}: VariableRowProps) {
  return (
    <Group gap="xs" align="center" wrap="nowrap">
      <Box style={{ minWidth: 180, maxWidth: 180 }}>
        <Text size="sm" lineClamp={2}>
          {capitalizeLabel(variable.label)}
        </Text>
      </Box>
      <Box style={{ flex: 1, minWidth: 120 }}>
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
      {onRemove && (
        <Tooltip label="Remove variable">
          <ActionIcon size="lg" variant="default" onClick={onRemove} disabled={disabled}>
            <IconX size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
