/**
 * EditableLabel - Shared component for inline editable labels
 *
 * Used by PolicyCreationModal and PopulationStatusHeader for consistent
 * name editing behavior with auto-sizing input and checkmark confirmation.
 */

import { useLayoutEffect, useState } from 'react';
import { IconCheck, IconPencil } from '@tabler/icons-react';
import { Button, Input, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES } from '../constants';

interface EditableLabelProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyStateText?: string;
  textColor?: string;
  emptyTextColor?: string;
  readOnly?: boolean;
}

export function EditableLabel({
  value,
  onChange,
  placeholder,
  emptyStateText,
  textColor = colors.gray[800],
  emptyTextColor = colors.gray[400],
  readOnly = false,
}: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Sync inputValue with value prop when not editing
  useLayoutEffect(() => {
    if (!isEditing) {
      setInputValue(value);
    }
  }, [value, isEditing]);

  const handleSubmit = () => {
    onChange(inputValue);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setInputValue(value);
    setIsEditing(true);
  };

  const displayText = value || emptyStateText || placeholder;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, minWidth: 0, flex: 1 }}>
      {isEditing && !readOnly ? (
        <>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
              if (e.key === 'Escape') {
                setInputValue(value);
                setIsEditing(false);
              }
            }}
            autoFocus
            onBlur={handleSubmit}
            placeholder={placeholder}
            className="tw:border-none tw:bg-transparent tw:p-0 tw:h-auto tw:shadow-none tw:focus-visible:ring-0"
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: typography.fontFamily.primary,
              fontWeight: 600,
              fontSize: FONT_SIZES.normal,
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSubmit}
            aria-label="Confirm name"
            className="tw:text-teal-600"
            style={{ flexShrink: 0 }}
          >
            <IconCheck size={14} />
          </Button>
        </>
      ) : (
        <>
          <Text
            fw={600}
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.normal,
              color: value ? textColor : emptyTextColor,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginRight: 8,
              cursor: readOnly ? 'default' : 'pointer',
            }}
            onClick={readOnly ? undefined : handleStartEditing}
          >
            {displayText}
          </Text>
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleStartEditing}
              style={{ flexShrink: 0 }}
            >
              <IconPencil size={14} />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
