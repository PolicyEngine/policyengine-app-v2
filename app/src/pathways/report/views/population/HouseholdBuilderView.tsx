/**
 * HouseholdBuilderView - View for building custom household
 * Duplicated from HouseholdBuilderFrame
 * Props-based instead of Redux-based
 */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PathwayView from '@/components/common/PathwayView';
import { Spinner, Stack } from '@/components/ui';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useReportYear } from '@/hooks/useReportYear';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { Household as HouseholdModel } from '@/models/Household';
import type { AppHouseholdInputEnvelope } from '@/models/household/appTypes';
import {
  HouseholdCreationContent,
  PopulationStatusHeader,
} from '@/pages/reportBuilder/modals/population';
import { RootState } from '@/store';
import { PopulationStateProps } from '@/types/pathwayState';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
import {
  deriveHouseholdBuilderComposition,
  updateHouseholdBuilderChildCount,
  updateHouseholdBuilderMaritalStatus,
} from '@/utils/householdBuilderComposition';
import { HouseholdValidation } from '@/utils/HouseholdValidation';

interface HouseholdBuilderViewProps {
  population: PopulationStateProps;
  countryId: string;
  onSubmitSuccess: (householdId: string, household: AppHouseholdInputEnvelope) => void;
  onBack?: () => void;
}

export default function HouseholdBuilderView({
  population,
  countryId,
  onSubmitSuccess,
  onBack,
}: HouseholdBuilderViewProps) {
  const currentCountryId = useCurrentCountry();
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
  const [household, setLocalHousehold] = useState<AppHouseholdInputEnvelope>(() => {
    if (population?.household) {
      return {
        ...population.household,
        label: population.label ?? population.household.label ?? null,
      };
    }
    const builder = new HouseholdBuilder(countryId as any, reportYear);
    builder.addAdult('you', 30, { employment_income: 0 });
    return builder.build();
  });
  const { createHousehold, isPending } = useCreateHousehold(household.label || undefined);
  const [validation, setValidation] = useState<ReturnType<
    typeof HouseholdValidation.isReadyForSimulation
  > | null>(null);

  const composition = deriveHouseholdBuilderComposition(household, reportYear);
  const maritalStatus = composition.maritalStatus;
  const numChildren = composition.numChildren;
  const validationMessage = validation?.errors[0]?.message ?? null;

  useEffect(() => {
    setValidation(null);
    const timeoutId = setTimeout(() => {
      setValidation(
        HouseholdValidation.isReadyForSimulation(household, currentCountryId, reportYear)
      );
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [currentCountryId, household, reportYear]);

  // Handler for marital status change - directly modifies household
  const handleMaritalStatusChange = (newStatus: 'single' | 'married') => {
    setValidation(null);
    setLocalHousehold(updateHouseholdBuilderMaritalStatus(household, reportYear, newStatus));
  };

  // Handler for number of children change - directly modifies household
  const handleNumChildrenChange = (newCount: number) => {
    setValidation(null);
    setLocalHousehold(updateHouseholdBuilderChildCount(household, reportYear, newCount));
  };

  const handleHouseholdLabelChange = (label: string) => {
    setLocalHousehold((prev) => ({
      ...prev,
      label: label.trim() ? label : null,
    }));
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
    const validation = HouseholdValidation.isReadyForSimulation(
      household,
      currentCountryId,
      reportYear
    );
    if (!validation.isValid) {
      return;
    }

    const payload = HouseholdModel.fromDraft({
      countryId: countryId as AppHouseholdInputEnvelope['countryId'],
      householdData: household.householdData,
    }).toV1CreationPayload();

    try {
      const result = await createHousehold(payload);

      const householdId = result.result.household_id;
      onSubmitSuccess(householdId, {
        ...household,
        id: householdId,
      });
    } catch (err) {
      // Error is handled by the mutation
    }
  };

  const canProceed = validation?.isValid ?? false;

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

      <PopulationStatusHeader
        householdLabel={household.label ?? ''}
        setHouseholdLabel={handleHouseholdLabelChange}
        memberCount={composition.people.length}
      />

      <HouseholdCreationContent
        householdDraft={household}
        metadata={metadata}
        reportYear={reportYear}
        maritalStatus={maritalStatus}
        numChildren={numChildren}
        basicPersonFields={basicInputFields.person || []}
        basicNonPersonFields={basicNonPersonFields}
        isCreating={loading || isPending}
        validationMessage={validationMessage}
        onChange={setLocalHousehold}
        onMaritalStatusChange={handleMaritalStatusChange}
        onNumChildrenChange={handleNumChildrenChange}
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
