import { useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import {
  Collapsible,
  CollapsibleContent,
  Group,
  SegmentedControl,
  Stack,
  Text,
} from '@/components/ui';
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
  const [opened, setOpened] = useState(defaultOpen);
  const ChevronIcon = opened ? IconChevronDown : IconChevronRight;

  return (
    <Collapsible open={opened} onOpenChange={setOpened}>
      <div
        style={{
          paddingTop: spacing['3xl'],
          borderTop: `1px solid ${colors.border.light}`,
        }}
      >
        <Group justify="space-between" align="center">
          <button
            type="button"
            onClick={() => setOpened(!opened)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Group gap="xs" align="center">
              <ChevronIcon size={14} color={colors.text.secondary} />
              <Text
                size="xs"
                fw={typography.fontWeight.semibold}
                c={colors.text.secondary}
                className="tw:uppercase"
                style={{ letterSpacing: '0.06em' }}
              >
                {label}
              </Text>
            </Group>
          </button>
          {opened && right}
        </Group>
      </div>
      <CollapsibleContent>
        <Stack gap="xl" style={{ paddingTop: spacing.xl }}>
          {children}
        </Stack>
      </CollapsibleContent>
    </Collapsible>
  );
}

type DistributionalMode = 'absolute' | 'relative' | 'intra-decile';

const DISTRIBUTIONAL_MODE_OPTIONS = [
  { label: 'Absolute decile impacts', value: 'absolute' as DistributionalMode },
  { label: 'Relative decile impacts', value: 'relative' as DistributionalMode },
  { label: 'Intra-decile impacts', value: 'intra-decile' as DistributionalMode },
];

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
              onValueChange={(value) => setWealthMode(value as DistributionalMode)}
              size="xs"
              options={DISTRIBUTIONAL_MODE_OPTIONS}
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
    <Stack gap="xl">
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
