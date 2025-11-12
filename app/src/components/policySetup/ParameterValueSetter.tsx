import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Container, Divider, Group, Stack, Text } from '@mantine/core';
import { getDateRange } from '@/libs/metadataUtils';
import { ValueSetterContainerProps, ValueSetterMode, ValueSetterProps } from './types';
import { ModeSelectorButton } from './ModeSelectorButton';
import { DefaultValueSelector } from './DefaultValueSelector';
import { YearlyValueSelector } from './YearlyValueSelector';
import { DateValueSelector } from './DateValueSelector';
import { MultiYearValueSelector } from './MultiYearValueSelector';
import { ValueInterval } from '@/types/subIngredients/valueInterval';

const ValueSetterComponents = {
  [ValueSetterMode.DEFAULT]: DefaultValueSelector,
  [ValueSetterMode.YEARLY]: YearlyValueSelector,
  [ValueSetterMode.DATE]: DateValueSelector,
  [ValueSetterMode.MULTI_YEAR]: MultiYearValueSelector,
} as const;

export default function ParameterValueSetter(props: ValueSetterContainerProps) {
  const { param, currentParameters, onParameterAdd } = props;

  const [mode, setMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);

  // Get date ranges from metadata using utility selector
  const { minDate, maxDate } = useSelector(getDateRange);

  const [intervals, setIntervals] = useState<ValueInterval[]>([]);

  // Hoisted date state for all non-multi-year selectors
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');

  function resetValueSettingState() {
    setIntervals([]);
  }

  function handleModeChange(newMode: ValueSetterMode) {
    resetValueSettingState();
    setMode(newMode);
  }

  function handleSubmit() {
    intervals.forEach((interval) => {
      onParameterAdd(param.parameter, interval);
    });
  }

  const ValueSetterToRender = ValueSetterComponents[mode];

  const valueSetterProps: ValueSetterProps = {
    minDate,
    maxDate,
    param,
    currentParameters,
    intervals,
    setIntervals,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  };

  return (
    <Container bg="gray.0" bd="1px solid gray.2" m="0" p="lg">
      <Stack>
        <Text fw={700}>Current value</Text>
        <Divider style={{ padding: 0 }} />
        <Group align="flex-end" w="100%">
          <ValueSetterToRender {...valueSetterProps} />
          <ModeSelectorButton setMode={handleModeChange} />
          <Button onClick={handleSubmit}>Add parameter</Button>
        </Group>
      </Stack>
    </Container>
  );
}
