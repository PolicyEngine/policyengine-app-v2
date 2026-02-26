/**
 * HouseholdBuilderView - View for building custom household
 * Duplicated from HouseholdBuilderFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { HouseholdAdapter } from '@/adapters/HouseholdAdapter';
import PathwayView from '@/components/common/PathwayView';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { Spinner, Stack } from '@/components/ui';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useReportYear } from '@/hooks/useReportYear';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import { PopulationStateProps } from '@/types/pathwayState';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
import { HouseholdValidation } from '@/utils/HouseholdValidation';

interface HouseholdBuilderViewProps {
  population: PopulationStateProps;
  countryId: string;
  onSubmitSuccess: (householdId: string, household: Household) => void;
  onBack?: () => void;
}

export default function HouseholdBuilderView({
  population,
  countryId,
  onSubmitSuccess,
  onBack,
}: HouseholdBuilderViewProps) {
  const { createHousehold, isPending } = useCreateHousehold(population?.label || '');
  const reportYear = useReportYear();

  // Get metadata-driven options
  const basicInputFields = useSelector(getBasicInputFields);
  const metadata = useSelector((state: RootState) => state.metadata);
  const { loading, error } = metadata;

  // Get all basic non-person fields dynamically (country-agnostic)
  // This handles US entities (tax_unit, spm_unit, etc.) and UK entities (benunit) automatically
  const basicNonPersonFields = Object.entries(basicInputFields)
    .filter(([key]) => key !== 'person')
    .flatMap(([, fields]) => fields);

  // Error boundary: Show error if no report year available
  if (!reportYear) {
    return (
      <PathwayView
        title="Create household"
        content={
          <Stack align="center" gap="md" className="tw:p-xl">
            <p className="tw:text-red-600 tw:font-semibold">Configuration Error</p>
            <p className="tw:text-gray-500 tw:text-center">
              No report year available. Please return to the report creation page and select a year
              before creating a household.
            </p>
          </Stack>
        }
        buttonPreset="cancel-only"
        cancelAction={{
          onClick: onBack,
        }}
      />
    );
  }

  // Initialize household with "you" if none exists
  const [household, setLocalHousehold] = useState<Household>(() => {
    if (population?.household) {
      return population.household;
    }
    const builder = new HouseholdBuilder(countryId as any, reportYear);
    builder.addAdult('you', 30, { employment_income: 0 });
    return builder.build();
  });

  // Derive marital status and number of children from household (single source of truth)
  const people = Object.keys(household.householdData.people);
  const maritalStatus = people.includes('your partner') ? 'married' : 'single';
  const numChildren = people.filter((p) => p.includes('dependent')).length;

  // Handler for marital status change - directly modifies household
  const handleMaritalStatusChange = (newStatus: 'single' | 'married') => {
    const builder = new HouseholdBuilder(countryId as any, reportYear);
    builder.loadHousehold(household);

    const hasPartner = people.includes('your partner');

    if (newStatus === 'married' && !hasPartner) {
      builder.addAdult('your partner', 30, { employment_income: 0 });
      builder.setMaritalStatus('you', 'your partner');
    } else if (newStatus === 'single' && hasPartner) {
      builder.removePerson('your partner');
    }

    setLocalHousehold(builder.build());
  };

  // Handler for number of children change - directly modifies household
  const handleNumChildrenChange = (newCount: number) => {
    const builder = new HouseholdBuilder(countryId as any, reportYear);
    builder.loadHousehold(household);

    const currentChildren = people.filter((p) => p.includes('dependent'));
    const currentChildCount = currentChildren.length;

    if (newCount !== currentChildCount) {
      // Remove all existing children
      currentChildren.forEach((child) => builder.removePerson(child));

      // Add new children
      if (newCount > 0) {
        const hasPartner = people.includes('your partner');
        const parentIds = hasPartner ? ['you', 'your partner'] : ['you'];
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];

        for (let i = 0; i < newCount; i++) {
          const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
          builder.addChild(childName, 10, parentIds, { employment_income: 0 });
        }
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
          <Stack align="center" gap="md" className="tw:p-xl">
            <p className="tw:text-red-600 tw:font-semibold">Failed to Load Required Data</p>
            <p className="tw:text-gray-500 tw:text-center">
              Unable to load household configuration data. Please refresh the page and try again.
            </p>
          </Stack>
        }
        buttonPreset="cancel-only"
      />
    );
  }

  const handleSubmit = async () => {
    // Validate household
    const validation = HouseholdValidation.isReadyForSimulation(household, reportYear);
    if (!validation.isValid) {
      return;
    }

    // Convert to API format
    const payload = HouseholdAdapter.toCreationPayload(household.householdData, countryId);

    try {
      const result = await createHousehold(payload);

      const householdId = result.result.household_id;
      onSubmitSuccess(householdId, household);
    } catch (err) {
      // Error is handled by the mutation
    }
  };

  const validation = HouseholdValidation.isReadyForSimulation(household, reportYear);
  const canProceed = validation.isValid;

  const primaryAction = {
    label: 'Create household',
    onClick: handleSubmit,
    isLoading: isPending,
    isDisabled: !canProceed,
  };

  const content = (
    <Stack gap="lg" className="tw:relative">
      {(loading || isPending) && (
        <div className="tw:absolute tw:inset-0 tw:bg-white/80 tw:flex tw:items-center tw:justify-center tw:z-50">
          <Spinner />
        </div>
      )}

      <HouseholdBuilderForm
        household={household}
        metadata={metadata}
        year={reportYear}
        maritalStatus={maritalStatus}
        numChildren={numChildren}
        basicPersonFields={basicInputFields.person || []}
        basicNonPersonFields={basicNonPersonFields}
        onChange={setLocalHousehold}
        onMaritalStatusChange={handleMaritalStatusChange}
        onNumChildrenChange={handleNumChildrenChange}
        disabled={loading || isPending}
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
