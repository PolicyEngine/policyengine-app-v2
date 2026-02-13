/**
 * ChecklistVariant - Clear checklist with completion tracking
 *
 * Key changes from base:
 * - Left sidebar checklist with clear completion states
 * - Main content shows only the current step
 * - Progress percentage and completion bar
 * - Prominent action buttons for each step
 */

import { Box, Group, Paper, Text, Stack, Progress, Button, Badge } from '@mantine/core';
import {
  IconCheck,
  IconCircle,
  IconScale,
  IconUsers,
  IconChartLine,
  IconChevronRight,
  IconArrowRight,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';

interface ChecklistItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: 'complete' | 'current' | 'pending';
  onClick?: () => void;
}

function ChecklistItem({ icon, title, subtitle, status, onClick }: ChecklistItemProps) {
  const isComplete = status === 'complete';
  const isCurrent = status === 'current';

  return (
    <Box
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: spacing.radius.lg,
        background: isCurrent
          ? `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.white} 100%)`
          : isComplete
            ? colors.gray[50]
            : 'transparent',
        border: isCurrent
          ? `2px solid ${colors.primary[400]}`
          : `1px solid ${isComplete ? colors.gray[200] : 'transparent'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Status indicator */}
      <Box
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isComplete
            ? colors.primary[500]
            : isCurrent
              ? colors.white
              : colors.gray[100],
          border: isCurrent ? `2px solid ${colors.primary[500]}` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isComplete ? `0 2px 8px ${colors.primary[300]}` : 'none',
        }}
      >
        {isComplete ? (
          <IconCheck size={16} color={colors.white} stroke={3} />
        ) : isCurrent ? (
          <Box
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: colors.primary[500],
              animation: 'pulse-dot 1.5s ease-in-out infinite',
            }}
          />
        ) : (
          <IconCircle size={16} color={colors.gray[300]} />
        )}
      </Box>

      {/* Content */}
      <Box style={{ flex: 1 }}>
        <Group gap={spacing.xs}>
          <Box style={{ color: isComplete ? colors.primary[600] : isCurrent ? colors.gray[700] : colors.gray[400] }}>
            {icon}
          </Box>
          <Text
            fw={isCurrent ? 600 : 500}
            size="sm"
            c={isComplete ? colors.gray[700] : isCurrent ? colors.gray[900] : colors.gray[400]}
            style={{
              fontFamily: typography.fontFamily.primary,
              textDecoration: isComplete ? 'none' : 'none',
            }}
          >
            {title}
          </Text>
        </Group>
        <Text size="xs" c="dimmed" mt={2}>
          {isComplete ? subtitle : isCurrent ? 'Click to configure' : 'Pending'}
        </Text>
      </Box>

      {/* Arrow for current */}
      {isCurrent && (
        <IconChevronRight size={20} color={colors.primary[500]} />
      )}

      {/* "NEXT" badge for current */}
      {isCurrent && (
        <Box
          style={{
            position: 'absolute',
            top: -8,
            right: 12,
            background: colors.primary[500],
            color: colors.white,
            padding: `2px ${spacing.sm}`,
            borderRadius: spacing.radius.sm,
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: typography.fontFamily.primary,
            letterSpacing: '0.05em',
          }}
        >
          NEXT
        </Box>
      )}
    </Box>
  );
}

interface MainContentPanelProps {
  step: {
    title: string;
    description: string;
    icon: React.ReactNode;
    colorConfig: { primary: string; light: string; border: string };
  };
  children?: React.ReactNode;
}

function MainContentPanel({ step, children }: MainContentPanelProps) {
  return (
    <Paper
      style={{
        flex: 1,
        padding: spacing['2xl'],
        borderRadius: spacing.radius.xl,
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        boxShadow: `0 4px 24px ${colors.shadow.light}`,
      }}
    >
      {/* Header */}
      <Group gap={spacing.md} mb={spacing.xl}>
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: spacing.radius.lg,
            background: step.colorConfig.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box style={{ color: step.colorConfig.primary }}>{step.icon}</Box>
        </Box>
        <Box>
          <Text
            fw={700}
            size="xl"
            c={colors.gray[900]}
            style={{ fontFamily: typography.fontFamily.primary }}
          >
            {step.title}
          </Text>
          <Text size="sm" c="dimmed">
            {step.description}
          </Text>
        </Box>
      </Group>

      {/* Content area */}
      {children || (
        <Box
          style={{
            padding: spacing['3xl'],
            borderRadius: spacing.radius.xl,
            border: `2px dashed ${step.colorConfig.border}`,
            background: `${step.colorConfig.light}30`,
            textAlign: 'center',
          }}
        >
          <Stack gap={spacing.md} align="center">
            <Text size="lg" c={colors.gray[600]}>
              Make a selection to continue
            </Text>
            <Group gap={spacing.sm}>
              <Button
                variant="light"
                color="teal"
                size="lg"
                rightSection={<IconArrowRight size={18} />}
              >
                Choose nationwide
              </Button>
              <Button variant="subtle" color="gray" size="lg">
                Browse all options
              </Button>
            </Group>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

export function ChecklistVariant() {
  const completedSteps = 1;
  const totalSteps = 3;
  const progress = (completedSteps / totalSteps) * 100;

  const steps = [
    {
      id: 'policy',
      title: 'Select policy',
      subtitle: 'Current law',
      description: 'Choose a baseline policy for your analysis',
      icon: <IconScale size={18} />,
      colorConfig: { primary: colors.secondary[500], light: colors.secondary[50], border: colors.secondary[200] },
      status: 'complete' as const,
    },
    {
      id: 'population',
      title: 'Choose population',
      subtitle: 'Not selected',
      description: 'Select who you want to analyze',
      icon: <IconUsers size={18} />,
      colorConfig: { primary: colors.primary[500], light: colors.primary[50], border: colors.primary[200] },
      status: 'current' as const,
    },
    {
      id: 'dynamics',
      title: 'Add dynamics',
      subtitle: 'Optional',
      description: 'Configure behavioral responses',
      icon: <IconChartLine size={18} />,
      colorConfig: { primary: colors.gray[500], light: colors.gray[50], border: colors.gray[200] },
      status: 'pending' as const,
    },
  ];

  const currentStep = steps.find((s) => s.status === 'current');

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: colors.gray[50],
        padding: `${spacing.lg} ${spacing['3xl']}`,
      }}
    >
      {/* Header */}
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
          Variant 4: Checklist with progress tracking
        </Text>
      </Box>

      <Box style={{ display: 'flex', gap: spacing['2xl'] }}>
        {/* Left sidebar - Checklist */}
        <Paper
          style={{
            width: 320,
            padding: spacing.xl,
            borderRadius: spacing.radius.xl,
            background: colors.white,
            border: `1px solid ${colors.border.light}`,
            boxShadow: `0 4px 24px ${colors.shadow.light}`,
            flexShrink: 0,
            alignSelf: 'flex-start',
          }}
        >
          {/* Progress header */}
          <Box mb={spacing.xl}>
            <Group justify="space-between" mb={spacing.sm}>
              <Text size="sm" fw={600} c={colors.gray[700]}>
                Setup progress
              </Text>
              <Badge color="teal" variant="light" size="sm">
                {completedSteps}/{totalSteps} complete
              </Badge>
            </Group>
            <Progress
              value={progress}
              size="sm"
              color="teal"
              radius="xl"
              style={{ background: colors.gray[100] }}
            />
            <Text size="xs" c="dimmed" mt={spacing.xs}>
              {Math.round(progress)}% complete
            </Text>
          </Box>

          {/* Checklist items */}
          <Stack gap={spacing.sm}>
            {steps.map((step) => (
              <ChecklistItem
                key={step.id}
                icon={step.icon}
                title={step.title}
                subtitle={step.subtitle}
                status={step.status}
              />
            ))}
          </Stack>

          {/* Run button */}
          <Box mt={spacing.xl} pt={spacing.xl} style={{ borderTop: `1px solid ${colors.gray[200]}` }}>
            <Button
              fullWidth
              size="lg"
              disabled
              leftSection={<IconPlayerPlay size={18} />}
              style={{
                fontFamily: typography.fontFamily.primary,
                fontWeight: 600,
              }}
            >
              Run analysis
            </Button>
            <Text size="xs" c="dimmed" ta="center" mt={spacing.sm}>
              Complete all required steps to run
            </Text>
          </Box>
        </Paper>

        {/* Main content - Current step */}
        {currentStep && (
          <MainContentPanel step={currentStep} />
        )}
      </Box>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </Box>
  );
}
