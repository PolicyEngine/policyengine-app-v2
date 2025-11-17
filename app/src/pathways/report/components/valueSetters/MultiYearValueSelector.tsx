import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { ValueSetterProps } from './ValueSetterProps';
import { getDefaultValueForParam } from './getDefaultValueForParam';
import { ValueInputBox } from './ValueInputBox';

export function MultiYearValueSelector(props: ValueSetterProps) {
  const { param, policy, setIntervals, maxDate } = props;

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

  // Get values for each year - check reform first, then baseline
  const getInitialYearValues = useMemo(() => {
    const initialValues: Record<string, any> = {};
    years.forEach((year) => {
      initialValues[year] = getDefaultValueForParam(param, policy, `${year}-01-01`);
    });
    return initialValues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param, policy]);

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
