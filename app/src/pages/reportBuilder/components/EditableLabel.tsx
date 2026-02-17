/**
 * EditableLabel - Shared component for inline editable labels
 *
 * Used by PolicyCreationModal and PopulationStatusHeader for consistent
 * name editing behavior with auto-sizing input and checkmark confirmation.
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { IconCheck, IconPencil } from '@tabler/icons-react';
import { ActionIcon, Box, Text, TextInput } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES } from '../constants';

interface EditableLabelProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyStateText?: string;
  textColor?: string;
  emptyTextColor?: string;
}

export function EditableLabel({
  value,
  onChange,
  placeholder,
  emptyStateText,
  textColor = colors.gray[800],
  emptyTextColor = colors.gray[400],
}: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Sync inputValue with value prop when not editing
  useLayoutEffect(() => {
    if (!isEditing) {
      setInputValue(value);
    }
  }, [value, isEditing]);

  // Measure text width for auto-sizing input
  useLayoutEffect(() => {
    if (measureRef.current && isEditing) {
      const textToMeasure = inputValue || placeholder;
      measureRef.current.textContent = textToMeasure;
      setInputWidth(measureRef.current.offsetWidth);
    }
  }, [inputValue, isEditing, placeholder]);

  const handleSubmit = () => {
    onChange(inputValue || placeholder);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setInputValue(value);
    setIsEditing(true);
  };

  const displayText = value || emptyStateText || placeholder;

  return (
    <Box style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
      {isEditing ? (
        <>
          {/* Hidden span for measuring text width */}
          <span
            ref={measureRef}
            style={{
              position: 'absolute',
              visibility: 'hidden',
              whiteSpace: 'pre',
              fontFamily: typography.fontFamily.primary,
              fontWeight: 600,
              fontSize: FONT_SIZES.normal,
            }}
          />
          <TextInput
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {handleSubmit();}
              if (e.key === 'Escape') {
                setInputValue(value);
                setIsEditing(false);
              }
            }}
            autoFocus
            onBlur={handleSubmit}
            placeholder={placeholder}
            size="xs"
            style={{ width: inputWidth ? inputWidth + 8 : 'auto' }}
            styles={{
              input: {
                fontFamily: typography.fontFamily.primary,
                fontWeight: 600,
                fontSize: FONT_SIZES.normal,
                border: 'none',
                background: 'transparent',
                padding: 0,
              },
            }}
          />
          <ActionIcon
            size="sm"
            variant="subtle"
            color="teal"
            onClick={handleSubmit}
            aria-label="Confirm name"
            style={{ flexShrink: 0 }}
          >
            <IconCheck size={14} />
          </ActionIcon>
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
              cursor: 'pointer',
            }}
            onClick={handleStartEditing}
          >
            {displayText}
          </Text>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={handleStartEditing}
            style={{ flexShrink: 0 }}
          >
            <IconPencil size={14} />
          </ActionIcon>
        </>
      )}
    </Box>
  );
}
