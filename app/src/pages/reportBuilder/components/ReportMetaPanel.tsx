/**
 * ReportMetaPanel - Floating dock for report title and year
 */

import React, { useLayoutEffect, useState } from 'react';
import {
  IconCheck,
  IconFileDescription,
  IconPencil,
} from '@tabler/icons-react';
import { ActionIcon, Box, Select, Text, TextInput } from '@mantine/core';
import { CURRENT_YEAR } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES } from '../constants';
import type { ReportBuilderState } from '../types';

interface ReportMetaPanelProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
}

export function ReportMetaPanel({
  reportState,
  setReportState,
}: ReportMetaPanelProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);

  const handleLabelSubmit = () => {
    setReportState((prev) => ({ ...prev, label: labelInput || 'Untitled report' }));
    setIsEditingLabel(false);
  };

  const defaultReportLabel = 'Untitled report';

  // Measure text width for auto-sizing input
  useLayoutEffect(() => {
    if (measureRef.current && isEditingLabel) {
      const textToMeasure = labelInput || defaultReportLabel;
      measureRef.current.textContent = textToMeasure;
      setInputWidth(measureRef.current.offsetWidth);
    }
  }, [labelInput, isEditingLabel]);

  return (
    <Box
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: spacing.radius.xl,
        border: `1px solid ${colors.border.light}`,
        boxShadow: `0 4px 24px ${colors.shadow.light}`,
        padding: `${spacing.md} ${spacing.xl}`,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Document icon */}
      <Box
        style={{
          width: 32,
          height: 32,
          borderRadius: spacing.radius.md,
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconFileDescription size={18} color={colors.primary[600]} />
      </Box>

      {/* Title with pencil icon */}
      <Box
        style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}
      >
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
                fontSize: FONT_SIZES.normal,
              }}
            />
            <TextInput
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
              placeholder={defaultReportLabel}
              size="xs"
              autoFocus
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
              onClick={handleLabelSubmit}
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
                fontSize: FONT_SIZES.normal,
                color: colors.gray[800],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginRight: 8,
              }}
            >
              {reportState.label || 'Untitled report'}
            </Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => {
                setLabelInput(reportState.label || '');
                setIsEditingLabel(true);
              }}
              aria-label="Edit report name"
              style={{ flexShrink: 0 }}
            >
              <IconPencil size={14} />
            </ActionIcon>
          </>
        )}
      </Box>

      {/* Divider */}
      <Box
        style={{
          width: '1px',
          height: '24px',
          background: colors.gray[200],
          margin: `0 ${spacing.xs}`,
          flexShrink: 0,
        }}
      />

      {/* Year selector */}
      <Select
        aria-label="Report year"
        value={reportState.year}
        onChange={(value) =>
          setReportState((prev) => ({ ...prev, year: value || CURRENT_YEAR }))
        }
        data={['2023', '2024', '2025', '2026']}
        size="xs"
        w={60}
        variant="unstyled"
        rightSection={null}
        withCheckIcon={false}
        styles={{
          input: {
            fontFamily: typography.fontFamily.primary,
            fontSize: FONT_SIZES.normal,
            fontWeight: 500,
            color: colors.gray[600],
            cursor: 'pointer',
            padding: 0,
            minHeight: 'auto',
          },
        }}
      />
    </Box>
  );
}
