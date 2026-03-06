import { useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { Box, Collapse, Group, SegmentedControl, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { CongressionalDistrictDataProvider } from '@/contexts/CongressionalDistrictDataContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { Geography } from '@/types/ingredients/Geography';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import { isUKLocalLevelGeography } from '@/utils/geographyUtils';
import BudgetaryImpactByProgramSubPage from './budgetary-impact/BudgetaryImpactByProgramSubPage';
import { ConstituencySubPage } from './ConstituencySubPage';
import DistributionalImpactWealthAverageSubPage from './distributional-impact/DistributionalImpactWealthAverageSubPage';
import DistributionalImpactWealthRelativeSubPage from './distributional-impact/DistributionalImpactWealthRelativeSubPage';
import WinnersLosersWealthDecileSubPage from './distributional-impact/WinnersLosersWealthDecileSubPage';
import { LocalAuthoritySubPage } from './LocalAuthoritySubPage';
import SocietyWideOverview from './SocietyWideOverview';

interface MigrationSubPageProps {
  output: SocietyWideReportOutput;
  report?: Report;
  simulations?: Simulation[];
  geographies?: Geography[];
}

function CollapsibleSection({
  label,
  right,
  defaultOpen = true,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure(defaultOpen);
  const ChevronIcon = opened ? IconChevronDown : IconChevronRight;

  return (
    <>
      <Box
        pt={spacing['3xl']}
        style={{
          borderTop: `1px solid ${colors.border.light}`,
        }}
      >
        <Group justify="space-between" align="center">
          <UnstyledButton onClick={toggle}>
            <Group gap={spacing.xs} align="center">
              <ChevronIcon size={14} color={colors.text.secondary} />
              <Text
                size="xs"
                fw={typography.fontWeight.semibold}
                c={colors.text.secondary}
                tt="uppercase"
                style={{ letterSpacing: '0.06em' }}
              >
                {label}
              </Text>
            </Group>
          </UnstyledButton>
          {opened && right}
        </Group>
      </Box>
      <Collapse in={opened}>
        <Stack gap={spacing.xl} pt={spacing.xl}>
          {children}
        </Stack>
      </Collapse>
    </>
  );
}

type DistributionalMode = 'absolute' | 'relative' | 'intra-decile';

const DISTRIBUTIONAL_MODE_OPTIONS = [
  { label: 'Absolute decile impacts', value: 'absolute' as DistributionalMode },
  { label: 'Relative decile impacts', value: 'relative' as DistributionalMode },
  { label: 'Intra-decile impacts', value: 'intra-decile' as DistributionalMode },
];

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

export default function MigrationSubPage({
  output,
  report,
  simulations,
  geographies,
}: MigrationSubPageProps) {
  const countryId = useCurrentCountry();
  const [wealthMode, setWealthMode] = useState<DistributionalMode>('absolute');

  // UK constituency/local authority sections: only for national or country-level reports
  const hasLocalLevelGeography = geographies?.some((g) => isUKLocalLevelGeography(g));
  const showUKGeographySections = countryId === 'uk' && !hasLocalLevelGeography;

  // Congressional district provider props
  const reformPolicyId = simulations?.[1]?.policyId;
  const baselinePolicyId = simulations?.[0]?.policyId;
  const year = report?.year;
  const region = simulations?.[0]?.populationId;
  const canShowCongressional =
    countryId === 'us' && !!reformPolicyId && !!baselinePolicyId && !!year;

  const stackChildren = (
    <>
      <SocietyWideOverview output={output} showCongressionalCard={canShowCongressional} />

      {countryId === 'uk' && (
        <CollapsibleSection label="Budgetary impact by program" defaultOpen={false}>
          <BudgetaryImpactByProgramSubPage output={output} />
        </CollapsibleSection>
      )}

      {countryId === 'uk' && (
        <CollapsibleSection
          label="Wealth distributional analysis"
          defaultOpen={false}
          right={
            <SegmentedControl
              value={wealthMode}
              onChange={(value) => setWealthMode(value as DistributionalMode)}
              size="xs"
              data={DISTRIBUTIONAL_MODE_OPTIONS}
              styles={segmentedControlStyles}
            />
          }
        >
          {wealthMode === 'absolute' && (
            <DistributionalImpactWealthAverageSubPage output={output} />
          )}
          {wealthMode === 'relative' && (
            <DistributionalImpactWealthRelativeSubPage output={output} />
          )}
          {wealthMode === 'intra-decile' && <WinnersLosersWealthDecileSubPage output={output} />}
        </CollapsibleSection>
      )}

      {showUKGeographySections && (
        <>
          <CollapsibleSection label="Constituency impact" defaultOpen={false}>
            <ConstituencySubPage output={output} />
          </CollapsibleSection>

          <CollapsibleSection label="Local authority impact" defaultOpen={false}>
            <LocalAuthoritySubPage output={output} />
          </CollapsibleSection>
        </>
      )}
    </>
  );

  return (
    <Stack gap={spacing.xl}>
      {canShowCongressional ? (
        <CongressionalDistrictDataProvider
          reformPolicyId={reformPolicyId}
          baselinePolicyId={baselinePolicyId}
          year={year}
          region={region}
        >
          {stackChildren}
        </CongressionalDistrictDataProvider>
      ) : (
        stackChildren
      )}
    </Stack>
  );
}
