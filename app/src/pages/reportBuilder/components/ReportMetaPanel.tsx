/**
 * ReportMetaPanel - Floating dock showing report status and configuration
 */

import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  IconCheck,
  IconCircleCheck,
  IconCircleDashed,
  IconFileDescription,
  IconPencil,
  IconPlayerPlay,
  IconScale,
  IconUsers,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ActionIcon, Box, Group, Loader, Select, Stack, Text, TextInput } from '@mantine/core';
import { ReportAdapter, SimulationAdapter } from '@/adapters';
import { createSimulation } from '@/api/simulation';
import { CURRENT_YEAR } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { RootState } from '@/store';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { getReportOutputPath } from '@/utils/reportRouting';
import { FONT_SIZES } from '../constants';
import type { ReportBuilderState } from '../types';
import { ProgressDot } from './shared';

interface ReportMetaPanelProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  isReportConfigured: boolean;
}

export function ReportMetaPanel({
  reportState,
  setReportState,
  isReportConfigured,
}: ReportMetaPanelProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);

  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  const { createReport } = useCreateReport(reportState.label || undefined);

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

  // Convert SimulationStateProps to API Simulation format for useCreateReport
  const convertToSimulation = useCallback(
    (simState: SimulationStateProps, simulationId: string): Simulation | null => {
      const policyId = simState.policy?.id;
      if (!policyId) {
        return null;
      }

      let populationId: string | undefined;
      let populationType: 'household' | 'geography' | undefined;

      if (simState.population?.household?.id) {
        populationId = simState.population.household.id;
        populationType = 'household';
      } else if (simState.population?.geography?.geographyId) {
        populationId = simState.population.geography.geographyId;
        populationType = 'geography';
      }

      if (!populationId || !populationType) {
        return null;
      }

      return {
        id: simulationId,
        countryId,
        apiVersion: undefined,
        policyId: policyId === 'current-law' ? currentLawId.toString() : policyId,
        populationId,
        populationType,
        label: simState.label,
        isCreated: true,
        output: null,
        status: 'pending',
      };
    },
    [countryId, currentLawId]
  );

  const handleRunReport = useCallback(async () => {
    if (!isReportConfigured || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const simulationIds: string[] = [];
      const simulations: (Simulation | null)[] = [];

      // Step 1: Create simulations for each simulation in reportState
      for (const simState of reportState.simulations) {
        // Resolve policy ID (handle 'current-law' placeholder)
        const policyId =
          simState.policy?.id === 'current-law' ? currentLawId.toString() : simState.policy?.id;

        if (!policyId) {
          console.error('[ReportMetaPanel] Simulation missing policy ID');
          continue;
        }

        // Determine population ID and type
        let populationId: string | undefined;
        let populationType: 'household' | 'geography' | undefined;

        if (simState.population?.household?.id) {
          populationId = simState.population.household.id;
          populationType = 'household';
        } else if (simState.population?.geography?.geographyId) {
          populationId = simState.population.geography.geographyId;
          populationType = 'geography';
        }

        if (!populationId || !populationType) {
          console.error('[ReportMetaPanel] Simulation missing population');
          continue;
        }

        // Create simulation payload
        const simulationData: Partial<Simulation> = {
          populationId,
          policyId,
          populationType,
        };

        const payload = SimulationAdapter.toCreationPayload(simulationData);

        // Create simulation via API
        const result = await createSimulation(countryId, payload);
        const simulationId = result.result.simulation_id;
        simulationIds.push(simulationId);

        // Convert to Simulation format for useCreateReport
        const simulation = convertToSimulation(simState, simulationId);
        simulations.push(simulation);
      }

      if (simulationIds.length === 0) {
        console.error('[ReportMetaPanel] No simulations created');
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create report with simulation IDs
      const reportData: Partial<Report> = {
        countryId,
        year: reportState.year,
        simulationIds,
        apiVersion: null,
      };

      const serializedPayload = ReportAdapter.toCreationPayload(reportData as Report);

      // Step 3: Call useCreateReport to create report and start calculation
      await createReport(
        {
          countryId,
          payload: serializedPayload,
          simulations: {
            simulation1: simulations[0],
            simulation2: simulations[1] || null,
          },
          populations: {
            household1: reportState.simulations[0]?.population?.household || null,
            household2: reportState.simulations[1]?.population?.household || null,
            geography1: reportState.simulations[0]?.population?.geography || null,
            geography2: reportState.simulations[1]?.population?.geography || null,
          },
        },
        {
          onSuccess: (data) => {
            const outputPath = getReportOutputPath(countryId, data.userReport.id);
            navigate(outputPath);
          },
          onError: (error) => {
            console.error('[ReportMetaPanel] Report creation failed:', error);
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('[ReportMetaPanel] Error running report:', error);
      setIsSubmitting(false);
    }
  }, [
    isReportConfigured,
    isSubmitting,
    reportState,
    countryId,
    currentLawId,
    createReport,
    convertToSimulation,
    navigate,
  ]);

  // Calculate configuration progress
  const simulations = reportState.simulations;
  const baselinePolicyConfigured = !!simulations[0]?.policy?.id;
  const baselinePopulationConfigured = !!(
    simulations[0]?.population?.household?.id || simulations[0]?.population?.geography?.id
  );
  const hasReform = simulations.length > 1;
  const reformPolicyConfigured = hasReform && !!simulations[1]?.policy?.id;

  // Get labels for display
  const baselinePolicyLabel = simulations[0]?.policy?.label || null;
  const baselinePopulationLabel =
    simulations[0]?.population?.label ||
    (simulations[0]?.population?.household?.id
      ? 'Household'
      : simulations[0]?.population?.geography?.id
        ? 'Nationwide'
        : null);
  const reformPolicyLabel = hasReform ? simulations[1]?.policy?.label || null : null;

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
      background:
        isReportConfigured && !isSubmitting
          ? `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`
          : colors.gray[200],
      color: isReportConfigured && !isSubmitting ? 'white' : colors.gray[500],
      border: 'none',
      borderRadius: spacing.radius.lg,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontFamily: typography.fontFamily.primary,
      fontWeight: 600,
      fontSize: FONT_SIZES.normal,
      cursor: isReportConfigured && !isSubmitting ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
      transition: 'all 0.3s ease',
      boxShadow:
        isReportConfigured && !isSubmitting ? `0 4px 12px rgba(44, 122, 123, 0.3)` : 'none',
      opacity: isSubmitting ? 0.7 : 1,
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
          <Box
            style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}
          >
            {isEditingLabel ? (
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
          <Box style={{ ...dockStyles.divider, flexShrink: 0 }} />

          {/* Year selector - fixed width, no checkmark */}
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
            onClick={handleRunReport}
            disabled={!isReportConfigured || isSubmitting}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (isReportConfigured && !isSubmitting) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 6px 16px rgba(44, 122, 123, 0.4)`;
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow =
                isReportConfigured && !isSubmitting ? `0 4px 12px rgba(44, 122, 123, 0.3)` : 'none';
            }}
          >
            {isSubmitting ? <Loader size={16} color="gray" /> : <IconPlayerPlay size={16} />}
            <span>{isSubmitting ? 'Running...' : 'Run'}</span>
          </Box>
        </Box>

        {/* Expanded content - visible on hover */}
        <Box style={dockStyles.expandedContent}>
          <Stack gap={spacing.sm}>
            {/* Baseline row */}
            <Box style={dockStyles.configRow}>
              <Text
                c="dimmed"
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: FONT_SIZES.small,
                  width: 60,
                }}
              >
                Baseline
              </Text>
              <Box style={dockStyles.configChip}>
                {baselinePolicyConfigured ? (
                  <>
                    <IconScale size={12} color={colors.secondary[500]} />
                    <Text
                      style={{
                        fontFamily: typography.fontFamily.primary,
                        fontSize: FONT_SIZES.small,
                        color: colors.secondary[600],
                      }}
                    >
                      {baselinePolicyLabel}
                    </Text>
                  </>
                ) : (
                  <>
                    <IconCircleDashed size={12} color={colors.gray[400]} />
                    <Text
                      c="dimmed"
                      style={{
                        fontFamily: typography.fontFamily.primary,
                        fontSize: FONT_SIZES.small,
                      }}
                    >
                      Select policy
                    </Text>
                  </>
                )}
              </Box>
              <Text
                c="dimmed"
                style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}
              >
                +
              </Text>
              <Box style={dockStyles.configChip}>
                {baselinePopulationConfigured ? (
                  <>
                    <IconUsers size={12} color={colors.primary[500]} />
                    <Text
                      style={{
                        fontFamily: typography.fontFamily.primary,
                        fontSize: FONT_SIZES.small,
                        color: colors.primary[600],
                      }}
                    >
                      {baselinePopulationLabel}
                    </Text>
                  </>
                ) : (
                  <>
                    <IconCircleDashed size={12} color={colors.gray[400]} />
                    <Text
                      c="dimmed"
                      style={{
                        fontFamily: typography.fontFamily.primary,
                        fontSize: FONT_SIZES.small,
                      }}
                    >
                      Select population
                    </Text>
                  </>
                )}
              </Box>
            </Box>

            {/* Reform row (if applicable) */}
            {hasReform && (
              <Box style={dockStyles.configRow}>
                <Text
                  c="dimmed"
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: FONT_SIZES.small,
                    width: 60,
                  }}
                >
                  Reform
                </Text>
                <Box style={dockStyles.configChip}>
                  {reformPolicyConfigured ? (
                    <>
                      <IconScale size={12} color={colors.secondary[500]} />
                      <Text
                        style={{
                          fontFamily: typography.fontFamily.primary,
                          fontSize: FONT_SIZES.small,
                          color: colors.secondary[600],
                        }}
                      >
                        {reformPolicyLabel}
                      </Text>
                    </>
                  ) : (
                    <>
                      <IconCircleDashed size={12} color={colors.gray[400]} />
                      <Text
                        c="dimmed"
                        style={{
                          fontFamily: typography.fontFamily.primary,
                          fontSize: FONT_SIZES.small,
                        }}
                      >
                        Select policy
                      </Text>
                    </>
                  )}
                </Box>
                <Text
                  c="dimmed"
                  style={{ fontFamily: typography.fontFamily.primary, fontSize: FONT_SIZES.small }}
                >
                  +
                </Text>
                <Box style={dockStyles.configChip}>
                  {baselinePopulationConfigured ? (
                    <>
                      <IconUsers size={12} color={colors.primary[500]} />
                      <Text
                        style={{
                          fontFamily: typography.fontFamily.primary,
                          fontSize: FONT_SIZES.small,
                          color: colors.primary[600],
                        }}
                      >
                        {baselinePopulationLabel}
                      </Text>
                    </>
                  ) : (
                    <>
                      <IconCircleDashed size={12} color={colors.gray[400]} />
                      <Text
                        c="dimmed"
                        style={{
                          fontFamily: typography.fontFamily.primary,
                          fontSize: FONT_SIZES.small,
                        }}
                      >
                        Select population
                      </Text>
                    </>
                  )}
                </Box>
              </Box>
            )}

            {/* Ready message */}
            {isReportConfigured && (
              <Group gap={spacing.xs} justify="center" mt={spacing.xs}>
                <IconCircleCheck size={14} color={colors.success} />
                <Text
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: FONT_SIZES.small,
                    color: colors.success,
                  }}
                >
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
