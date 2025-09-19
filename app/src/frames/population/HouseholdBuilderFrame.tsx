import { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  Divider,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { HouseholdAdapter } from '@/adapters/HouseholdAdapter';
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
import * as HouseholdQueries from '@/utils/HouseholdQueries';
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
  const countryId = 'us'; // TODO: Get from application state when available

  // Initialize with empty household if none exists
  const [household, setLocalHousehold] = useState<Household>(() => {
    if (populationState?.household) {
      return populationState.household;
    }
    const builder = new HouseholdBuilder(countryId as any, '2024');
    return builder.build();
  });

  // Get metadata-driven options
  const taxYears = useSelector(getTaxYears);
  const basicInputFields = useSelector(getBasicInputFields);
  const variables = useSelector((state: RootState) => state.metadata.variables);

  const { loading, error } = useSelector((state: RootState) => state.metadata);

  // Helper to get default value for a variable from metadata
  const getVariableDefault = (variableName: string): any => {
    const snakeCaseName = variableName.replace(/([A-Z])/g, '_$1').toLowerCase();
    const variable = variables?.[snakeCaseName] || variables?.[variableName];
    return variable?.defaultValue ?? 0;
  };

  // State for form controls
  const [taxYear, setTaxYear] = useState<string>('2024');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [numChildren, setNumChildren] = useState<number>(0);

  // Initialize household on mount if not exists
  useEffect(() => {
    if (!populationState?.household) {
      dispatch(
        initializeHouseholdAtPosition({
          position: currentPosition,
          countryId,
          year: taxYear,
        })
      );
    }
  }, [populationState?.household, countryId, dispatch, currentPosition, taxYear]);

  // Build household based on form values
  useEffect(() => {
    const builder = new HouseholdBuilder(countryId as any, taxYear);

    // Get current people to preserve their data
    const currentPeople = Object.keys(household.householdData.people);
    const hasYou = currentPeople.includes('you');
    const hasPartner = currentPeople.includes('your partner');

    // Add or update primary adult
    if (hasYou) {
      // Preserve existing data
      builder.loadHousehold(household);
    } else {
      // Add new "you" person with defaults from metadata
      const ageDefault = getVariableDefault('age');
      const defaults: Record<string, any> = {};
      basicInputFields.person.forEach((field: string) => {
        if (field !== 'age') {
          defaults[field] = getVariableDefault(field);
        }
      });
      builder.addAdult('you', ageDefault, defaults);
    }

    // Handle spouse based on marital status
    if (maritalStatus === 'married') {
      if (!hasPartner) {
        // Add partner with defaults from metadata
        const ageDefault = getVariableDefault('age');
        const defaults: Record<string, any> = {};
        basicInputFields.person.forEach((field: string) => {
          if (field !== 'age') {
            defaults[field] = getVariableDefault(field);
          }
        });
        builder.addAdult('your partner', ageDefault, defaults);
      }
      builder.setMaritalStatus('you', 'your partner');
    } else if (hasPartner) {
      // Remove partner if switching to single
      builder.removePerson('your partner');
    }

    // Handle children
    const currentChildCount = HouseholdQueries.getChildCount(household, taxYear);
    if (numChildren !== currentChildCount) {
      // Remove all existing children
      const children = HouseholdQueries.getChildren(household, taxYear);
      children.forEach((child) => builder.removePerson(child.name));

      // Add new children with defaults (age 10, other variables from metadata)
      if (numChildren > 0) {
        const parentIds = maritalStatus === 'married' ? ['you', 'your partner'] : ['you'];
        const childDefaults: Record<string, any> = {};
        basicInputFields.person.forEach((field: string) => {
          if (field !== 'age') {
            childDefaults[field] = getVariableDefault(field);
          }
        });

        for (let i = 0; i < numChildren; i++) {
          const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
          const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
          builder.addChild(childName, 10, parentIds, childDefaults);
        }
      }
    }

    // Add required group entities for US
    if (countryId === 'us') {
      // Create household group
      builder.assignToGroupEntity('you', 'households', 'your household');
      if (maritalStatus === 'married') {
        builder.assignToGroupEntity('your partner', 'households', 'your household');
      }
      for (let i = 0; i < numChildren; i++) {
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
        const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
        builder.assignToGroupEntity(childName, 'households', 'your household');
      }

      // Create family
      builder.assignToGroupEntity('you', 'families', 'your family');
      if (maritalStatus === 'married') {
        builder.assignToGroupEntity('your partner', 'families', 'your family');
      }
      for (let i = 0; i < numChildren; i++) {
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
        const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
        builder.assignToGroupEntity(childName, 'families', 'your family');
      }

      // Create tax unit
      builder.assignToGroupEntity('you', 'taxUnits', 'your tax unit');
      if (maritalStatus === 'married') {
        builder.assignToGroupEntity('your partner', 'taxUnits', 'your tax unit');
      }
      for (let i = 0; i < numChildren; i++) {
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
        const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
        builder.assignToGroupEntity(childName, 'taxUnits', 'your tax unit');
      }

      // Create SPM unit
      builder.assignToGroupEntity('you', 'spmUnits', 'your household');
      if (maritalStatus === 'married') {
        builder.assignToGroupEntity('your partner', 'spmUnits', 'your household');
      }
      for (let i = 0; i < numChildren; i++) {
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
        const childName = `your ${ordinals[i] || `${i + 1}th`} dependent`;
        builder.assignToGroupEntity(childName, 'spmUnits', 'your household');
      }
    }

    setLocalHousehold(builder.build());
  }, [maritalStatus, numChildren, taxYear, countryId]);

  // Handle adult field changes
  const handleAdultChange = (person: string, field: string, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const updatedHousehold = { ...household };

    if (!updatedHousehold.householdData.people[person]) {
      updatedHousehold.householdData.people[person] = {};
    }

    if (!updatedHousehold.householdData.people[person][field]) {
      updatedHousehold.householdData.people[person][field] = {};
    }

    updatedHousehold.householdData.people[person][field][taxYear] = numValue;
    setLocalHousehold(updatedHousehold);
  };

  // Handle child field changes
  const handleChildChange = (childKey: string, field: string, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const updatedHousehold = { ...household };

    if (!updatedHousehold.householdData.people[childKey]) {
      updatedHousehold.householdData.people[childKey] = {};
    }

    if (!updatedHousehold.householdData.people[childKey][field]) {
      updatedHousehold.householdData.people[childKey][field] = {};
    }

    updatedHousehold.householdData.people[childKey][field][taxYear] = numValue;
    setLocalHousehold(updatedHousehold);
  };

  // Handle group entity field changes
  const handleGroupEntityChange = (
    entityName: string,
    groupKey: string,
    field: string,
    value: string | null
  ) => {
    const updatedHousehold = { ...household };

    // Ensure entity exists
    if (!updatedHousehold.householdData[entityName]) {
      updatedHousehold.householdData[entityName] = {};
    }

    const entities = updatedHousehold.householdData[entityName] as Record<string, any>;

    // Ensure group exists
    if (!entities[groupKey]) {
      entities[groupKey] = { members: [] };
    }

    entities[groupKey][field] = { [taxYear]: value || '' };
    setLocalHousehold(updatedHousehold);
  };

  // Convenience function for household-level fields
  const handleHouseholdFieldChange = (field: string, value: string | null) => {
    handleGroupEntityChange('households', 'your household', field, value);
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

  // Get field options for all household fields at once
  const fieldOptionsMap = useSelector((state: RootState) => {
    const options: Record<string, Array<{ value: string; label: string }>> = {};
    basicInputFields.household.forEach((field) => {
      if (isDropdownField(field)) {
        options[field] = getFieldOptions(state, field);
      }
    });
    return options;
  }, shallowEqual);

  const handleSubmit = async () => {
    // Sync final household to Redux before submit
    dispatch(
      setHouseholdAtPosition({
        position: currentPosition,
        household,
      })
    );

    // Validate household
    const validation = HouseholdValidation.isReadyForSimulation(household);
    if (!validation.isValid) {
      console.error('Household validation failed:', validation.errors);
      return;
    }

    // Convert to API format
    const payload = HouseholdAdapter.toCreationPayload(household.householdData, countryId);

    console.log('Creating household with payload:', payload);

    try {
      const result = await createHousehold(payload);
      console.log('Household created successfully:', result);

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
          const fieldValue =
            household.householdData.households?.['your household']?.[field]?.[taxYear] || '';

          if (isDropdown) {
            const options = fieldOptionsMap[field] || [];
            return (
              <Select
                key={field}
                label={fieldLabel}
                value={fieldValue?.toString() || ''}
                onChange={(val) => handleHouseholdFieldChange(field, val)}
                data={options}
                placeholder={`Select ${fieldLabel}`}
                searchable
              />
            );
          }

          return (
            <TextInput
              key={field}
              label={fieldLabel}
              value={fieldValue?.toString() || ''}
              onChange={(e) => handleHouseholdFieldChange(field, e.currentTarget.value)}
              placeholder={`Enter ${fieldLabel}`}
            />
          );
        })}
      </Stack>
    );
  };

  // Render adults section
  const renderAdults = () => (
    <Stack gap="md">
      <Text fw={500} size="sm" c="dimmed">
        Adults
      </Text>

      {/* Primary adult */}
      <Group gap="xs">
        <Text size="sm" fw={500} style={{ flex: 0, minWidth: 100 }}>
          You
        </Text>
        <NumberInput
          value={
            HouseholdQueries.getPersonVariable(household, 'you', 'age', taxYear) ||
            getVariableDefault('age')
          }
          onChange={(val) => handleAdultChange('you', 'age', val || 0)}
          min={18}
          max={120}
          placeholder="Age"
          style={{ flex: 1 }}
        />
        <NumberInput
          value={
            HouseholdQueries.getPersonVariable(household, 'you', 'employment_income', taxYear) || 0
          }
          onChange={(val) => handleAdultChange('you', 'employment_income', val || 0)}
          min={0}
          prefix="$"
          thousandSeparator=","
          placeholder="Employment Income"
          style={{ flex: 2 }}
        />
      </Group>

      {/* Spouse (if married) */}
      {maritalStatus === 'married' && (
        <Group gap="xs">
          <Text size="sm" fw={500} style={{ flex: 0, minWidth: 100 }}>
            Your Partner
          </Text>
          <NumberInput
            value={
              HouseholdQueries.getPersonVariable(household, 'your partner', 'age', taxYear) ||
              getVariableDefault('age')
            }
            onChange={(val) => handleAdultChange('your partner', 'age', val || 0)}
            min={18}
            max={120}
            placeholder="Age"
            style={{ flex: 1 }}
          />
          <NumberInput
            value={
              HouseholdQueries.getPersonVariable(
                household,
                'your partner',
                'employment_income',
                taxYear
              ) || 0
            }
            onChange={(val) => handleAdultChange('your partner', 'employment_income', val || 0)}
            min={0}
            prefix="$"
            thousandSeparator=","
            placeholder="Employment Income"
            style={{ flex: 2 }}
          />
        </Group>
      )}
    </Stack>
  );

  // Render children section
  const renderChildren = () => {
    if (numChildren === 0) {
      return null;
    }

    const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];

    return (
      <Stack gap="md">
        <Text fw={500} size="sm" c="dimmed">
          Children
        </Text>

        {Array.from({ length: numChildren }, (_, index) => {
          const childKey = `your ${ordinals[index] || `${index + 1}th`} dependent`;
          return (
            <Group key={index} gap="xs">
              <Text size="sm" fw={500} style={{ flex: 0, minWidth: 100 }}>
                Child {index + 1}
              </Text>
              <NumberInput
                value={
                  HouseholdQueries.getPersonVariable(household, childKey, 'age', taxYear) || 10
                }
                onChange={(val) => handleChildChange(childKey, 'age', val || 0)}
                min={0}
                max={17}
                placeholder="Age"
                style={{ flex: 1 }}
              />
              <NumberInput
                value={
                  HouseholdQueries.getPersonVariable(
                    household,
                    childKey,
                    'employment_income',
                    taxYear
                  ) || 0
                }
                onChange={(val) => handleChildChange(childKey, 'employment_income', val || 0)}
                min={0}
                prefix="$"
                thousandSeparator=","
                placeholder="Employment Income"
                style={{ flex: 2 }}
              />
            </Group>
          );
        })}
      </Stack>
    );
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

      {/* Tax Year Selection */}
      <Select
        label="Tax Year"
        value={taxYear}
        onChange={(val) => setTaxYear(val || '2024')}
        data={taxYears}
        placeholder="Select Tax Year"
        required
      />

      {/* Core household configuration */}
      <Group grow>
        <Select
          label="Marital Status"
          value={maritalStatus}
          onChange={(val) => setMaritalStatus((val || 'single') as 'single' | 'married')}
          data={[
            { value: 'single', label: 'Single' },
            { value: 'married', label: 'Married' },
          ]}
        />

        <Select
          label="Number of Children"
          value={numChildren.toString()}
          onChange={(val) => setNumChildren(parseInt(val || '0', 10))}
          data={[
            { value: '0', label: '0' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
          ]}
        />
      </Group>

      {/* Household-level fields */}
      {renderHouseholdFields()}

      <Divider />

      {/* Adults section */}
      {renderAdults()}

      {numChildren > 0 && <Divider />}

      {/* Children section */}
      {renderChildren()}
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
