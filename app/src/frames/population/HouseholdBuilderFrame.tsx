import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Divider,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import {
  getBasicInputFields,
  getFieldLabel,
  getFieldOptions,
  getTaxYears,
  isDropdownField,
} from '@/libs/metadataUtils';
import { childOptions, maritalOptions } from '@/mocks/householdOptions';
import {
  markPopulationAsCreated,
  updateAdultInfo,
  updateChildInfo,
  updateHouseholdInfo,
  updateMaritalStatus,
  updateNumChildren,
  updatePopulationId,
  updatePopulationLabel,
  updateTaxYear,
} from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import {
  HouseholdCreationPayload,
  serializeHouseholdCreationPayload,
} from '@/types/householdPayloads';

export default function HouseholdBuilderFrame({
  onNavigate,
  onReturn,
  isInSubflow,
}: FlowComponentProps) {
  const dispatch = useDispatch();
  const household = useSelector((state: RootState) => state.population);
  const { createHousehold, isPending } = useCreateHousehold();
  const { resetIngredient } = useIngredientReset();

  // Get metadata-driven options
  const taxYears = useSelector(getTaxYears);
  const basicInputFields = useSelector(getBasicInputFields);

  const { loading, error } = useSelector((state: RootState) => state.metadata);
  const isMetadataLoaded = !loading && !error;

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

  // Get field options for all household fields at once
  const fieldOptionsMap = useSelector((state: RootState) => {
    const options: Record<string, Array<{ value: string; label: string }>> = {};
    basicInputFields.household.forEach((field) => {
      if (isDropdownField(field)) {
        options[field] = getFieldOptions(state, field);
      }
    });
    return options;
  });

  // Handlers for core fields
  const handleTaxYearChange = (value: string | null) => {
    dispatch(updateTaxYear(value || ''));
  };

  const handleMaritalStatusChange = (value: string | null) => {
    dispatch(updateMaritalStatus((value || 'single') as 'single' | 'married'));
  };

  const handleNumChildrenChange = (value: string | null) => {
    const count = parseInt(value || '0', 10);
    dispatch(updateNumChildren(count));
  };

  // Handlers for household-level fields
  const handleHouseholdFieldChange = (field: string, value: string | null) => {
    dispatch(updateHouseholdInfo({ field, value: value || '' }));
  };

  // Handlers for person-level fields
  const handleAdultChange = (
    person: 'primary' | 'spouse',
    field: 'age' | 'employment_income',
    value: number | string
  ) => {
    dispatch(
      updateAdultInfo({
        person,
        field,
        value: value?.toString() || '',
      })
    );
  };

  const handleChildChange = (
    index: number,
    field: 'age' | 'employment_income',
    value: number | string
  ) => {
    dispatch(
      updateChildInfo({
        index,
        field,
        value: value?.toString() || '',
      })
    );
  };

  const handleSubmit = async () => {
    const payload: HouseholdCreationPayload = serializeHouseholdCreationPayload(household);
    console.log('serializedHouseholdCreationPayload', payload);

    try {
      const result = await createHousehold(payload);
      console.log('Household created successfully:', result);

      // Update population state with the created household ID and mark as created
      dispatch(updatePopulationId(result.result.household_id));
      dispatch(updatePopulationLabel(household.label || ''));
      dispatch(markPopulationAsCreated());

      // If we've created this population as part of a standalone population creation flow,
      // we're done; clear the population reducer
      if (!isInSubflow) {
        resetIngredient('population');
      }

      // Return to calling flow (simulation setup) or navigate to next frame
      if (onReturn) {
        onReturn();
      } else {
        onNavigate('next');
      }
    } catch (err) {
      console.error('Failed to create household:', err);
    }
  };

  // Render household-level fields dynamically
  const renderHouseholdFields = () => {
    if (!basicInputFields.household.length) {
      return null;
    }

    return (
      <Stack gap="xs">
        <Text fw={500} size="sm" c="dimmed">
          Location & Geographic Information
        </Text>
        {basicInputFields.household.map((field) => {
          const isDropdown = isDropdownField(field);
          const fieldLabel = getFieldLabel(field);
          const fieldValue = household.householdInfo[field] || '';

          if (isDropdown) {
            const options = fieldOptionsMap[field] || [];
            return (
              <Select
                key={field}
                label={fieldLabel}
                value={fieldValue}
                onChange={(val) => handleHouseholdFieldChange(field, val)}
                data={options}
                placeholder={`Select ${fieldLabel}`}
              />
            );
          }
          return (
            <TextInput
              key={field}
              label={fieldLabel}
              value={fieldValue}
              onChange={(e) => handleHouseholdFieldChange(field, e.target.value)}
            />
          );
        })}
      </Stack>
    );
  };

  // Render person-level fields for adults
  const renderAdultFields = () => {
    return (
      <Stack gap="xs">
        <Text fw={500} size="sm" c="dimmed">
          Adult Information
        </Text>

        {/* Primary Adult */}
        <Stack gap="xs">
          <Text fw={500}>You</Text>
          <Group grow>
            <NumberInput
              label="Age"
              value={
                household.adults.primary.age
                  ? parseInt(household.adults.primary.age, 10)
                  : undefined
              }
              onChange={(val) => handleAdultChange('primary', 'age', val || '')}
              min={0}
              max={120}
              required
            />
            <NumberInput
              label="Employment Income"
              value={
                household.adults.primary.employment_income
                  ? parseFloat(household.adults.primary.employment_income)
                  : undefined
              }
              onChange={(val) => handleAdultChange('primary', 'employment_income', val || '')}
              min={0}
              required
            />
          </Group>
        </Stack>

        {/* Spouse (if married) */}
        {household.maritalStatus === 'married' && (
          <Stack gap="xs">
            <Text fw={500}>Your Partner</Text>
            <Group grow>
              <NumberInput
                label="Age"
                value={
                  household.adults.spouse?.age
                    ? parseInt(household.adults.spouse.age, 10)
                    : undefined
                }
                onChange={(val) => handleAdultChange('spouse', 'age', val || '')}
                min={0}
                max={120}
                required
              />
              <NumberInput
                label="Employment Income"
                value={
                  household.adults.spouse?.employment_income
                    ? parseFloat(household.adults.spouse.employment_income)
                    : undefined
                }
                onChange={(val) => handleAdultChange('spouse', 'employment_income', val || '')}
                min={0}
                required
              />
            </Group>
          </Stack>
        )}
      </Stack>
    );
  };

  // Render children fields
  const renderChildrenFields = () => {
    if (household.numChildren === 0) {
      return null;
    }

    return (
      <Stack gap="xs">
        <Text fw={500} size="sm" c="dimmed">
          Children Information
        </Text>
        {household.children.map((child, idx) => (
          <Stack key={idx} gap="xs">
            <Text fw={500}>Child {idx + 1}</Text>
            <Group grow>
              <NumberInput
                label="Age"
                value={child.age ? parseInt(child.age, 10) : undefined}
                onChange={(val) => handleChildChange(idx, 'age', val || '')}
                min={0}
                max={25}
                required
              />
              <NumberInput
                label="Employment Income"
                value={child.employment_income ? parseFloat(child.employment_income) : undefined}
                onChange={(val) => handleChildChange(idx, 'employment_income', val || '')}
                min={0}
                required
              />
            </Group>
          </Stack>
        ))}
      </Stack>
    );
  };

  const formInputs = (
    <Box pos="relative">
      {/* Loading overlay blocks interaction until metadata is ready */}
      <LoadingOverlay
        visible={!isMetadataLoaded}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ type: 'dots' }}
      />

      <Stack gap="lg">
        <Text fw={600} fz="lg">
          Household Information
        </Text>

        {/* Core household settings */}
        <Stack gap="md">
          <Select
            label="Tax Year"
            value={household.taxYear}
            onChange={handleTaxYearChange}
            data={taxYears}
            required
            placeholder={isMetadataLoaded ? undefined : 'Loading...'}
          />

          <Select
            label="Marital Status"
            value={household.maritalStatus}
            onChange={handleMaritalStatusChange}
            data={maritalOptions}
            required
          />

          <Select
            label="Number of Children"
            value={household.numChildren.toString()}
            onChange={handleNumChildrenChange}
            data={childOptions}
            required
          />
        </Stack>

        {/* Dynamic household-level fields */}
        {renderHouseholdFields() && (
          <>
            <Divider />
            {renderHouseholdFields()}
          </>
        )}

        {/* Adult information */}
        <Divider />
        {renderAdultFields()}

        {/* Children information */}
        {household.numChildren > 0 && (
          <>
            <Divider />
            {renderChildrenFields()}
          </>
        )}
      </Stack>
    </Box>
  );

  const primaryAction = {
    label: 'Create Household',
    onClick: handleSubmit,
    isLoading: isPending,
    isDisabled: !isMetadataLoaded || isPending,
  };

  return <FlowView title="Create Household" content={formInputs} primaryAction={primaryAction} />;
}
