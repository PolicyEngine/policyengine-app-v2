import { Parameter } from "@/types/parameter";
import { Center, Text, Stack } from "@mantine/core";
import HistoricalValues from "@/components/policyParameterSelectorFrame/HistoricalValues";
import ValueSetter from "@/components/policyParameterSelectorFrame/ValueSetter";
import { ValueIntervalCollection, ValuesList } from "@/types/valueInterval";
import { useSelector } from "react-redux";

interface PolicyParameterSelectorMainProps {
  param: Parameter;
}

export default function PolicyParameterSelectorMain(props: PolicyParameterSelectorMainProps) {
  const { param } = props;
  const userDefinedPolicy = useSelector((state: any) => state.policy);

  const baseValuesCollection = new ValueIntervalCollection(param.values as ValuesList);
  const reformValuesCollection = new ValueIntervalCollection(userDefinedPolicy.policyParams as ValuesList);

  return (
    <Center h="100%">
      <Stack>
        <Text fw={700}>TODO: Provision Counter</Text>
        <Text>{param.label || "Label unavailable"}</Text>
        {param.description && (<>
          <Text fw={700}>Description</Text>
          <Text>{param.description}</Text>
        </>)}
        <ValueSetter param={param} />
        <HistoricalValues param={param} baseValuesCollection={baseValuesCollection} reformValuesCollection={reformValuesCollection} />
      </Stack>
    </Center>

  )
}