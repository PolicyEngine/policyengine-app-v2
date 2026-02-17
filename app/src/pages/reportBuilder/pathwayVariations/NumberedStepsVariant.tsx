/**
 * NumberedStepsVariant - Adds numbered badges and breadcrumb progress
 *
 * Key changes from base:
 * - Numbered step badges (1, 2, 3) on each ingredient section
 * - Horizontal breadcrumb progress bar at top of canvas
 * - "Start here" callout on first incomplete step
 * - Connecting lines between steps
 */

import { Box, Group, Paper, Text, Badge } from '@mantine/core';
import { IconCheck, IconArrowRight, IconPointer } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';

// Step configuration
const STEPS = [
  { id: 'policy', label: 'Choose policy', description: 'Select current law or create a reform' },
  { id: 'population', label: 'Choose population', description: 'Pick a geography or household' },
  { id: 'dynamics', label: 'Add dynamics', description: 'Optional: behavioral responses' },
];

interface StepBadgeProps {
  number: number;
  isComplete: boolean;
  isCurrent: boolean;
}

function StepBadge({ number, isComplete, isCurrent }: StepBadgeProps) {
  return (
    <Box
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: isComplete
          ? `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[600]} 100%)`
          : isCurrent
            ? colors.white
            : colors.gray[100],
        border: isCurrent ? `2px solid ${colors.primary[500]}` : 'none',
        boxShadow: isComplete
          ? `0 2px 8px ${colors.primary[300]}`
          : isCurrent
            ? `0 0 0 4px ${colors.primary[100]}`
            : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.primary,
        fontWeight: 700,
        fontSize: '14px',
        color: isComplete ? colors.white : isCurrent ? colors.primary[600] : colors.gray[400],
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
    >
      {isComplete ? <IconCheck size={16} stroke={3} /> : number}
      {isCurrent && !isComplete && (
        <Box
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <IconPointer size={14} color={colors.primary[500]} style={{ transform: 'rotate(-45deg)' }} />
        </Box>
      )}
    </Box>
  );
}

interface BreadcrumbProgressProps {
  completedSteps: number[];
  currentStep: number;
}

function BreadcrumbProgress({ completedSteps, currentStep }: BreadcrumbProgressProps) {
  return (
    <Box
      style={{
        background: colors.white,
        borderRadius: spacing.radius.xl,
        border: `1px solid ${colors.border.light}`,
        padding: `${spacing.md} ${spacing.xl}`,
        marginBottom: spacing.xl,
        boxShadow: `0 2px 12px ${colors.shadow.light}`,
      }}
    >
      <Group justify="center" gap={0}>
        {STEPS.map((step, index) => {
          const isComplete = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const isLast = index === STEPS.length - 1;

          return (
            <Group key={step.id} gap={0}>
              <Group gap={spacing.sm} style={{ padding: `0 ${spacing.md}` }}>
                <StepBadge number={index + 1} isComplete={isComplete} isCurrent={isCurrent} />
                <Box>
                  <Text
                    fw={isCurrent ? 600 : 500}
                    size="sm"
                    c={isComplete ? colors.primary[600] : isCurrent ? colors.gray[900] : colors.gray[500]}
                  >
                    {step.label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {step.description}
                  </Text>
                </Box>
              </Group>
              {!isLast && (
                <Box
                  style={{
                    width: 60,
                    height: 2,
                    background: completedSteps.includes(index)
                      ? `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[300]})`
                      : colors.gray[200],
                    margin: `0 ${spacing.xs}`,
                    position: 'relative',
                  }}
                >
                  {completedSteps.includes(index) && (
                    <IconArrowRight
                      size={14}
                      color={colors.primary[500]}
                      style={{
                        position: 'absolute',
                        right: -7,
                        top: -6,
                      }}
                    />
                  )}
                </Box>
              )}
            </Group>
          );
        })}
      </Group>
    </Box>
  );
}

interface IngredientSectionWithNumberProps {
  stepNumber: number;
  title: string;
  colorConfig: { icon: string; bg: string; border: string };
  isComplete: boolean;
  isCurrent: boolean;
  children?: React.ReactNode;
}

function IngredientSectionWithNumber({
  stepNumber,
  title,
  colorConfig,
  isComplete,
  isCurrent,
  children,
}: IngredientSectionWithNumberProps) {
  return (
    <Box
      style={{
        padding: spacing.md,
        borderRadius: spacing.radius.lg,
        border: `1px solid ${isCurrent ? colorConfig.border : colors.border.light}`,
        background: isCurrent ? `${colorConfig.bg}40` : colors.white,
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: isCurrent ? `0 0 0 3px ${colorConfig.bg}` : 'none',
      }}
    >
      {/* Step number badge */}
      <Box
        style={{
          position: 'absolute',
          top: -12,
          left: spacing.md,
          zIndex: 1,
        }}
      >
        <Badge
          size="lg"
          variant={isComplete ? 'filled' : 'light'}
          color={isComplete ? 'teal' : 'gray'}
          style={{
            fontFamily: typography.fontFamily.primary,
            fontWeight: 700,
            boxShadow: `0 2px 4px ${colors.shadow.light}`,
          }}
        >
          {isComplete ? <IconCheck size={12} /> : `Step ${stepNumber}`}
        </Badge>
      </Box>

      {/* "Start here" callout */}
      {isCurrent && !isComplete && (
        <Box
          style={{
            position: 'absolute',
            top: -12,
            right: spacing.md,
            background: colors.primary[500],
            color: colors.white,
            padding: `2px ${spacing.sm}`,
            borderRadius: spacing.radius.sm,
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: typography.fontFamily.primary,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          Start here
        </Box>
      )}

      <Box style={{ marginTop: spacing.sm }}>
        <Text
          fw={600}
          size="sm"
          c={colorConfig.icon}
          mb={spacing.sm}
          style={{ fontFamily: typography.fontFamily.primary }}
        >
          {title}
        </Text>
        {children || (
          <Box
            style={{
              height: 80,
              borderRadius: spacing.radius.md,
              border: `2px dashed ${colors.gray[200]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text c="dimmed" size="sm">
              Click to select
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export function NumberedStepsVariant() {
  // Simulated state - in real implementation would use actual state
  const completedSteps = [0]; // Policy selected
  const currentStep = 1; // Population is current

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${colors.gray[50]} 0%, ${colors.background.secondary} 100%)`,
        padding: `${spacing.lg} ${spacing['3xl']}`,
      }}
    >
      <Box style={{ marginBottom: spacing.xl }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: '28px',
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.02em',
          }}
        >
          Report builder
        </Text>
        <Text c="dimmed" size="sm" mt={spacing.xs}>
          Variant 1: Numbered steps with breadcrumb progress
        </Text>
      </Box>

      {/* Breadcrumb progress bar */}
      <BreadcrumbProgress completedSteps={completedSteps} currentStep={currentStep} />

      {/* Canvas */}
      <Paper
        style={{
          background: colors.white,
          borderRadius: spacing.radius.xl,
          border: `1px solid ${colors.border.light}`,
          boxShadow: `0 4px 24px ${colors.shadow.light}`,
          padding: spacing['2xl'],
        }}
      >
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing['2xl'],
          }}
        >
          {/* Baseline simulation */}
          <Box>
            <Text fw={600} size="sm" mb={spacing.lg} c={colors.gray[800]}>
              Baseline simulation
            </Text>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
              <IngredientSectionWithNumber
                stepNumber={1}
                title="Policy"
                colorConfig={{ icon: colors.secondary[600], bg: colors.secondary[50], border: colors.secondary[200] }}
                isComplete
                isCurrent={false}
              >
                <Box
                  style={{
                    padding: spacing.md,
                    borderRadius: spacing.radius.md,
                    background: colors.secondary[50],
                    border: `1px solid ${colors.secondary[200]}`,
                  }}
                >
                  <Group gap={spacing.sm}>
                    <IconCheck size={16} color={colors.secondary[500]} />
                    <Text size="sm" fw={500}>Current law</Text>
                  </Group>
                </Box>
              </IngredientSectionWithNumber>

              <IngredientSectionWithNumber
                stepNumber={2}
                title="Population"
                colorConfig={{ icon: colors.primary[600], bg: colors.primary[50], border: colors.primary[200] }}
                isComplete={false}
                isCurrent
              />

              <IngredientSectionWithNumber
                stepNumber={3}
                title="Dynamics"
                colorConfig={{ icon: colors.gray[500], bg: colors.gray[50], border: colors.gray[200] }}
                isComplete={false}
                isCurrent={false}
              />
            </Box>
          </Box>

          {/* Reform simulation */}
          <Box style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <Text fw={600} size="sm" mb={spacing.lg} c={colors.gray[500]}>
              Reform simulation (unlocks after baseline)
            </Text>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
              <IngredientSectionWithNumber
                stepNumber={1}
                title="Policy"
                colorConfig={{ icon: colors.gray[400], bg: colors.gray[50], border: colors.gray[200] }}
                isComplete={false}
                isCurrent={false}
              />
              <IngredientSectionWithNumber
                stepNumber={2}
                title="Population"
                colorConfig={{ icon: colors.gray[400], bg: colors.gray[50], border: colors.gray[200] }}
                isComplete={false}
                isCurrent={false}
              />
              <IngredientSectionWithNumber
                stepNumber={3}
                title="Dynamics"
                colorConfig={{ icon: colors.gray[400], bg: colors.gray[50], border: colors.gray[200] }}
                isComplete={false}
                isCurrent={false}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </Box>
  );
}
