/**
 * EditableLabel - Shared component for inline editable labels
 *
 * Used by PolicyCreationModal and PopulationStatusHeader for consistent
 * name editing behavior with auto-sizing input and checkmark confirmation.
 */

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
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
  fitContentWhileEditing?: boolean;
  controlOutsideField?: boolean;
  fieldStyle?: CSSProperties;
  showFieldWhenEmptyOrEditing?: boolean;
}

export function EditableLabel({
  value,
  onChange,
  placeholder,
  emptyStateText,
  textColor = colors.gray[800],
  emptyTextColor = colors.gray[400],
  readOnly = false,
  fitContentWhileEditing = false,
  controlOutsideField = false,
  fieldStyle,
  showFieldWhenEmptyOrEditing = false,
}: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [editingWidth, setEditingWidth] = useState<number | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!isEditing) {
      setInputValue(value);
      setEditingWidth(null);
    }
  }, [value, isEditing]);

  const displayText = value || emptyStateText || placeholder;

  const measureTextWidth = useMemo(
    () => (text: string) => {
      const measurementNode = measureRef.current;
      if (!measurementNode) {
        return null;
      }

      measurementNode.textContent = text || placeholder;
      return Math.ceil(measurementNode.getBoundingClientRect().width + 20);
    },
    [placeholder]
  );

  const handleSubmit = () => {
    onChange(inputValue);
    setIsEditing(false);
    setEditingWidth(null);
  };

  const handleStartEditing = () => {
    setInputValue(value);
    if (fitContentWhileEditing) {
      setEditingWidth(measureTextWidth(value || placeholder));
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setInputValue(value);
    setEditingWidth(null);
    setIsEditing(false);
  };

  const inputField = (
    <Input
      value={inputValue}
      onChange={(e) => {
        const nextValue = e.currentTarget.value;
        setInputValue(nextValue);

        if (fitContentWhileEditing) {
          const nextWidth = measureTextWidth(nextValue || placeholder);
          if (nextWidth && (!editingWidth || nextWidth > editingWidth)) {
            setEditingWidth(nextWidth);
          }
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSubmit();
        }
        if (e.key === 'Escape') {
          handleCancel();
        }
      }}
      autoFocus
      onBlur={handleSubmit}
      placeholder={placeholder}
      className="tw:border-none tw:bg-transparent tw:p-0 tw:h-auto tw:shadow-none tw:focus-visible:ring-0"
      style={{
        flex: fitContentWhileEditing ? '0 1 auto' : 1,
        minWidth: 0,
        width: fitContentWhileEditing && editingWidth ? editingWidth : undefined,
        maxWidth: '100%',
        fontFamily: typography.fontFamily.primary,
        fontWeight: 600,
        fontSize: FONT_SIZES.normal,
      }}
    />
  );

  const displayField = (
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
  );

  const controlButton =
    isEditing && !readOnly ? (
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
    ) : !readOnly ? (
      <Button variant="ghost" size="icon-sm" onClick={handleStartEditing} style={{ flexShrink: 0 }}>
        <IconPencil size={14} />
      </Button>
    ) : null;

  const shouldShowFieldChrome =
    !!fieldStyle && (!showFieldWhenEmptyOrEditing || isEditing || !value.trim());

  const fieldContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    flex: fitContentWhileEditing ? '0 1 auto' : 1,
    maxWidth: '100%',
    ...(shouldShowFieldChrome ? fieldStyle : null),
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        minWidth: 0,
        flex: fitContentWhileEditing ? '0 1 auto' : 1,
        maxWidth: '100%',
      }}
    >
      <span
        ref={measureRef}
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre',
          fontFamily: typography.fontFamily.primary,
          fontWeight: 600,
          fontSize: FONT_SIZES.normal,
          pointerEvents: 'none',
        }}
      />
      {controlOutsideField ? (
        <>
          <div style={fieldContainerStyle}>
            {isEditing && !readOnly ? inputField : displayField}
          </div>
          {controlButton}
        </>
      ) : (
        <>
          {isEditing && !readOnly ? inputField : displayField}
          {controlButton}
        </>
      )}
    </div>
  );
}
