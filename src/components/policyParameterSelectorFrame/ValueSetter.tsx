import { FOREVER } from "@/constants";
import { Parameter } from "@/types/parameter";
import { Box, Button, Divider, Group, NumberInput, Stack, Text } from "@mantine/core";
import { YearPickerInput } from "@mantine/dates";
import { useState } from "react";

enum ValueSetterMode {
  DEFAULT = "default",
  YEARLY = "yearly",
  DATE = "date",
  MULTI_YEAR = "multi-year",
}

interface ValueSetterProps {
  param: Parameter;
}

// Shared by all date setter components
interface DateSetterProps {
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

interface ValueInputBoxProps {
  param: Parameter;
}

const ValueSetterComponents = {
  [ValueSetterMode.DEFAULT]: DefaultValueSelector,
  [ValueSetterMode.YEARLY]: () => <Text>TODO: Yearly value selector
  </Text>,
  [ValueSetterMode.DATE]: () => <Text>TODO: Date value selector</Text>,
  [ValueSetterMode.MULTI_YEAR]: () => <Text>TODO: Multi-year value selector</Text>,
} as const;

export default function PolicyParameterSelectorValueSetter(props: ValueSetterProps) {
  const { param } = props;

  const [isNewSetter, setIsNewSetter] = useState(false);
  const [mode, setMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleModeChange = (newMode: ValueSetterMode) => {
    if (newMode === ValueSetterMode.DEFAULT) {
      setEndDate(FOREVER); // Reset end date to FOREVER for default mode
    }
    setMode(newMode);
  };

  const ValueSetterToRender = ValueSetterComponents[mode];
  return (
    <Box>
      <Stack>
        <Text fw={700}>Current value</Text>
        <Divider my="xs" />
        {isNewSetter ? (
          <Text>TODO: New value setter component</Text>
        ) : (
          <Group>
            <ValueSetterToRender setStartDate={setStartDate} setEndDate={setEndDate} />
            <ValueInputBox param={param} />
            <Text>TODO: Gear icon</Text>
            <Text>TODO: Reset button</Text>
            <Text>TODO: Add button</Text>
          </Group>
        )}
      </Stack>
      <Button onClick={() => setIsNewSetter(!isNewSetter)}>
        Show {isNewSetter ? "Figma-based" : "prototype"} value setter
      </Button>
    </Box>
  );
}

export function DefaultValueSelector(props: DateSetterProps) {
  const { setStartDate } = props;

  // TODO: Pull min and max dates from country metadata
  const minDate = "2022-01-01";
  const maxDate = "2035-12-31";

  function handleStartDateChange(value: string | null) {
    setStartDate(value || "");
  }

  return (
    <Group>
      <YearPickerInput
        placeholder="Pick a year"
        label="From"
        minDate={minDate}
        maxDate={maxDate}
        onChange={handleStartDateChange}
      />
      <Text>onward</Text>
    </Group>
  )
}

export function ValueInputBox(props: ValueInputBoxProps) {

  const { param } = props;


  // US and UK packages use these inconsistently
  const USD_UNITS = ["currency-USD", "currency_USD", "USD"]; 
  const GBP_UNITS = ["currency-GBP", "currency_GBP", "GBP"];

  const prefix = USD_UNITS.includes(String(param.unit)) ? "$" : GBP_UNITS.includes(String(param.unit)) ? "£" : "";

  if (param.type !== "parameter") {
    console.error("ValueInputBox expects a parameter type of 'parameter', got:", param.type);
    return <NumberInput disabled value={0} />;
  }

  return (
    param.unit === "bool" ? (
      <Text>TODO: Switch for boolean value</Text>
    ) : (
      <NumberInput
        placeholder="Enter value"
        min={0}
        prefix={prefix}
        suffix={param.unit === "/1" ? "%" : ""}
        defaultValue={0} // TODO: Logic around setting default input values; this requires pulling from reform interval values
        thousandSeparator=","
      />
    )
  )

  /*

  NumberInput
  -----------
  * /1 (with % marker)
  * Child care facility quality rating?
  * USD
  * Age
  * Child
  * currency-USD
  * currency_USD
  * day
  * dependent
  * float
  * hour
  * hours
  * int
  * kilowatt-hour
  * miles
  * month
  * motor-vehicle
  * people
  * person
  * persons
  * quarters
  * week
  * year
  * years
  
  Switch
  -----------
  * Bool


  Unknown
  -----------
  * Abolition
  * list
  * single_amount



  */





}