/**
 * GuidedFunnelVariant - Vertical funnel with connecting arrows
 *
 * Key changes from base:
 * - Vertical funnel layout with clear flow
 * - Animated connecting arrows between steps
 * - Progress narrows as you complete steps (funnel metaphor)
 * - Large "NEXT" indicator on current step
 */

import { Box, Group, Text, Button } from '@mantine/core';
import {
  IconCheck,
  IconChevronDown,
  IconScale,
  IconUsers,
  IconChartLine,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';

interface FunnelStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'complete' | 'current' | 'locked';
  colorConfig: { primary: string; light: string; border: string };
  widthPercent: number;
  showArrow?: boolean;
}

function FunnelStep({
  icon,
  title,
  description,
  status,
  colorConfig,
  widthPercent,
  showArrow = true,
}: FunnelStepProps) {
  const isComplete = status === 'complete';
  const isCurrent = status === 'current';
  const isLocked = status === 'locked';

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box
        style={{
          width: `${widthPercent}%`,
          minWidth: 400,
          maxWidth: 700,
          background: isLocked ? colors.gray[50] : colors.white,
          borderRadius: spacing.radius.xl,
          border: isCurrent
            ? `2px solid ${colorConfig.primary}`
            : `1px solid ${isLocked ? colors.gray[200] : colorConfig.border}`,
          padding: spacing.xl,
          position: 'relative',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isCurrent
            ? `0 8px 32px ${colorConfig.light}, 0 0 0 4px ${colorConfig.light}`
            : isComplete
              ? `0 4px 16px ${colorConfig.light}`
              : 'none',
          opacity: isLocked ? 0.5 : 1,
        }}
      >
        {/* Status indicator */}
        {isComplete && (
          <Box
            style={{
              position: 'absolute',
              top: -12,
              right: 20,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colorConfig.primary} 0%, ${colors.primary[700]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${colorConfig.primary}60`,
            }}
          >
            <IconCheck size={14} color={colors.white} stroke={3} />
          </Box>
        )}

        {/* NEXT indicator */}
        {isCurrent && (
          <Box
            style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: `linear-gradient(135deg, ${colorConfig.primary} 0%, ${colors.primary[600]} 100%)`,
              color: colors.white,
              padding: `${spacing.xs} ${spacing.lg}`,
              borderRadius: spacing.radius.lg,
              fontFamily: typography.fontFamily.primary,
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.1em',
              boxShadow: `0 4px 12px ${colorConfig.primary}40`,
              animation: 'glow 2s ease-in-out infinite',
            }}
          >
            NEXT STEP
          </Box>
        )}

        <Group justify="space-between" align="flex-start">
          <Group gap={spacing.md}>
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: spacing.radius.lg,
                background: isLocked ? colors.gray[100] : colorConfig.light,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              {icon}
            </Box>
            <Box>
              <Text
                fw={600}
                size="lg"
                c={isLocked ? colors.gray[400] : colors.gray[900]}
                style={{ fontFamily: typography.fontFamily.primary }}
              >
                {title}
              </Text>
              <Text size="sm" c={isLocked ? colors.gray[400] : colors.gray[600]}>
                {description}
              </Text>
            </Box>
          </Group>

          {isCurrent && (
            <Button
              variant="light"
              color="teal"
              size="md"
              style={{
                fontFamily: typography.fontFamily.primary,
                fontWeight: 600,
              }}
            >
              Select
            </Button>
          )}

          {isComplete && (
            <Text size="sm" c={colorConfig.primary} fw={500}>
              Selected: Current law
            </Text>
          )}

          {isLocked && (
            <Text size="xs" c="dimmed" fs="italic">
              Complete previous steps first
            </Text>
          )}
        </Group>
      </Box>

      {/* Connecting arrow */}
      {showArrow && (
        <Box
          style={{
            height: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            style={{
              width: 2,
              height: 20,
              background: isComplete
                ? `linear-gradient(180deg, ${colorConfig.primary} 0%, ${colors.primary[300]} 100%)`
                : colors.gray[200],
              transition: 'all 0.3s ease',
            }}
          />
          <IconChevronDown
            size={20}
            color={isComplete ? colorConfig.primary : colors.gray[300]}
            style={{
              marginTop: -4,
              animation: isCurrent ? 'bounce 1s ease-in-out infinite' : 'none',
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export function GuidedFunnelVariant() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse at 50% 0%, ${colors.primary[50]} 0%, transparent 50%),
          linear-gradient(180deg, ${colors.gray[50]} 0%, ${colors.background.secondary} 100%)
        `,
        padding: `${spacing.lg} ${spacing['3xl']}`,
      }}
    >
      <Box style={{ marginBottom: spacing['2xl'], textAlign: 'center' }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: '32px',
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.02em',
          }}
        >
          Build your report
        </Text>
        <Text c="dimmed" size="md" mt={spacing.sm}>
          Variant 2: Guided funnel with connecting arrows
        </Text>
      </Box>

      {/* Progress summary */}
      <Box
        style={{
          textAlign: 'center',
          marginBottom: spacing['2xl'],
        }}
      >
        <Group justify="center" gap={spacing.sm}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.primary[500],
            }}
          />
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.gray[200],
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.gray[200],
            }}
          />
        </Group>
        <Text size="sm" c="dimmed" mt={spacing.sm}>
          Step 2 of 3
        </Text>
      </Box>

      {/* Funnel steps */}
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        <FunnelStep
          icon={<IconScale size={24} color={colors.secondary[500]} />}
          title="Select a policy"
          description="Choose current law or create a custom reform policy"
          status="complete"
          colorConfig={{
            primary: colors.secondary[500],
            light: colors.secondary[50],
            border: colors.secondary[200],
          }}
          widthPercent={100}
        />

        <FunnelStep
          icon={<IconUsers size={24} color={colors.primary[500]} />}
          title="Choose your population"
          description="Select nationwide, a specific region, or a custom household"
          status="current"
          colorConfig={{
            primary: colors.primary[500],
            light: colors.primary[50],
            border: colors.primary[200],
          }}
          widthPercent={85}
        />

        <FunnelStep
          icon={<IconChartLine size={24} color={colors.gray[400]} />}
          title="Add dynamics (optional)"
          description="Configure behavioral responses and economic dynamics"
          status="locked"
          colorConfig={{
            primary: colors.gray[500],
            light: colors.gray[50],
            border: colors.gray[200],
          }}
          widthPercent={70}
          showArrow={false}
        />
      </Box>

      {/* Run button */}
      <Box
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: spacing['3xl'],
        }}
      >
        <Button
          size="xl"
          disabled
          leftSection={<IconPlayerPlay size={20} />}
          style={{
            fontFamily: typography.fontFamily.primary,
            fontWeight: 600,
            borderRadius: spacing.radius.xl,
            padding: `${spacing.md} ${spacing['3xl']}`,
          }}
        >
          Run analysis
        </Button>
      </Box>

      <style>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 4px 12px ${colors.primary[500]}40; }
          50% { box-shadow: 0 4px 20px ${colors.primary[500]}60; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
}
