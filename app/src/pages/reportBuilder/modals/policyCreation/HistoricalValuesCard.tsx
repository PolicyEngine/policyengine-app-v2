/**
 * HistoricalValuesCard - Card wrapper for the historical values chart
 */

import React from 'react';
import { Stack, Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import HistoricalValues from '@/pathways/report/components/policyParameterSelector/HistoricalValues';
import { FONT_SIZES } from '../../constants';
import { HistoricalValuesCardProps } from './types';

export function HistoricalValuesCard({
  selectedParam,
  baseValues,
  reformValues,
  policyLabel,
}: HistoricalValuesCardProps) {
  return (
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
  );
}
