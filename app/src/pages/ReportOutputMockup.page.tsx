import {
  IconCalendar,
  IconChevronRight,
  IconClock,
  IconCode,
  IconSettings,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Box,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { ShareButton } from '@/components/common/ActionButtons';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import BudgetaryImpactSubPage from './report-output/budgetary-impact/BudgetaryImpactSubPage';
import DistributionalImpactIncomeRelativeSubPage from './report-output/distributional-impact/DistributionalImpactIncomeRelativeSubPage';
import WinnersLosersIncomeDecileSubPage from './report-output/distributional-impact/WinnersLosersIncomeDecileSubPage';
import InequalityImpactSubPage from './report-output/inequality-impact/InequalityImpactSubPage';
import PovertyImpactByAgeSubPage from './report-output/poverty-impact/PovertyImpactByAgeSubPage';
import SocietyWideOverview from './report-output/SocietyWideOverview';

/**
 * Hardcoded mock data representing a typical US CTC-expansion reform.
 * This matches the ReportOutputSocietyWideUS interface exactly.
 */
const MOCK_OUTPUT: ReportOutputSocietyWideUS = {
  budget: {
    baseline_net_income: 15_000_000_000_000,
    benefit_spending_impact: 52_500_000_000,
    budgetary_impact: -50_000_000_000,
    households: 130_000_000,
    state_tax_revenue_impact: 500_000_000,
    tax_revenue_impact: 2_500_000_000,
  },
  cliff_impact: null,
  congressional_district_impact: null,
  constituency_impact: null,
  data_version: 'mock-2025',
  decile: {
    relative: {
      '1': 0.035,
      '2': 0.028,
      '3': 0.022,
      '4': 0.018,
      '5': 0.012,
      '6': 0.008,
      '7': 0.005,
      '8': 0.003,
      '9': 0.001,
      '10': -0.001,
    },
    average: {
      '1': 450,
      '2': 520,
      '3': 580,
      '4': 550,
      '5': 420,
      '6': 350,
      '7': 250,
      '8': 180,
      '9': 70,
      '10': -100,
    },
  },
  detailed_budget: {},
  inequality: {
    gini: { baseline: 0.407, reform: 0.401 },
    top_10_pct_share: { baseline: 0.295, reform: 0.291 },
    top_1_pct_share: { baseline: 0.098, reform: 0.097 },
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0.15,
      'Gain less than 5%': 0.25,
      'No change': 0.35,
      'Lose less than 5%': 0.15,
      'Lose more than 5%': 0.1,
    },
    deciles: {
      'Gain more than 5%': [0.45, 0.35, 0.25, 0.2, 0.15, 0.1, 0.08, 0.05, 0.03, 0.01],
      'Gain less than 5%': [0.3, 0.35, 0.35, 0.3, 0.28, 0.25, 0.2, 0.18, 0.15, 0.05],
      'No change': [0.1, 0.12, 0.18, 0.25, 0.3, 0.35, 0.4, 0.42, 0.45, 0.5],
      'Lose less than 5%': [0.1, 0.12, 0.14, 0.15, 0.16, 0.18, 0.18, 0.2, 0.22, 0.24],
      'Lose more than 5%': [0.05, 0.06, 0.08, 0.1, 0.11, 0.12, 0.14, 0.15, 0.15, 0.2],
    },
  },
  intra_wealth_decile: null,
  labor_supply_response: {
    decile: {
      average: {
        income: {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
        },
        substitution: {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
        },
      },
      relative: {
        income: {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
        },
        substitution: {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
        },
      },
    },
    hours: {
      baseline: 0,
      change: 0,
      income_effect: 0,
      reform: 0,
      substitution_effect: 0,
    },
    income_lsr: 0,
    relative_lsr: { income: 0, substitution: 0 },
    revenue_change: 0,
    substitution_lsr: 0,
    total_change: 0,
  },
  model_version: 'mock-v1',
  poverty: {
    poverty: {
      child: { baseline: 0.12, reform: 0.105 },
      adult: { baseline: 0.095, reform: 0.09 },
      senior: { baseline: 0.085, reform: 0.082 },
      all: { baseline: 0.1, reform: 0.094 },
    },
    deep_poverty: {
      child: { baseline: 0.05, reform: 0.042 },
      adult: { baseline: 0.04, reform: 0.038 },
      senior: { baseline: 0.035, reform: 0.034 },
      all: { baseline: 0.042, reform: 0.039 },
    },
  },
  poverty_by_gender: {
    poverty: {
      female: { baseline: 0.11, reform: 0.103 },
      male: { baseline: 0.09, reform: 0.085 },
    },
    deep_poverty: {
      female: { baseline: 0.045, reform: 0.04 },
      male: { baseline: 0.038, reform: 0.035 },
    },
  },
  poverty_by_race: {
    poverty: {
      black: { baseline: 0.18, reform: 0.158 },
      hispanic: { baseline: 0.16, reform: 0.143 },
      white: { baseline: 0.075, reform: 0.072 },
      other: { baseline: 0.1, reform: 0.093 },
    },
  },
  wealth_decile: null,
};

const tooltipStyles = {
  tooltip: {
    backgroundColor: colors.gray[700],
    fontSize: typography.fontSize.xs,
  },
};

/**
 * Section header with a top divider line — groups related charts visually.
 */
function SectionHeader({ label }: { label: string }) {
  return (
    <Box
      pt={spacing['3xl']}
      style={{
        borderTop: `1px solid ${colors.border.light}`,
      }}
    >
      <Text
        size="xs"
        fw={typography.fontWeight.semibold}
        c={colors.text.secondary}
        tt="uppercase"
        style={{ letterSpacing: '0.06em' }}
      >
        {label}
      </Text>
    </Box>
  );
}

/**
 * Mock-up page combining Overview + Comparative Analysis on a single screen.
 * Uses hardcoded data so the layout can be evaluated without a real report.
 */
export default function ReportOutputMockupPage() {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  return (
    <Container size="xl" px={spacing.xl}>
      <Stack gap={spacing.xl}>
        {/* Breadcrumb */}
        <Group gap={4} align="center" style={{ marginBottom: `-${spacing.md}` }}>
          <Text
            size="sm"
            c="dimmed"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/${countryId}/reports`)}
          >
            Reports
          </Text>
          <IconChevronRight size={12} color={colors.gray[400]} />
          <Text size="sm" c={colors.text.primary}>
            Sample policy reform report
          </Text>
        </Group>

        {/* Header */}
        <Box>
          <Group
            gap={spacing.xs}
            align="center"
            mb={spacing.xs}
            justify="space-between"
            wrap="nowrap"
          >
            <Title
              order={1}
              variant="colored"
              fw={typography.fontWeight.semibold}
              fz={typography.fontSize['3xl']}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              Sample policy reform report
            </Title>
            <Group gap="xs" style={{ flexShrink: 0 }}>
              <Tooltip
                label="Reproduce in Python"
                position="bottom"
                styles={tooltipStyles}
                withArrow
              >
                <ActionIcon variant="light" color="gray" size="lg" aria-label="Reproduce in Python">
                  <IconCode size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="View/edit report" position="bottom" styles={tooltipStyles} withArrow>
                <ActionIcon variant="light" color="gray" size="lg" aria-label="View/edit report">
                  <IconSettings size={18} />
                </ActionIcon>
              </Tooltip>
              <ShareButton />
            </Group>
          </Group>

          <Group gap={spacing.xs} align="center">
            <IconCalendar size={16} color={colors.text.secondary} />
            <Text size="sm" c="dimmed">
              Year: 2025
            </Text>
            <Text size="sm" c="dimmed">
              &bull;
            </Text>
            <IconClock size={16} color={colors.text.secondary} />
            <Text size="sm" c="dimmed">
              Ran today at 10:30:00
            </Text>
          </Group>
        </Box>

        {/* === Overview === */}
        <SocietyWideOverview output={MOCK_OUTPUT} />

        {/* === Budgetary impact === */}
        <SectionHeader label="Budgetary impact" />
        <BudgetaryImpactSubPage output={MOCK_OUTPUT} />

        {/* === Distributional analysis === */}
        <SectionHeader label="Distributional analysis" />
        <DistributionalImpactIncomeRelativeSubPage output={MOCK_OUTPUT} />
        <WinnersLosersIncomeDecileSubPage output={MOCK_OUTPUT} />

        {/* === Social impact — poverty & inequality side by side === */}
        <SectionHeader label="Social impact" />
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={spacing.xl}>
          <PovertyImpactByAgeSubPage output={MOCK_OUTPUT} />
          <InequalityImpactSubPage output={MOCK_OUTPUT} />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
