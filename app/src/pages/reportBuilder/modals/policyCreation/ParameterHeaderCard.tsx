/**
 * ParameterHeaderCard - Displays the selected parameter name and description
 */

import React from 'react';
import { Box, Text, Title } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { capitalize } from '@/utils/stringUtils';
import { FONT_SIZES } from '../../constants';
import { ParameterHeaderCardProps } from './types';

export function ParameterHeaderCard({ label, description }: ParameterHeaderCardProps) {
  return (
    <Box
      style={{
        background: colors.white,
        borderRadius: spacing.radius.lg,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
      }}
    >
      <Title order={3} style={{ marginBottom: spacing.sm }}>
        {capitalize(label || 'Label unavailable')}
      </Title>
      {description && (
        <Text style={{ fontSize: FONT_SIZES.normal, color: colors.gray[600] }}>{description}</Text>
      )}
    </Box>
  );
}
