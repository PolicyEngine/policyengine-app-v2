import { FOREVER } from "@/constants";
import { Parameter } from "@/types/parameter";
import { ActionIcon, Box, Button, Divider, Group, Menu, NumberInput, Stack, Text } from "@mantine/core";
import { YearPickerInput, DatePickerInput } from "@mantine/dates";
import { useState, SetStateAction, Dispatch } from "react";
import { IconSettings } from "@tabler/icons-react";
import { ValueInterval } from "@/types/valueInterval";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { addPolicyParam } from "@/reducers/policyReducer";

enum ValueSetterMode {
  DEFAULT = "default",
  YEARLY = "yearly",
  DATE = "date",
  MULTI_YEAR = "multi-year",
}

interface ValueSetterProps {
  param: Parameter;
  onSubmit?: () => void; // Optional submit handler
}

interface SharedValueSetterProps {
  minDate: string; // ISO date string (YYYY-MM-DD)
  maxDate: string; // ISO date string (YYYY-MM-DD)
}

interface SingleYearValueSetterProps extends SharedValueSetterProps {
  setStartDate: Dispatch<SetStateAction<string>>;
  setEndDate: Dispatch<SetStateAction<string>>;
  setParamValue: Dispatch<SetStateAction<any>>;
}

interface MultiYearValueSetterProps extends SharedValueSetterProps {
  setParams: Dispatch<SetStateAction<ValueInterval[]>>;
}

interface ValueInputBoxProps {
  param: Parameter;
  onSubmit?: (value: any) => void; // Optional submit handler for value input
}

const ValueSetterComponents = {
  [ValueSetterMode.DEFAULT]: DefaultValueSelector,
  [ValueSetterMode.YEARLY]: YearlyValueSelector,
  [ValueSetterMode.DATE]: DateValueSelector,
  [ValueSetterMode.MULTI_YEAR]: MultiYearValueSelector,
} as const;

export default function PolicyParameterSelectorValueSetterContainer(props: ValueSetterProps) {
  const { param } = props;

  const [mode, setMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const userDefinedPolicy = useSelector((state: any) => state.policy);

  const dispatch = useDispatch();

  // Props for single-year inputs only
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>(mode === ValueSetterMode.DEFAULT ? FOREVER : ""); // Default to FOREVER for default mode
  const [paramValue, setParamValue] = useState<any>(0); // Default value, can be adjusted based on param type

  // Props for multi-year inputs
  const [params, setParams] = useState<ValueInterval[]>([]); // Array of ValueInterval objects for multi-year inputs

  // TODO: Pull min and max dates from country metadata
  const minDate = "2022-01-01";
  const maxDate = "2035-12-31";


  function handleModeChange(newMode: ValueSetterMode) {
    if (newMode === ValueSetterMode.DEFAULT) {
      setEndDate(FOREVER); // Reset end date to FOREVER for default mode
    }
    setMode(newMode);
  };

  function handleSubmit() {
    if (mode === ValueSetterMode.MULTI_YEAR) {
      // Logic to handle multi-year submission
      // This could involve sending the params array to a backend or updating state
      console.log("Submitting multi-year values:", params);
      return;
    } 

    const newInterval: ValueInterval = {
      startDate: startDate,
      endDate: endDate,
      value: paramValue,
    };

    dispatch(addPolicyParam(newInterval))
    
  }

  const ValueSetterToRender = ValueSetterComponents[mode];

  // Use type assertions to ensure correct prop types are passed in render
  const MultiYearComponent = ValueSetterToRender as React.ComponentType<MultiYearValueSetterProps>;
  const SingleYearComponent = ValueSetterToRender as React.ComponentType<SingleYearValueSetterProps>;

  const sharedProps = {
    minDate,
    maxDate,
  }

  const singleYearProps = {
    ...sharedProps,
    setStartDate,
    setEndDate,
    setParamValue,
  }

  const multiYearProps = {
    ...sharedProps,
    setParams,
  }


  return (
    <Box>
      <Stack>
        <Text fw={700}>Current value</Text>
        <Divider my="xs" />
          <Group>
            { mode === ValueSetterMode.MULTI_YEAR ? (
              <MultiYearComponent {...multiYearProps} />
            ) : (
              <>
                <SingleYearComponent {...singleYearProps} />
                <ValueInputBox param={param} onSubmit={setParamValue} />
              </>
            )}
            <ModeSelectorButton setMode={handleModeChange} />
            <Text>TODO: Reset button</Text>
            <Button onClick={handleSubmit} >
              Add
            </Button>
          </Group>
      </Stack>
    </Box>
  );
}

export function ModeSelectorButton(props: { setMode: (mode: ValueSetterMode) => void }) {
  const { setMode } = props;
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

export function DefaultValueSelector(props: SingleYearValueSetterProps) {
  const { setStartDate, minDate, maxDate } = props;

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

export function YearlyValueSelector(props: SingleYearValueSetterProps) {
  const { setStartDate, setEndDate, minDate, maxDate } = props;

  function handleStartDateChange(value: string | null) {
    setStartDate(value || "");
  }

  function handleEndDateChange(value: string | null) {
    const endOfYearDate = dayjs(value || "").endOf('year').format('YYYY-MM-DD');
    setEndDate(endOfYearDate);
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
    </Group>
  )
}

export function DateValueSelector(props: SingleYearValueSetterProps) {
  const { setStartDate, setEndDate, minDate, maxDate } = props;
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
    </Group>
  )
}

export function MultiYearValueSelector(props: MultiYearValueSetterProps) {
  const { setParams, minDate, maxDate } = props;
  return (
    <></>
  )
}


export function ValueInputBox(props: ValueInputBoxProps) {

  const { param, onSubmit } = props;


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