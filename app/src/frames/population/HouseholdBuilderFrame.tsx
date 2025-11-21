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

  // Get all basic non-person fields (household, taxUnit, spmUnit, etc.)
  const basicNonPersonFields = [
    ...basicInputFields.household,
    ...basicInputFields.taxUnit,
    ...basicInputFields.spmUnit,
    ...basicInputFields.family,
    ...basicInputFields.maritalUnit,
  ];

  // State for form controls
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [numChildren, setNumChildren] = useState<number>(0);

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

  // Initialize with empty household if none exists
  const [household, setLocalHousehold] = useState<Household>(() => {
    if (populationState?.household) {
      return populationState.household;
    }
    const builder = new HouseholdBuilder(countryId as any, reportYear);
    return builder.build();
  });

  // Initialize household on mount if not exists
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

  // Rebuild household structure when marital status or children count changes
  useEffect(() => {
    const builder = new HouseholdBuilder(countryId as any, reportYear);

    // Get current people to preserve their data
    const currentPeople = Object.keys(household.householdData.people);
    const hasYou = currentPeople.includes('you');
    const hasPartner = currentPeople.includes('your partner');

    // Add or update primary adult
    if (hasYou) {
      // Preserve existing data
      builder.loadHousehold(household);
    } else {
      // Add new "you" person
      builder.addAdult('you', 30, { employment_income: 0 });
    }

    // Handle spouse based on marital status
    if (maritalStatus === 'married') {
      if (!hasPartner) {
        builder.addAdult('your partner', 30, { employment_income: 0 });
      }
      builder.setMaritalStatus('you', 'your partner');
    } else if (hasPartner) {
      builder.removePerson('your partner');
    }

    // Handle children
    const children = currentPeople.filter((p) => p.includes('dependent'));
    const currentChildCount = children.length;

    if (numChildren !== currentChildCount) {
      // Remove all existing children
      children.forEach((child) => builder.removePerson(child));

      // Add new children
      if (numChildren > 0) {
        const parentIds = maritalStatus === 'married' ? ['you', 'your partner'] : ['you'];
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];

        for (let i = 0; i < numChildren; i++) {
          const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
          builder.addChild(childName, 10, parentIds, { employment_income: 0 });
        }
      }
    }

    // Add required group entities for US
    if (countryId === 'us') {
      const allPeople = ['you'];
      if (maritalStatus === 'married') {
        allPeople.push('your partner');
      }
      for (let i = 0; i < numChildren; i++) {
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
        allPeople.push(`your ${ordinals[i] || `${i + 1}th`} dependent`);
      }

      allPeople.forEach((person) => {
        builder.assignToGroupEntity(person, 'households', 'your household');
        builder.assignToGroupEntity(person, 'families', 'your family');
        builder.assignToGroupEntity(person, 'taxUnits', 'your tax unit');
        builder.assignToGroupEntity(person, 'spmUnits', 'your household');
      });
    }

    setLocalHousehold(builder.build());
  }, [maritalStatus, numChildren, reportYear, countryId]);

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
    console.log('[HOUSEHOLD_API] 📦 Raw household data (before conversion):', {
      people: household.householdData.people,
      households: household.householdData.households,
      taxUnits: household.householdData.tax_units,
      spmUnits: household.householdData.spm_units,
      families: household.householdData.families,
      maritalUnits: household.householdData.marital_units,
    });

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
        basicPersonFields={basicInputFields.person}
        basicNonPersonFields={basicNonPersonFields}
        onChange={setLocalHousehold}
        onMaritalStatusChange={setMaritalStatus}
        onNumChildrenChange={setNumChildren}
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
