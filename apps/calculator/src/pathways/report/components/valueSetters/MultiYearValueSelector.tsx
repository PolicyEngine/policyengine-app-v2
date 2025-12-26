import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { getTaxYears } from '@/libs/metadataUtils';
import { RootState } from '@/store';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { getDefaultValueForParam } from './getDefaultValueForParam';
import { ValueInputBox } from './ValueInputBox';
import { ValueSetterProps } from './ValueSetterProps';

export function MultiYearValueSelector(props: ValueSetterProps) {
  const { param, policy, setIntervals } = props;

  // Get available years from metadata
  const availableYears = useSelector(getTaxYears);
  const countryId = useSelector((state: RootState) => state.metadata.currentCountry);

  // Country-specific max years configuration
  const MAX_YEARS_BY_COUNTRY: Record<string, number> = {
    us: 10,
    uk: 5,
  };

  // Generate years from metadata, starting from current year
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const maxYears = MAX_YEARS_BY_COUNTRY[countryId || 'us'] || 10;

    // Filter available years from metadata to only include current year onwards
    const futureYears = availableYears
      .map((option) => parseInt(option.value, 10))
      .filter((year) => year >= currentYear)
      .sort((a, b) => a - b);

    // Take only the configured max years for this country
    return futureYears.slice(0, maxYears);
  };

  const years = generateYears();

  // Get values for each year - check reform first, then baseline
  const getInitialYearValues = useMemo(() => {
    const initialValues: Record<string, any> = {};
    years.forEach((year) => {
      initialValues[year] = getDefaultValueForParam(param, policy, `${year}-01-01`);
    });
    return initialValues;
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
