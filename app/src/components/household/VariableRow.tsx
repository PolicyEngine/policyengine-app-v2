/**
 * VariableRow - Reusable row for displaying a variable with label and input
 */

import { IconX } from '@tabler/icons-react';
import { Button, Text, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
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

// Fixed width and height for remove button column (matches ActionIcon size="sm")
const REMOVE_COLUMN_SIDE = 22;

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
    <div className="tw:flex tw:items-center tw:gap-1 tw:flex-nowrap">
      <div className="tw:flex-1">
        <Text size="sm">{sentenceCaseLabel(variable.label)}</Text>
      </div>
      <div className="tw:flex-1">
        <VariableInput
          variable={{ ...variable, label: '' }}
          household={household}
          metadata={metadata}
          year={year}
          entityName={entityName}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
      {shouldShowColumn && (
        <div style={{ width: REMOVE_COLUMN_SIDE, height: REMOVE_COLUMN_SIDE }}>
          {onRemove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  disabled={disabled}
                  style={{ width: REMOVE_COLUMN_SIDE, height: REMOVE_COLUMN_SIDE }}
                  className="tw:p-0"
                >
                  <IconX size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove variable</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
