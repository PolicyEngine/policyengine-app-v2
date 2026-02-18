/**
 * ModifyReportDemo - Prototype for viewing and modifying a completed report's configuration
 *
 * Demonstrates the flow:
 * 1. User sees the report output overview with a "Modify" button
 * 2. Clicking "Modify" swaps to the report builder configuration view
 * 3. The configuration shows pre-filled simulation blocks (no empty selection chips)
 * 4. User can edit and "Save as new report"
 */

import { useState } from 'react';
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconChartLine,
  IconClock,
  IconCoin,
  IconCopy,
  IconFileDescription,
  IconHome,
  IconPencil,
  IconPlayerPlay,
  IconScale,
  IconSelector,
  IconSettings,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES, INGREDIENT_COLORS } from './reportBuilder/constants';
import { styles as builderStyles } from './reportBuilder/styles';
import { TopBar } from './reportBuilder/components';
import type { TopBarAction } from './reportBuilder/types';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_REPORT = {
  label: 'Child benefit expansion analysis',
  year: '2025',
  timestamp: 'Ran today at 14:23',
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

const MOCK_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'comparative-analysis', label: 'Comparative analysis' },
  { value: 'policy', label: 'Policy' },
  { value: 'population', label: 'Population' },
  { value: 'dynamics', label: 'Dynamics' },
  { value: 'reproduce', label: 'Reproduce in Python' },
];

// ============================================================================
// MOCK OVERVIEW CONTENT
// ============================================================================

function MockMetricCard({
  icon,
  iconBg,
  label,
  value,
  subtext,
  trend,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subtext: string;
  trend?: 'positive' | 'negative' | 'neutral';
}) {
  const trendColor =
    trend === 'positive' ? colors.primary[600] : trend === 'negative' ? '#e53e3e' : colors.gray[600];

  return (
    <Paper
      p={spacing.xl}
      radius="md"
      style={{
        border: `1px solid ${colors.border.light}`,
        background: colors.white,
      }}
    >
      <Group gap={spacing.md} mb={spacing.md}>
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: spacing.radius.lg,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Text size="sm" c="dimmed" fw={500}>
          {label}
        </Text>
      </Group>
      <Text
        fw={700}
        style={{
          fontSize: '28px',
          fontFamily: typography.fontFamily.primary,
          color: trendColor,
          lineHeight: 1.2,
        }}
      >
        {value}
      </Text>
      <Text size="sm" c="dimmed" mt={spacing.xs}>
        {subtext}
      </Text>
    </Paper>
  );
}

function MockOverviewContent() {
  return (
    <Stack gap={spacing.xl}>
      {/* Hero metric */}
      <Box
        p={spacing.xl}
        style={{
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.background.primary} 100%)`,
          borderRadius: spacing.radius.lg,
          border: `1px solid ${colors.primary[100]}`,
        }}
      >
        <Group gap={spacing.md} mb={spacing.md}>
          <Box
            style={{
              width: 48,
              height: 48,
              borderRadius: spacing.radius.lg,
              background: `linear-gradient(135deg, ${colors.primary[100]} 0%, ${colors.primary[200]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCoin size={24} color={colors.primary[700]} />
          </Box>
          <Box>
            <Text size="sm" c="dimmed" fw={500}>
              Budgetary impact
            </Text>
            <Text size="xs" c="dimmed">
              Annual change in government revenue
            </Text>
          </Box>
        </Group>
        <Text
          fw={700}
          style={{
            fontSize: '36px',
            fontFamily: typography.fontFamily.primary,
            color: colors.primary[700],
          }}
        >
          -$12.4 billion
        </Text>
        <Text size="sm" c="dimmed" mt={spacing.xs}>
          in additional government spending
        </Text>
      </Box>

      {/* Secondary metrics */}
      <SimpleGrid cols={3}>
        <MockMetricCard
          icon={<IconUsers size={20} color={colors.primary[600]} />}
          iconBg={colors.primary[50]}
          label="Poverty impact"
          value="-8.2%"
          subtext="decrease in poverty rate"
          trend="positive"
        />
        <MockMetricCard
          icon={<IconHome size={20} color="#6366f1" />}
          iconBg="#eef2ff"
          label="Winners"
          value="62.3%"
          subtext="of households see gains"
          trend="positive"
        />
        <MockMetricCard
          icon={<IconCoin size={20} color="#e53e3e" />}
          iconBg="#fff5f5"
          label="Losers"
          value="4.1%"
          subtext="of households see losses"
          trend="negative"
        />
      </SimpleGrid>
    </Stack>
  );
}

// ============================================================================
// OUTPUT VIEW (mimics ReportOutputLayout)
// ============================================================================

function OutputView({ onModify }: { onModify: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Container size="xl" px={spacing.xl}>
      <Stack gap={spacing.xl}>
        {/* Header */}
        <Box>
          <Group gap={spacing.xs} align="center" mb={spacing.xs}>
            <Title
              order={1}
              fw={typography.fontWeight.semibold}
              fz={typography.fontSize['3xl']}
            >
              {MOCK_REPORT.label}
            </Title>
            <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Edit report name">
              <IconPencil size={18} />
            </ActionIcon>

            {/* Modify button */}
            <Box
              component="button"
              onClick={onModify}
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                padding: `${spacing.sm} ${spacing.lg}`,
                borderRadius: spacing.radius.lg,
                background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                color: 'white',
                border: 'none',
                fontFamily: typography.fontFamily.primary,
                fontWeight: 600,
                fontSize: FONT_SIZES.normal,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(44, 122, 123, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <IconSettings size={16} />
              <span>Modify</span>
            </Box>
          </Group>

          <Group gap={spacing.xs} align="center">
            <IconCalendar size={16} color={colors.text.secondary} />
            <Text size="sm" c="dimmed">
              Year: {MOCK_REPORT.year}
            </Text>
            <Text size="sm" c="dimmed">
              &bull;
            </Text>
            <IconClock size={16} color={colors.text.secondary} />
            <Text size="sm" c="dimmed">
              {MOCK_REPORT.timestamp}
            </Text>
          </Group>
        </Box>

        {/* Tab navigation */}
        <Box
          style={{
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.md,
          }}
        >
          <Box
            style={{
              display: 'flex',
              position: 'relative',
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            {MOCK_TABS.map((tab, i) => (
              <Box
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  paddingLeft: spacing.sm,
                  paddingRight: spacing.sm,
                  paddingBottom: spacing.xs,
                  paddingTop: spacing.xs,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  borderRight: i < MOCK_TABS.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                  marginBottom: '-1px',
                }}
              >
                <Text
                  span
                  style={{
                    color: activeTab === tab.value ? colors.text.primary : colors.gray[700],
                    fontWeight: activeTab === tab.value ? typography.fontWeight.medium : typography.fontWeight.normal,
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  {tab.label}
                </Text>
                {activeTab === tab.value && (
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: colors.primary[700],
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Content */}
        <MockOverviewContent />
      </Stack>
    </Container>
  );
}

// ============================================================================
// MODIFY VIEW (report builder configuration)
// ============================================================================

type IngredientType = 'policy' | 'population' | 'dynamics';

function ConfiguredIngredient({
  icon,
  label,
  description,
  colorConfig,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  colorConfig: { icon: string; bg: string; border: string };
}) {
  return (
    <Box
      style={{
        ...builderStyles.chipSquare,
        background: colorConfig.bg,
        borderColor: colorConfig.border,
        borderWidth: 2,
        boxShadow: `0 0 0 2px ${colorConfig.bg}`,
        position: 'relative',
      }}
    >
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

function IngredientPanel({ type, config }: {
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
        ...builderStyles.ingredientSection,
        borderColor: colors.border.light,
        background: colors.white,
      }}
    >
      <Box style={builderStyles.ingredientSectionHeader}>
        <Box
          style={{
            ...builderStyles.ingredientSectionIcon,
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

      <Box style={builderStyles.chipGridSquare}>
        {type === 'policy' && config && (
          <ConfiguredIngredient
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
          <ConfiguredIngredient
            icon={<IconUsers size={16} color={colorConfig.icon} />}
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

function SimulationCard({ simulation, index }: {
  simulation: typeof MOCK_REPORT.simulations[0];
  index: number;
}) {
  return (
    <Paper
      style={{
        ...builderStyles.simulationCard,
        ...builderStyles.simulationCardActive,
      }}
    >
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

      <Box style={builderStyles.simulationHeader}>
        <Group gap={spacing.xs}>
          <Text style={{ ...builderStyles.simulationTitle, marginRight: 8 }}>
            {simulation.label}
          </Text>
          <ActionIcon size="xs" variant="subtle" color="gray">
            <IconPencil size={12} />
          </ActionIcon>
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

      <IngredientPanel
        type="policy"
        config={{
          label: simulation.policy.label,
          description: 'paramCount' in simulation.policy
            ? `${simulation.policy.paramCount} params changed`
            : 'No changes',
        }}
      />

      <IngredientPanel
        type="population"
        config={{
          label: simulation.population.label,
          populationType: simulation.population.type,
        }}
      />

      <IngredientPanel type="dynamics" />
    </Paper>
  );
}

const MODIFY_ACTIONS: TopBarAction[] = [
  {
    key: 'save-new',
    label: 'Save as new report',
    icon: <IconPlayerPlay size={16} />,
    onClick: () => {},
    variant: 'primary',
  },
  {
    key: 'copy',
    label: 'Duplicate',
    icon: <IconCopy size={16} />,
    onClick: () => {},
    variant: 'secondary',
  },
];

function ModifyView({ onBack }: { onBack: () => void }) {
  return (
    <Box style={builderStyles.pageContainer}>
      <Box style={builderStyles.headerSection}>
        <Group gap={spacing.sm} mb={spacing.xs}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={onBack}
            aria-label="Back to report output"
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <h1 style={builderStyles.mainTitle}>Modify report</h1>
        </Group>
        <Text
          c={colors.gray[500]}
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: FONT_SIZES.normal,
            marginLeft: 44,
          }}
        >
          Edit configuration and save as a new report
        </Text>
      </Box>

      <TopBar actions={MODIFY_ACTIONS}>
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
      </TopBar>

      {/* Simulation blocks */}
      <Box style={builderStyles.canvasContainer}>
        <Box style={builderStyles.canvasGrid} />
        <Box style={builderStyles.simulationsGrid}>
          {MOCK_REPORT.simulations.map((sim, i) => (
            <SimulationCard key={i} simulation={sim} index={i} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ModifyReportDemoPage() {
  const [view, setView] = useState<'output' | 'modify'>('output');

  if (view === 'modify') {
    return <ModifyView onBack={() => setView('output')} />;
  }

  return <OutputView onModify={() => setView('modify')} />;
}
