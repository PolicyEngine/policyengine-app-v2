import { useDispatch, useSelector } from 'react-redux';
import { Group, NumberInput, Select, Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { childOptions, maritalOptions, taxYears } from '@/mocks/householdOptions';
import { updateChildInfo, updatePopulation } from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import {
  HouseholdCreationPayload,
  serializeHouseholdCreationPayload,
} from '@/types/householdPayloads';

export default function HouseholdBuilderFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const household = useSelector((state: RootState) => state.household);
  const { createHousehold } = useCreateHousehold();

  // Generic updater for top-level household fields
  const handleChange = (field: string, value: string | number) => {
    dispatch(updatePopulation({ [field]: value }));
  };

  // Handle number of children change
  const handleNumChildrenChange = (val: string) => {
    const count = parseInt(val || '0', 10);
    handleChange('numChildren', count);
    dispatch(updateChildInfo(Array.from({ length: count }, () => ({ age: '', income: '' }))));
  };

  // Handle changes to a specific child
  const handleChildChange = (index: number, field: 'age' | 'income', value: string) => {
    const updated = [...household.children];
    updated[index] = { ...updated[index], [field]: value };
    dispatch(updateChildInfo(updated));
  };

  const handleSubmit = async () => {
    const payload: HouseholdCreationPayload = serializeHouseholdCreationPayload(household);
    try {
      await createHousehold(payload);
      onNavigate('next');
    } catch (err) {
      console.error('Failed to create household:', err);
    }
  };

  const formInputs = (
    <Stack gap="md">
      <Text fw={600} fz="lg">
        Household Info
      </Text>

      <Select
        label="Tax Year"
        value={household.taxYear}
        onChange={(val) => handleChange('taxYear', val || '')}
        data={taxYears}
        required
      />

      <Select
        label="Marital Status"
        value={household.maritalStatus}
        onChange={(val) => handleChange('maritalStatus', val || '')}
        data={maritalOptions}
        required
      />

      <Select
        label="Number of Children"
        value={household.numChildren.toString()}
        onChange={(val) => handleNumChildrenChange(val || '0')}
        data={childOptions}
        required
      />

      {household.children.map((child, idx) => (
        <Stack key={idx} gap="xs">
          <Text fw={500}>Child {idx + 1}</Text>
          <Group grow>
            <NumberInput
              label="Age"
              value={child.age ? parseInt(child.age, 10) : undefined}
              onChange={(val) => handleChildChange(idx, 'age', val?.toString() || '')}
              min={0}
              max={25}
              required
            />
            <NumberInput
              label="Employment Income"
              value={child.income ? parseFloat(child.income) : undefined}
              onChange={(val) => handleChildChange(idx, 'income', val?.toString() || '')}
              min={0}
              required
            />
          </Group>
        </Stack>
      ))}
    </Stack>
  );

  const primaryAction = {
    label: 'Create Household',
    onClick: handleSubmit,
  };

  return (
    <FlowView
      title="Create Household"
      content={formInputs}
      primaryAction={primaryAction}
    />
  );
}
