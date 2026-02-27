import { useMemo, useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import {
  Box,
  Button,
  Collapse,
  Group,
  Progress,
  SegmentedControl,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import {
  CongressionalDistrictDataProvider,
  useCongressionalDistrictData,
} from '@/contexts/CongressionalDistrictDataContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { Geography } from '@/types/ingredients/Geography';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { formatParameterValue } from '@/utils/chartValueUtils';
import { isUKLocalLevelGeography } from '@/utils/geographyUtils';
import { DIVERGING_GRAY_TEAL } from '@/utils/visualization/colorScales';
import BudgetaryImpactByProgramSubPage from './budgetary-impact/BudgetaryImpactByProgramSubPage';
import BudgetaryImpactSubPage from './budgetary-impact/BudgetaryImpactSubPage';
import { ConstituencySubPage } from './ConstituencySubPage';
import DistributionalImpactIncomeAverageSubPage from './distributional-impact/DistributionalImpactIncomeAverageSubPage';
import DistributionalImpactIncomeRelativeSubPage from './distributional-impact/DistributionalImpactIncomeRelativeSubPage';
import DistributionalImpactWealthAverageSubPage from './distributional-impact/DistributionalImpactWealthAverageSubPage';
import DistributionalImpactWealthRelativeSubPage from './distributional-impact/DistributionalImpactWealthRelativeSubPage';
import WinnersLosersIncomeDecileSubPage from './distributional-impact/WinnersLosersIncomeDecileSubPage';
import WinnersLosersWealthDecileSubPage from './distributional-impact/WinnersLosersWealthDecileSubPage';
import InequalityImpactSubPage from './inequality-impact/InequalityImpactSubPage';
import { LocalAuthoritySubPage } from './LocalAuthoritySubPage';
import DeepPovertyImpactByAgeSubPage from './poverty-impact/DeepPovertyImpactByAgeSubPage';
import DeepPovertyImpactByGenderSubPage from './poverty-impact/DeepPovertyImpactByGenderSubPage';
import PovertyImpactByAgeSubPage from './poverty-impact/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from './poverty-impact/PovertyImpactByGenderSubPage';
import PovertyImpactByRaceSubPage from './poverty-impact/PovertyImpactByRaceSubPage';
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

type PovertyDepth = 'regular' | 'deep';
type PovertyBreakdown = 'by-age' | 'by-gender' | 'by-race';

const POVERTY_DEPTH_OPTIONS = [
  { label: 'Regular poverty', value: 'regular' as PovertyDepth },
  { label: 'Deep poverty', value: 'deep' as PovertyDepth },
];

type CongressionalMode = 'absolute' | 'relative';

const CONGRESSIONAL_MODE_OPTIONS = [
  { label: 'Absolute', value: 'absolute' as CongressionalMode },
  { label: 'Relative', value: 'relative' as CongressionalMode },
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

function getBreakdownOptions(
  depth: PovertyDepth,
  countryId: string
): Array<{ label: string; value: PovertyBreakdown; disabled?: boolean }> {
  const options: Array<{ label: string; value: PovertyBreakdown; disabled?: boolean }> = [
    { label: 'By age', value: 'by-age' },
    { label: 'By gender', value: 'by-gender' },
  ];
  if (countryId === 'us') {
    options.push({
      label: 'By race',
      value: 'by-race',
      disabled: depth === 'deep',
    });
  }
  return options;
}

function PovertyChart({
  output,
  depth,
  breakdown,
}: {
  output: SocietyWideReportOutput;
  depth: PovertyDepth;
  breakdown: PovertyBreakdown;
}) {
  if (depth === 'regular') {
    if (breakdown === 'by-age') return <PovertyImpactByAgeSubPage output={output} />;
    if (breakdown === 'by-gender') return <PovertyImpactByGenderSubPage output={output} />;
    if (breakdown === 'by-race') return <PovertyImpactByRaceSubPage output={output} />;
  }
  // Deep poverty: by age and by gender only (no by-race data available)
  if (breakdown === 'by-age') return <DeepPovertyImpactByAgeSubPage output={output} />;
  if (breakdown === 'by-gender') return <DeepPovertyImpactByGenderSubPage output={output} />;
  return null;
}

/**
 * Congressional district collapsible section.
 * Renders the map immediately (all outlines visible, white fill).
 * Districts fill in progressively as state-by-state data arrives.
 * Must be rendered inside a CongressionalDistrictDataProvider.
 */
function CongressionalDistrictSection({ output }: { output: SocietyWideReportOutput }) {
  const {
    stateResponses,
    completedCount,
    totalStates,
    hasStarted,
    isLoading,
    labelLookup,
    stateCode,
    startFetch,
  } = useCongressionalDistrictData();
  const [mode, setMode] = useState<CongressionalMode>('absolute');

  // Check if output already has district data (from nationwide calculation)
  const existingDistricts = useMemo(() => {
    if (!('congressional_district_impact' in output)) return null;
    const districtData = (output as ReportOutputSocietyWideUS).congressional_district_impact;
    if (!districtData?.districts) return null;
    return districtData.districts;
  }, [output]);

  // Build map data from context (progressive fill as states complete)
  const contextMapData = useMemo(() => {
    if (stateResponses.size === 0) return [];
    const points: Array<{ geoId: string; label: string; value: number }> = [];
    stateResponses.forEach((stateData) => {
      stateData.districts.forEach((district) => {
        points.push({
          geoId: district.district,
          label: labelLookup.get(district.district) ?? `District ${district.district}`,
          value:
            mode === 'absolute'
              ? district.average_household_income_change
              : district.relative_household_income_change,
        });
      });
    });
    return points;
  }, [stateResponses, labelLookup, mode]);

  // Use pre-computed data if available, otherwise progressive context data
  const mapData = useMemo(() => {
    if (existingDistricts) {
      return existingDistricts.map((item) => ({
        geoId: item.district,
        label: labelLookup.get(item.district) ?? `District ${item.district}`,
        value:
          mode === 'absolute'
            ? item.average_household_income_change
            : item.relative_household_income_change,
      }));
    }
    return contextMapData;
  }, [existingDistricts, contextMapData, labelLookup, mode]);

  // Map config based on absolute vs relative mode
  const mapConfig = useMemo(
    () => ({
      colorScale: {
        colors: DIVERGING_GRAY_TEAL.colors,
        tickFormat: mode === 'absolute' ? '$,.0f' : '.1%',
        symmetric: true,
      },
      formatValue: (value: number) =>
        mode === 'absolute'
          ? formatParameterValue(value, 'currency-USD', {
              decimalPlaces: 0,
              includeSymbol: true,
            })
          : formatParameterValue(value, '/1', { decimalPlaces: 1 }),
    }),
    [mode]
  );

  // Progress
  const progressPercent = totalStates > 0 ? Math.round((completedCount / totalStates) * 100) : 0;
  const progressMessage = isLoading
    ? `Computing district impacts (${completedCount} of ${totalStates} states)...`
    : undefined;

  return (
    <CollapsibleSection
      label="Congressional district impact"
      defaultOpen={false}
      right={
        <Group gap={spacing.lg}>
          {!hasStarted && !existingDistricts && (
            <Button variant="light" color="gray" size="xs" onClick={startFetch} maw={250}>
              Compute congressional impacts
            </Button>
          )}
          <SegmentedControl
            value={mode}
            onChange={(value) => setMode(value as CongressionalMode)}
            size="xs"
            data={CONGRESSIONAL_MODE_OPTIONS}
            styles={segmentedControlStyles}
          />
        </Group>
      }
    >
      {progressMessage && (
        <Text size="sm" c={colors.text.secondary}>
          {progressMessage}
        </Text>
      )}
      {isLoading && <Progress value={progressPercent} size="sm" />}
      <USDistrictChoroplethMap
        data={mapData}
        config={mapConfig}
        focusState={stateCode ?? undefined}
      />
    </CollapsibleSection>
  );
}

export default function MigrationSubPage({
  output,
  report,
  simulations,
  geographies,
}: MigrationSubPageProps) {
  const countryId = useCurrentCountry();
  const [distributionalMode, setDistributionalMode] = useState<DistributionalMode>('absolute');
  const [wealthMode, setWealthMode] = useState<DistributionalMode>('absolute');
  const [povertyDepth, setPovertyDepth] = useState<PovertyDepth>('regular');
  const [povertyBreakdown, setPovertyBreakdown] = useState<PovertyBreakdown>('by-age');
  const breakdownOptions = getBreakdownOptions(povertyDepth, countryId);

  const handleDepthChange = (value: string) => {
    const newDepth = value as PovertyDepth;
    setPovertyDepth(newDepth);
    // Reset breakdown if current selection is disabled in the new depth
    const options = getBreakdownOptions(newDepth, countryId);
    const currentOption = options.find((o) => o.value === povertyBreakdown);
    if (!currentOption || currentOption.disabled) {
      setPovertyBreakdown(options[0].value);
    }
  };

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

  return (
    <Stack gap={spacing.xl}>
      <SocietyWideOverview output={output} />

      <CollapsibleSection label="Budgetary impact" defaultOpen={false}>
        <BudgetaryImpactSubPage output={output} />
      </CollapsibleSection>

      {countryId === 'uk' && (
        <CollapsibleSection label="Budgetary impact by program" defaultOpen={false}>
          <BudgetaryImpactByProgramSubPage output={output} />
        </CollapsibleSection>
      )}

      <CollapsibleSection
        label="Distributional analysis"
        defaultOpen={false}
        right={
          <SegmentedControl
            value={distributionalMode}
            onChange={(value) => setDistributionalMode(value as DistributionalMode)}
            size="xs"
            data={DISTRIBUTIONAL_MODE_OPTIONS}
            styles={segmentedControlStyles}
          />
        }
      >
        {distributionalMode === 'absolute' && (
          <DistributionalImpactIncomeAverageSubPage output={output} />
        )}
        {distributionalMode === 'relative' && (
          <DistributionalImpactIncomeRelativeSubPage output={output} />
        )}
        {distributionalMode === 'intra-decile' && (
          <WinnersLosersIncomeDecileSubPage output={output} />
        )}
      </CollapsibleSection>

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

      <CollapsibleSection
        label="Poverty impact"
        defaultOpen={false}
        right={
          <Group gap={spacing.lg}>
            <SegmentedControl
              value={povertyDepth}
              onChange={handleDepthChange}
              size="xs"
              data={POVERTY_DEPTH_OPTIONS}
              styles={segmentedControlStyles}
            />
            <SegmentedControl
              value={povertyBreakdown}
              onChange={(value) => setPovertyBreakdown(value as PovertyBreakdown)}
              size="xs"
              data={breakdownOptions}
              styles={segmentedControlStyles}
            />
          </Group>
        }
      >
        <PovertyChart output={output} depth={povertyDepth} breakdown={povertyBreakdown} />
      </CollapsibleSection>

      <CollapsibleSection label="Inequality impact" defaultOpen={false}>
        <InequalityImpactSubPage output={output} />
      </CollapsibleSection>

      {canShowCongressional && (
        <CongressionalDistrictDataProvider
          reformPolicyId={reformPolicyId}
          baselinePolicyId={baselinePolicyId}
          year={year}
          region={region}
        >
          <CongressionalDistrictSection output={output} />
        </CongressionalDistrictDataProvider>
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
    </Stack>
  );
}
