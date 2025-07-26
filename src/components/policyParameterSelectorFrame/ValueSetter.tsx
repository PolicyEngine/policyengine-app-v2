import dayjs from 'dayjs';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { DatePickerInput, YearPickerInput } from '@mantine/dates';
import { FOREVER } from '@/constants';
import { addPolicyParam } from '@/reducers/policyReducer';
import { Parameter } from '@/types/parameter';
import { ValueInterval } from '@/types/valueInterval';

enum ValueSetterMode {
  DEFAULT = 'default',
  YEARLY = 'yearly',
  DATE = 'date',
  MULTI_YEAR = 'multi-year',
}

interface ValueSetterProps {
  param: Parameter;
  onSubmit?: () => void;
}

interface ValueSetterProps {
  minDate: string;
  maxDate: string;
  param: Parameter;
  intervals: ValueInterval[];
  setIntervals: Dispatch<SetStateAction<ValueInterval[]>>;
}

interface ValueInputBoxProps {
  param: Parameter;
  value?: any;
  onChange?: (value: any) => void;
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
  const dispatch = useDispatch();

  const [intervals, setIntervals] = useState<ValueInterval[]>([]);

  const minDate = '2022-01-01';
  const maxDate = '2035-12-31';

  function resetValueSettingState() {
    setIntervals([]);
  }

  function handleModeChange(newMode: ValueSetterMode) {
    resetValueSettingState();
    setMode(newMode);
  }

  function handleSubmit() {
    intervals.forEach((interval) => {
      dispatch(addPolicyParam(interval));
    });
  }

  const ValueSetterToRender = ValueSetterComponents[mode];

  const valueSetterProps: ValueSetterProps = {
    minDate,
    maxDate,
    param,
    intervals,
    setIntervals,
  };

  return (
    <Box>
      <Stack>
        <Text fw={700}>Current value</Text>
        <Divider my="xs" />
        <Group>
          <ValueSetterToRender {...valueSetterProps} />
          <ModeSelectorButton setMode={handleModeChange} />
          <Text>TODO: Reset button</Text>
          <Button onClick={handleSubmit}>Add</Button>
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
        <Menu.Item onClick={() => setMode(ValueSetterMode.DEFAULT)}>Default</Menu.Item>
        <Menu.Item onClick={() => setMode(ValueSetterMode.YEARLY)}>Yearly</Menu.Item>
        <Menu.Item onClick={() => setMode(ValueSetterMode.DATE)}>Advanced</Menu.Item>
        <Menu.Item onClick={() => setMode(ValueSetterMode.MULTI_YEAR)}>Multi-year</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export function DefaultValueSelector(props: ValueSetterProps) {
  const { param, intervals, setIntervals, minDate, maxDate } = props;
  
  // Local state for form inputs
  const [startDate, setStartDate] = useState<string>('');
  const [paramValue, setParamValue] = useState<any>(param.unit === 'bool' ? false : 0);

  // Update intervals whenever local state changes
  useEffect(() => {
    if (startDate) {
      const newInterval: ValueInterval = {
        startDate,
        endDate: FOREVER,
        value: paramValue,
      };
      setIntervals([newInterval]);
    } else {
      setIntervals([]);
    }
  }, [startDate, paramValue, setIntervals]);

  function handleStartDateChange(value: string | null) {
    setStartDate(value || '');
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
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </Group>
  );
}

export function YearlyValueSelector(props: ValueSetterProps) {
  const { param, intervals, setIntervals, minDate, maxDate } = props;
  
  // Local state for form inputs
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paramValue, setParamValue] = useState<any>(param.unit === 'bool' ? false : 0);

  // Update intervals whenever local state changes
  useEffect(() => {
    if (startDate && endDate) {
      const newInterval: ValueInterval = {
        startDate,
        endDate,
        value: paramValue,
      };
      setIntervals([newInterval]);
    } else {
      setIntervals([]);
    }
  }, [startDate, endDate, paramValue, setIntervals]);

  function handleStartDateChange(value: string | null) {
    setStartDate(value || '');
  }

  function handleEndDateChange(value: string | null) {
    const endOfYearDate = dayjs(value || '').endOf('year').format('YYYY-MM-DD');
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
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </Group>
  );
}

export function DateValueSelector(props: ValueSetterProps) {
  const { param, intervals, setIntervals, minDate, maxDate } = props;
  
  // Local state for form inputs
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paramValue, setParamValue] = useState<any>(param.unit === 'bool' ? false : 0);

  // Update intervals whenever local state changes
  useEffect(() => {
    if (startDate && endDate) {
      const newInterval: ValueInterval = {
        startDate,
        endDate,
        value: paramValue,
      };
      setIntervals([newInterval]);
    } else {
      setIntervals([]);
    }
  }, [startDate, endDate, paramValue, setIntervals]);

  function handleStartDateChange(value: string | null) {
    setStartDate(value || '');
  }

  function handleEndDateChange(value: string | null) {
    setEndDate(value || '');
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
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </Group>
  );
}

export function MultiYearValueSelector(props: ValueSetterProps) {
  const { param, intervals, setIntervals, minDate, maxDate } = props;

  const MAX_YEARS = 10;

  // Generate years from minDate to maxDate
  const generateYears = () => {
    const startYear = dayjs(minDate).year();
    const endYear = dayjs(maxDate).year();
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years.slice(0, MAX_YEARS);
  };

  const years = generateYears();

  const [yearValues, setYearValues] = useState<Record<string, any>>(() => {
    const initialValues: Record<string, any> = {};
    years.forEach((year) => {
      initialValues[year] = param.unit === 'bool' ? false : 0;
    });
    return initialValues;
  });

  // Update intervals whenever yearValues changes
  useEffect(() => {
    const newIntervals: ValueInterval[] = Object.keys(yearValues).map((year: string) => ({
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      value: yearValues[year],
    }));

    setIntervals(newIntervals);
  }, [yearValues, setIntervals]);

  const handleYearValueChange = (year: number, value: any) => {
    setYearValues((prev) => ({
      ...prev,
      [year]: value,
    }));
  };

  // Split years into two columns
  const midpoint = Math.ceil(years.length / 2);
  const leftColumn = years.slice(0, midpoint);
  const rightColumn = years.slice(midpoint);

  return (
    <Box>
      <SimpleGrid cols={2} spacing="md">
        <Stack>
          {leftColumn.map((year) => (
            <Group key={year}>
              <Text fw={500} style={{ minWidth: '50px' }}>
                {year}
              </Text>
              <ValueInputBox
                param={param}
                value={yearValues[year]}
                onChange={(value) => handleYearValueChange(year, value)}
              />
            </Group>
          ))}
        </Stack>
        <Stack>
          {rightColumn.map((year) => (
            <Group key={year}>
              <Text fw={500} style={{ minWidth: '50px' }}>
                {year}
              </Text>
              <ValueInputBox
                param={param}
                value={yearValues[year]}
                onChange={(value) => handleYearValueChange(year, value)}
              />
            </Group>
          ))}
        </Stack>
      </SimpleGrid>
    </Box>
  );
}

export function ValueInputBox(props: ValueInputBoxProps) {
  const { param, value, onChange } = props;

  // US and UK packages use these type designations inconsistently
  const USD_UNITS = ['currency-USD', 'currency_USD', 'USD'];
  const GBP_UNITS = ['currency-GBP', 'currency_GBP', 'GBP'];

  const prefix = USD_UNITS.includes(String(param.unit))
    ? '$'
    : GBP_UNITS.includes(String(param.unit))
      ? '£'
      : '';

  if (param.type !== 'parameter') {
    console.error("ValueInputBox expects a parameter type of 'parameter', got:", param.type);
    return <NumberInput disabled value={0} />;
  }

  const handleChange = (newValue: any) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return param.unit === 'bool' ? (
    <Text>TODO: Switch for boolean value</Text>
  ) : (
    <NumberInput
      placeholder="Enter value"
      min={0}
      prefix={prefix}
      suffix={param.unit === '/1' ? '%' : ''}
      value={value !== undefined ? value : 0}
      onChange={handleChange}
      thousandSeparator=","
    />
  );
}