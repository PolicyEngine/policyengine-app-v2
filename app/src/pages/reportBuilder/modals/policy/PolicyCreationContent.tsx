/**
 * PolicyCreationContent - Main content area for policy creation mode
 */
import { Dispatch, SetStateAction } from 'react';
import { Box, Stack, Text, Title, Divider, Group, Button } from '@mantine/core';
import { IconScale } from '@tabler/icons-react';
import { colors, spacing } from '@/designTokens';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { ValueInterval, ValueIntervalCollection, ValuesList } from '@/types/subIngredients/valueInterval';
import { capitalize } from '@/utils/stringUtils';
import { ValueSetterComponents, ValueSetterMode, ModeSelectorButton } from '@/pathways/report/components/valueSetters';
import HistoricalValues from '@/pathways/report/components/policyParameterSelector/HistoricalValues';
import { FONT_SIZES } from '../../constants';
import { Parameter } from '@/types/subIngredients/parameter';

interface PolicyCreationContentProps {
  selectedParam: ParameterMetadata | null;
  localPolicy: PolicyStateProps;
  policyLabel: string;
  policyParameters: Parameter[];
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
}

export function PolicyCreationContent({
  selectedParam,
  localPolicy,
  policyLabel,
  policyParameters,
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
}: PolicyCreationContentProps) {
  // Get base and reform values for chart
  const getChartValues = () => {
    if (!selectedParam) return { baseValues: null, reformValues: null };
    const baseValues = new ValueIntervalCollection(selectedParam.values as ValuesList);
    const reformValues = new ValueIntervalCollection(baseValues);
    const paramToChart = policyParameters.find(p => p.name === selectedParam.parameter);
    if (paramToChart && paramToChart.values && paramToChart.values.length > 0) {
      const userIntervals = new ValueIntervalCollection(paramToChart.values as ValuesList);
      for (const interval of userIntervals.getIntervals()) {
        reformValues.addInterval(interval);
      }
    }
    return { baseValues, reformValues };
  };

  const { baseValues, reformValues } = getChartValues();
  const ValueSetterToRender = ValueSetterComponents[valueSetterMode];

  if (!selectedParam) {
    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
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
          <Text ta="center" style={{ fontSize: FONT_SIZES.normal, color: colors.gray[600], maxWidth: 400 }}>
            Select a parameter from the menu to modify its value for your policy reform.
          </Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box style={{ padding: spacing.xl }}>
      <Stack gap={spacing.lg}>
        <Box>
          <Title order={3} style={{ marginBottom: spacing.sm }}>
            {capitalize(selectedParam.label || 'Label unavailable')}
          </Title>
          {selectedParam.description && (
            <Text style={{ fontSize: FONT_SIZES.normal, color: colors.gray[600] }}>
              {selectedParam.description}
            </Text>
          )}
        </Box>
        <Box
          style={{
            background: colors.gray[50],
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.md,
            padding: spacing.lg,
          }}
        >
          <Stack gap={spacing.md}>
            <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>Set new value</Text>
            <Divider />
            <Group align="flex-end" wrap="nowrap">
              <Box style={{ flex: 1 }}>
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
              </Box>
              <ModeSelectorButton setMode={(mode) => {
                setIntervals([]);
                setValueSetterMode(mode);
              }} />
              <Button
                onClick={onValueSubmit}
                disabled={intervals.length === 0}
                color="teal"
              >
                Add change
              </Button>
            </Group>
          </Stack>
        </Box>
        {baseValues && reformValues && (
          <Box>
            <HistoricalValues
              param={selectedParam}
              baseValues={baseValues}
              reformValues={reformValues}
              policyLabel={policyLabel}
              policyId={null}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
