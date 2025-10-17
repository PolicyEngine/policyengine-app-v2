import { useSelector } from 'react-redux';
import { Container, Text, Title } from '@mantine/core';
import HistoricalValues from '@/components/policyParameterSelectorFrame/HistoricalValues';
import ValueSetter from '@/components/policyParameterSelectorFrame/ValueSetter';
import { selectActivePolicy } from '@/reducers/activeSelectors';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { getParameterByName } from '@/types/subIngredients/parameter';
import { ValueIntervalCollection, ValuesList } from '@/types/subIngredients/valueInterval';

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
  const activePolicy = useSelector(selectActivePolicy);

  const baseValues = new ValueIntervalCollection(param.values as ValuesList);

  // Always start reform with a copy of base values (reform line matches current law initially)
  const reformValues = new ValueIntervalCollection(baseValues);
  let policyLabel = null;
  let policyId = null;

  // If a policy exists, get metadata and check for user-defined parameter values
  if (activePolicy) {
    policyLabel = activePolicy.label;
    policyId = activePolicy.id;

    // Check if this specific parameter has been modified by the user
    const paramToChart = getParameterByName(activePolicy, param.parameter);
    if (paramToChart && paramToChart.values && paramToChart.values.length > 0) {
      // Don't replace - instead, overlay user intervals on top of base values
      const userIntervals = new ValueIntervalCollection(paramToChart.values as ValuesList);

      // Add each user interval to the reform (which already contains base values)
      // addInterval() will properly handle overlaps and merge/split intervals as needed
      for (const interval of userIntervals.getIntervals()) {
        reformValues.addInterval(interval);
      }
    }
    // If no values for this parameter yet, reformValues stays as baseValues (set above)
  }

  return (
    <Container variant="guttered">
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
      <HistoricalValues
        param={param}
        baseValues={baseValues}
        reformValues={reformValues}
        policyLabel={policyLabel}
        policyId={policyId}
      />
    </Container>
  );
}
