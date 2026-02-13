/**
 * TimelineVariant - Horizontal timeline with milestone markers
 *
 * Key changes from base:
 * - Prominent horizontal timeline at top
 * - Milestone markers with icons
 * - Progress line fills as you complete steps
 * - Current step highlighted with expanded detail
 */

import { Box, Group, Paper, Text, Stack } from '@mantine/core';
import {
  IconCheck,
  IconScale,
  IconUsers,
  IconChartLine,
  IconFlag,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';

interface TimelineMilestoneProps {
  icon: React.ReactNode;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
  isLast?: boolean;
}

function TimelineMilestone({ icon, label, status, isLast = false }: TimelineMilestoneProps) {
  const isComplete = status === 'complete';
  const isCurrent = status === 'current';

  return (
    <Box style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
      {/* Milestone node */}
      <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.xs }}>
        <Box
          style={{
            width: isCurrent ? 56 : 44,
            height: isCurrent ? 56 : 44,
            borderRadius: '50%',
            background: isComplete
              ? `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[600]} 100%)`
              : isCurrent
                ? colors.white
                : colors.gray[100],
            border: isCurrent ? `3px solid ${colors.primary[500]}` : 'none',
            boxShadow: isComplete
              ? `0 4px 16px ${colors.primary[400]}50`
              : isCurrent
                ? `0 0 0 6px ${colors.primary[100]}, 0 8px 24px ${colors.primary[200]}`
                : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {isComplete ? (
            <IconCheck size={20} color={colors.white} stroke={3} />
          ) : (
            <Box style={{ color: isCurrent ? colors.primary[600] : colors.gray[400] }}>
              {icon}
            </Box>
          )}
        </Box>
        <Text
          size="xs"
          fw={isCurrent ? 700 : 500}
          c={isComplete ? colors.primary[600] : isCurrent ? colors.gray[900] : colors.gray[500]}
          ta="center"
          style={{
            fontFamily: typography.fontFamily.primary,
            maxWidth: 80,
            lineHeight: 1.3,
          }}
        >
          {label}
        </Text>
      </Box>

      {/* Connecting line */}
      {!isLast && (
        <Box
          style={{
            flex: 1,
            height: 4,
            marginTop: -20,
            marginLeft: -2,
            marginRight: -2,
            background: isComplete
              ? `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[300]})`
              : colors.gray[200],
            borderRadius: 2,
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.4s ease',
          }}
        >
          {/* Animated progress for current step */}
          {isCurrent && (
            <Box
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '30%',
                background: `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[300]})`,
                borderRadius: 2,
                animation: 'progress-pulse 2s ease-in-out infinite',
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

interface DetailCardProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  colorConfig: { primary: string; light: string };
  isActive: boolean;
  content?: React.ReactNode;
}

function DetailCard({
  stepNumber,
  totalSteps,
  title,
  description,
  colorConfig,
  isActive,
  content,
}: DetailCardProps) {
  return (
    <Paper
      style={{
        padding: spacing.xl,
        borderRadius: spacing.radius.xl,
        border: isActive ? `2px solid ${colorConfig.primary}` : `1px solid ${colors.border.light}`,
        background: isActive ? `linear-gradient(135deg, ${colorConfig.light}40 0%, ${colors.white} 100%)` : colors.white,
        boxShadow: isActive ? `0 8px 32px ${colorConfig.primary}20` : `0 2px 8px ${colors.shadow.light}`,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Step indicator */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: isActive
            ? `linear-gradient(90deg, ${colorConfig.primary}, ${colorConfig.light})`
            : colors.gray[100],
        }}
      />

      <Group justify="space-between" mb={spacing.md}>
        <Box>
          <Text
            size="xs"
            c={isActive ? colorConfig.primary : colors.gray[400]}
            fw={600}
            mb={4}
            style={{
              fontFamily: typography.fontFamily.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Step {stepNumber} of {totalSteps}
          </Text>
          <Text
            fw={700}
            size="lg"
            c={colors.gray[900]}
            style={{ fontFamily: typography.fontFamily.primary }}
          >
            {title}
          </Text>
        </Box>
        {isActive && (
          <Box
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              background: colorConfig.primary,
              color: colors.white,
              borderRadius: spacing.radius.md,
              fontFamily: typography.fontFamily.primary,
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            IN PROGRESS
          </Box>
        )}
      </Group>

      <Text size="sm" c={colors.gray[600]} mb={spacing.lg}>
        {description}
      </Text>

      {content || (
        <Box
          style={{
            padding: spacing.xl,
            borderRadius: spacing.radius.lg,
            border: `2px dashed ${isActive ? colorConfig.primary : colors.gray[200]}`,
            background: isActive ? `${colorConfig.light}30` : colors.gray[50],
            textAlign: 'center',
          }}
        >
          <Text c={isActive ? colorConfig.primary : colors.gray[400]} fw={500}>
            {isActive ? 'Click to make a selection' : 'Complete previous steps first'}
          </Text>
        </Box>
      )}
    </Paper>
  );
}

export function TimelineVariant() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: colors.gray[50],
        padding: `${spacing.lg} ${spacing['3xl']}`,
      }}
    >
      {/* Header */}
      <Box style={{ marginBottom: spacing['2xl'] }}>
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
          Variant 3: Horizontal timeline with milestone markers
        </Text>
      </Box>

      {/* Timeline */}
      <Paper
        style={{
          padding: `${spacing['2xl']} ${spacing['3xl']}`,
          borderRadius: spacing.radius.xl,
          background: colors.white,
          marginBottom: spacing['2xl'],
          boxShadow: `0 4px 24px ${colors.shadow.light}`,
        }}
      >
        <Group gap={0} align="flex-start">
          <TimelineMilestone
            icon={<IconScale size={20} />}
            label="Select policy"
            status="complete"
          />
          <TimelineMilestone
            icon={<IconUsers size={20} />}
            label="Choose population"
            status="current"
          />
          <TimelineMilestone
            icon={<IconChartLine size={20} />}
            label="Add dynamics"
            status="upcoming"
          />
          <TimelineMilestone
            icon={<IconFlag size={20} />}
            label="Review & run"
            status="upcoming"
            isLast
          />
        </Group>
      </Paper>

      {/* Detail cards */}
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing.xl,
        }}
      >
        <DetailCard
          stepNumber={1}
          totalSteps={3}
          title="Policy"
          description="Select a baseline policy to analyze. You can use current law or create a custom reform."
          colorConfig={{ primary: colors.secondary[500], light: colors.secondary[50] }}
          isActive={false}
          content={
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
                <Text size="sm" fw={500}>Current law selected</Text>
              </Group>
            </Box>
          }
        />

        <DetailCard
          stepNumber={2}
          totalSteps={3}
          title="Population"
          description="Choose who you want to analyze: the entire nation, a specific region, or a custom household."
          colorConfig={{ primary: colors.primary[500], light: colors.primary[50] }}
          isActive={true}
        />

        <DetailCard
          stepNumber={3}
          totalSteps={3}
          title="Dynamics"
          description="Optionally add behavioral responses and economic dynamics to your simulation."
          colorConfig={{ primary: colors.gray[500], light: colors.gray[50] }}
          isActive={false}
        />
      </Box>

      {/* Run button */}
      <Box style={{ display: 'flex', justifyContent: 'center', marginTop: spacing['2xl'] }}>
        <Box
          component="button"
          disabled
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.md} ${spacing['2xl']}`,
            borderRadius: spacing.radius.xl,
            background: colors.gray[200],
            color: colors.gray[500],
            border: 'none',
            fontFamily: typography.fontFamily.primary,
            fontWeight: 600,
            fontSize: '16px',
            cursor: 'not-allowed',
          }}
        >
          <IconPlayerPlay size={20} />
          Complete all steps to run
        </Box>
      </Box>

      <style>{`
        @keyframes progress-pulse {
          0%, 100% { width: 30%; opacity: 1; }
          50% { width: 50%; opacity: 0.7; }
        }
      `}</style>
    </Box>
  );
}
