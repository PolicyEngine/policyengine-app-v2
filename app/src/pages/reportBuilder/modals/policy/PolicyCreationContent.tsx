/**
 * PolicyCreationContent - Main content area for policy creation mode (V6 styled)
 */
import { Dispatch, SetStateAction } from 'react';
import { IconScale, IconTrash } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Group } from '@/components/ui/Group';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { Title } from '@/components/ui/Title';
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
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.gray[50],
          padding: spacing.lg,
        }}
      >
        <Stack align="center" gap="md">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: spacing.radius.feature,
              background: colors.gray[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconScale size={32} color={colors.gray[400]} />
          </div>
          <Text
            style={{
              textAlign: 'center',
              fontSize: FONT_SIZES.normal,
              color: colors.gray[600],
              maxWidth: 400,
            }}
          >
            {isReadOnly
              ? 'Select a parameter from the menu to view its details.'
              : 'Select a parameter from the menu to modify its value for your policy reform.'}
          </Text>
        </Stack>
      </div>
    );
  }

  return (
    <div style={{ background: colors.gray[50], minHeight: '100%', padding: spacing.lg }}>
      <Stack gap="lg">
        {/* Parameter Header Card */}
        <div
          style={{
            background: colors.white,
            borderRadius: spacing.radius.feature,
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
        </div>

        {/* 50/50 Split Content */}
        <Group gap="lg" align="start" wrap="nowrap">
          {/* Left Column: Setter + Changes */}
          <Stack gap="lg" style={{ flex: 1, minWidth: 0 }}>
            {/* Value Setter Card -- hidden in read-only mode */}
            {!isReadOnly && (
              <div
                style={{
                  background: colors.white,
                  borderRadius: spacing.radius.feature,
                  padding: spacing.lg,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                <Stack gap="md">
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[700] }}>
                    Set new value
                  </Text>

                  {/* Mode selector - SegmentedControl per V6 mockup */}
                  <SegmentedControl
                    value={valueSetterMode}
                    onValueChange={(value) => {
                      setIntervals([]);
                      setValueSetterMode(value as ValueSetterMode);
                    }}
                    size="xs"
                    options={MODE_OPTIONS}
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
                    className="tw:w-full"
                  >
                    Add change
                  </Button>
                </Stack>
              </div>
            )}

            {/* Changes for this parameter */}
            {currentParamChanges.length > 0 && (
              <div
                style={{
                  background: colors.white,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: spacing.radius.feature,
                  padding: spacing.lg,
                }}
              >
                <Group justify="space-between" style={{ marginBottom: spacing.sm }}>
                  <Text size="sm" fw={600} style={{ color: colors.gray[700] }}>
                    Changes for this parameter
                  </Text>
                  <Badge variant="secondary">{currentParamChanges.length}</Badge>
                </Group>
                <Stack gap="xs">
                  {currentParamChanges.map((change, i) => (
                    <Group
                      key={i}
                      justify="space-between"
                      style={{
                        padding: spacing.sm,
                        background: colors.gray[50],
                        borderRadius: spacing.radius.element,
                      }}
                    >
                      <Text size="xs" style={{ color: colors.gray[600] }}>
                        {formatPeriod(change)}
                      </Text>
                      <Group gap="xs">
                        <Text size="xs" fw={600} style={{ color: colors.primary[700] }}>
                          {formatValue(change.value)}
                        </Text>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveChange(i)}
                          >
                            <IconTrash size={12} />
                          </Button>
                        )}
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </div>
            )}
          </Stack>

          {/* Right Column: Historical Values Chart */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: colors.white,
              borderRadius: spacing.radius.feature,
              padding: spacing.lg,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <Stack gap="md">
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
          </div>
        </Group>
      </Stack>
    </div>
  );
}
