import dayjs from 'dayjs';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Menu,
  NumberInput,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { DatePickerInput, YearPickerInput } from '@mantine/dates';
import { FOREVER } from '@/constants';
import { getDateRange } from '@/libs/metadataUtils';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { addPolicyParamAtPosition } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

enum ValueSetterMode {
  DEFAULT = 'default',
  YEARLY = 'yearly',
  DATE = 'date',
  MULTI_YEAR = 'multi-year',
}

interface ValueSetterContainerProps {
  param: ParameterMetadata;
  onSubmit?: () => void;
}

interface ValueSetterProps {
  minDate: string;
  maxDate: string;
  param: ParameterMetadata;
  intervals: ValueInterval[];
  setIntervals: Dispatch<SetStateAction<ValueInterval[]>>;
}

interface ValueInputBoxProps {
  label?: string;
  param: ParameterMetadata;
  value?: any;
  onChange?: (value: any) => void;
}

const ValueSetterComponents = {
  [ValueSetterMode.DEFAULT]: DefaultValueSelector,
  [ValueSetterMode.YEARLY]: YearlyValueSelector,
  [ValueSetterMode.DATE]: DateValueSelector,
  [ValueSetterMode.MULTI_YEAR]: MultiYearValueSelector,
} as const;

export default function PolicyParameterSelectorValueSetterContainer(
  props: ValueSetterContainerProps
) {
  const { param } = props;

  const [mode, setMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);
  const dispatch = useDispatch();

  // Get the current position from the cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));

  // Get date ranges from metadata using utility selector
  const { minDate, maxDate } = useSelector(getDateRange);

  const [intervals, setIntervals] = useState<ValueInterval[]>([]);

  function resetValueSettingState() {
    setIntervals([]);
  }

  function handleModeChange(newMode: ValueSetterMode) {
    resetValueSettingState();
    setMode(newMode);
  }

  function handleSubmit() {
    intervals.forEach((interval) => {
      dispatch(
        addPolicyParamAtPosition({
          position: currentPosition,
          name: param.parameter,
          valueInterval: interval,
        })
      );
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
    <Container bg="gray.0" bd="1px solid gray.2" m="0" p="lg">
      <Stack>
        <Text fw={700}>Current value</Text>
        <Divider style={{ padding: 0 }} />
        <Group align="flex-end" w="100%">
          <ValueSetterToRender {...valueSetterProps} />
          <ModeSelectorButton setMode={handleModeChange} />
          <Button onClick={handleSubmit}>Add</Button>
        </Group>
      </Stack>
    </Container>
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
  const { param, setIntervals, minDate, maxDate } = props;

  // Get default value for 2025-01-01 from metadata
  const defaultValue = useMemo(() => {
    if (param.values) {
      const collection = new ValueIntervalCollection(param.values as any);
      const value = collection.getValueAtDate('2025-01-01');
      return value !== undefined ? value : (param.unit === 'bool' ? false : 0);
    }
    return param.unit === 'bool' ? false : 0;
  }, [param.values, param.unit]);

  // Local state for form inputs
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [paramValue, setParamValue] = useState<any>(defaultValue);

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
    <Group align="flex-end" style={{ flex: 1 }}>
      <YearPickerInput
        placeholder="Pick a year"
        label="From"
        minDate={minDate}
        maxDate={maxDate}
        value={startDate ? new Date(startDate) : null}
        onChange={handleStartDateChange}
        style={{ flex: 1 }}
      />
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} label="Onward" />
    </Group>
  );
}

export function YearlyValueSelector(props: ValueSetterProps) {
  const { param, setIntervals, minDate, maxDate } = props;

  // Get default value for 2025-01-01 from metadata
  const defaultValue = useMemo(() => {
    if (param.values) {
      const collection = new ValueIntervalCollection(param.values as any);
      const value = collection.getValueAtDate('2025-01-01');
      return value !== undefined ? value : (param.unit === 'bool' ? false : 0);
    }
    return param.unit === 'bool' ? false : 0;
  }, [param.values, param.unit]);

  // Local state for form inputs
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');
  const [paramValue, setParamValue] = useState<any>(defaultValue);

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
    const endOfYearDate = dayjs(value || '')
      .endOf('year')
      .format('YYYY-MM-DD');
    setEndDate(endOfYearDate);
  }

  return (
    <Group align="flex-end" style={{ flex: 1 }}>
      <YearPickerInput
        placeholder="Pick a year"
        label="From"
        minDate={minDate}
        maxDate={maxDate}
        value={startDate ? new Date(startDate) : null}
        onChange={handleStartDateChange}
        style={{ flex: 1 }}
      />
      <YearPickerInput
        placeholder="Pick a year"
        label="To"
        minDate={minDate}
        maxDate={maxDate}
        value={endDate ? new Date(endDate) : null}
        onChange={handleEndDateChange}
        style={{ flex: 1 }}
      />
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </Group>
  );
}

export function DateValueSelector(props: ValueSetterProps) {
  const { param, setIntervals, minDate, maxDate } = props;

  // Get default value for 2025-01-01 from metadata
  const defaultValue = useMemo(() => {
    if (param.values) {
      const collection = new ValueIntervalCollection(param.values as any);
      const value = collection.getValueAtDate('2025-01-01');
      return value !== undefined ? value : (param.unit === 'bool' ? false : 0);
    }
    return param.unit === 'bool' ? false : 0;
  }, [param.values, param.unit]);

  // Local state for form inputs
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-01-01');
  const [paramValue, setParamValue] = useState<any>(defaultValue);

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
    <Group align="flex-end" style={{ flex: 1 }}>
      <DatePickerInput
        placeholder="Pick a start date"
        label="From"
        minDate={minDate}
        maxDate={maxDate}
        value={startDate ? new Date(startDate) : null}
        onChange={handleStartDateChange}
        style={{ flex: 1 }}
      />
      <DatePickerInput
        placeholder="Pick an end date"
        label="To"
        minDate={minDate}
        maxDate={maxDate}
        value={endDate ? new Date(endDate) : null}
        onChange={handleEndDateChange}
        style={{ flex: 1 }}
      />
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </Group>
  );
}

export function MultiYearValueSelector(props: ValueSetterProps) {
  const { param, setIntervals, minDate, maxDate } = props;

  const MAX_YEARS = 10;

  // Generate years from minDate to maxDate, starting from 2025
  const generateYears = () => {
    const startYear = 2025;
    const endYear = dayjs(maxDate).year();
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years.slice(0, MAX_YEARS);
  };

  const years = generateYears();

  // Get values from metadata for each year
  const getInitialYearValues = useMemo(() => {
    const initialValues: Record<string, any> = {};
    if (param.values) {
      const collection = new ValueIntervalCollection(param.values as any);
      years.forEach((year) => {
        const value = collection.getValueAtDate(`${year}-01-01`);
        initialValues[year] = value !== undefined ? value : (param.unit === 'bool' ? false : 0);
      });
    } else {
      years.forEach((year) => {
        initialValues[year] = param.unit === 'bool' ? false : 0;
      });
    }
    return initialValues;
  }, [param.values, param.unit, years]);

  const [yearValues, setYearValues] = useState<Record<string, any>>(getInitialYearValues);

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
  const { param, value, onChange, label } = props;

  // US and UK packages use these type designations inconsistently
  const USD_UNITS = ['currency-USD', 'currency_USD', 'USD'];
  const GBP_UNITS = ['currency-GBP', 'currency_GBP', 'GBP'];

  const prefix = USD_UNITS.includes(String(param.unit))
    ? '$'
    : GBP_UNITS.includes(String(param.unit))
      ? '£'
      : '';

  const isPercentage = param.unit === '/1';
  const isBool = param.unit === 'bool';

  if (param.type !== 'parameter') {
    console.error("ValueInputBox expects a parameter type of 'parameter', got:", param.type);
    return <NumberInput disabled value={0} />;
  }

  const handleChange = (newValue: any) => {
    if (onChange) {
      // Convert percentage display value (0-100) to decimal (0-1) for storage
      const valueToStore = isPercentage ? newValue / 100 : newValue;
      onChange(valueToStore);
    }
  };

  const handleBoolChange = (checked: boolean) => {
    if (onChange) {
      onChange(checked);
    }
  };

  // Convert decimal value (0-1) to percentage display value (0-100)
  const displayValue = isPercentage
    ? value !== undefined
      ? value * 100
      : 0
    : value !== undefined
      ? value
      : 0;

  if (isBool) {
    return (
      <Stack gap="xs" style={{ flex: 1 }}>
        {label && (
          <Text size="sm" fw={500}>
            {label}
          </Text>
        )}
        <Group
          justify="space-between"
          align="center"
          style={{
            border: '1px solid #ced4da',
            borderRadius: '4px',
            padding: '6px 12px',
            height: '36px',
            backgroundColor: 'white',
          }}
        >
          <Text size="sm" c={value ? 'dimmed' : 'dark'} fw={value ? 400 : 600}>
            False
          </Text>
          <Switch
            checked={value || false}
            onChange={(event) => handleBoolChange(event.currentTarget.checked)}
            size="md"
          />
          <Text size="sm" c={value ? 'dark' : 'dimmed'} fw={value ? 600 : 400}>
            True
          </Text>
        </Group>
      </Stack>
    );
  }

  return (
    <NumberInput
      label={label}
      placeholder="Enter value"
      min={0}
      prefix={prefix}
      suffix={isPercentage ? '%' : ''}
      value={displayValue}
      onChange={handleChange}
      thousandSeparator=","
      style={{ flex: 1 }}
    />
  );
}
