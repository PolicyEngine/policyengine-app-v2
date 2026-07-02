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
  // `report` and `simulations` are currently unused because the congressional
  // district impact map (which needed them) is disabled below; kept on the
  // props interface so re-enabling that map doesn't change this component's API.
  geographies,
}: MigrationSubPageProps) {
  const countryId = useCurrentCountry();
  const [wealthMode, setWealthMode] = useState<DistributionalMode>('absolute');

  // UK constituency/local authority sections: only for national or country-level reports
  const hasLocalLevelGeography = geographies?.some((g) => isUKLocalLevelGeography(g));
  const showUKGeographySections = countryId === 'uk' && !hasLocalLevelGeography;

  // Congressional district impact map is disabled for now. It rendered on every
  // US report (recomputed live via CongressionalDistrictDataProvider); existing
  // reports remain fully viewable without it. To re-enable, restore the provider
  // wrapper in the return and the CongressionalDistrictDataProvider import, and
  // derive this from countryId === 'us' && reform && baseline && year.
  const canShowCongressional = false;

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

  return <Stack gap="xl">{stackChildren}</Stack>;
}
