import { Parameter } from "@/types/parameter";
import { Center, Text, Stack } from "@mantine/core";
import HistoricalValues from "@/components/policyParameterSelectorFrame/HistoricalValues";
import { ValueIntervalCollection, ValuesList } from "@/types/valueInterval";

interface PolicyParameterSelectorMainProps {
  param: Parameter;
}

export default function PolicyParameterSelectorMain(props: PolicyParameterSelectorMainProps) {
  const { param } = props;

  const baseValuesCollection = new ValueIntervalCollection(param.values as ValuesList);

  return (
    <Center h="100%">
      <Stack>
        <Text fw={700}>TODO: Provision Counter</Text>
        <Text>{param.label || "Label unavailable"}</Text>
        {param.description && (<>
          <Text fw={700}>Description</Text>
          <Text>{param.description}</Text>
        </>)}
        <Text fw={700}>TODO: Param value setter</Text>
        <HistoricalValues param={param} baseValuesCollection={baseValuesCollection} />
      </Stack>
    </Center>

  )
}