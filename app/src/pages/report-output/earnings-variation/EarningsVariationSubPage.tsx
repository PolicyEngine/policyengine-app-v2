import { useDeferredValue, useMemo, useState } from 'react';
import { IconCheck, IconChevronDown, IconSearch } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import {
  Button,
  Group,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Stack,
  Text,
} from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useHouseholdVariation } from '@/hooks/useHouseholdVariation';
import { useReportYear } from '@/hooks/useReportYear';
import type { RootState } from '@/store';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import { getHeadOfHouseholdPersonName } from '@/utils/householdHead';
import { getValueFromHousehold } from '@/utils/householdValues';
import BaselineAndReformChart from './BaselineAndReformChart';
import BaselineOnlyChart from './BaselineOnlyChart';

interface Props {
  baseline: HouseholdCalculationOutput;
  reform: HouseholdCalculationOutput | null;
  simulations: Simulation[];
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  households?: HouseholdCalculationOutput[];
  baselineVariation?: HouseholdCalculationOutput | null;
  reformVariation?: HouseholdCalculationOutput | null;
}

/**
 * Earnings Variation page
 * Shows how variables change across different employment income levels
 * Variable selector dropdown + chart with baseline/reform comparison
 */
export default function EarningsVariationSubPage({
  baseline,
  reform,
  simulations,
  policies,
  userPolicies: _userPolicies,
  households: _households,
  baselineVariation: providedBaselineVariation = null,
  reformVariation: providedReformVariation = null,
}: Props) {
  const [selectedVariable, setSelectedVariable] = useState('household_net_income');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const countryId = useCurrentCountry();
  const reportYear = useReportYear();
  const normalizedReportYear = reportYear ?? '';
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());
  const metadata = useSelector((state: RootState) => state.metadata);
  const baselineFocusPersonName = useMemo(
    () => getHeadOfHouseholdPersonName(baseline, normalizedReportYear),
    [baseline, normalizedReportYear]
  );
  const reformFocusPersonName = useMemo(
    () => (reform ? getHeadOfHouseholdPersonName(reform, normalizedReportYear) : null),
    [normalizedReportYear, reform]
  );

  // Get policy data for variations
  const baselinePolicy = policies?.find((p) => p.id === simulations[0]?.policyId);
  const reformPolicy = simulations[1] && policies?.find((p) => p.id === simulations[1].policyId);

  // Convert policies to API format
  const baselinePolicyData = useMemo(
    () => (baselinePolicy ? PolicyAdapter.toCreationPayload(baselinePolicy).data : {}),
    [baselinePolicy]
  );
  const reformPolicyData = useMemo(
    () => (reformPolicy ? PolicyAdapter.toCreationPayload(reformPolicy).data : {}),
    [reformPolicy]
  );
  const shouldFetchInternally = !providedBaselineVariation;

  // Fetch baseline variation
  const {
    data: baselineVariation,
    isLoading: baselineLoading,
    error: baselineError,
  } = useHouseholdVariation({
    householdId: simulations[0]?.populationId || 'baseline',
    policyId: simulations[0]?.policyId || 'baseline-policy',
    policyData: baselinePolicyData,
    year: normalizedReportYear,
    countryId,
    personName: baselineFocusPersonName,
    enabled:
      shouldFetchInternally && !!reportYear && !!simulations[0]?.populationId && !!baselinePolicy,
  });

  // Fetch reform variation (if reform exists)
  const {
    data: reformVariation,
    isLoading: reformLoading,
    error: reformError,
  } = useHouseholdVariation({
    householdId: simulations[1]?.populationId || 'reform',
    policyId: simulations[1]?.policyId || 'reform-policy',
    policyData: reformPolicyData,
    year: normalizedReportYear,
    countryId,
    personName: reformFocusPersonName ?? baselineFocusPersonName,
    enabled:
      shouldFetchInternally &&
      !!reportYear &&
      !!reform &&
      !!simulations[1]?.populationId &&
      !!reformPolicy,
  });

  const resolvedBaselineVariation = providedBaselineVariation ?? baselineVariation ?? null;
  const resolvedReformVariation = providedReformVariation ?? reformVariation ?? null;

  // Build variable options (only non-input variables with array values)
  const variableOptions = useMemo(() => {
    if (!reportYear || !resolvedBaselineVariation?.householdData?.people) {
      return [];
    }

    return Object.keys(metadata.variables)
      .filter((varName) => {
        const variable = metadata.variables[varName];
        // Exclude input variables and marginal_tax_rate (has its own page)
        if (!variable || variable.isInputVariable || varName === 'marginal_tax_rate') {
          return false;
        }

        // Check if baseline variation has array values for this variable
        const value = getValueFromHousehold(
          varName,
          normalizedReportYear,
          null,
          resolvedBaselineVariation,
          metadata
        );
        return Array.isArray(value);
      })
      .map((varName) => ({
        value: varName,
        label: metadata.variables[varName]?.label || varName,
      }));
  }, [metadata, normalizedReportYear, reportYear, resolvedBaselineVariation]);
  const sortedVariableOptions = useMemo(
    () =>
      [...variableOptions].sort(
        (left, right) =>
          left.label.localeCompare(right.label) || left.value.localeCompare(right.value)
      ),
    [variableOptions]
  );
  const selectedVariableOption = useMemo(
    () =>
      sortedVariableOptions.find((option) => option.value === selectedVariable) ?? {
        value: selectedVariable,
        label: metadata.variables[selectedVariable]?.label || selectedVariable,
      },
    [metadata, selectedVariable, sortedVariableOptions]
  );
  const visibleVariableOptions = useMemo(() => {
    if (!deferredSearchQuery) {
      return [
        selectedVariableOption,
        ...sortedVariableOptions
          .filter((option) => option.value !== selectedVariableOption.value)
          .slice(0, 49),
      ];
    }

    return sortedVariableOptions
      .filter((option) => {
        const normalizedLabel = option.label.toLowerCase();
        const normalizedValue = option.value.toLowerCase();
        return (
          normalizedLabel.includes(deferredSearchQuery) ||
          normalizedValue.includes(deferredSearchQuery)
        );
      })
      .slice(0, 50);
  }, [deferredSearchQuery, selectedVariableOption, sortedVariableOptions]);
  const totalMatchingVariableCount = useMemo(() => {
    if (!deferredSearchQuery) {
      return sortedVariableOptions.length;
    }

    return sortedVariableOptions.filter((option) => {
      const normalizedLabel = option.label.toLowerCase();
      const normalizedValue = option.value.toLowerCase();
      return (
        normalizedLabel.includes(deferredSearchQuery) ||
        normalizedValue.includes(deferredSearchQuery)
      );
    }).length;
  }, [deferredSearchQuery, sortedVariableOptions]);
  const resultSummary = deferredSearchQuery
    ? `Showing ${visibleVariableOptions.length} of ${totalMatchingVariableCount} matching variables`
    : `Showing the current selection plus ${Math.max(0, visibleVariableOptions.length - 1)} more variables`;

  // Show loading if either query is still loading
  const isLoading = shouldFetchInternally && (baselineLoading || (reform && reformLoading));

  if (!reportYear) {
    return (
      <Stack gap="md">
        <Text c="red">Error: Report year not available</Text>
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Group className="tw:gap-sm tw:items-center">
        <Spinner size="sm" />
        <Text className="tw:text-sm">Loading earnings variation...</Text>
      </Group>
    );
  }

  if (baselineError) {
    return (
      <Stack gap="md">
        <Text c="red">Error loading baseline variation: {baselineError.message}</Text>
      </Stack>
    );
  }

  if (reform && reformError) {
    return (
      <Stack gap="md">
        <Text c="red">Error loading reform variation: {reformError.message}</Text>
      </Stack>
    );
  }

  // Verify baseline data exists and has required structure
  if (!resolvedBaselineVariation || !resolvedBaselineVariation.householdData?.people) {
    return (
      <Stack gap="md">
        <Text c="red">No baseline variation data available</Text>
      </Stack>
    );
  }

  // If reform exists, verify reform data has required structure
  if (reform && resolvedReformVariation && !resolvedReformVariation.householdData?.people) {
    return (
      <Stack gap="md">
        <Text c="red">Invalid reform variation data</Text>
      </Stack>
    );
  }

  const handleVariableSelect = (value: string) => {
    setSelectedVariable(value);
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <Stack gap="lg">
      <div className="tw:flex tw:items-end tw:gap-md">
        <Text className="tw:font-medium tw:text-sm tw:whitespace-nowrap tw:pb-2">
          Select variable to display:
        </Text>
        <Popover
          open={searchOpen}
          onOpenChange={(nextOpen) => {
            setSearchOpen(nextOpen);
            if (!nextOpen) {
              setSearchQuery('');
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="tw:flex-1 tw:justify-between tw:font-normal tw:min-w-0"
            >
              <span className="tw:truncate">{selectedVariableOption.label}</span>
              <IconChevronDown size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="tw:p-0"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            align="start"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <div className="tw:p-sm tw:border-b tw:border-gray-200">
              <div className="tw:relative">
                <IconSearch
                  size={14}
                  className="tw:absolute tw:left-2.5 tw:top-1/2 tw:-translate-y-1/2"
                  color={colors.gray[400]}
                />
                <Input
                  placeholder="Search variables..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="tw:pl-8 tw:h-8"
                  style={{ fontSize: typography.fontSize.sm }}
                  autoFocus
                />
              </div>
              <Text className="tw:text-xs tw:mt-xs" style={{ color: colors.text.secondary }}>
                {resultSummary}
              </Text>
            </div>
            <div className="tw:max-h-[280px] tw:overflow-y-auto">
              {visibleVariableOptions.length > 0 ? (
                visibleVariableOptions.map((option) => {
                  const isSelected = option.value === selectedVariable;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleVariableSelect(option.value)}
                      className="tw:w-full tw:flex tw:items-start tw:justify-between tw:gap-sm tw:px-sm tw:py-sm tw:text-left tw:border-none tw:bg-transparent tw:hover:bg-gray-50"
                    >
                      <div className="tw:min-w-0">
                        <Text className="tw:text-sm tw:truncate">{option.label}</Text>
                        <Text
                          className="tw:text-xs tw:truncate"
                          style={{ color: colors.text.secondary }}
                        >
                          {option.value}
                        </Text>
                      </div>
                      {isSelected ? (
                        <IconCheck
                          size={16}
                          color={colors.primary[500]}
                          className="tw:shrink-0 tw:mt-1"
                        />
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="tw:px-sm tw:py-md">
                  <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
                    No matching variables
                  </Text>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {reform && resolvedReformVariation ? (
        <BaselineAndReformChart
          baseline={baseline}
          baselineVariation={resolvedBaselineVariation}
          focusPersonName={baselineFocusPersonName}
          reform={reform}
          reformVariation={resolvedReformVariation!}
          variableName={selectedVariable}
          year={normalizedReportYear}
        />
      ) : (
        <BaselineOnlyChart
          baseline={baseline}
          baselineVariation={resolvedBaselineVariation}
          focusPersonName={baselineFocusPersonName}
          variableName={selectedVariable}
          year={normalizedReportYear}
        />
      )}
    </Stack>
  );
}
