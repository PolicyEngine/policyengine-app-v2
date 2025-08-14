import { useSelector } from 'react-redux';
import { Container, Text, Title } from '@mantine/core';
import HistoricalValues from '@/components/policyParameterSelectorFrame/HistoricalValues';
import ValueSetter from '@/components/policyParameterSelectorFrame/ValueSetter';
import { getParameterByName } from '@/types/parameter';
import { ParameterMetadata } from '@/types/parameterMetadata';
import { ValueIntervalCollection, ValuesList } from '@/types/valueInterval';

/* TODO:
- Implement reset functionality
- Implement a switch for boolean values
- Implement a dropdown for selecting predefined values
- Implement search feature
- Properly fill default values based on pre-existing param values
*/

interface PolicyParameterSelectorMainProps {
  param: ParameterMetadata;
}

export default function PolicyParameterSelectorMain(props: PolicyParameterSelectorMainProps) {
  const { param } = props;
  const userDefinedPolicy = useSelector((state: any) => state.policy);

  const baseValues = new ValueIntervalCollection(param.values as ValuesList);
  let reformValues = null;
  if (userDefinedPolicy && userDefinedPolicy.params) {
    const paramToChart = getParameterByName(userDefinedPolicy, param.parameter);
    reformValues = new ValueIntervalCollection(paramToChart?.values as ValuesList);
  } else {
    reformValues = new ValueIntervalCollection(baseValues);
  }

  return (
    <Container variant="guttered">
      <Text fw={700}>TODO: Provision Counter</Text>
      <Title order={3} pb="xl">
        {param.label || 'Label unavailable'}
      </Title>
      {param.description && (
        <>
          <Text fw={600} pb="xs">
            Description
          </Text>
          <Text pb="sm">{param.description}</Text>
        </>
      )}
      <ValueSetter param={param} />
      <HistoricalValues param={param} baseValues={baseValues} reformValues={reformValues} />
    </Container>
  );
}
