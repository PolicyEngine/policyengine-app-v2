/**
 * ChangesCard - Displays list of modified parameters with their changes
 */

import React from 'react';
import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { ChangesCardProps } from './types';

export function ChangesCard({
  modifiedParams,
  modificationCount,
  selectedParamName,
  onSelectParam,
}: ChangesCardProps) {
  if (modifiedParams.length === 0) {
    return null;
  }

  return (
    <Box
      style={{
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.lg,
        padding: spacing.md,
      }}
    >
      <Group justify="space-between" style={{ marginBottom: spacing.sm }}>
        <Text size="sm" fw={600} style={{ color: colors.gray[700] }}>
          Changes for this parameter
        </Text>
        <Box
          style={{
            background: colors.primary[50],
            color: colors.primary[700],
            padding: `2px ${spacing.sm}`,
            borderRadius: spacing.radius.sm,
            fontSize: FONT_SIZES.small,
            fontWeight: 500,
          }}
        >
          {modificationCount}
        </Box>
      </Group>
      <Stack gap={spacing.xs}>
        {modifiedParams.map((param) => (
          <UnstyledButton
            key={param.paramName}
            onClick={() => onSelectParam(param.paramName)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.sm,
              background:
                selectedParamName === param.paramName ? colors.primary[50] : colors.gray[50],
              borderRadius: spacing.radius.sm,
              width: '100%',
            }}
          >
            <Text size="xs" style={{ color: colors.gray[600], flex: 1 }}>
              {param.label}
            </Text>
            <Stack gap={2} align="flex-end">
              {param.changes.map((change, idx) => (
                <Text key={idx} size="xs" fw={600} style={{ color: colors.primary[700] }}>
                  {change.period}: {change.value}
                </Text>
              ))}
            </Stack>
          </UnstyledButton>
        ))}
      </Stack>
    </Box>
  );
}
