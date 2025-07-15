import { Parameter } from "@/types/parameter";
import { Center, Text } from "@mantine/core";

interface PolicyParameterSelectorMainProps {
  param: Parameter;
}

export default function PolicyParameterSelectorMain(props: PolicyParameterSelectorMainProps) {
  const { param } = props;

  return (
    <Center h="100%">
      <Text>{param.label || "Label unavailable"}</Text>
      {param.description && (<Text>{param.description}</Text>)}
      <Text fw={700}>TODO: Param value setter</Text>
      <Text fw={700}>TODO: Param historical values chart</Text>
    </Center>

  )
}