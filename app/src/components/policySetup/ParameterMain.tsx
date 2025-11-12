import { Container, Text, Title } from '@mantine/core';
import HistoricalValues from '@/components/policyParameterSelectorFrame/HistoricalValues';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { Parameter, getParameterByName } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection, ValuesList } from '@/types/subIngredients/valueInterval';
import { capitalize } from '@/utils/stringUtils';
import { ParameterValueSetter } from '@/components/policySetup';

interface ParameterMainProps {
  param: ParameterMetadata;
  currentParameters: Parameter[];
  policyLabel: string;
  policyId: string | null;
  onParameterAdd: (name: string, valueInterval: ValueInterval) => void;
}

export default function ParameterMain({
  param,
  currentParameters,
  policyLabel,
  policyId,
  onParameterAdd,
}: ParameterMainProps) {
  const baseValues = new ValueIntervalCollection(param.values as ValuesList);

  // Always start reform with a copy of base values (reform line matches current law initially)
  const reformValues = new ValueIntervalCollection(baseValues);

  // Check if this specific parameter has been modified by the user
  const paramToChart = getParameterByName({ parameters: currentParameters } as any, param.parameter);
  if (paramToChart && paramToChart.values && paramToChart.values.length > 0) {
    // Overlay user intervals on top of base values
    const userIntervals = new ValueIntervalCollection(paramToChart.values as ValuesList);

    // Add each user interval to the reform
    for (const interval of userIntervals.getIntervals()) {
      reformValues.addInterval(interval);
    }
  }

  return (
    <Container variant="guttered">
      <Title order={3} pb="xl">
        {capitalize(param.label || 'Label unavailable')}
      </Title>
      {param.description && (
        <>
          <Text fw={600} pb="xs">
            Description
          </Text>
          <Text pb="sm">{param.description}</Text>
        </>
      )}
      <ParameterValueSetter
        param={param}
        currentParameters={currentParameters}
        onParameterAdd={onParameterAdd}
      />
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
