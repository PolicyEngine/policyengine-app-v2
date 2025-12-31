/**
 * ReportMetaPanel - Floating dock showing report status and configuration
 */

import React, { useState } from 'react';
import {
  Box,
  Group,
  Stack,
  Text,
  TextInput,
  Select,
  ActionIcon,
} from '@mantine/core';
import {
  IconFileDescription,
  IconPencil,
  IconScale,
  IconUsers,
  IconPlayerPlay,
  IconCircleDashed,
  IconCircleCheck,
} from '@tabler/icons-react';

import { colors, spacing, typography } from '@/designTokens';
import { CURRENT_YEAR } from '@/constants';

import type { ReportBuilderState } from '../types';
import { FONT_SIZES } from '../constants';
import { ProgressDot } from './shared';

interface ReportMetaPanelProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  isReportConfigured: boolean;
}

export function ReportMetaPanel({ reportState, setReportState, isReportConfigured }: ReportMetaPanelProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');

  const handleLabelSubmit = () => {
    setReportState((prev) => ({ ...prev, label: labelInput || 'Untitled report' }));
    setIsEditingLabel(false);
  };

  // Calculate configuration progress
  const simulations = reportState.simulations;
  const baselinePolicyConfigured = !!simulations[0]?.policy?.id;
  const baselinePopulationConfigured = !!(simulations[0]?.population?.household?.id || simulations[0]?.population?.geography?.id);
  const hasReform = simulations.length > 1;
  const reformPolicyConfigured = hasReform && !!simulations[1]?.policy?.id;

  // Get labels for display
  const baselinePolicyLabel = simulations[0]?.policy?.label || null;
  const baselinePopulationLabel = simulations[0]?.population?.label ||
    (simulations[0]?.population?.household?.id ? 'Household' :
     simulations[0]?.population?.geography?.id ? 'Nationwide' : null);
  const reformPolicyLabel = hasReform ? (simulations[1]?.policy?.label || null) : null;

  // Progress steps
  const steps = [
    baselinePolicyConfigured,
    baselinePopulationConfigured,
    ...(hasReform ? [reformPolicyConfigured] : []),
  ];
  const completedSteps = steps.filter(Boolean).length;

  // Floating dock styles - matches canvas container styling
  const dockStyles = {
    container: {
      marginBottom: spacing.xl,
    },
    dock: {
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: spacing.radius.xl,
      border: `1px solid ${isReportConfigured ? colors.primary[200] : colors.border.light}`,
      boxShadow: isReportConfigured
        ? `0 8px 32px rgba(44, 122, 123, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)`
        : `0 4px 24px ${colors.shadow.light}`,
      padding: `${spacing.md} ${spacing.xl}`,
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      overflow: 'hidden',
    },
    compactRow: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      width: '100%',
    },
    expandedContent: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTop: `1px solid ${colors.gray[200]}`,
    },
    divider: {
      width: '1px',
      height: '24px',
      background: colors.gray[200],
      margin: `0 ${spacing.xs}`,
    },
    runButton: {
      background: isReportConfigured
        ? `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`
        : colors.gray[200],
      color: isReportConfigured ? 'white' : colors.gray[500],
      border: 'none',
      borderRadius: spacing.radius.lg,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontFamily: typography.fontFamily.primary,
      fontWeight: 600,
      fontSize: FONT_SIZES.normal,
      cursor: isReportConfigured ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
      transition: 'all 0.3s ease',
      boxShadow: isReportConfigured
        ? `0 4px 12px rgba(44, 122, 123, 0.3)`
        : 'none',
    },
    configRow: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.xs} 0`,
    },
    configChip: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
      padding: `${spacing.xs} ${spacing.sm}`,
      background: colors.gray[50],
      borderRadius: spacing.radius.md,
      fontFamily: typography.fontFamily.primary,
      fontSize: FONT_SIZES.small,
    },
  };

  return (
    <Box style={dockStyles.container}>
      <Box style={dockStyles.dock}>
        {/* Compact row - always visible */}
        <Box style={dockStyles.compactRow}>
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

          {/* Title with pencil icon - flexible width */}
          <Box style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            {isEditingLabel ? (
              <TextInput
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onBlur={handleLabelSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
                placeholder="Report name..."
                size="xs"
                autoFocus
                style={{ flex: 1 }}
                styles={{
                  input: {
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: 600,
                    fontSize: FONT_SIZES.normal,
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                  }
                }}
              />
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
          <Box style={{ ...dockStyles.divider, flexShrink: 0 }} />

          {/* Year selector - fixed width, no checkmark */}
          <Select
            aria-label="Report year"
            value={reportState.year}
            onChange={(value) => setReportState((prev) => ({ ...prev, year: value || CURRENT_YEAR }))}
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
              }
            }}
          />

          {/* Divider */}
          <Box style={{ ...dockStyles.divider, flexShrink: 0 }} />

          {/* Progress dots - fixed width */}
          <Group gap={6} style={{ flexShrink: 0 }}>
            {steps.map((completed, i) => (
              <ProgressDot
                key={i}
                filled={completed}
                pulsing={!completed && i === completedSteps}
              />
            ))}
          </Group>

          {/* Divider */}
          <Box style={dockStyles.divider} />

          {/* Run button */}
          <Box
            component="button"
            style={dockStyles.runButton}
            onClick={() => isReportConfigured && console.log('Run report')}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (isReportConfigured) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 6px 16px rgba(44, 122, 123, 0.4)`;
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isReportConfigured
                ? `0 4px 12px rgba(44, 122, 123, 0.3)`
                : 'none';
            }}
          >
            <IconPlayerPlay size={16} />
            <span>Run</span>
          </Box>
        </Box>

        {/* Expanded content - visible on hover */}
        <Box style={dockStyles.expandedContent}>
          <Stack gap={spacing.sm}>
            {/* Baseline row */}
            <Box style={dockStyles.configRow}>
              <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, width: 60 }}>Baseline</Text>
              <Box style={dockStyles.configChip}>
                {baselinePolicyConfigured ? (
                  <>
                    <IconScale size={12} color={colors.secondary[500]} />
                    <Text style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, color: colors.secondary[600] }}>{baselinePolicyLabel}</Text>
                  </>
                ) : (
                  <>
                    <IconCircleDashed size={12} color={colors.gray[400]} />
                    <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}>Select policy</Text>
                  </>
                )}
              </Box>
              <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}>+</Text>
              <Box style={dockStyles.configChip}>
                {baselinePopulationConfigured ? (
                  <>
                    <IconUsers size={12} color={colors.primary[500]} />
                    <Text style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, color: colors.primary[600] }}>{baselinePopulationLabel}</Text>
                  </>
                ) : (
                  <>
                    <IconCircleDashed size={12} color={colors.gray[400]} />
                    <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}>Select population</Text>
                  </>
                )}
              </Box>
            </Box>

            {/* Reform row (if applicable) */}
            {hasReform && (
              <Box style={dockStyles.configRow}>
                <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, width: 60 }}>Reform</Text>
                <Box style={dockStyles.configChip}>
                  {reformPolicyConfigured ? (
                    <>
                      <IconScale size={12} color={colors.secondary[500]} />
                      <Text style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, color: colors.secondary[600] }}>{reformPolicyLabel}</Text>
                    </>
                  ) : (
                    <>
                      <IconCircleDashed size={12} color={colors.gray[400]} />
                      <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}>Select policy</Text>
                    </>
                  )}
                </Box>
                <Text c="dimmed" style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.tiny }}>(inherits population)</Text>
              </Box>
            )}

            {/* Ready message */}
            {isReportConfigured && (
              <Group gap={spacing.xs} justify="center" mt={spacing.xs}>
                <IconCircleCheck size={14} color={colors.success} />
                <Text style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small, color: colors.success }}>
                  Ready to run your analysis
                </Text>
              </Group>
            )}
          </Stack>
        </Box>
      </Box>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </Box>
  );
}
