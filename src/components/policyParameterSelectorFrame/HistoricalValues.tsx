import { ValueIntervalCollection } from '@/types/valueInterval';
import { Parameter } from '@/types/parameter';
import { Stack, Text } from '@mantine/core';

interface PolicyParameterSelectorHistoricalValuesProps {
  param: Parameter;
}

export default function PolicyParameterSelectorHistoricalValues(props: PolicyParameterSelectorHistoricalValuesProps) {
  const { param } = props;

  return (
    <Stack>
      <Text fw={700}>Historical values</Text>
      <Text>{param.label} over time</Text>
      <Text fw={700}>TODO: Historical values chart</Text>
    </Stack>
  )
}