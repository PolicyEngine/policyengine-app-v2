import { Box, Button, Divider, Group, Stack, Text } from "@mantine/core";
import { YearPickerInput } from "@mantine/dates";
import { useState } from "react";

enum ValueSetterMode {
  DEFAULT = "default",
  YEARLY = "yearly",
  DATE = "date",
  MULTI_YEAR = "multi-year",
}

const ValueSetterComponents = {
  [ValueSetterMode.DEFAULT]: DefaultValueSelector,
  [ValueSetterMode.YEARLY]: () => <Text>TODO: Yearly value selector
  </Text>,
  [ValueSetterMode.DATE]: () => <Text>TODO: Date value selector</Text>,
  [ValueSetterMode.MULTI_YEAR]: () => <Text>TODO: Multi-year value selector</Text>,
} as const;

export default function PolicyParameterSelectorValueSetter() {

  const [isNewSetter, setIsNewSetter] = useState(false);

  return (
    <Box>
      <Stack>
        <Text fw={700}>Current value</Text>
        <Divider my="xs" />
        {isNewSetter ? (
          <Text>TODO: New value setter component</Text>
        ) : (
          <ParamDateSelector />
        )}
      </Stack>
      <Button onClick={() => setIsNewSetter(!isNewSetter)}>
        Show {isNewSetter ? "Figma-based" : "prototype"} value setter
      </Button>
    </Box>
  );
}

export function ParamDateSelector() {

  const [mode, setMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);

  const handleModeChange = (newMode: ValueSetterMode) => {
    setMode(newMode);
  };

  const ValueSetterToRender = ValueSetterComponents[mode];
  return (
    <Group>
      <ValueSetterToRender />
      <Text>TODO: Gear icon</Text>
      <Text>TODO: Reset button</Text>
      <Text>TODO: Add button</Text>
    </Group>
  )
}

export function DefaultValueSelector() {

  // TODO: Pull min and max dates from country metadata
  const minDate = "2022-01-01";
  const maxDate = "2035-12-31";

  return (
    <Group>
      <Stack>
        <Text size="sm" fw={700}>From</Text>
        <YearPickerInput
          placeholder="Pick a year"
          label="Year"
          minDate={minDate}
          maxDate={maxDate}
          withAsterisk
        />
      </Stack>
      <Stack>
        <Text size="sm" fw={700}>Onward</Text>
        <Text>TODO: Value input box</Text>
      </Stack>
    </Group>
  )
}