import { useEffect, useState } from 'react';
import { IconChevronDown, IconChevronRight, IconWallet } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import HouseholdBreakdown from '@/components/household/HouseholdBreakdown';
import MetricCard from '@/components/report/MetricCard';
import { Group, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { AppHouseholdInputEnvelope as Household } from '@/models/household/appTypes';
import { RootState } from '@/store';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import { calculateVariableComparison } from '@/utils/householdComparison';
import { formatVariableValue } from '@/utils/householdValues';
import EarningsVariationSubPage from './earnings-variation/EarningsVariationSubPage';
import MarginalTaxRatesSubPage from './marginal-tax-rates/MarginalTaxRatesSubPage';

interface HouseholdOverviewProps {
  outputs: Household[];
  policyLabels?: string[];
  simulations?: Simulation[];
  policies?: Policy[];
  activeView?: string;
}

// Fixed size for icon container to ensure square aspect ratio
const HERO_ICON_SIZE = 48;

interface ExpandableSectionProps {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  keepMounted?: boolean;
  children: React.ReactNode;
}

function ExpandableSection({
  title,
  summary,
  isOpen,
  onToggle,
  keepMounted = false,
  children,
}: ExpandableSectionProps) {
  const shouldRenderChildren = isOpen || keepMounted;

  return (
    <div
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: spacing.radius.container,
        border: `1px solid ${colors.border.light}`,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-lg tw:w-full tw:block"
        style={{ transition: 'background-color 0.15s ease' }}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = colors.gray[50];
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Group className="tw:justify-between tw:items-center tw:gap-md">
          <div className="tw:text-left">
            <Group className="tw:gap-sm tw:items-center">
              {isOpen ? (
                <IconChevronDown size={20} color={colors.text.secondary} />
              ) : (
                <IconChevronRight size={20} color={colors.text.secondary} />
              )}
              <Text
                style={{ fontWeight: typography.fontWeight.medium, color: colors.text.primary }}
              >
                {title}
              </Text>
            </Group>
            <Text className="tw:text-sm tw:mt-xs" style={{ color: colors.text.secondary }}>
              {summary}
            </Text>
          </div>
          <Text className="tw:text-sm tw:shrink-0" style={{ color: colors.text.tertiary }}>
            {isOpen ? 'Click to collapse' : 'Click to expand'}
          </Text>
        </Group>
      </button>

      {shouldRenderChildren && (
        <div
          aria-hidden={!isOpen}
          className="tw:px-lg"
          style={{
            borderTop: isOpen ? `1px solid ${colors.border.light}` : 'none',
            height: isOpen ? 'auto' : 0,
            overflow: 'hidden',
            paddingBottom: isOpen ? spacing.md : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            visibility: isOpen ? 'visible' : 'hidden',
          }}
        >
          <div className="tw:mt-md">{children}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Overview page for household reports
 *
 * Features:
 * - Hero metric showing net income (or change)
 * - Clean expandable breakdown section
 * - Clear visual indicators for positive/negative changes
 */
export default function HouseholdOverview({
  outputs,
  policyLabels,
  simulations,
  policies,
  activeView,
}: HouseholdOverviewProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [earningsOpen, setEarningsOpen] = useState(activeView === 'earnings-variation');
  const [mtrOpen, setMtrOpen] = useState(activeView === 'marginal-tax-rates');
  const [hasOpenedEarnings, setHasOpenedEarnings] = useState(activeView === 'earnings-variation');
  const [hasOpenedMtr, setHasOpenedMtr] = useState(activeView === 'marginal-tax-rates');
  const metadata = useSelector((state: RootState) => state.metadata);

  const rootVariable = metadata.variables.household_net_income;
  if (!rootVariable) {
    return (
      <div>
        <Text style={{ color: colors.error }}>
          Error: household_net_income variable not found in metadata
        </Text>
      </div>
    );
  }

  // Determine mode and extract households
  const isComparisonMode = outputs.length === 2;
  const baseline = outputs[0];
  const reform = isComparisonMode ? outputs[1] : null;

  // Calculate comparison for net income
  const comparison = calculateVariableComparison(
    'household_net_income',
    baseline,
    reform,
    metadata
  );

  // Format the value
  const formattedValue = formatVariableValue(rootVariable, comparison.displayValue, 0);

  // Get policy labels
  const baselineLabel = policyLabels?.[0] || 'baseline';
  const reformLabel = policyLabels?.[1] || 'reform';

  // Determine trend
  const trend =
    comparison.direction === 'increase'
      ? 'positive'
      : comparison.direction === 'decrease'
        ? 'negative'
        : 'neutral';

  // Build display text
  let heroLabel: string;
  let heroSubtext: string;

  if (!isComparisonMode) {
    heroLabel = 'Your Net Income';
    heroSubtext = 'Total household income after taxes and benefits';
  } else if (comparison.direction === 'no-change') {
    heroLabel = 'Net Income Change';
    heroSubtext = `No change under "${reformLabel}" compared to "${baselineLabel}"`;
  } else {
    heroLabel = 'Net Income Change';
    const direction = comparison.direction === 'increase' ? 'increase' : 'decrease';
    heroSubtext = `${direction.charAt(0).toUpperCase() + direction.slice(1)} under "${reformLabel}" compared to "${baselineLabel}"`;
  }

  // Determine border color for breakdown
  const borderColor = isComparisonMode
    ? comparison.direction === 'increase'
      ? colors.primary[700]
      : colors.text.secondary
    : colors.primary[700];

  const hasAnalysisInputs = !!simulations?.length && !!policies?.length;

  useEffect(() => {
    if (activeView === 'net-income') {
      setBreakdownOpen(true);
    }
    if (activeView === 'earnings-variation') {
      setEarningsOpen(true);
      setHasOpenedEarnings(true);
    }
    if (activeView === 'marginal-tax-rates') {
      setMtrOpen(true);
      setHasOpenedMtr(true);
    }
  }, [activeView]);

  const toggleEarnings = () => {
    setEarningsOpen((previous) => {
      const next = !previous;
      if (next) {
        setHasOpenedEarnings(true);
      }
      return next;
    });
  };

  const toggleMtr = () => {
    setMtrOpen((previous) => {
      const next = !previous;
      if (next) {
        setHasOpenedMtr(true);
      }
      return next;
    });
  };

  return (
    <Stack className="tw:gap-xl">
      {/* Hero Section - Net Income */}
      <div
        className="tw:p-xl"
        style={{
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.background.primary} 100%)`,
          borderRadius: spacing.radius.container,
          border: `1px solid ${colors.primary[100]}`,
        }}
      >
        <Group className="tw:gap-md tw:items-start">
          <div
            className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
            style={{
              width: HERO_ICON_SIZE,
              height: HERO_ICON_SIZE,
              backgroundColor: colors.primary[100],
              borderRadius: spacing.radius.element,
            }}
          >
            <IconWallet size={28} color={colors.primary[700]} stroke={1.5} />
          </div>
          <div className="tw:flex-1">
            <MetricCard
              label={heroLabel}
              value={formattedValue}
              subtext={heroSubtext}
              trend={trend}
              hero
            />
          </div>
        </Group>
      </div>

      <ExpandableSection
        title="Household net income breakdown"
        summary="Expand the household net-income decomposition and inspect each component."
        isOpen={breakdownOpen}
        onToggle={() => setBreakdownOpen((previous) => !previous)}
      >
        <div style={{ borderLeft: `3px solid ${borderColor}` }}>
          <HouseholdBreakdown baseline={baseline} reform={reform} borderColor={borderColor} />
        </div>

        <Text
          className="tw:text-xs tw:mt-md tw:text-center"
          style={{ color: colors.text.tertiary }}
        >
          Click on any item to see its detailed breakdown
        </Text>
      </ExpandableSection>

      <ExpandableSection
        title="Varying your earnings"
        summary="Load and inspect how household outcomes move as earnings change across a wider range."
        isOpen={earningsOpen}
        onToggle={toggleEarnings}
        keepMounted={hasOpenedEarnings}
      >
        {hasOpenedEarnings && hasAnalysisInputs ? (
          <EarningsVariationSubPage
            baseline={baseline}
            reform={reform}
            simulations={simulations || []}
            policies={policies}
          />
        ) : (
          <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
            {!hasAnalysisInputs
              ? 'This analysis is unavailable because the household or policy inputs are incomplete.'
              : 'Open this section to start loading the chart.'}
          </Text>
        )}
      </ExpandableSection>

      <ExpandableSection
        title="Marginal tax rates"
        summary="Load the marginal-tax-rate curve for this household and compare it with the earnings analysis."
        isOpen={mtrOpen}
        onToggle={toggleMtr}
        keepMounted={hasOpenedMtr}
      >
        {hasOpenedMtr && hasAnalysisInputs ? (
          <MarginalTaxRatesSubPage
            baseline={baseline}
            reform={reform}
            simulations={simulations || []}
            policies={policies}
          />
        ) : (
          <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
            {!hasAnalysisInputs
              ? 'This analysis is unavailable because the household or policy inputs are incomplete.'
              : 'Open this section to start loading the chart.'}
          </Text>
        )}
      </ExpandableSection>
    </Stack>
  );
}
