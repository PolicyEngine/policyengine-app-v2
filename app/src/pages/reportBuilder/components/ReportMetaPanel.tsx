/**
 * ReportMetaPanel - Segmented breadcrumb for report title and year
 *
 * Renders as three separate segments (icon, name, year) that flow
 * directly into TopBar's flex layout via display: contents.
 */

import React, { useLayoutEffect, useState } from 'react';
import { IconCheck, IconFileDescription, IconPencil } from '@tabler/icons-react';
import { ActionIcon, Box, Select, Text, TextInput } from '@mantine/core';
import { CURRENT_YEAR } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES } from '../constants';
import type { ReportBuilderState } from '../types';

const SEGMENT_HEIGHT = 38;

const segmentBase: React.CSSProperties = {
  height: SEGMENT_HEIGHT,
  borderRadius: spacing.radius.lg,
  background: colors.white,
  border: `1px solid ${colors.primary[200]}`,
  boxShadow: `0 2px 8px ${colors.shadow.light}`,
  display: 'flex',
  alignItems: 'center',
};

interface ReportMetaPanelProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  isReadOnly?: boolean;
}

export function ReportMetaPanel({ reportState, setReportState, isReadOnly }: ReportMetaPanelProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);

  const handleLabelSubmit = () => {
    setReportState((prev) => ({ ...prev, label: labelInput || 'Untitled report' }));
    setIsEditingLabel(false);
  };

  const defaultReportLabel = 'Untitled report';

  useLayoutEffect(() => {
    if (measureRef.current && isEditingLabel) {
      const textToMeasure = labelInput || defaultReportLabel;
      measureRef.current.textContent = textToMeasure;
      setInputWidth(measureRef.current.offsetWidth);
    }
  }, [labelInput, isEditingLabel]);

  return (
    <Box style={{ display: 'contents' }}>
      {/* Icon segment */}
      <Box
        style={{
          width: SEGMENT_HEIGHT,
          height: SEGMENT_HEIGHT,
          borderRadius: spacing.radius.lg,
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
          border: `1px solid ${colors.primary[200]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconFileDescription size={20} color={colors.primary[600]} />
      </Box>

      {/* Name segment */}
      <Box
        style={{
          ...segmentBase,
          flex: 1,
          minWidth: 0,
          padding: `0 ${spacing.lg}`,
          gap: spacing.sm,
          cursor: isReadOnly ? 'default' : isEditingLabel ? 'text' : 'pointer',
          position: 'relative',
        }}
        onClick={() => {
          if (!isReadOnly && !isEditingLabel) {
            setLabelInput(reportState.label || '');
            setIsEditingLabel(true);
          }
        }}
      >
        <Text
          c={colors.primary[500]}
          fw={600}
          style={{
            fontSize: FONT_SIZES.tiny,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          Name
        </Text>

        {isEditingLabel ? (
          <>
            <span
              ref={measureRef}
              style={{
                position: 'absolute',
                visibility: 'hidden',
                whiteSpace: 'pre',
                fontFamily: typography.fontFamily.primary,
                fontWeight: 600,
                fontSize: FONT_SIZES.small,
              }}
            />
            <TextInput
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
              onBlur={handleLabelSubmit}
              placeholder={defaultReportLabel}
              size="xs"
              autoFocus
              style={{ flex: 1, minWidth: 0, width: inputWidth ? inputWidth + 8 : 'auto' }}
              styles={{
                input: {
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: 600,
                  fontSize: FONT_SIZES.small,
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  minHeight: 'auto',
                },
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
            <ActionIcon
              size="sm"
              variant="subtle"
              color="teal"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleLabelSubmit();
              }}
              aria-label="Confirm report name"
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
                fontSize: FONT_SIZES.small,
                color: colors.gray[800],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {reportState.label || defaultReportLabel}
            </Text>
            {!isReadOnly && (
              <IconPencil
                size={12}
                color={colors.gray[400]}
                style={{ flexShrink: 0, marginLeft: 'auto' }}
              />
            )}
          </>
        )}
      </Box>

      {/* Year segment */}
      <Box
        style={{
          ...segmentBase,
          padding: `0 ${spacing.md}`,
          gap: spacing.sm,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <Text
          c={colors.primary[500]}
          fw={600}
          style={{
            fontSize: FONT_SIZES.tiny,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        >
          Year
        </Text>
        <Select
          aria-label="Report year"
          value={reportState.year}
          onChange={(value) => setReportState((prev) => ({ ...prev, year: value || CURRENT_YEAR }))}
          data={['2023', '2024', '2025', '2026']}
          size="sm"
          variant="unstyled"
          withCheckIcon={false}
          disabled={isReadOnly}
          comboboxProps={{ width: 120, position: 'bottom-end' }}
          styles={{
            input: {
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.small,
              fontWeight: 500,
              color: `${colors.gray[700]}`,
              opacity: 1,
              cursor: isReadOnly ? 'default' : 'pointer',
              paddingLeft: 0,
              paddingRight: isReadOnly ? 0 : spacing.xl,
              minHeight: 'auto',
              height: 'auto',
              WebkitTextFillColor: colors.gray[700],
            },
            root: {
              width: isReadOnly ? 'auto' : 72,
            },
          }}
        />
      </Box>
    </Box>
  );
}
