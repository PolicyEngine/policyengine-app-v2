import { useState } from 'react';
import { IconChartBar, IconCoin, IconHome, IconUsers } from '@tabler/icons-react';
import { Container, SegmentedControl, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import DashboardCard from '@/components/report/DashboardCard';
import { colors, spacing } from '@/designTokens';
import BudgetaryImpactSubPage from '@/pages/report-output/budgetary-impact/BudgetaryImpactSubPage';
import WinnersLosersIncomeDecileSubPage from '@/pages/report-output/distributional-impact/WinnersLosersIncomeDecileSubPage';
import InequalityImpactSubPage from '@/pages/report-output/inequality-impact/InequalityImpactSubPage';
import PovertyImpactByAgeSubPage from '@/pages/report-output/poverty-impact/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from '@/pages/report-output/poverty-impact/PovertyImpactByGenderSubPage';
import {
  MiniBudgetaryChart,
  MiniDistributionalChart,
  MiniInequalityChart,
  MiniPovertyChart,
  MiniWinnersLosersChart,
} from './miniCharts';
import { mockOutput } from './mockOutput';

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
            icon={IconCoin}
            label="Budgetary impact"
            mode={modeOf('budget')}
            zIndex={zOf('budget')}
            expandDirection="down-right"
            gridGap={GRID_GAP}
            slides={[<MiniBudgetaryChart key="budget" output={mockOutput} />]}
            expandedContent={<BudgetaryImpactSubPage output={mockOutput} />}
            onToggleMode={() => toggle('budget')}
          />

          {/* Top-right: expands down & to the left */}
          <DashboardCard
            icon={IconHome}
            label="Poverty impact"
            mode={modeOf('poverty')}
            zIndex={zOf('poverty')}
            expandDirection="down-left"
            gridGap={GRID_GAP}
            slides={[
              <MiniPovertyChart key="regular" output={mockOutput} />,
              <MiniPovertyChart key="deep" output={mockOutput} variant="deep" />,
            ]}
            expandedContent={<PovertyExpandedContent output={mockOutput} />}
            onToggleMode={() => toggle('poverty')}
          />

          {/* Bottom-left: expands up & to the right */}
          <DashboardCard
            icon={IconUsers}
            label="Winners and losers"
            mode={modeOf('winners')}
            zIndex={zOf('winners')}
            expandDirection="up-right"
            gridGap={GRID_GAP}
            slides={[
              <MiniWinnersLosersChart key="winners" output={mockOutput} />,
              <MiniDistributionalChart key="dist" output={mockOutput} />,
            ]}
            expandedContent={<WinnersLosersIncomeDecileSubPage output={mockOutput} />}
            onToggleMode={() => toggle('winners')}
          />

          {/* Bottom-right: expands up & to the left */}
          <DashboardCard
            icon={IconChartBar}
            label="Inequality impact"
            mode={modeOf('inequality')}
            zIndex={zOf('inequality')}
            expandDirection="up-left"
            gridGap={GRID_GAP}
            slides={[<MiniInequalityChart key="inequality" output={mockOutput} />]}
            expandedContent={<InequalityImpactSubPage output={mockOutput} />}
            onToggleMode={() => toggle('inequality')}
          />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
