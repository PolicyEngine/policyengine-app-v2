import { useSelector } from 'react-redux';
import { Center, Stack, Text } from '@mantine/core';
import HistoricalValues from '@/components/policyParameterSelectorFrame/HistoricalValues';
import ValueSetter from '@/components/policyParameterSelectorFrame/ValueSetter';
import { ParameterMetadataModule } from '@/types/parameter';
import { ValueIntervalCollection, ValuesList } from '@/types/valueInterval';
import { getParamByName } from '@/reducers/policyReducer';

/* TODO:
- Implement reset functionality
- Implement a switch for boolean values
- Implement a dropdown for selecting predefined values
- Implement search feature
- Properly fill default values based on pre-existing param values
*/

interface PolicyParameterSelectorMainProps {
  param: ParameterMetadataModule;
}

export default function PolicyParameterSelectorMain(props: PolicyParameterSelectorMainProps) {
  const { param } = props;
  const userDefinedPolicy = useSelector((state: any) => state.policy);

  const baseValues = new ValueIntervalCollection(param.values as ValuesList);
  let reformValues = null;
  if (userDefinedPolicy && userDefinedPolicy.params) {
    const paramToChart = getParamByName(userDefinedPolicy, param.parameter);
    reformValues = new ValueIntervalCollection(paramToChart?.values as ValuesList);
  } else {
    reformValues = new ValueIntervalCollection(baseValues);
  }

  return (
    <Center h="100%">
      <Stack>
        <Text fw={700}>TODO: Provision Counter</Text>
        <Text>{param.label || 'Label unavailable'}</Text>
        {param.description && (
          <>
            <Text fw={700}>Description</Text>
            <Text>{param.description}</Text>
          </>
        )}
        <ValueSetter param={param} />
        <HistoricalValues param={param} baseValues={baseValues} reformValues={reformValues} />
      </Stack>
    </Center>
  );
}
