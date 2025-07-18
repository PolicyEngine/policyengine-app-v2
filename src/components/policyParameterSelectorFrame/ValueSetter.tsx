import { FOREVER } from "@/constants";
import { Parameter } from "@/types/parameter";
import { ActionIcon, Box, Button, Divider, Group, Menu, NumberInput, Stack, Text } from "@mantine/core";
import { YearPickerInput, DatePickerInput } from "@mantine/dates";
import { useState } from "react";
import { IconSettings } from "@tabler/icons-react";

enum ValueSetterMode {
  DEFAULT = "default",
  YEARLY = "yearly",
  DATE = "date",
  MULTI_YEAR = "multi-year",
}

interface ValueSetterProps {
  param: Parameter;
}

// Shared by all value setter mode components
interface ValueSetterModeProps {
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  minDate: string; // ISO date string (YYYY-MM-DD)
  maxDate: string; // ISO date string (YYYY-MM-DD)
  param: Parameter;
}

interface ValueInputBoxProps {
  param: Parameter;
}

const ValueSetterComponents = {
  [ValueSetterMode.DEFAULT]: DefaultValueSelector,
  [ValueSetterMode.YEARLY]: YearlyValueSelector,
  [ValueSetterMode.DATE]: DateValueSelector,
  [ValueSetterMode.MULTI_YEAR]: () => <Text>TODO: Multi-year value selector</Text>,
} as const;

export default function PolicyParameterSelectorValueSetter(props: ValueSetterProps) {
  const { param } = props;

  const [mode, setMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // TODO: Pull min and max dates from country metadata
  const minDate = "2022-01-01";
  const maxDate = "2035-12-31";


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
          <Group>
            <ValueSetterToRender setStartDate={setStartDate} setEndDate={setEndDate} minDate={minDate} maxDate={maxDate} param={param} />
            <ModeSelectorButton mode={mode} setMode={handleModeChange} />
            <Text>TODO: Reset button</Text>
            <Text>TODO: Add button</Text>
          </Group>
      </Stack>
    </Box>
  );
}

export function ModeSelectorButton(props: { mode: ValueSetterMode; setMode: (mode: ValueSetterMode) => void }) {
  const { mode, setMode } = props;
  return (
    <Menu>
      <Menu.Target>
        <ActionIcon aria-label="Select value setter mode" variant="default">
          <IconSettings />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => setMode(ValueSetterMode.DEFAULT)}
        >
          Default
        </Menu.Item>
        <Menu.Item
          onClick={() => setMode(ValueSetterMode.YEARLY)}
        >
          Yearly
        </Menu.Item>
        <Menu.Item
          onClick={() => setMode(ValueSetterMode.DATE)}
        >
          Advanced
        </Menu.Item>
        <Menu.Item
          onClick={() => setMode(ValueSetterMode.MULTI_YEAR)}
        >
          Multi-year
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export function DefaultValueSelector(props: ValueSetterModeProps) {
  const { setStartDate, minDate, maxDate, param } = props;

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
      <ValueInputBox param={param} />
    </Group>
  )
}

export function YearlyValueSelector(props: ValueSetterModeProps) {
  const { setStartDate, setEndDate, minDate, maxDate, param } = props;

  function handleStartDateChange(value: string | null) {
    setStartDate(value || "");
  }

  function handleEndDateChange(value: string | null) {
    setEndDate(value || "");
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
      <YearPickerInput
        placeholder="Pick a year"
        label="To"
        minDate={minDate}
        maxDate={maxDate}
        onChange={handleEndDateChange}
      />
      <ValueInputBox param={param} />
    </Group>
  )
}

export function DateValueSelector(props: ValueSetterModeProps) {
  const { setStartDate, setEndDate, minDate, maxDate, param } = props;
  function handleStartDateChange(value: string | null) {
    setStartDate(value || "");
  }
  function handleEndDateChange(value: string | null) {
    setEndDate(value || "");
  }
  return (
    <Group>
      <DatePickerInput
        placeholder="Pick a start date"
        label="From"
        minDate={minDate}
        maxDate={maxDate}
        onChange={handleStartDateChange}
      />
      <DatePickerInput
        placeholder="Pick an end date"
        label="To"
        minDate={minDate}
        maxDate={maxDate}
        onChange={handleEndDateChange}
      />
      <ValueInputBox param={param} />
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