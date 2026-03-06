import { useState } from 'react';
import { IconChartBar, IconCoin, IconHome, IconUsers } from '@tabler/icons-react';
import {
  Box,
  Container,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import DashboardCard from '@/components/report/DashboardCard';
import { colors, spacing, typography } from '@/designTokens';
import BudgetaryImpactSubPage from '@/pages/report-output/budgetary-impact/BudgetaryImpactSubPage';
import WinnersLosersIncomeDecileSubPage from '@/pages/report-output/distributional-impact/WinnersLosersIncomeDecileSubPage';
import InequalityImpactSubPage from '@/pages/report-output/inequality-impact/InequalityImpactSubPage';
import PovertyImpactByAgeSubPage from '@/pages/report-output/poverty-impact/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from '@/pages/report-output/poverty-impact/PovertyImpactByGenderSubPage';
import {
  MiniBudgetaryChart,
  MiniInequalityChart,
  MiniPovertyChart,
  MiniWinnersLosersChart,
} from './miniCharts';
import { mockOutput } from './mockOutput';

const ICON_SIZE = 36;

function cardHeader(
  IconComponent: React.ComponentType<{ size: number; color: string; stroke: number }>,
  labelText: string
) {
  return (
    <Group gap={spacing.md} align="center">
      <Box
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.gray[100],
          borderRadius: spacing.xs,
          flexShrink: 0,
        }}
      >
        <IconComponent size={20} color={colors.gray[600]} stroke={1.5} />
      </Box>
      <Text
        size="xs"
        fw={typography.fontWeight.medium}
        c={colors.text.secondary}
        tt="uppercase"
        style={{ letterSpacing: '0.05em' }}
      >
        {labelText}
      </Text>
    </Group>
  );
}

type CardKey = 'budget' | 'poverty' | 'winners' | 'inequality';

const GRID_GAP = 16; // matches spacing.lg

const segmentedControlStyles = {
  root: {
    background: colors.gray[100],
    borderRadius: spacing.radius.md,
  },
  indicator: {
    background: colors.white,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};

function PovertyExpandedContent({ output }: { output: SocietyWideReportOutput }) {
  const [breakdown, setBreakdown] = useState<'by-age' | 'by-gender'>('by-age');

  return (
    <Stack gap={spacing.md}>
      <SegmentedControl
        value={breakdown}
        onChange={(v) => setBreakdown(v as 'by-age' | 'by-gender')}
        size="xs"
        data={[
          { label: 'By age', value: 'by-age' },
          { label: 'By gender', value: 'by-gender' },
        ]}
        styles={segmentedControlStyles}
      />
      {breakdown === 'by-age' ? (
        <PovertyImpactByAgeSubPage output={output} />
      ) : (
        <PovertyImpactByGenderSubPage output={output} />
      )}
    </Stack>
  );
}

export default function PlaygroundPage() {
  // null = nothing expanded, otherwise the key of the expanded card
  const [expandedCard, setExpandedCard] = useState<CardKey | null>(null);

  const toggle = (key: CardKey) => {
    setExpandedCard((prev) => (prev === key ? null : key));
  };

  const modeOf = (key: CardKey) => (expandedCard === key ? 'expanded' : 'shrunken');
  const zOf = (key: CardKey) => (expandedCard === key ? 10 : 1);

  return (
    <Container size="xl" px={spacing.xl} py={spacing.xl}>
      <Stack gap={spacing.xl}>
        <Stack gap={spacing.xs}>
          <Title order={3}>Report output playground</Title>
          <Text size="sm" c="dimmed">
            Experimental dashboard card layout. Click a card to expand it.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={GRID_GAP}>
          {/* Top-left: expands down & to the right */}
          <DashboardCard
            shrunkenHeader={cardHeader(IconCoin, 'Budgetary impact')}
            shrunkenBody={<MiniBudgetaryChart output={mockOutput} />}
            mode={modeOf('budget')}
            zIndex={zOf('budget')}
            expandDirection="down-right"
            gridGap={GRID_GAP}
            expandedContent={<BudgetaryImpactSubPage output={mockOutput} />}
            onToggleMode={() => toggle('budget')}
          />

          {/* Top-right: expands down & to the left */}
          <DashboardCard
            shrunkenHeader={cardHeader(IconHome, 'Poverty impact')}
            shrunkenBody={<MiniPovertyChart output={mockOutput} />}
            mode={modeOf('poverty')}
            zIndex={zOf('poverty')}
            expandDirection="down-left"
            gridGap={GRID_GAP}
            expandedContent={<PovertyExpandedContent output={mockOutput} />}
            onToggleMode={() => toggle('poverty')}
          />

          {/* Bottom-left: expands up & to the right */}
          <DashboardCard
            shrunkenHeader={cardHeader(IconUsers, 'Winners and losers')}
            shrunkenBody={<MiniWinnersLosersChart output={mockOutput} />}
            mode={modeOf('winners')}
            zIndex={zOf('winners')}
            expandDirection="up-right"
            gridGap={GRID_GAP}
            expandedContent={<WinnersLosersIncomeDecileSubPage output={mockOutput} />}
            onToggleMode={() => toggle('winners')}
          />

          {/* Bottom-right: expands up & to the left */}
          <DashboardCard
            shrunkenHeader={cardHeader(IconChartBar, 'Inequality impact')}
            shrunkenBody={<MiniInequalityChart output={mockOutput} />}
            mode={modeOf('inequality')}
            zIndex={zOf('inequality')}
            expandDirection="up-left"
            gridGap={GRID_GAP}
            expandedContent={<InequalityImpactSubPage output={mockOutput} />}
            onToggleMode={() => toggle('inequality')}
          />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
