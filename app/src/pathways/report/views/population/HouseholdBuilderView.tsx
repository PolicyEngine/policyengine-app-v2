/**
 * HouseholdBuilderView - View for building custom household
 * Props-based instead of Redux-based
 */

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { LoadingOverlay, Stack, Text } from '@mantine/core';
import { countryIdToModelName } from '@/adapters/HouseholdAdapter';
import PathwayView from '@/components/common/PathwayView';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { getTaxYears } from '@/data/static';
import { useBasicInputFields } from '@/hooks/useBasicInputFields';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useHouseholdMetadataContext } from '@/hooks/useMetadata';
import { useReportYear } from '@/hooks/useReportYear';
import { useEntities } from '@/hooks/useStaticMetadata';
import { RootState } from '@/store';
import { Household, TaxBenefitModelName } from '@/types/ingredients/Household';
import { PopulationStateProps } from '@/types/pathwayState';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
import { HouseholdValidation } from '@/utils/HouseholdValidation';

interface HouseholdBuilderViewProps {
  population: PopulationStateProps;
  countryId: string;
  onSubmitSuccess: (householdId: string, household: Household) => void;
  onBack?: () => void;
  /** If provided, shows year selector (standalone mode). If not, uses year from context (report mode). */
  onYearChange?: (year: string) => void;
}

export default function HouseholdBuilderView({
  population,
  countryId,
  onSubmitSuccess,
  onBack,
  onYearChange,
}: HouseholdBuilderViewProps) {
  const { createHousehold, isPending } = useCreateHousehold(population?.label || '');
  const reportYear = useReportYear();

  // Get metadata-driven options
  const basicInputFields = useBasicInputFields(countryId);
  const metadata = useHouseholdMetadataContext();
  const { loading, error } = useSelector((state: RootState) => state.metadata);

  // Get available years for standalone mode
  const availableYears = getTaxYears(countryId);

  const modelName: TaxBenefitModelName = countryIdToModelName(countryId as 'us' | 'uk');

  // Get all basic non-person fields dynamically (country-agnostic)
  const basicNonPersonFields = Object.entries(basicInputFields)
    .filter(([key]) => key !== 'person')
    .flatMap(([, fields]) => fields);

  // Error boundary: Show error if no report year available
  if (!reportYear) {
    return (
      <PathwayView
        title="Create household"
        content={
          <Stack align="center" gap="md" p="xl">
            <Text c="red" fw={600}>
              Configuration Error
            </Text>
            <Text c="dimmed" ta="center">
              No report year available. Please return to the report creation page and select a year
              before creating a household.
            </Text>
          </Stack>
        }
        buttonPreset="cancel-only"
        cancelAction={{
          onClick: onBack,
        }}
      />
    );
  }

  const yearNum = parseInt(reportYear, 10);

  // Initialize household with "you" if none exists
  const [household, setLocalHousehold] = useState<Household>(() => {
    if (population?.household) {
      return population.household;
    }
    const builder = new HouseholdBuilder(modelName, yearNum);
    builder.addAdult({ age: 30, employment_income: 0 });
    return builder.build();
  });

  // Derive marital status and number of dependents from household
  // For US: dependents identified by is_tax_unit_dependent === true
  // For UK: dependents identified by age < 18
  const isDependent = (p: Record<string, any>) =>
    p.is_tax_unit_dependent === true || (p.age !== undefined && p.age < 18);
  const adults = household.people.filter((p) => !isDependent(p));
  const hasPartner = adults.length >= 2;
  const maritalStatus = hasPartner ? 'married' : 'single';
  const numChildren = household.people.filter((p) => isDependent(p)).length;

  // Handler for marital status change - directly modifies household
  const handleMaritalStatusChange = (newStatus: 'single' | 'married') => {
    const builder = new HouseholdBuilder(modelName, yearNum);
    builder.loadHousehold(household);

    if (newStatus === 'married' && !hasPartner) {
      builder.addAdult({ age: 30, employment_income: 0 });
    } else if (newStatus === 'single' && hasPartner) {
      // Remove the second adult (index 1)
      // Find the index of the second non-dependent adult
      const secondAdultIndex = household.people.findIndex((p, i) => i > 0 && !isDependent(p));
      if (secondAdultIndex >= 0) {
        builder.removePerson(secondAdultIndex);
      }
    }

    setLocalHousehold(builder.build());
  };

  // Handler for number of children change - directly modifies household
  const handleNumChildrenChange = (newCount: number) => {
    const builder = new HouseholdBuilder(modelName, yearNum);
    builder.loadHousehold(household);

    // Find all current dependents
    const currentDependentIndices = household.people
      .map((p, i) => (isDependent(p) ? i : -1))
      .filter((i) => i >= 0);
    const currentChildCount = currentDependentIndices.length;

    if (newCount !== currentChildCount) {
      // Remove all existing dependents (in reverse order to preserve indices)
      for (let i = currentDependentIndices.length - 1; i >= 0; i--) {
        builder.removePerson(currentDependentIndices[i]);
      }

      // Add new children
      for (let i = 0; i < newCount; i++) {
        builder.addChild({ age: 10 });
      }
    }

    setLocalHousehold(builder.build());
  };

  // Show error state if metadata failed to load
  if (error) {
    return (
      <PathwayView
        title="Create household"
        content={
          <Stack align="center" gap="md" p="xl">
            <Text c="red" fw={600}>
              Failed to Load Required Data
            </Text>
            <Text c="dimmed" ta="center">
              Unable to load household configuration data. Please refresh the page and try again.
            </Text>
          </Stack>
        }
        buttonPreset="cancel-only"
      />
    );
  }

  const handleSubmit = async () => {
    // Validate household
    const validation = HouseholdValidation.isReadyForSimulation(household);
    if (!validation.isValid) {
      return;
    }

    try {
      const result = await createHousehold(household);
      onSubmitSuccess(result.householdId, household);
    } catch (err) {
      // Error is handled by the mutation
    }
  };

  const validation = HouseholdValidation.isReadyForSimulation(household);
  const canProceed = validation.isValid;

  const primaryAction = {
    label: 'Create household',
    onClick: handleSubmit,
    isLoading: isPending,
    isDisabled: !canProceed,
  };

  const content = (
    <Stack gap="lg" pos="relative">
      <LoadingOverlay visible={loading || isPending} />

      <HouseholdBuilderForm
        household={household}
        metadata={metadata}
        countryId={countryId}
        maritalStatus={maritalStatus}
        numChildren={numChildren}
        basicPersonFields={basicInputFields.person || []}
        basicNonPersonFields={basicNonPersonFields}
        onChange={setLocalHousehold}
        onMaritalStatusChange={handleMaritalStatusChange}
        onNumChildrenChange={handleNumChildrenChange}
        disabled={loading || isPending}
        year={reportYear}
        availableYears={onYearChange ? availableYears : undefined}
        onYearChange={onYearChange}
      />
    </Stack>
  );

  return (
    <PathwayView
      title="Build your household"
      content={content}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
    />
  );
}
