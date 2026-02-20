/**
 * PolicyCreationContent - Main content area for policy creation mode (V6 styled)
 */
import { Dispatch, SetStateAction } from 'react';
import { IconScale, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import HistoricalValues from '@/pathways/report/components/policyParameterSelector/HistoricalValues';
import { ValueSetterMode } from '@/pathways/report/components/valueSetters';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { Parameter } from '@/types/subIngredients/parameter';
import {
  ValueInterval,
  ValueIntervalCollection,
  ValuesList,
} from '@/types/subIngredients/valueInterval';
import { capitalize } from '@/utils/stringUtils';
import { FONT_SIZES } from '../../constants';
import { ValueSetterComponentsV6 } from '../policyCreation/valueSelectors';

// Mode selector options for SegmentedControl
const MODE_OPTIONS = [
  { label: 'Default', value: ValueSetterMode.DEFAULT },
  { label: 'Yearly', value: ValueSetterMode.YEARLY },
  { label: 'Date range', value: ValueSetterMode.DATE },
  { label: 'Multi-year', value: ValueSetterMode.MULTI_YEAR },
];

interface PolicyCreationContentProps {
  selectedParam: ParameterMetadata | null;
  localPolicy: PolicyStateProps;
  policyLabel: string;
  policyParameters: Parameter[];
  setPolicyParameters: Dispatch<SetStateAction<Parameter[]>>;
  minDate: string;
  maxDate: string;
  intervals: ValueInterval[];
  setIntervals: Dispatch<SetStateAction<ValueInterval[]>>;
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  endDate: string;
  setEndDate: Dispatch<SetStateAction<string>>;
  valueSetterMode: ValueSetterMode;
  setValueSetterMode: (mode: ValueSetterMode) => void;
  onValueSubmit: () => void;
  isReadOnly?: boolean;
}

export function PolicyCreationContent({
  selectedParam,
  localPolicy,
  policyLabel,
  policyParameters,
  setPolicyParameters,
  minDate,
  maxDate,
  intervals,
  setIntervals,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  valueSetterMode,
  setValueSetterMode,
  onValueSubmit,
  isReadOnly = false,
}: PolicyCreationContentProps) {
  // Get base and reform values for chart
  const getChartValues = () => {
    if (!selectedParam) {
      return { baseValues: null, reformValues: null };
    }
    const baseValues = new ValueIntervalCollection(selectedParam.values as ValuesList);
    const reformValues = new ValueIntervalCollection(baseValues);
    const paramToChart = policyParameters.find((p) => p.name === selectedParam.parameter);
    if (paramToChart && paramToChart.values && paramToChart.values.length > 0) {
      const userIntervals = new ValueIntervalCollection(paramToChart.values as ValuesList);
      for (const interval of userIntervals.getIntervals()) {
        reformValues.addInterval(interval);
      }
    }
    return { baseValues, reformValues };
  };

  const { baseValues, reformValues } = getChartValues();
  const ValueSetterToRender = ValueSetterComponentsV6[valueSetterMode];

  // Get changes for the current parameter
  const currentParamChanges = selectedParam
    ? policyParameters.find((p) => p.name === selectedParam.parameter)?.values || []
    : [];

  // Format a date range for display
  const formatPeriod = (interval: ValueInterval): string => {
    const start = interval.startDate;
    const end = interval.endDate;
    if (!end || end === '9999-12-31') {
      const year = start.split('-')[0];
      return `${year} onward`;
    }
    const startYear = start.split('-')[0];
    const endYear = end.split('-')[0];
    if (startYear === endYear) {
      return startYear;
    }
    return `${startYear}-${endYear}`;
  };

  // Format a value for display
  const formatValue = (value: number | string | boolean): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      if (selectedParam?.unit === '/1') {
        return `${(value * 100).toFixed(1)}%`;
      }
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      });
    }
    return String(value);
  };

  // Remove a change from the current parameter
  const handleRemoveChange = (indexToRemove: number) => {
    if (!selectedParam) {
      return;
    }
    const updatedParameters = policyParameters
      .map((param) => {
        if (param.name === selectedParam.parameter) {
          return {
            ...param,
            values: param.values.filter((_, i) => i !== indexToRemove),
          };
        }
        return param;
      })
      .filter((param) => param.values.length > 0);
    setPolicyParameters(updatedParameters);
  };

  if (!selectedParam) {
    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.gray[50],
          padding: spacing.lg,
        }}
      >
        <Stack align="center" gap={spacing.md}>
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: spacing.radius.lg,
              background: colors.gray[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconScale size={32} color={colors.gray[400]} />
          </Box>
          <Text
            ta="center"
            style={{ fontSize: FONT_SIZES.normal, color: colors.gray[600], maxWidth: 400 }}
          >
            {isReadOnly
              ? 'Select a parameter from the menu to view its details.'
              : 'Select a parameter from the menu to modify its value for your policy reform.'}
          </Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box style={{ background: colors.gray[50], minHeight: '100%', padding: spacing.lg }}>
      <Stack gap={spacing.lg}>
        {/* Parameter Header Card */}
        <Box
          style={{
            background: colors.white,
            borderRadius: spacing.radius.lg,
            padding: spacing.lg,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <Title order={3} style={{ marginBottom: spacing.xs }}>
            {capitalize(selectedParam.label || 'Label unavailable')}
          </Title>
          {selectedParam.description && (
            <Text style={{ fontSize: FONT_SIZES.normal, color: colors.gray[600] }}>
              {selectedParam.description}
            </Text>
          )}
        </Box>

        {/* 50/50 Split Content */}
        <Group gap={spacing.lg} align="flex-start" wrap="nowrap">
          {/* Left Column: Setter + Changes */}
          <Stack gap={spacing.lg} style={{ flex: 1, minWidth: 0 }}>
            {/* Value Setter Card — hidden in read-only mode */}
            {!isReadOnly && (
              <Box
                style={{
                  background: colors.white,
                  borderRadius: spacing.radius.lg,
                  padding: spacing.lg,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                <Stack gap={spacing.md}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[700] }}>
                    Set new value
                  </Text>

                  {/* Mode selector - SegmentedControl per V6 mockup */}
                  <SegmentedControl
                    value={valueSetterMode}
                    onChange={(value) => {
                      setIntervals([]);
                      setValueSetterMode(value as ValueSetterMode);
                    }}
                    size="xs"
                    data={MODE_OPTIONS}
                    styles={{
                      root: {
                        background: colors.gray[100],
                        borderRadius: spacing.radius.md,
                      },
                      indicator: {
                        background: colors.white,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      },
                    }}
                  />

                  <ValueSetterToRender
                    minDate={minDate}
                    maxDate={maxDate}
                    param={selectedParam}
                    policy={localPolicy}
                    intervals={intervals}
                    setIntervals={setIntervals}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                  />

                  <Button
                    onClick={onValueSubmit}
                    disabled={intervals.length === 0}
                    color="teal"
                    fullWidth
                  >
                    Add change
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Changes for this parameter */}
            {currentParamChanges.length > 0 && (
              <Box
                style={{
                  background: colors.white,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: spacing.radius.lg,
                  padding: spacing.lg,
                }}
              >
                <Group justify="space-between" mb={spacing.sm}>
                  <Text size="sm" fw={600} style={{ color: colors.gray[700] }}>
                    Changes for this parameter
                  </Text>
                  <Badge size="xs" color="teal" variant="light">
                    {currentParamChanges.length}
                  </Badge>
                </Group>
                <Stack gap={spacing.xs}>
                  {currentParamChanges.map((change, i) => (
                    <Group
                      key={i}
                      justify="space-between"
                      style={{
                        padding: spacing.sm,
                        background: colors.gray[50],
                        borderRadius: spacing.radius.sm,
                      }}
                    >
                      <Text size="xs" style={{ color: colors.gray[600] }}>
                        {formatPeriod(change)}
                      </Text>
                      <Group gap={spacing.xs}>
                        <Text size="xs" fw={600} style={{ color: colors.primary[700] }}>
                          {formatValue(change.value)}
                        </Text>
                        {!isReadOnly && (
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="gray"
                            onClick={() => handleRemoveChange(i)}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>

          {/* Right Column: Historical Values Chart */}
          <Box
            style={{
              flex: 1,
              minWidth: 0,
              background: colors.white,
              borderRadius: spacing.radius.lg,
              padding: spacing.lg,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <Stack gap={spacing.md}>
              <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[700] }}>
                Historical values
              </Text>
              {baseValues && reformValues && (
                <HistoricalValues
                  param={selectedParam}
                  baseValues={baseValues}
                  reformValues={reformValues}
                  policyLabel={policyLabel}
                  policyId={null}
                />
              )}
            </Stack>
          </Box>
        </Group>
      </Stack>
    </Box>
  );
}
