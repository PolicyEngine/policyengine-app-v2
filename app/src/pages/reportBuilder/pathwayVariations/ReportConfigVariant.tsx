/**
 * ReportConfigVariant - Report configuration variant for re-running reports
 *
 * Key changes from base report builder (≤10%):
 * - Title: "Report configuration" with "Modify and re-run" subtitle
 * - Pre-filled mock data showing a previously-run report
 * - Small edit icons on configured ingredients for quick changes
 * - "Re-run" button instead of "Run"
 * - Subtle "last run" timestamp indicator
 */

import { Box, Group, Paper, Text } from '@mantine/core';
import {
  IconCheck,
  IconChartLine,
  IconCopy,
  IconFileDescription,
  IconHome,
  IconPencil,
  IconPlayerPlay,
  IconRefresh,
  IconScale,
  IconSelector,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES, INGREDIENT_COLORS } from '../constants';
import { styles } from '../styles';
import { CountryMapIcon, TopBar } from '../components';
import type { TopBarAction } from '../types';

// Mock pre-filled data representing a previously-run report
const MOCK_REPORT = {
  label: 'Child benefit expansion analysis',
  year: '2025',
  lastRun: '2 hours ago',
  simulations: [
    {
      label: 'Baseline simulation',
      policy: { id: 'current-law', label: 'Current law' },
      population: { id: 'us-nationwide', label: 'US nationwide', type: 'geography' as const },
    },
    {
      label: 'Reform simulation',
      policy: { id: 'policy-123', label: 'CTC expansion', paramCount: 3 },
      population: { id: 'us-nationwide', label: 'US nationwide', type: 'geography' as const },
    },
  ],
};

type IngredientType = 'policy' | 'population' | 'dynamics';

interface ConfiguredChipProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  colorConfig: { icon: string; bg: string; border: string };
}

function ConfiguredChip({ icon, label, description, colorConfig }: ConfiguredChipProps) {
  return (
    <Box
      style={{
        ...styles.chipSquare,
        background: colorConfig.bg,
        borderColor: colorConfig.border,
        borderWidth: 2,
        boxShadow: `0 0 0 2px ${colorConfig.bg}`,
        position: 'relative',
      }}
    >
      {/* Edit affordance */}
      <Box
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 18,
          height: 18,
          borderRadius: spacing.radius.sm,
          background: colors.white,
          border: `1px solid ${colorConfig.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: 0.7,
          transition: 'opacity 0.15s ease',
        }}
      >
        <IconPencil size={10} color={colorConfig.icon} />
      </Box>

      <Box
        style={{
          width: 28,
          height: 28,
          borderRadius: spacing.radius.sm,
          background: colors.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Text
        ta="center"
        fw={600}
        c={colorConfig.icon}
        style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
      >
        {label}
      </Text>
      {description && (
        <Text
          ta="center"
          c={colors.gray[500]}
          style={{ fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
        >
          {description}
        </Text>
      )}
    </Box>
  );
}

function IngredientSection({ type, config }: {
  type: IngredientType;
  config?: { label: string; description?: string; populationType?: string };
}) {
  const colorConfig = INGREDIENT_COLORS[type];
  const IconComponent = {
    policy: IconScale,
    population: IconUsers,
    dynamics: IconChartLine,
  }[type];

  const typeLabels = {
    policy: 'Policy',
    population: 'Household(s)',
    dynamics: 'Dynamics',
  };

  return (
    <Box
      style={{
        ...styles.ingredientSection,
        borderColor: colors.border.light,
        background: colors.white,
      }}
    >
      <Box style={styles.ingredientSectionHeader}>
        <Box
          style={{
            ...styles.ingredientSectionIcon,
            background: colorConfig.bg,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <IconComponent size={16} color={colorConfig.icon} stroke={2} />
        </Box>
        <Text fw={600} c={colorConfig.icon} style={{ fontSize: FONT_SIZES.normal, userSelect: 'none' }}>
          {typeLabels[type]}
        </Text>
      </Box>

      <Box style={styles.chipGridSquare}>
        {type === 'policy' && config && (
          <ConfiguredChip
            icon={
              config.label === 'Current law'
                ? <IconScale size={16} color={colorConfig.icon} />
                : <IconFileDescription size={16} color={colorConfig.icon} />
            }
            label={config.label}
            description={config.description}
            colorConfig={colorConfig}
          />
        )}

        {type === 'population' && config && (
          <ConfiguredChip
            icon={
              config.populationType === 'household'
                ? <IconHome size={16} color={colorConfig.icon} />
                : <CountryMapIcon countryId="us" size={16} color={colorConfig.icon} />
            }
            label={config.label}
            description={config.populationType === 'household' ? 'Household' : 'Nationwide'}
            colorConfig={colorConfig}
          />
        )}

        {type === 'dynamics' && (
          <Box
            style={{
              padding: spacing.md,
              background: colors.white,
              borderRadius: spacing.radius.md,
              border: `1px dashed ${colorConfig.border}`,
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Group gap={spacing.sm}>
              <IconSparkles size={18} color={colorConfig.accent} />
              <Text c={colorConfig.icon} style={{ fontSize: FONT_SIZES.normal }}>
                Dynamics coming soon
              </Text>
            </Group>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function SimulationBlock({ simulation, index }: {
  simulation: typeof MOCK_REPORT.simulations[0];
  index: number;
}) {
  return (
    <Paper
      style={{
        ...styles.simulationCard,
        ...styles.simulationCardActive,
      }}
    >
      {/* Status indicator - always active since this is a configured report */}
      <Box
        style={{
          position: 'absolute',
          top: -1,
          left: 20,
          right: 20,
          height: 4,
          borderRadius: '0 0 4px 4px',
          background: `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})`,
        }}
      />

      {/* Header */}
      <Box style={styles.simulationHeader}>
        <Group gap={spacing.sm}>
          <Group gap={spacing.xs}>
            <Text style={{ ...styles.simulationTitle, marginRight: 8 }}>
              {simulation.label}
            </Text>
            <Box
              style={{
                width: 16,
                height: 16,
                borderRadius: spacing.radius.sm,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: colors.gray[400],
              }}
            >
              <IconPencil size={12} />
            </Box>
          </Group>
        </Group>

        <Group gap={spacing.xs}>
          {index === 0 && (
            <Text c="dimmed" fs="italic" style={{ fontSize: FONT_SIZES.small }}>
              Required
            </Text>
          )}
          <Box
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: colors.success,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCheck size={12} color="white" stroke={3} />
          </Box>
        </Group>
      </Box>

      <IngredientSection
        type="policy"
        config={{
          label: simulation.policy.label,
          description: 'paramCount' in simulation.policy
            ? `${simulation.policy.paramCount} params changed`
            : 'No changes',
        }}
      />

      <IngredientSection
        type="population"
        config={{
          label: simulation.population.label,
          populationType: simulation.population.type,
        }}
      />

      <IngredientSection type="dynamics" />
    </Paper>
  );
}

const REPORT_CONFIG_ACTIONS: TopBarAction[] = [
  {
    key: 'rerun',
    label: 'Re-run',
    icon: <IconPlayerPlay size={16} />,
    onClick: () => {},
    variant: 'primary',
  },
  {
    key: 'copy',
    label: 'Copy report',
    icon: <IconCopy size={16} />,
    onClick: () => {},
    variant: 'secondary',
  },
];

export function ReportConfigVariant() {
  return (
    <Box style={styles.pageContainer}>
      <Box style={styles.headerSection}>
        <h1 style={styles.mainTitle}>Report configuration</h1>
        <Text
          c={colors.gray[500]}
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: FONT_SIZES.normal,
            marginTop: spacing.xs,
          }}
        >
          Modify and re-run your analysis
        </Text>
      </Box>

      <TopBar actions={REPORT_CONFIG_ACTIONS}>
        {/* Icon segment */}
        <Box
          style={{
            width: 44,
            height: 44,
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
            flex: 1,
            minWidth: 0,
            height: 44,
            borderRadius: spacing.radius.lg,
            background: colors.white,
            border: `1px solid ${colors.primary[200]}`,
            boxShadow: `0 2px 8px ${colors.shadow.light}`,
            padding: `0 ${spacing.lg}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            cursor: 'pointer',
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
            {MOCK_REPORT.label}
          </Text>
          <IconPencil size={12} color={colors.gray[400]} style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </Box>

        {/* Year segment */}
        <Box
          style={{
            height: 44,
            borderRadius: spacing.radius.lg,
            background: colors.white,
            border: `1px solid ${colors.primary[200]}`,
            boxShadow: `0 2px 8px ${colors.shadow.light}`,
            padding: `0 ${spacing.lg}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Text
            c={colors.primary[500]}
            fw={600}
            style={{
              fontSize: FONT_SIZES.tiny,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Year
          </Text>
          <Text
            fw={500}
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.normal,
              color: colors.gray[700],
            }}
          >
            {MOCK_REPORT.year}
          </Text>
          <IconSelector size={12} color={colors.gray[400]} />
        </Box>

        {/* Last run segment */}
        <Box
          style={{
            height: 44,
            borderRadius: spacing.radius.lg,
            background: colors.gray[50],
            border: `1px solid ${colors.gray[200]}`,
            padding: `0 ${spacing.md}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            flexShrink: 0,
          }}
        >
          <IconRefresh size={14} color={colors.gray[400]} />
          <Text
            c={colors.gray[500]}
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.small,
              whiteSpace: 'nowrap',
            }}
          >
            {MOCK_REPORT.lastRun}
          </Text>
        </Box>
      </TopBar>

      {/* Canvas with simulation blocks */}
      <Box style={styles.canvasContainer}>
        <Box style={styles.canvasGrid} />
        <Box style={styles.simulationsGrid}>
          {MOCK_REPORT.simulations.map((sim, i) => (
            <SimulationBlock key={i} simulation={sim} index={i} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
