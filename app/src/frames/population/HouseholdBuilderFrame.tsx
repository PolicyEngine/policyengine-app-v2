/**
 * @deprecated REFERENCE ONLY - Remove before merging PR
 *
 * This file is kept as a reference for the HouseholdBuilderForm component pattern.
 * The app now uses HouseholdBuilderView in src/pathways/ instead.
 * Delete this file and its test before final PR merge.
 */

/**
 * HouseholdBuilderFrame - Orchestrator for household creation flow
 *
 * Responsibilities:
 * - Redux integration (state management)
 * - API integration (household creation)
 * - Flow navigation
 * - Household structure management (HouseholdBuilder)
 *
 * Delegates UI rendering to HouseholdBuilderForm
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingOverlay, Stack, Text } from '@mantine/core';
import { HouseholdAdapter } from '@/adapters/HouseholdAdapter';
import FlowView from '@/components/common/FlowView';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { useReportYear } from '@/hooks/useReportYear';
import { getBasicInputFields } from '@/libs/metadataUtils';
import { selectActivePopulation, selectCurrentPosition } from '@/reducers/activeSelectors';
import {
  initializeHouseholdAtPosition,
  setHouseholdAtPosition,
  updatePopulationAtPosition,
  updatePopulationIdAtPosition,
} from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Household } from '@/types/ingredients/Household';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
import { HouseholdValidation } from '@/utils/HouseholdValidation';

export default function HouseholdBuilderFrame({
  onNavigate,
  onReturn,
  isInSubflow,
}: FlowComponentProps) {
  const dispatch = useDispatch();
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const populationState = useSelector((state: RootState) => selectActivePopulation(state));
  const { createHousehold, isPending } = useCreateHousehold(populationState?.label || '');
  const { resetIngredient } = useIngredientReset();
  const countryId = useCurrentCountry();
  const reportYear = useReportYear();

  // Get metadata-driven options
  const basicInputFields = useSelector(getBasicInputFields);
  const { loading, error } = useSelector((state: RootState) => state.metadata);
  const metadata = useSelector((state: RootState) => state.metadata);

  // Get all basic non-person fields dynamically (country-agnostic)
  // This handles US entities (tax_unit, spm_unit, etc.) and UK entities (benunit) automatically
  const basicNonPersonFields = Object.entries(basicInputFields)
    .filter(([key]) => key !== 'person')
    .flatMap(([, fields]) => fields);

  // Error boundary: Show error if no report year available
  if (!reportYear) {
    return (
      <FlowView
        title="Create Household"
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
          onClick: onReturn,
        }}
      />
    );
  }

  // Initialize household with "you" if none exists
  const [household, setLocalHousehold] = useState<Household>(() => {
    if (populationState?.household) {
      return populationState.household;
    }
    const builder = new HouseholdBuilder(countryId as any, reportYear);
    builder.addAdult('you', 30, { employment_income: 0 });
    return builder.build();
  });

  // Initialize household in Redux on mount if not exists
  useEffect(() => {
    if (!populationState?.household) {
      dispatch(
        initializeHouseholdAtPosition({
          position: currentPosition,
          countryId,
          year: reportYear,
        })
      );
    }
  }, [populationState?.household, countryId, dispatch, currentPosition, reportYear]);

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

  // Handle submit
  const handleSubmit = async () => {
    // Sync final household to Redux before submit
    dispatch(
      setHouseholdAtPosition({
        position: currentPosition,
        household,
      })
    );

    // Validate household
    const validation = HouseholdValidation.isReadyForSimulation(household, reportYear);
    if (!validation.isValid) {
      console.error('[HOUSEHOLD_API] ❌ Validation failed:', validation.errors);
      return;
    }

    console.log('[HOUSEHOLD_API] ✅ Validation passed');

    // Log the raw household data before conversion
    console.log(
      '[HOUSEHOLD_API] 📦 Raw household data (before conversion):',
      household.householdData
    );

    // Convert to API format
    const payload = HouseholdAdapter.toCreationPayload(household.householdData, countryId);

    console.log('[HOUSEHOLD_API] 🚀 API Payload (to be sent):', JSON.stringify(payload, null, 2));

    try {
      const result = await createHousehold(payload);

      console.log('[HOUSEHOLD_API] ✅ Household created successfully');
      console.log('[HOUSEHOLD_API] 📥 API Response:', JSON.stringify(result, null, 2));
      console.log('[HOUSEHOLD_API] 🆔 Household ID:', result.result.household_id);

      const householdId = result.result.household_id;
      const label = populationState?.label || '';

      // Update population state with the created household ID
      dispatch(
        updatePopulationIdAtPosition({
          position: currentPosition,
          id: householdId,
        })
      );
      dispatch(
        updatePopulationAtPosition({
          position: currentPosition,
          updates: {
            label,
            isCreated: true,
          },
        })
      );

      // If standalone flow, reset
      if (!isInSubflow) {
        resetIngredient('population');
      }

      // Navigate
      if (onReturn) {
        onReturn();
      } else {
        onNavigate('next');
      }
    } catch (err) {
      console.error('[HOUSEHOLD_API] ❌ Failed to create household:', err);
      console.error('[HOUSEHOLD_API] 📦 Failed payload was:', JSON.stringify(payload, null, 2));
    }
  };

  // Show error state if metadata failed to load
  if (error) {
    return (
      <FlowView
        title="Create Household"
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

  const validation = HouseholdValidation.isReadyForSimulation(household, reportYear);
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
    <FlowView
      title="Build Your Household"
      content={content}
      primaryAction={primaryAction}
      cancelAction={{
        onClick: onReturn,
      }}
      buttonPreset="cancel-primary"
    />
  );
}
