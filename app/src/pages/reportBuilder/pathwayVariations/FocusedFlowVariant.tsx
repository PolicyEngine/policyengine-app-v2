/**
 * FocusedFlowVariant - Progressive disclosure with focused current step
 *
 * Key changes from base:
 * - Only current step is fully visible and interactive
 * - Completed steps collapsed to minimal summary
 * - Upcoming steps shown as blurred/locked previews
 * - Smooth expand/collapse animations
 */

import { Box, Group, Paper, Text, Stack, Button, Collapse, Badge } from '@mantine/core';
import {
  IconCheck,
  IconLock,
  IconScale,
  IconUsers,
  IconChartLine,
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconSparkles,
} from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { useState } from 'react';

interface CollapsedStepProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  colorConfig: { primary: string; light: string };
  onExpand?: () => void;
}

function CollapsedStep({ icon, title, value, colorConfig, onExpand }: CollapsedStepProps) {
  return (
    <Box
      onClick={onExpand}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: spacing.radius.lg,
        background: colors.gray[50],
        border: `1px solid ${colors.gray[200]}`,
        cursor: onExpand ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
    >
      <Box
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: colorConfig.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconCheck size={14} color={colors.white} stroke={3} />
      </Box>
      <Box style={{ flex: 1 }}>
        <Text size="xs" c="dimmed">
          {title}
        </Text>
        <Text size="sm" fw={600} c={colors.gray[800]}>
          {value}
        </Text>
      </Box>
      <Box style={{ color: colorConfig.primary }}>{icon}</Box>
      {onExpand && <IconChevronDown size={16} color={colors.gray[400]} />}
    </Box>
  );
}

interface ActiveStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  colorConfig: { primary: string; light: string; border: string };
  children?: React.ReactNode;
}

function ActiveStep({ stepNumber, title, description, icon, colorConfig, children }: ActiveStepProps) {
  return (
    <Paper
      style={{
        padding: spacing['2xl'],
        borderRadius: spacing.radius.xl,
        background: `linear-gradient(180deg, ${colorConfig.light}60 0%, ${colors.white} 100%)`,
        border: `2px solid ${colorConfig.border}`,
        boxShadow: `0 8px 40px ${colorConfig.primary}15, 0 0 0 4px ${colorConfig.light}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient bar */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${colorConfig.primary}, ${colorConfig.light})`,
        }}
      />

      {/* Header */}
      <Group justify="space-between" mb={spacing.xl}>
        <Group gap={spacing.md}>
          <Box
            style={{
              width: 56,
              height: 56,
              borderRadius: spacing.radius.xl,
              background: colors.white,
              border: `2px solid ${colorConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${colorConfig.primary}20`,
            }}
          >
            <Box style={{ color: colorConfig.primary }}>{icon}</Box>
          </Box>
          <Box>
            <Badge
              size="sm"
              variant="light"
              color="teal"
              mb={4}
              style={{ fontFamily: typography.fontFamily.primary }}
            >
              Step {stepNumber} — In progress
            </Badge>
            <Text
              fw={700}
              size="xl"
              c={colors.gray[900]}
              style={{ fontFamily: typography.fontFamily.primary }}
            >
              {title}
            </Text>
            <Text size="sm" c={colors.gray[600]}>
              {description}
            </Text>
          </Box>
        </Group>
      </Group>

      {/* Content */}
      {children || (
        <Box
          style={{
            padding: spacing['2xl'],
            borderRadius: spacing.radius.xl,
            background: colors.white,
            border: `2px dashed ${colorConfig.border}`,
          }}
        >
          <Stack gap={spacing.lg} align="center">
            <IconSparkles size={32} color={colorConfig.primary} />
            <Text
              size="lg"
              fw={500}
              c={colors.gray[700]}
              ta="center"
              style={{ maxWidth: 400 }}
            >
              Choose your analysis population
            </Text>
            <Text size="sm" c="dimmed" ta="center" style={{ maxWidth: 400 }}>
              Select who you want to include in your policy analysis: the entire nation, a specific region, or a custom household.
            </Text>
            <Group gap={spacing.md} mt={spacing.sm}>
              <Button
                size="lg"
                color="teal"
                rightSection={<IconArrowRight size={18} />}
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: 600,
                  boxShadow: `0 4px 16px ${colors.primary[400]}40`,
                }}
              >
                Select nationwide
              </Button>
              <Button
                size="lg"
                variant="light"
                color="gray"
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: 500,
                }}
              >
                Browse all options
              </Button>
            </Group>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

interface LockedStepProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function LockedStep({ title, description, icon }: LockedStepProps) {
  return (
    <Box
      style={{
        padding: spacing.lg,
        borderRadius: spacing.radius.xl,
        background: colors.gray[50],
        border: `1px dashed ${colors.gray[200]}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Blur overlay */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(2px)',
          background: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <Group gap={spacing.xs}>
          <IconLock size={14} color={colors.gray[400]} />
          <Text size="sm" c="dimmed" fw={500}>
            Complete previous step to unlock
          </Text>
        </Group>
      </Box>

      {/* Content (blurred) */}
      <Group gap={spacing.md}>
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: spacing.radius.lg,
            background: colors.gray[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.gray[300],
          }}
        >
          {icon}
        </Box>
        <Box>
          <Text fw={600} c={colors.gray[400]}>
            {title}
          </Text>
          <Text size="sm" c={colors.gray[300]}>
            {description}
          </Text>
        </Box>
      </Group>
    </Box>
  );
}

export function FocusedFlowVariant() {
  const [showCompletedDetails, setShowCompletedDetails] = useState(false);

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse at 30% 20%, ${colors.primary[50]}80 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, ${colors.secondary[50]}60 0%, transparent 50%),
          ${colors.gray[50]}
        `,
        padding: `${spacing.lg} ${spacing['3xl']}`,
      }}
    >
      {/* Header */}
      <Box style={{ marginBottom: spacing['2xl'], maxWidth: 800, margin: '0 auto' }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: '32px',
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}
        >
          Build your report
        </Text>
        <Text c="dimmed" size="md" mt={spacing.xs} ta="center">
          Variant 5: Focused flow with progressive disclosure
        </Text>
      </Box>

      {/* Content container */}
      <Box style={{ maxWidth: 700, margin: '0 auto' }}>
        <Stack gap={spacing.lg}>
          {/* Completed step - Collapsed */}
          <Box>
            <Text
              size="xs"
              fw={600}
              c={colors.gray[500]}
              mb={spacing.sm}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Completed
            </Text>
            <CollapsedStep
              icon={<IconScale size={18} />}
              title="Policy"
              value="Current law"
              colorConfig={{ primary: colors.secondary[500], light: colors.secondary[50] }}
              onExpand={() => setShowCompletedDetails(!showCompletedDetails)}
            />
            <Collapse in={showCompletedDetails}>
              <Box
                style={{
                  marginTop: spacing.sm,
                  padding: spacing.md,
                  borderRadius: spacing.radius.md,
                  background: colors.white,
                  border: `1px solid ${colors.gray[200]}`,
                }}
              >
                <Text size="sm" c="dimmed">
                  You selected <strong>Current law</strong> as your baseline policy.
                  This represents the existing tax and benefit rules with no changes.
                </Text>
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  mt={spacing.sm}
                >
                  Change selection
                </Button>
              </Box>
            </Collapse>
          </Box>

          {/* Current step - Expanded */}
          <Box>
            <Text
              size="xs"
              fw={600}
              c={colors.primary[600]}
              mb={spacing.sm}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Current step
            </Text>
            <ActiveStep
              stepNumber={2}
              title="Choose your population"
              description="Select who you want to analyze"
              icon={<IconUsers size={24} />}
              colorConfig={{
                primary: colors.primary[500],
                light: colors.primary[50],
                border: colors.primary[200],
              }}
            />
          </Box>

          {/* Upcoming step - Locked */}
          <Box>
            <Text
              size="xs"
              fw={600}
              c={colors.gray[400]}
              mb={spacing.sm}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Coming up
            </Text>
            <LockedStep
              title="Add dynamics (optional)"
              description="Configure behavioral responses and economic dynamics"
              icon={<IconChartLine size={20} />}
            />
          </Box>
        </Stack>

        {/* Skip to run option */}
        <Box
          style={{
            marginTop: spacing['3xl'],
            padding: spacing.xl,
            borderRadius: spacing.radius.xl,
            background: colors.white,
            border: `1px solid ${colors.gray[200]}`,
            textAlign: 'center',
          }}
        >
          <Text size="sm" c="dimmed" mb={spacing.sm}>
            Complete step 2 to continue, or skip optional steps and run your analysis
          </Text>
          <Group justify="center" gap={spacing.md}>
            <Button
              variant="light"
              color="gray"
              size="md"
              style={{ fontFamily: typography.fontFamily.primary }}
            >
              Skip dynamics
            </Button>
            <Button
              disabled
              size="md"
              style={{ fontFamily: typography.fontFamily.primary }}
            >
              Run analysis
            </Button>
          </Group>
        </Box>
      </Box>
    </Box>
  );
}
