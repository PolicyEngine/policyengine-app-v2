import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Group, NumberInput, Select, Stack, Text } from '@mantine/core';
import IngredientCreationStartView from '@/components/IngredientCreationStartView';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { childOptions, maritalOptions, taxYears } from '@/mocks/householdOptions';
import { updateChildInfo, updateHousehold } from '@/reducers/populationReducer';
import { FlowComponentProps } from '@/types/flow';

export default function HouseholdBuilderFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const { mutateAsync: createHousehold } = useCreateHousehold();

  const [taxYear, setTaxYear] = useState('2023');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [numChildren, setNumChildren] = useState(0);
  const [children, setChildren] = useState<{ age: string; income: string }[]>([]);

  function handleNumChildrenChange(val: string) {
    const count = parseInt(val, 10);
    setNumChildren(count);
    setChildren(Array.from({ length: count }, () => ({ age: '', income: '' })));
  }

  function handleChildChange(index: number, field: 'age' | 'income', value: string) {
    const updated = [...children];
    updated[index][field] = value;
    setChildren(updated);
  }

  async function submissionHandler() {
    dispatch(updateHousehold({ taxYear, maritalStatus, numChildren }));
    dispatch(updateChildInfo(children));

    // TODO: payload for creating household needs to be structured correctly to work with the post api
    await createHousehold({
      taxYear,
      maritalStatus,
      numChildren,
      children,
      // children: children.map((c) => ({
      //   age: parseInt(c.age, 10),
      //   income: parseFloat(c.income),
      // })),
    });

    onNavigate('next');
  }

  const formInputs = (
    <Stack gap="md">
      <Text fw={600} fz="lg">
        Household Info
      </Text>

      <Select
        label="Tax Year"
        value={taxYear}
        onChange={(val) => setTaxYear(val || '')}
        data={taxYears}
        required
      />

      <Select
        label="Marital Status"
        value={maritalStatus}
        onChange={(val) => setMaritalStatus(val || '')}
        data={maritalOptions}
        required
      />

      <Select
        label="Number of Children"
        value={numChildren.toString()}
        onChange={(val) => handleNumChildrenChange(val || '0')}
        data={childOptions}
        required
      />

      {children.map((child, idx) => (
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

  return (
    <IngredientCreationStartView
      title="Create Household"
      formInputs={formInputs}
      submissionHandler={submissionHandler}
    />
  );
}
