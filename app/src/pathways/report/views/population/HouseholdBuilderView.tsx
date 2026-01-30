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
import { useBasicInputFields } from '@/hooks/useBasicInputFields';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
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
  const basicInputFields = useBasicInputFields(countryId);
  const reduxMetadata = useSelector((state: RootState) => state.metadata);
  const entities = useEntities(countryId);
  const { loading, error } = reduxMetadata;

  // Merge static entities into metadata so VariableResolver can resolve entity types
  const metadata = useMemo(() => ({ ...reduxMetadata, entities }), [reduxMetadata, entities]);

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
    builder.addAdult({ name: 'you', age: 30, employment_income: 0 });
    return builder.build();
  });

  // Derive marital status and number of children from household (single source of truth)
  const hasPartner = household.people.some((p) => p.name === 'your partner');
  const maritalStatus = hasPartner ? 'married' : 'single';
  const numChildren = household.people.filter((p) => p.name?.includes('dependent')).length;

  // Handler for marital status change - directly modifies household
  const handleMaritalStatusChange = (newStatus: 'single' | 'married') => {
    const builder = new HouseholdBuilder(modelName, yearNum);
    builder.loadHousehold(household);

    if (newStatus === 'married' && !hasPartner) {
      builder.addAdult({ name: 'your partner', age: 30, employment_income: 0 });
    } else if (newStatus === 'single' && hasPartner) {
      const partner = household.people.find((p) => p.name === 'your partner');
      if (partner?.person_id !== undefined) {
        builder.removePerson(partner.person_id);
      }
    }

    setLocalHousehold(builder.build());
  };

  // Handler for number of children change - directly modifies household
  const handleNumChildrenChange = (newCount: number) => {
    const builder = new HouseholdBuilder(modelName, yearNum);
    builder.loadHousehold(household);

    const currentChildren = household.people.filter((p) => p.name?.includes('dependent'));
    const currentChildCount = currentChildren.length;

    if (newCount !== currentChildCount) {
      // Remove all existing children
      currentChildren.forEach((child) => {
        if (child.person_id !== undefined) {
          builder.removePerson(child.person_id);
        }
      });

      // Add new children
      if (newCount > 0) {
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];

        for (let i = 0; i < newCount; i++) {
          const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
          builder.addChild({ name: childName, age: 10 });
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
